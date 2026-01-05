# Conversations & Messages API Specification

Complete backend specification for real-time messaging between tenants, landlords, and property managers.

---

## Overview

### Transport Methods

The messaging system supports two transport methods:

| Transport | Use Case | Endpoint |
|-----------|----------|----------|
| **REST API** | Initial data load, fallback, CRUD operations | `http://localhost:8081/api/conversations` |
| **WebSocket (STOMP)** | Real-time messaging, instant delivery | `ws://localhost:8081/ws` |

### WebSocket Quick Reference

| Action | STOMP Destination | Description |
|--------|-------------------|-------------|
| Connect | `ws://localhost:8081/ws` | Connect with SockJS + STOMP |
| Subscribe | `/topic/conversations/{id}` | Receive real-time messages |
| Send Message | `/app/chat.send/{id}` | Send message instantly |
| Mark Read | `/app/chat.read/{id}` | Mark messages as read |
| Errors | `/user/queue/errors` | Receive error notifications |

### REST API Quick Reference

The messaging system enables communication between tenants and property owners/managers regarding specific properties. Each conversation is tied to a property and can involve:
- **Tenant** ↔ **Landlord**: Direct communication
- **Tenant** ↔ **Property Manager**: Manager handles communications for assigned properties

Property Managers can view and respond to conversations for properties they manage, acting on behalf of the landlord.

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

## Role Permissions

| Action | Tenant | Landlord | Property Manager |
|--------|--------|----------|------------------|
| Start conversation | ✅ (about any property) | ❌ | ❌ |
| View conversations | ✅ (own only) | ✅ (own properties) | ✅ (assigned properties) |
| Send messages | ✅ (own only) | ✅ (own properties) | ✅ (assigned properties) |
| Mark as read | ✅ (own only) | ✅ (own properties) | ✅ (assigned properties) |
| Delete conversation | ✅ (own only) | ✅ (own only) | ❌ |

**Property Manager Access Logic:**
- PM can access conversations where `property_id` is in their assigned properties
- PM messages appear with their own name (not landlord's name)
- PM role is indicated in UI so tenant knows who they're talking to

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
    
    -- Sender role for display purposes
    sender_role VARCHAR(20) NOT NULL,        -- TENANT, LANDLORD, PROPERTY_MANAGER
    
    -- Content
    content TEXT NOT NULL,
    
    -- Read status
    read_at TIMESTAMP,                       -- NULL = unread
    
    -- Soft delete
    deleted_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Property Managers assignment table (already exists)
CREATE TABLE property_managers (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'manager',      -- manager, assistant
    added_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(property_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_landlord ON conversations(landlord_id);
CREATE INDEX idx_conversations_property ON conversations(property_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_property_managers_user ON property_managers(user_id);
CREATE INDEX idx_property_managers_property ON property_managers(property_id);
```

### Enums

```java
public enum ConversationStatus {
    ACTIVE,      // Normal active conversation
    ARCHIVED,    // Archived by user (can be restored)
    DELETED      // Soft deleted
}

public enum SenderRole {
    TENANT,
    LANDLORD,
    PROPERTY_MANAGER
}
```

---

## Authorization Logic

### Checking Conversation Access

```java
public boolean canAccessConversation(Long userId, UserRole userRole, Conversation conv) {
    // Tenant: must be the tenant in conversation
    if (userRole == UserRole.TENANT) {
        return conv.getTenantId().equals(userId);
    }
    
    // Landlord: must own the property
    if (userRole == UserRole.LANDLORD) {
        return conv.getLandlordId().equals(userId);
    }
    
    // Property Manager: must be assigned to the property
    if (userRole == UserRole.PROPERTY_MANAGER) {
        return propertyManagerRepository.existsByPropertyIdAndUserId(
            conv.getPropertyId(), userId
        );
    }
    
    return false;
}
```

### Get Conversations Query (By Role)

```sql
-- For TENANT: conversations where they are the tenant
SELECT c.* FROM conversations c
WHERE c.tenant_id = :userId
  AND c.tenant_deleted_at IS NULL;

-- For LANDLORD: conversations on their properties
SELECT c.* FROM conversations c
JOIN properties p ON c.property_id = p.id
WHERE p.landlord_id = :userId
  AND c.landlord_deleted_at IS NULL;

-- For PROPERTY_MANAGER: conversations on assigned properties
SELECT DISTINCT c.* FROM conversations c
JOIN property_managers pm ON c.property_id = pm.property_id
WHERE pm.user_id = :userId
  AND c.landlord_deleted_at IS NULL;  -- Uses landlord delete flag
```

---

## DTOs

### ConversationDTO (List View)

```typescript
interface ConversationDTO {
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyImage: string | null;
    
    // Other participant(s) info - perspective depends on current user role
    participants: ParticipantSummaryDTO[];
    
    // For simpler UX: primary contact (tenant for landlord/PM, landlord for tenant)
    primaryParticipant: ParticipantSummaryDTO;
    
    // Preview
    subject: string | null;
    lastMessage: string;
    lastMessageAt: string;
    lastMessageSenderId: number;
    lastMessageSenderRole: 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';
    
    // Unread
    unreadCount: number;
    
    // Status
    status: 'ACTIVE' | 'ARCHIVED';
    
    createdAt: string;
}

interface ParticipantSummaryDTO {
    id: number;
    fullName: string;
    avatar: string | null;
    role: 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';
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
    
    // All participants
    tenant: ParticipantDTO;
    landlord: ParticipantDTO;
    propertyManagers: ParticipantDTO[];  // List of managers who can respond
    
    // Current user's role in this conversation
    currentUserRole: 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';
    
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
    email: string;
    phone: string | null;
    role: 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';
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
    senderRole: 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';
    
    content: string;
    
    isOwn: boolean;
    isRead: boolean;
    readAt: string | null;
    
    createdAt: string;
}
```

### Request DTOs

```typescript
// Start new conversation (Tenant only)
interface CreateConversationRequest {
    propertyId: number;
    subject?: string;
    message: string;
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

Returns all conversations for the authenticated user based on their role.

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
            "participants": [
                {
                    "id": 10,
                    "fullName": "John Tenant",
                    "avatar": "https://...",
                    "role": "TENANT"
                }
            ],
            "primaryParticipant": {
                "id": 10,
                "fullName": "John Tenant",
                "avatar": "https://...",
                "role": "TENANT"
            },
            "subject": "Question about parking",
            "lastMessage": "Hi, I wanted to ask about the parking situation...",
            "lastMessageAt": "2025-01-04T10:30:00Z",
            "lastMessageSenderId": 10,
            "lastMessageSenderRole": "TENANT",
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

**Business Logic by Role:**

| User Role | Sees | Primary Participant |
|-----------|------|---------------------|
| TENANT | Their own conversations | Landlord |
| LANDLORD | Conversations on their properties | Tenant |
| PROPERTY_MANAGER | Conversations on assigned properties | Tenant |

- Sort by `lastMessageAt DESC` (most recent first)
- Exclude soft-deleted conversations
- `unreadCount` = messages NOT sent by current user AND `read_at IS NULL`

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
        "phone": "+1234567890",
        "role": "TENANT"
    },
    "landlord": {
        "id": 3,
        "fullName": "Jane Landlord",
        "avatar": "https://...",
        "email": "jane@example.com",
        "phone": "+1234567891",
        "role": "LANDLORD"
    },
    "propertyManagers": [
        {
            "id": 7,
            "fullName": "Mike Manager",
            "avatar": "https://...",
            "email": "mike@example.com",
            "phone": "+1234567892",
            "role": "PROPERTY_MANAGER"
        }
    ],
    "currentUserRole": "PROPERTY_MANAGER",
    "subject": "Question about parking",
    "status": "ACTIVE",
    "messages": [
        {
            "id": 5,
            "conversationId": 1,
            "senderId": 10,
            "senderName": "John Tenant",
            "senderAvatar": "https://...",
            "senderRole": "TENANT",
            "content": "Thanks for the quick response!",
            "isOwn": false,
            "isRead": false,
            "readAt": null,
            "createdAt": "2025-01-04T10:30:00Z"
        },
        {
            "id": 4,
            "conversationId": 1,
            "senderId": 7,
            "senderName": "Mike Manager",
            "senderAvatar": "https://...",
            "senderRole": "PROPERTY_MANAGER",
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
- `403 Forbidden`: User is not authorized to access this conversation
- `404 Not Found`: Conversation doesn't exist

**Authorization Check:**
```java
// User must be:
// 1. The tenant in this conversation, OR
// 2. The landlord who owns the property, OR
// 3. A property manager assigned to the property
```

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
        "participants": [
            {
                "id": 3,
                "fullName": "Jane Landlord",
                "avatar": "https://...",
                "role": "LANDLORD"
            }
        ],
        "primaryParticipant": {
            "id": 3,
            "fullName": "Jane Landlord",
            "avatar": "https://...",
            "role": "LANDLORD"
        },
        "subject": "Question about parking",
        "lastMessage": "Hi, I'm interested in the property...",
        "lastMessageAt": "2025-01-04T10:00:00Z",
        "lastMessageSenderId": 10,
        "lastMessageSenderRole": "TENANT",
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
        "senderRole": "TENANT",
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
5. Create first message with sender_role = 'TENANT'
6. Notify landlord AND all property managers assigned to property

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
    "senderId": 7,
    "senderName": "Mike Manager",
    "senderAvatar": "https://...",
    "senderRole": "PROPERTY_MANAGER",
    "content": "Yes, there's one assigned parking spot included with the unit.",
    "isOwn": true,
    "isRead": true,
    "readAt": null,
    "createdAt": "2025-01-04T10:15:00Z"
}
```

**Errors:**
- `400 Bad Request`: Message empty or exceeds 5000 characters
- `403 Forbidden`: User is not authorized
- `404 Not Found`: Conversation doesn't exist

**Business Logic:**
1. Validate user authorization (see Authorization Logic section)
2. Validate content (not empty, max 5000 chars)
3. Create message with sender's actual role
4. Update conversation's `last_message_at`
5. Notify appropriate recipients:
   - If sender is TENANT: notify landlord + property managers
   - If sender is LANDLORD/PM: notify tenant

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

### 6. Check Existing Conversation for Property (Tenant Only)

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

**SQL by Role:**

```sql
-- TENANT
SELECT COUNT(DISTINCT m.id), COUNT(DISTINCT c.id)
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.tenant_id = :userId
  AND m.sender_id != :userId
  AND m.read_at IS NULL
  AND c.tenant_deleted_at IS NULL;

-- LANDLORD
SELECT COUNT(DISTINCT m.id), COUNT(DISTINCT c.id)
FROM conversations c
JOIN properties p ON c.property_id = p.id
JOIN messages m ON m.conversation_id = c.id
WHERE p.landlord_id = :userId
  AND m.sender_id != :userId
  AND m.read_at IS NULL
  AND c.landlord_deleted_at IS NULL;

-- PROPERTY_MANAGER
SELECT COUNT(DISTINCT m.id), COUNT(DISTINCT c.id)
FROM conversations c
JOIN property_managers pm ON c.property_id = pm.property_id
JOIN messages m ON m.conversation_id = c.id
WHERE pm.user_id = :userId
  AND m.sender_id != :userId
  AND m.read_at IS NULL
  AND c.landlord_deleted_at IS NULL;
```

---

### 8. Delete/Archive Conversation

Soft delete for the current user only.

```http
DELETE /api/conversations/{conversationId}
Authorization: Bearer {{token}}
```

**Response:** `204 No Content`

**Business Logic:**
- TENANT: set `tenant_deleted_at = NOW()`
- LANDLORD: set `landlord_deleted_at = NOW()`
- PROPERTY_MANAGER: Not allowed (403)
- If BOTH tenant and landlord have deleted: schedule for hard delete

---

## Complete Flow Examples

### Flow 1: Tenant Contacts Landlord (PM Responds)

```
1. Tenant views property listing
   → Clicks "Contact Landlord"

2. Frontend checks existing conversation:
   GET /api/conversations/property/5
   → { exists: false }

3. Tenant sends message:
   POST /api/conversations
   { propertyId: 5, message: "Is this still available?" }
   → Conversation created
   → Notifications sent to: landlord + all property managers

4. Property Manager sees notification, opens messages:
   GET /api/conversations
   → Shows new conversation with unreadCount: 1

5. Property Manager opens conversation:
   GET /api/conversations/1
   → Returns full conversation detail
   → Shows tenant info + landlord info + PM list
   → currentUserRole: "PROPERTY_MANAGER"

6. Property Manager marks as read:
   PATCH /api/conversations/1/read

7. Property Manager replies:
   POST /api/conversations/1/messages
   { content: "Yes, would you like to schedule a viewing?" }
   → Message saved with senderRole: "PROPERTY_MANAGER"
   → Tenant notified

8. Tenant sees response:
   → Message shows "Mike Manager (Property Manager)"
   → Tenant knows they're talking to PM, not landlord
```

### Flow 2: Multiple Responders

```
1. Tenant asks question about property
   → Landlord and PM both see unread count

2. PM responds first:
   → Message shows: "Mike Manager (Property Manager)"
   → Tenant unread cleared

3. Landlord also wants to add info:
   POST /api/conversations/1/messages
   → Message shows: "Jane Landlord (Owner)"

4. Tenant sees both messages with clear role labels
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

When a message is sent, notify appropriate users:

```java
// In MessageService.sendMessage()
public void notifyRecipients(Conversation conv, Message msg, Long senderId) {
    Set<Long> recipients = new HashSet<>();
    
    if (msg.getSenderRole() == SenderRole.TENANT) {
        // Tenant sent: notify landlord + all property managers
        recipients.add(conv.getLandlordId());
        recipients.addAll(propertyManagerRepository
            .findUserIdsByPropertyId(conv.getPropertyId()));
    } else {
        // Landlord or PM sent: notify tenant only
        recipients.add(conv.getTenantId());
    }
    
    // Don't notify sender
    recipients.remove(senderId);
    
    for (Long userId : recipients) {
        notificationService.create(
            userId,
            NotificationType.MESSAGE,
            "New Message",
            "Message from " + msg.getSenderName() + " about " + propertyTitle,
            "/dashboard/messages?conversation=" + conv.getId()
        );
    }
}
```

---

## WebSocket Implementation (STOMP + SockJS)

The messaging system now supports real-time WebSocket communication using STOMP protocol over SockJS.

### Connection Setup

```javascript
// Using SockJS + STOMP
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const socket = new SockJS('http://localhost:8081/ws');
const stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
        'Authorization': 'Bearer <your_token>'
    },
    debug: (str) => console.log('[STOMP]', str),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000
});

stompClient.onConnect = (frame) => {
    console.log('Connected:', frame);
    
    // Subscribe to conversation updates
    stompClient.subscribe('/topic/conversations/5', (message) => {
        const msg = JSON.parse(message.body);
        console.log('New message:', msg);
    });
};

stompClient.activate();
```

### Send Message (WebSocket)

```javascript
stompClient.publish({
    destination: '/app/chat.send/5',
    body: JSON.stringify({ content: 'Hello via WebSocket!' })
});
```

### Mark as Read (WebSocket)

```javascript
stompClient.publish({
    destination: '/app/chat.read/5',
    body: ''
});
```

### Subscribe Destinations

| Destination | Description |
|-------------|-------------|
| `/topic/conversations/{id}` | Receive messages for a conversation |
| `/user/queue/errors` | Receive error notifications |

### Message Format (Same as REST)

**Received Message:**
```json
{
    "id": 15,
    "conversationId": 5,
    "senderId": 10,
    "senderName": "John Tenant",
    "senderRole": "TENANT",
    "content": "Hello!",
    "isOwn": false,
    "isRead": false,
    "createdAt": "2026-01-05T07:15:00"
}
```

### Frontend Implementation

A complete WebSocket service and React hook are provided:

- `src/lib/websocket/chatWebSocket.ts` - WebSocket service singleton
- `src/hooks/useChatWebSocket.ts` - React hook with auto-reconnect and REST fallback

**Usage in Components:**

```typescript
import { useChatWebSocket } from '@/hooks/useChatWebSocket';

function MessageComponent({ conversationId }) {
    const { isConnected, sendMessage, markAsRead } = useChatWebSocket({
        conversationId,
        onNewMessage: (message) => {
            // Handle real-time message
            console.log('New message:', message);
        },
    });

    const handleSend = async (content: string) => {
        const success = await sendMessage(content);
        if (!success) {
            // Falls back to REST automatically
        }
    };
}
```

### Fallback Strategy

The frontend implementation includes automatic fallback to REST API when WebSocket is unavailable:

1. Try sending via WebSocket first
2. If WebSocket disconnected, use REST API
3. Mark as read uses WebSocket when connected, REST otherwise

---

## TypeScript Interfaces (Frontend)

```typescript
// Enums
type UserRole = 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';
type ConversationStatus = 'ACTIVE' | 'ARCHIVED';

// Participant types
interface ParticipantSummary {
    id: number;
    fullName: string;
    avatar: string | null;
    role: UserRole;
}

interface Participant {
    id: number;
    fullName: string;
    avatar: string | null;
    email: string;
    phone: string | null;
    role: UserRole;
}

// Conversation types
interface Conversation {
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyImage: string | null;
    participants: ParticipantSummary[];
    primaryParticipant: ParticipantSummary;
    subject: string | null;
    lastMessage: string;
    lastMessageAt: string;
    lastMessageSenderId: number;
    lastMessageSenderRole: UserRole;
    unreadCount: number;
    status: ConversationStatus;
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
    propertyManagers: Participant[];
    currentUserRole: UserRole;
    subject: string | null;
    status: ConversationStatus;
    messages: Message[];
    hasMoreMessages: boolean;
    createdAt: string;
    updatedAt: string;
}

// Message types
interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string | null;
    senderRole: UserRole;
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

interface MarkAsReadResponse {
    markedAsRead: number;
    conversationId: number;
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
| 403 | User not authorized (wrong role, not assigned to property) |
| 404 | Conversation or property not found |
| 409 | Conversation already exists for tenant + property |

---

## Security Considerations

1. **Authorization**:
   - Tenants: only their own conversations
   - Landlords: only properties they own
   - Property Managers: only assigned properties

2. **Role Verification**:
   ```java
   // On every request, verify:
   // 1. User is authenticated
   // 2. User role matches allowed roles for endpoint
   // 3. User has access to specific conversation
   ```

3. **Rate Limiting**: 
   - 10 messages/minute per user
   - 5 new conversations/hour per tenant

4. **Content Validation**: 
   - Sanitize message content
   - Prevent XSS attacks

5. **Spam Prevention**: 
   - Cooldown before starting new conversations
   - Report/block functionality (future)

---

## UI Display Guidelines

### Sender Role Labels

Show clear role indicators in message UI:

```
Tenant view:
  "Jane Landlord" (Owner)
  "Mike Manager" (Property Manager)

Landlord/PM view:
  "John Tenant" (Tenant)
```

### Conversation List - Primary Contact

| Viewer Role | Shows as Primary Contact |
|-------------|--------------------------|
| TENANT | Landlord name |
| LANDLORD | Tenant name |
| PROPERTY_MANAGER | Tenant name |

### Message Alignment

- Own messages: Right side, primary color
- Other messages: Left side, secondary/muted color
- Show sender name + role label above each message
