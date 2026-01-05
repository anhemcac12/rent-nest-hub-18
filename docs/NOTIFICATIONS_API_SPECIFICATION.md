# Notifications API Specification

## Overview

This document specifies the API endpoints for the notification system. Notifications inform users about important events across the platform including applications, leases, payments, maintenance, and messages.

---

## Base URL

```
http://localhost:8081/api/notifications
```

---

## API Endpoints

### 1. Get Notifications (Paginated)

**GET** `/api/notifications`

Retrieve paginated notifications for the authenticated user with optional filters.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 0 | Page number (0-indexed) |
| `size` | int | 20 | Number of notifications per page |
| `unreadOnly` | boolean | false | Filter to show only unread notifications |
| `type` | string | null | Filter by type(s), comma-separated (e.g., `APPLICATION,LEASE,MAINTENANCE`) |

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "userId": 5,
      "type": "MAINTENANCE",
      "title": "New Maintenance Request",
      "description": "John Doe submitted a HIGH maintenance request for Sunset Apartments: Broken AC",
      "read": false,
      "link": "/dashboard/maintenance",
      "relatedEntityId": 10,
      "relatedEntityType": "MAINTENANCE_REQUEST",
      "createdAt": "2026-01-05T22:00:00"
    },
    {
      "id": 2,
      "userId": 5,
      "type": "APPLICATION",
      "title": "New Application Received",
      "description": "Jane Smith applied for Downtown Loft",
      "read": true,
      "link": "/dashboard/applications",
      "relatedEntityId": 15,
      "relatedEntityType": "LEASE_APPLICATION",
      "createdAt": "2026-01-04T14:30:00"
    }
  ],
  "totalElements": 25,
  "totalPages": 2
}
```

---

### 2. Get Unread Count

**GET** `/api/notifications/unread-count`

Get the count of unread notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

### 3. Mark Single Notification as Read

**PATCH** `/api/notifications/{id}/read`

Mark a specific notification as read.

**Path Parameters:**
- `id` (required): Notification ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": 5,
  "type": "MAINTENANCE",
  "title": "New Maintenance Request",
  "description": "John Doe submitted a HIGH maintenance request...",
  "read": true,
  "link": "/dashboard/maintenance",
  "relatedEntityId": 10,
  "relatedEntityType": "MAINTENANCE_REQUEST",
  "createdAt": "2026-01-05T22:00:00"
}
```

**Error Responses:**
- `404 Not Found`: Notification not found or doesn't belong to user

---

### 4. Mark All Notifications as Read

**PATCH** `/api/notifications/read-all`

Mark all notifications as read for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

### 5. Delete Single Notification

**DELETE** `/api/notifications/{id}`

Delete a specific notification.

**Path Parameters:**
- `id` (required): Notification ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found`: Notification not found or doesn't belong to user

---

### 6. Delete All Read Notifications

**DELETE** `/api/notifications/read`

Delete all read notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "All read notifications deleted",
  "count": 10
}
```

---

## Data Models

### Notification Object

```typescript
interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  link?: string;
  relatedEntityId?: number;
  relatedEntityType?: RelatedEntityType;
  createdAt: string; // ISO 8601 format
}
```

### NotificationType Enum

| Value | Description |
|-------|-------------|
| `APPLICATION` | Lease application events |
| `LEASE` | Lease agreement events |
| `MAINTENANCE` | Maintenance request events |
| `MESSAGE` | New message events |
| `PAYMENT` | Payment events |
| `PROPERTY` | Property status events |
| `SYSTEM` | System notifications |

### RelatedEntityType Enum

| Value | Description |
|-------|-------------|
| `LEASE_APPLICATION` | Links to a lease application |
| `LEASE_AGREEMENT` | Links to a lease agreement |
| `MAINTENANCE_REQUEST` | Links to a maintenance request |
| `CONVERSATION` | Links to a conversation |
| `PAYMENT` | Links to a payment |
| `PROPERTY` | Links to a property |
| `USER` | Links to a user |

---

## WebSocket Real-Time Notifications

### Connection

**URL:** `ws://localhost:8081/ws` (STOMP over SockJS)

### Subscription

**Topic:** `/user/queue/notifications`

Notifications are pushed automatically when triggered by backend events.

### Sample Payload

```json
{
  "id": 123,
  "userId": 5,
  "type": "MAINTENANCE",
  "title": "Request Accepted",
  "description": "Your maintenance request has been accepted by the landlord",
  "read": false,
  "link": "/dashboard/maintenance",
  "relatedEntityId": 10,
  "relatedEntityType": "MAINTENANCE_REQUEST",
  "createdAt": "2026-01-05T22:15:00"
}
```

---

## Notification Triggers by Category

### APPLICATION Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| Application submitted | Landlord/PM | "New Application Received" | /dashboard/applications |
| Application approved | Tenant | "Application Approved!" | /dashboard/applications |
| Application rejected | Tenant | "Application Rejected" | /dashboard/applications |
| Application cancelled | Landlord/PM | "Application Cancelled" | /dashboard/applications |

### LEASE Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| Lease created | Tenant | "New Lease Agreement" | /dashboard/leases |
| Contract attached | Tenant | "Lease Contract Ready" | /dashboard/leases |
| Lease accepted | Landlord | "Lease Accepted" | /dashboard/landlord-leases |
| Lease rejected | Landlord | "Lease Rejected" | /dashboard/landlord-leases |
| Lease activated | Tenant | "Lease Now Active" | /dashboard/leases |
| Lease terminated | Both | "Lease Terminated" | /dashboard/leases |
| Lease expiring (30/7/1 days) | Both | "Lease Expiring Soon" | /dashboard/leases |

### PAYMENT Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| Acceptance payment received | Landlord | "Payment Received" | /dashboard/landlord-leases |
| Rent payment received | Landlord | "Rent Payment Received" | /dashboard/payments |
| Rent due (7/3/1 days) | Tenant | "Rent Due Soon" | /dashboard/payments |
| Rent due today | Tenant | "Rent Due Today" | /dashboard/payments |
| Rent overdue | Tenant | "Rent Overdue" | /dashboard/payments |
| Late fee applied | Tenant | "Late Fee Applied" | /dashboard/payments |
| Late fee waived | Tenant | "Late Fee Waived" | /dashboard/payments |

### MAINTENANCE Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| Request created | Landlord/PM | "New Maintenance Request" | /dashboard/landlord-maintenance |
| Request accepted | Tenant | "Request Accepted" | /dashboard/maintenance |
| Request rejected | Tenant | "Request Rejected" | /dashboard/maintenance |
| Request scheduled | Tenant | "Maintenance Scheduled" | /dashboard/maintenance |
| Work started | Tenant | "Work In Progress" | /dashboard/maintenance |
| Request completed | Tenant | "Request Completed" | /dashboard/maintenance |
| Request cancelled | Landlord/PM | "Request Cancelled" | /dashboard/landlord-maintenance |
| Request reopened | Landlord/PM | "Request Reopened" | /dashboard/landlord-maintenance |
| Priority changed | Tenant | "Priority Updated" | /dashboard/maintenance |
| Comment added | Both | "New Comment" | /dashboard/maintenance |
| Urgent overdue (24h+) | Landlord/PM | "Urgent Request Overdue" | /dashboard/landlord-maintenance |

### MESSAGE Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| New message | Recipient | "New Message" | /dashboard/messages |
| New conversation | Recipient | "New Conversation" | /dashboard/messages |

### PROPERTY Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| Saved property available | User | "Property Now Available" | /properties/{id} |
| Saved property rented | User | "Property Rented" | /properties/{id} |
| Saved property price changed | User | "Price Changed" | /properties/{id} |

### SYSTEM Notifications

| Trigger | Recipient | Title | Link |
|---------|-----------|-------|------|
| Welcome | New user | "Welcome to RentMate!" | /dashboard |
| Email verified | User | "Email Verified" | /dashboard/profile |
| Password changed | User | "Password Changed" | /dashboard/profile |
| Profile updated | User | "Profile Updated" | /dashboard/profile |

---

## Frontend Implementation

### API Client Usage

```typescript
import { notificationsApi } from '@/lib/api/notificationsApi';

// Get paginated notifications
const response = await notificationsApi.getNotifications({
  page: 0,
  size: 20,
  unreadOnly: false,
  type: ['APPLICATION', 'LEASE']
});

// Get unread count
const { count } = await notificationsApi.getUnreadCount();

// Mark single as read
await notificationsApi.markAsRead(notificationId);

// Mark all as read
await notificationsApi.markAllAsRead();

// Delete single notification
await notificationsApi.deleteNotification(notificationId);

// Delete all read notifications
await notificationsApi.deleteAllRead();
```

### WebSocket Integration

```typescript
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
  onConnect: () => {
    client.subscribe('/user/queue/notifications', (message) => {
      const notification = JSON.parse(message.body);
      // Handle new notification (show toast, update badge, etc.)
    });
  },
});

client.activate();
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Notification doesn't exist |
| 500 | Internal Server Error |

---

## API Implementation Status

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/notifications` | GET | ✅ Ready |
| `/api/notifications/unread-count` | GET | ✅ Ready |
| `/api/notifications/{id}/read` | PATCH | ✅ Ready |
| `/api/notifications/read-all` | PATCH | ✅ Ready |
| `/api/notifications/{id}` | DELETE | ✅ Ready |
| `/api/notifications/read` | DELETE | ✅ Ready |
| WebSocket `/user/queue/notifications` | - | ✅ Ready |
