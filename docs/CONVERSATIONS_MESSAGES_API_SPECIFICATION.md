# Conversations & Messages API Specification

Complete backend specification for real-time messaging between tenants and landlords.

---

## Overview

The messaging system enables communication between tenants and landlords regarding specific properties. Each conversation is tied to a property and involves exactly two participants: one tenant and one landlord.

---

## Quick Reference

| Method | Endpoint | Actor | Description |
|--------|----------|-------|-------------|
| GET | `/api/conversations` | All | Get user's conversations |
| GET | `/api/conversations/{id}` | Participant | Get single conversation with messages |
| POST | `/api/conversations` | Tenant | Start new conversation |
| POST | `/api/conversations/{id}/messages` | Participant | Send message |
| PATCH | `/api/conversations/{id}/read` | Participant | Mark messages as read |
| GET | `/api/conversations/property/{propertyId}` | Tenant | Check if conversation exists for property |
| GET | `/api/conversations/unread-count` | All | Get total unread message count |
| DELETE | `/api/conversations/{id}` | Participant | Soft delete conversation |

---

## Data Models

### Database Tables

```sql
-- Conversations table
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id),
    tenant_id BIGINT NOT NULL REFERENCES users(id),
    landlord_id BIGINT NOT NULL REFERENCES users(id),
    
    -- Metadata
    subject VARCHAR(255),                    -- Optional subject/topic
    status VARCHAR(20) DEFAULT 'ACTIVE',     -- ACTIVE, ARCHIVED, DELETED
    
    -- Soft delete tracking (per user)
    tenant_deleted_at TIMESTAMP,
    landlord_deleted_at TIMESTAMP,
    
    -- Timestamps
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint: one conversation per tenant-property pair
    UNIQUE(property_id, tenant_id)
);

-- Messages table
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    
    -- Content
    content TEXT NOT NULL,
    
    -- Read status
    read_at TIMESTAMP,                       -- NULL = unread
    
    -- Soft delete
    deleted_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_landlord ON conversations(landlord_id);
CREATE INDEX idx_conversations_property ON conversations(property_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;
```

### Enums

```java
public enum ConversationStatus {
    ACTIVE,      // Normal active conversation
    ARCHIVED,    // Archived by user (can be restored)
    DELETED      // Soft deleted
}
```

---

## DTOs

### ConversationDTO (List View)

```typescript
interface ConversationDTO {
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyImage: string | null;      // First property image for avatar
    
    // Other participant info (NOT the current user)
    participantId: number;
    participantName: string;
    participantAvatar: string | null;
    participantRole: 'TENANT' | 'LANDLORD';
    
    // Preview
    subject: string | null;
    lastMessage: string;               // Truncated to ~100 chars
    lastMessageAt: string;             // ISO timestamp
    lastMessageSenderId: number;
    
    // Unread
    unreadCount: number;
    
    // Status
    status: 'ACTIVE' | 'ARCHIVED';
    
    createdAt: string;
}
```

### ConversationDetailDTO (With Messages)

```typescript
interface ConversationDetailDTO {
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyAddress: string;
    propertyImage: string | null;
    
    // Participants
    tenant: ParticipantDTO;
    landlord: ParticipantDTO;
    
    // Current user's role in this conversation
    currentUserRole: 'TENANT' | 'LANDLORD';
    
    subject: string | null;
    status: 'ACTIVE' | 'ARCHIVED';
    
    // Messages (paginated, newest first for infinite scroll)
    messages: MessageDTO[];
    hasMoreMessages: boolean;
    
    createdAt: string;
    updatedAt: string;
}

interface ParticipantDTO {
    id: number;
    fullName: string;
    avatar: string | null;
    email: string;          // For contact purposes
    phone: string | null;   // Optional
}
```

### MessageDTO

```typescript
interface MessageDTO {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string | null;
    
    content: string;
    
    isOwn: boolean;         // true if current user sent this
    isRead: boolean;        // true if recipient has read
    readAt: string | null;
    
    createdAt: string;
}
```

### Request DTOs

```typescript
// Start new conversation
interface CreateConversationRequest {
    propertyId: number;
    subject?: string;       // Optional subject line
    message: string;        // Initial message (required)
}

// Send message
interface SendMessageRequest {
    content: string;
}

// Response for creating conversation
interface CreateConversationResponse {
    conversation: ConversationDTO;
    message: MessageDTO;
}
```

---

## API Endpoints

### 1. Get All Conversations

Returns all conversations for the authenticated user (as tenant or landlord).

```http
GET /api/conversations
Authorization: Bearer {{token}}
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | ACTIVE | Filter by ACTIVE, ARCHIVED, or ALL |
| page | int | 0 | Page number |
| size | int | 20 | Page size |

**Response:** `200 OK`
```json
{
    "content": [
        {
            "id": 1,
            "propertyId": 5,
            "propertyTitle": "Modern Downtown Apartment",
            "propertyImage": "https://...",
            "participantId": 10,
            "participantName": "John Tenant",
            "participantAvatar": "https://...",
            "participantRole": "TENANT",
            "subject": "Question about parking",
            "lastMessage": "Hi, I wanted to ask about the parking situation...",
            "lastMessageAt": "2025-01-04T10:30:00Z",
            "lastMessageSenderId": 10,
            "unreadCount": 2,
            "status": "ACTIVE",
            "createdAt": "2025-01-03T14:00:00Z"
        }
    ],
    "totalElements": 15,
    "totalPages": 1,
    "number": 0,
    "size": 20
}
```

**Business Logic:**
- For **landlords**: participantId = tenant, participantRole = "TENANT"
- For **tenants**: participantId = landlord, participantRole = "LANDLORD"
- Sort by `lastMessageAt DESC` (most recent first)
- Exclude conversations where user has soft-deleted
- `unreadCount` = count of messages NOT sent by current user AND read_at IS NULL

---

### 2. Get Conversation Detail

```http
GET /api/conversations/{conversationId}
Authorization: Bearer {{token}}
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 0 | Message page (0 = newest) |
| size | int | 50 | Messages per page |

**Response:** `200 OK`
```json
{
    "id": 1,
    "propertyId": 5,
    "propertyTitle": "Modern Downtown Apartment",
    "propertyAddress": "123 Main St, Apt 4B",
    "propertyImage": "https://...",
    "tenant": {
        "id": 10,
        "fullName": "John Tenant",
        "avatar": "https://...",
        "email": "john@example.com",
        "phone": "+1234567890"
    },
    "landlord": {
        "id": 3,
        "fullName": "Jane Landlord",
        "avatar": "https://...",
        "email": "jane@example.com",
        "phone": "+1234567891"
    },
    "currentUserRole": "LANDLORD",
    "subject": "Question about parking",
    "status": "ACTIVE",
    "messages": [
        {
            "id": 5,
            "conversationId": 1,
            "senderId": 10,
            "senderName": "John Tenant",
            "senderAvatar": "https://...",
            "content": "Thanks for the quick response!",
            "isOwn": false,
            "isRead": false,
            "readAt": null,
            "createdAt": "2025-01-04T10:30:00Z"
        },
        {
            "id": 4,
            "conversationId": 1,
            "senderId": 3,
            "senderName": "Jane Landlord",
            "senderAvatar": "https://...",
            "content": "Yes, there's one assigned parking spot included.",
            "isOwn": true,
            "isRead": true,
            "readAt": "2025-01-04T10:25:00Z",
            "createdAt": "2025-01-04T10:20:00Z"
        }
    ],
    "hasMoreMessages": false,
    "createdAt": "2025-01-03T14:00:00Z",
    "updatedAt": "2025-01-04T10:30:00Z"
}
```

**Errors:**
- `403 Forbidden`: User is not a participant in this conversation
- `404 Not Found`: Conversation doesn't exist

**Business Logic:**
- Messages sorted by `created_at DESC` (newest first for infinite scroll)
- Automatically mark incoming messages as read (optional - see endpoint #5)

---

### 3. Start New Conversation (Tenant Only)

Only tenants can initiate conversations about properties.

```http
POST /api/conversations
Authorization: Bearer {{tenant_token}}
Content-Type: application/json

{
    "propertyId": 5,
    "subject": "Question about parking",
    "message": "Hi, I'm interested in the property. Does it include parking?"
}
```

**Response:** `201 Created`
```json
{
    "conversation": {
        "id": 1,
        "propertyId": 5,
        "propertyTitle": "Modern Downtown Apartment",
        "propertyImage": "https://...",
        "participantId": 3,
        "participantName": "Jane Landlord",
        "participantAvatar": "https://...",
        "participantRole": "LANDLORD",
        "subject": "Question about parking",
        "lastMessage": "Hi, I'm interested in the property...",
        "lastMessageAt": "2025-01-04T10:00:00Z",
        "lastMessageSenderId": 10,
        "unreadCount": 0,
        "status": "ACTIVE",
        "createdAt": "2025-01-04T10:00:00Z"
    },
    "message": {
        "id": 1,
        "conversationId": 1,
        "senderId": 10,
        "senderName": "John Tenant",
        "senderAvatar": "https://...",
        "content": "Hi, I'm interested in the property. Does it include parking?",
        "isOwn": true,
        "isRead": true,
        "readAt": null,
        "createdAt": "2025-01-04T10:00:00Z"
    }
}
```

**Errors:**
- `400 Bad Request`: Message is empty or too long (max 5000 chars)
- `403 Forbidden`: Only tenants can start conversations
- `404 Not Found`: Property doesn't exist
- `409 Conflict`: Conversation already exists for this tenant + property

**Business Logic:**
1. Validate tenant role
2. Check if conversation already exists for this tenant + property
   - If exists AND not deleted by tenant: return 409
   - If exists AND deleted by tenant: restore and add message
3. Look up property to get landlord_id
4. Create conversation record
5. Create first message record
6. Optionally: Create notification for landlord (see Notifications spec)

---

### 4. Send Message

```http
POST /api/conversations/{conversationId}/messages
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "content": "Yes, there's one assigned parking spot included with the unit."
}
```

**Response:** `201 Created`
```json
{
    "id": 2,
    "conversationId": 1,
    "senderId": 3,
    "senderName": "Jane Landlord",
    "senderAvatar": "https://...",
    "content": "Yes, there's one assigned parking spot included with the unit.",
    "isOwn": true,
    "isRead": true,
    "readAt": null,
    "createdAt": "2025-01-04T10:15:00Z"
}
```

**Errors:**
- `400 Bad Request`: Message empty or exceeds 5000 characters
- `403 Forbidden`: User is not a participant
- `404 Not Found`: Conversation doesn't exist

**Business Logic:**
1. Validate user is participant (tenant_id OR landlord_id)
2. Validate content (not empty, max 5000 chars)
3. Create message record
4. Update conversation's `last_message_at` and `updated_at`
5. Create notification for recipient

---

### 5. Mark Messages as Read

Mark all unread messages in a conversation as read.

```http
PATCH /api/conversations/{conversationId}/read
Authorization: Bearer {{token}}
```

**Response:** `200 OK`
```json
{
    "markedAsRead": 3,
    "conversationId": 1
}
```

**Business Logic:**
```sql
UPDATE messages 
SET read_at = NOW()
WHERE conversation_id = :conversationId 
  AND sender_id != :currentUserId 
  AND read_at IS NULL;
```

---

### 6. Check Existing Conversation for Property

Used by frontend to check if tenant already has a conversation about a property.

```http
GET /api/conversations/property/{propertyId}
Authorization: Bearer {{tenant_token}}
```

**Response if exists:** `200 OK`
```json
{
    "exists": true,
    "conversationId": 1
}
```

**Response if not exists:** `200 OK`
```json
{
    "exists": false,
    "conversationId": null
}
```

---

### 7. Get Unread Count

Get total unread message count for header badge.

```http
GET /api/conversations/unread-count
Authorization: Bearer {{token}}
```

**Response:** `200 OK`
```json
{
    "unreadCount": 5,
    "unreadConversations": 2
}
```

**SQL:**
```sql
SELECT 
    COUNT(DISTINCT m.id) as unread_count,
    COUNT(DISTINCT c.id) as unread_conversations
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE (c.tenant_id = :userId OR c.landlord_id = :userId)
  AND m.sender_id != :userId
  AND m.read_at IS NULL
  AND (
    (c.tenant_id = :userId AND c.tenant_deleted_at IS NULL) OR
    (c.landlord_id = :userId AND c.landlord_deleted_at IS NULL)
  );
```

---

### 8. Delete/Archive Conversation

Soft delete for the current user only. The other participant still sees it.

```http
DELETE /api/conversations/{conversationId}
Authorization: Bearer {{token}}
```

**Response:** `204 No Content`

**Business Logic:**
- If current user is tenant: set `tenant_deleted_at = NOW()`
- If current user is landlord: set `landlord_deleted_at = NOW()`
- If BOTH have deleted: actually delete from database (cleanup job)

---

## Complete Flow Examples

### Flow 1: Tenant Contacts Landlord

```
1. Tenant views property listing
   → Clicks "Contact Landlord"

2. Frontend checks existing conversation:
   GET /api/conversations/property/5
   → { exists: false }

3. Tenant sends message:
   POST /api/conversations
   { propertyId: 5, message: "Is this still available?" }
   → Conversation created, landlord notified

4. Landlord sees notification, opens messages:
   GET /api/conversations
   → Shows new conversation with unreadCount: 1

5. Landlord opens conversation:
   GET /api/conversations/1
   → Returns messages, auto-marks as read

6. Landlord replies:
   POST /api/conversations/1/messages
   { content: "Yes, would you like to schedule a viewing?" }
   → Tenant notified
```

### Flow 2: Continuing Existing Conversation

```
1. Tenant clicks "Contact Landlord" on same property:
   GET /api/conversations/property/5
   → { exists: true, conversationId: 1 }

2. Frontend navigates to existing conversation:
   GET /api/conversations/1
   → Shows message history

3. Tenant sends follow-up:
   POST /api/conversations/1/messages
   { content: "Yes, I'm free Saturday afternoon" }
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| message.content | Required, 1-5000 characters |
| conversation.subject | Optional, max 255 characters |
| propertyId | Must exist and be active |

---

## Notifications Integration

When a message is sent, create a notification for the recipient:

```java
// In MessageService.sendMessage()
Notification notification = new Notification();
notification.setUserId(recipientId);
notification.setType(NotificationType.MESSAGE);
notification.setTitle("New Message");
notification.setDescription("Message from " + senderName + " about " + propertyTitle);
notification.setLink("/dashboard/messages?conversation=" + conversationId);
notificationService.create(notification);
```

---

## Real-time Considerations (Future)

For real-time messaging, consider:

1. **WebSocket Integration**
   - Subscribe to conversation updates
   - Push new messages instantly
   - Update unread counts in real-time

2. **Polling Alternative**
   - Frontend polls `/api/conversations/unread-count` every 30s
   - Poll active conversation every 5s for new messages

---

## TypeScript Interfaces (Frontend)

```typescript
// Types
interface Conversation {
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyImage: string | null;
    participantId: number;
    participantName: string;
    participantAvatar: string | null;
    participantRole: 'TENANT' | 'LANDLORD';
    subject: string | null;
    lastMessage: string;
    lastMessageAt: string;
    lastMessageSenderId: number;
    unreadCount: number;
    status: 'ACTIVE' | 'ARCHIVED';
    createdAt: string;
}

interface ConversationDetail {
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyAddress: string;
    propertyImage: string | null;
    tenant: Participant;
    landlord: Participant;
    currentUserRole: 'TENANT' | 'LANDLORD';
    subject: string | null;
    status: 'ACTIVE' | 'ARCHIVED';
    messages: Message[];
    hasMoreMessages: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Participant {
    id: number;
    fullName: string;
    avatar: string | null;
    email: string;
    phone: string | null;
}

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    isOwn: boolean;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

// Request types
interface CreateConversationRequest {
    propertyId: number;
    subject?: string;
    message: string;
}

interface SendMessageRequest {
    content: string;
}

// Response types
interface CreateConversationResponse {
    conversation: Conversation;
    message: Message;
}

interface UnreadCountResponse {
    unreadCount: number;
    unreadConversations: number;
}

interface PropertyConversationCheckResponse {
    exists: boolean;
    conversationId: number | null;
}
```

---

## Error Responses

All errors follow this format:

```json
{
    "timestamp": "2025-01-04T10:00:00Z",
    "status": 400,
    "error": "Bad Request",
    "message": "Message content is required",
    "path": "/api/conversations/1/messages"
}
```

| Status | When |
|--------|------|
| 400 | Validation failed (empty message, too long, etc.) |
| 403 | User not participant / wrong role |
| 404 | Conversation or property not found |
| 409 | Conversation already exists for tenant + property |

---

## Security Considerations

1. **Authorization**: Users can only access conversations they're part of
2. **Rate Limiting**: Limit message sending (e.g., 10 messages/minute)
3. **Content Validation**: Sanitize message content, prevent XSS
4. **Spam Prevention**: Consider cooldown before starting new conversations

---

## Property Manager Support (Optional Extension)

If property managers can respond on behalf of landlords:

```sql
-- Add to conversations table
manager_id BIGINT REFERENCES users(id),

-- Modify authorization check
WHERE (
    c.tenant_id = :userId OR 
    c.landlord_id = :userId OR
    c.manager_id = :userId OR
    :userId IN (SELECT manager_id FROM property_managers WHERE property_id = c.property_id)
)
```
