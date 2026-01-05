# Notifications API Specification

## Overview

This document specifies the REST API endpoints for the notification system in the RentMate application. Notifications are triggered by various system events (applications, messages, payments, maintenance, etc.) and delivered to users.

## Data Models

### Notification

```json
{
  "id": 1,
  "userId": 1,
  "type": "APPLICATION",
  "title": "New Lease Application",
  "description": "You received a new application for Modern Downtown Apartment",
  "read": false,
  "link": "/dashboard/applications",
  "createdAt": "2026-01-05T10:30:00.000Z"
}
```

### NotificationType Enum

| Value | Description |
|-------|-------------|
| `APPLICATION` | Lease application events (submitted, approved, rejected, etc.) |
| `MESSAGE` | New message received |
| `PROPERTY` | Property-related updates |
| `PAYMENT` | Payment reminders, confirmations, overdue alerts |
| `MAINTENANCE` | Maintenance request updates |
| `LEASE` | Lease events (created, expiring, terminated) |
| `SYSTEM` | System announcements and updates |

---

## API Endpoints

### 1. Get User Notifications (Paginated)

Retrieve all notifications for the authenticated user with pagination support.

**Endpoint:** `GET /api/notifications`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 0 | Page number (0-indexed) |
| `size` | integer | No | 20 | Number of items per page |
| `unreadOnly` | boolean | No | false | Filter to show only unread notifications |
| `type` | string | No | null | Filter by notification type |

**Response:** `200 OK`

```json
{
  "content": [
    {
      "id": 1,
      "userId": 1,
      "type": "APPLICATION",
      "title": "New Lease Application",
      "description": "You received a new application for Modern Downtown Apartment",
      "read": false,
      "link": "/dashboard/applications",
      "createdAt": "2026-01-05T10:30:00.000Z"
    },
    {
      "id": 2,
      "userId": 1,
      "type": "MESSAGE",
      "title": "New Message",
      "description": "John Tenant sent you a message about Cozy Studio",
      "read": true,
      "link": "/dashboard/messages",
      "createdAt": "2026-01-05T09:15:00.000Z"
    }
  ],
  "totalElements": 25,
  "totalPages": 2,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false
}
```

---

### 2. Get Unread Notification Count

Get the count of unread notifications for the authenticated user.

**Endpoint:** `GET /api/notifications/unread-count`

**Response:** `200 OK`

```json
{
  "count": 5
}
```

---

### 3. Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `PATCH /api/notifications/{id}/read`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Notification ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "userId": 1,
  "type": "APPLICATION",
  "title": "New Lease Application",
  "description": "You received a new application for Modern Downtown Apartment",
  "read": true,
  "link": "/dashboard/applications",
  "createdAt": "2026-01-05T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Notification not found or doesn't belong to user

---

### 4. Mark All Notifications as Read

Mark all notifications for the authenticated user as read.

**Endpoint:** `PATCH /api/notifications/read-all`

**Response:** `200 OK`

```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

### 5. Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/notifications/{id}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Notification ID |

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Notification not found or doesn't belong to user

---

### 6. Delete All Read Notifications

Delete all read notifications for the authenticated user.

**Endpoint:** `DELETE /api/notifications/read`

**Response:** `200 OK`

```json
{
  "message": "All read notifications deleted",
  "count": 10
}
```

---

## Backend-Triggered Notifications

The backend should automatically create notifications for the following events. These are **not** called by the frontend - they are created internally by the backend when certain actions occur.

### Application Events

| Trigger | Recipient | Type | Title | Description Template |
|---------|-----------|------|-------|---------------------|
| Application submitted | Landlord/Manager | `APPLICATION` | New Lease Application | "You received a new application for {propertyTitle}" |
| Application approved | Tenant | `APPLICATION` | Application Approved | "Your application for {propertyTitle} has been approved" |
| Application rejected | Tenant | `APPLICATION` | Application Rejected | "Your application for {propertyTitle} was not approved" |
| Application under review | Tenant | `APPLICATION` | Application Under Review | "Your application for {propertyTitle} is being reviewed" |

### Lease Events

| Trigger | Recipient | Type | Title | Description Template |
|---------|-----------|------|-------|---------------------|
| Lease created/sent | Tenant | `LEASE` | New Lease Agreement | "A lease agreement for {propertyTitle} has been sent to you" |
| Lease accepted | Landlord | `LEASE` | Lease Accepted | "{tenantName} has accepted the lease for {propertyTitle}" |
| Lease rejected | Landlord | `LEASE` | Lease Rejected | "{tenantName} has rejected the lease for {propertyTitle}" |
| Lease activated | Tenant | `LEASE` | Lease Activated | "Your lease for {propertyTitle} is now active" |
| Lease expiring soon (30 days) | Tenant & Landlord | `LEASE` | Lease Expiring Soon | "Lease for {propertyTitle} expires in 30 days" |
| Lease terminated | Tenant | `LEASE` | Lease Terminated | "Your lease for {propertyTitle} has been terminated" |

### Payment Events

| Trigger | Recipient | Type | Title | Description Template |
|---------|-----------|------|-------|---------------------|
| Rent due reminder (7 days before) | Tenant | `PAYMENT` | Rent Due Soon | "Rent for {propertyTitle} is due in 7 days" |
| Rent due reminder (1 day before) | Tenant | `PAYMENT` | Rent Due Tomorrow | "Rent for {propertyTitle} is due tomorrow" |
| Rent overdue | Tenant | `PAYMENT` | Rent Overdue | "Rent for {propertyTitle} is overdue" |
| Payment received | Tenant | `PAYMENT` | Payment Confirmed | "Your payment of ${amount} for {propertyTitle} was received" |
| Payment received | Landlord | `PAYMENT` | Payment Received | "{tenantName} paid ${amount} for {propertyTitle}" |

### Maintenance Events

| Trigger | Recipient | Type | Title | Description Template |
|---------|-----------|------|-------|---------------------|
| Request submitted | Landlord/Manager | `MAINTENANCE` | New Maintenance Request | "{tenantName} submitted a maintenance request for {propertyTitle}" |
| Request accepted | Tenant | `MAINTENANCE` | Request Accepted | "Your maintenance request for {propertyTitle} has been accepted" |
| Request scheduled | Tenant | `MAINTENANCE` | Maintenance Scheduled | "Maintenance for {propertyTitle} scheduled for {date}" |
| Request completed | Tenant | `MAINTENANCE` | Maintenance Completed | "Maintenance request for {propertyTitle} has been completed" |
| Request rejected | Tenant | `MAINTENANCE` | Request Rejected | "Your maintenance request for {propertyTitle} was rejected" |

### Message Events

| Trigger | Recipient | Type | Title | Description Template |
|---------|-----------|------|-------|---------------------|
| New message received | Recipient | `MESSAGE` | New Message | "{senderName} sent you a message about {propertyTitle}" |

---

## Optional: Real-Time Notifications (WebSocket)

For real-time notification delivery, consider implementing WebSocket support:

**WebSocket Endpoint:** `ws://api-host/ws/notifications`

**Connection:** Client connects with auth token

**Server-Sent Events:**

```json
{
  "event": "NEW_NOTIFICATION",
  "data": {
    "id": 1,
    "type": "MESSAGE",
    "title": "New Message",
    "description": "John sent you a message",
    "read": false,
    "link": "/dashboard/messages",
    "createdAt": "2026-01-05T10:30:00.000Z"
  }
}
```

```json
{
  "event": "NOTIFICATION_COUNT_UPDATE",
  "data": {
    "unreadCount": 6
  }
}
```

---

## Summary

### Required Endpoints (Minimum)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get paginated notifications |
| `GET` | `/api/notifications/unread-count` | Get unread count |
| `PATCH` | `/api/notifications/{id}/read` | Mark one as read |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/notifications/{id}` | Delete notification |

### Nice-to-Have Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `DELETE` | `/api/notifications/read` | Delete all read notifications |
| WebSocket | `/ws/notifications` | Real-time notifications |

---

## Notes

1. **Authentication**: All endpoints require Bearer token authentication
2. **Authorization**: Users can only access their own notifications
3. **Backend-Generated**: Notifications are created by the backend when events occur, not by frontend API calls
4. **Link Format**: The `link` field contains frontend route paths for navigation
5. **Ordering**: Notifications should be returned in descending order by `createdAt` (newest first)
