# Notifications API Specification

## Overview

This document specifies the REST API endpoints for the notification system in the RentMate application. Notifications are triggered by various system events and delivered to users based on their role (Tenant, Landlord, Property Manager).

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
  "relatedEntityId": 15,
  "relatedEntityType": "LEASE_APPLICATION",
  "createdAt": "2026-01-05T10:30:00.000Z"
}
```

### NotificationType Enum

| Value | Description |
|-------|-------------|
| `APPLICATION` | Lease application events (submitted, approved, rejected, cancelled) |
| `MESSAGE` | New message received in conversation |
| `PROPERTY` | Property-related updates (saved property status change) |
| `PAYMENT` | Payment reminders, confirmations, overdue alerts |
| `MAINTENANCE` | Maintenance request lifecycle updates |
| `LEASE` | Lease events (created, accepted, rejected, activated, expiring, terminated) |
| `SYSTEM` | System announcements and updates |

### RelatedEntityType Enum (Optional field for deep linking)

| Value | Description |
|-------|-------------|
| `LEASE_APPLICATION` | Links to application |
| `LEASE` | Links to lease |
| `MAINTENANCE_REQUEST` | Links to maintenance request |
| `CONVERSATION` | Links to conversation |
| `PROPERTY` | Links to property |
| `PAYMENT` | Links to payment |
| `RENT_SCHEDULE` | Links to rent schedule item |

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
| `type` | string | No | null | Filter by notification type (comma-separated for multiple) |

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
      "relatedEntityId": 15,
      "relatedEntityType": "LEASE_APPLICATION",
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
      "relatedEntityId": 5,
      "relatedEntityType": "CONVERSATION",
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
  "relatedEntityId": 15,
  "relatedEntityType": "LEASE_APPLICATION",
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

### 6. Delete All Read Notifications (Optional)

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

## Backend-Triggered Notifications (Complete List)

The backend MUST automatically create notifications for all the following events. These are **not** called by the frontend - they are created internally by the backend when certain actions occur.

---

### 1. Lease Application Events

| Trigger Action | API Call | Recipient | Type | Title | Description Template | Link |
|----------------|----------|-----------|------|-------|---------------------|------|
| Tenant submits application | `POST /api/lease-applications` | Landlord | `APPLICATION` | New Lease Application | "{tenantName} submitted an application for {propertyTitle}" | `/dashboard/applications` |
| Tenant submits application | `POST /api/lease-applications` | Property Manager (if assigned) | `APPLICATION` | New Lease Application | "{tenantName} submitted an application for {propertyTitle}" | `/dashboard/applications` |
| Landlord/PM approves application | `PATCH /api/lease-applications/{id}/approve` | Tenant | `APPLICATION` | Application Approved! | "Your application for {propertyTitle} has been approved!" | `/dashboard/applications` |
| Landlord/PM rejects application | `PATCH /api/lease-applications/{id}/reject` | Tenant | `APPLICATION` | Application Not Approved | "Your application for {propertyTitle} was not approved" | `/dashboard/applications` |
| Tenant cancels application | `PATCH /api/lease-applications/{id}/cancel` | Landlord | `APPLICATION` | Application Cancelled | "{tenantName} cancelled their application for {propertyTitle}" | `/dashboard/applications` |
| Tenant cancels application | `PATCH /api/lease-applications/{id}/cancel` | Property Manager (if assigned) | `APPLICATION` | Application Cancelled | "{tenantName} cancelled their application for {propertyTitle}" | `/dashboard/applications` |

---

### 2. Lease Agreement Events

| Trigger Action | API Call | Recipient | Type | Title | Description Template | Link |
|----------------|----------|-----------|------|-------|---------------------|------|
| Landlord creates lease | `POST /api/lease-agreements` | Tenant | `LEASE` | New Lease Agreement | "A lease agreement for {propertyTitle} has been sent to you for review" | `/dashboard/leases` |
| Landlord attaches contract | `PATCH /api/lease-agreements/{id}/contract` | Tenant | `LEASE` | Lease Contract Ready | "The contract for {propertyTitle} is ready for your review" | `/dashboard/leases` |
| Tenant accepts lease | `PATCH /api/lease-agreements/{id}/accept` | Landlord | `LEASE` | Lease Accepted | "{tenantName} has accepted the lease for {propertyTitle}" | `/dashboard/leases` |
| Tenant accepts lease | `PATCH /api/lease-agreements/{id}/accept` | Property Manager (if assigned) | `LEASE` | Lease Accepted | "{tenantName} has accepted the lease for {propertyTitle}" | `/dashboard/leases` |
| Tenant rejects lease | `PATCH /api/lease-agreements/{id}/reject` | Landlord | `LEASE` | Lease Rejected | "{tenantName} has rejected the lease for {propertyTitle}. Reason: {reason}" | `/dashboard/leases` |
| Tenant rejects lease | `PATCH /api/lease-agreements/{id}/reject` | Property Manager (if assigned) | `LEASE` | Lease Rejected | "{tenantName} has rejected the lease for {propertyTitle}" | `/dashboard/leases` |
| Lease activated (after payment) | `POST /api/payments/lease/{id}/acceptance` | Tenant | `LEASE` | Lease Activated | "Your lease for {propertyTitle} is now active!" | `/dashboard/leases` |
| Lease activated (after payment) | `POST /api/payments/lease/{id}/acceptance` | Landlord | `LEASE` | Lease Activated | "Lease for {propertyTitle} with {tenantName} is now active" | `/dashboard/leases` |
| Landlord terminates lease | `PATCH /api/lease-agreements/{id}/terminate` | Tenant | `LEASE` | Lease Terminated | "Your lease for {propertyTitle} has been terminated" | `/dashboard/leases` |
| Lease expires (scheduled job) | - | Tenant | `LEASE` | Lease Expired | "Your lease for {propertyTitle} has expired" | `/dashboard/leases` |
| Lease expires (scheduled job) | - | Landlord | `LEASE` | Lease Expired | "Lease for {propertyTitle} with {tenantName} has expired" | `/dashboard/leases` |
| Acceptance deadline approaching (24h before) | Scheduled job | Tenant | `LEASE` | Action Required: Lease Expiring | "You have 24 hours to respond to the lease for {propertyTitle}" | `/dashboard/leases` |
| Lease auto-terminated (deadline passed) | Scheduled job | Tenant | `LEASE` | Lease Expired | "Lease offer for {propertyTitle} expired due to no response" | `/dashboard/leases` |
| Lease auto-terminated (deadline passed) | Scheduled job | Landlord | `LEASE` | Lease Expired | "Lease offer for {propertyTitle} expired - no tenant response" | `/dashboard/leases` |
| Lease expiring soon (30 days before end) | Scheduled job | Tenant | `LEASE` | Lease Expiring Soon | "Your lease for {propertyTitle} expires in 30 days" | `/dashboard/leases` |
| Lease expiring soon (30 days before end) | Scheduled job | Landlord | `LEASE` | Lease Expiring Soon | "Lease for {propertyTitle} with {tenantName} expires in 30 days" | `/dashboard/leases` |
| Lease expiring soon (7 days before end) | Scheduled job | Tenant | `LEASE` | Lease Expiring | "Your lease for {propertyTitle} expires in 7 days" | `/dashboard/leases` |

---

### 3. Payment Events

| Trigger Action | API Call | Recipient | Type | Title | Description Template | Link |
|----------------|----------|-----------|------|-------|---------------------|------|
| Acceptance payment made | `POST /api/payments/lease/{id}/acceptance` | Landlord | `PAYMENT` | Payment Received | "{tenantName} paid ${amount} (deposit + first rent) for {propertyTitle}" | `/dashboard/leases` |
| Rent payment made | `POST /api/rent-schedule/{leaseId}/{scheduleId}/pay` | Landlord | `PAYMENT` | Rent Payment Received | "{tenantName} paid ${amount} rent for {propertyTitle}" | `/dashboard/leases` |
| Rent payment made | `POST /api/rent-schedule/{leaseId}/{scheduleId}/pay` | Tenant | `PAYMENT` | Payment Confirmed | "Your payment of ${amount} for {propertyTitle} was successful" | `/dashboard/payments` |
| Rent due reminder (7 days before) | Scheduled job | Tenant | `PAYMENT` | Rent Due Soon | "Rent of ${amount} for {propertyTitle} is due in 7 days" | `/dashboard/payments` |
| Rent due reminder (3 days before) | Scheduled job | Tenant | `PAYMENT` | Rent Due Soon | "Rent of ${amount} for {propertyTitle} is due in 3 days" | `/dashboard/payments` |
| Rent due reminder (1 day before) | Scheduled job | Tenant | `PAYMENT` | Rent Due Tomorrow | "Rent of ${amount} for {propertyTitle} is due tomorrow" | `/dashboard/payments` |
| Rent due today | Scheduled job | Tenant | `PAYMENT` | Rent Due Today | "Rent of ${amount} for {propertyTitle} is due today" | `/dashboard/payments` |
| Rent overdue (1 day after) | Scheduled job | Tenant | `PAYMENT` | Rent Overdue | "Rent for {propertyTitle} is 1 day overdue" | `/dashboard/payments` |
| Rent overdue (1 day after) | Scheduled job | Landlord | `PAYMENT` | Rent Overdue | "{tenantName}'s rent for {propertyTitle} is overdue" | `/dashboard/leases` |
| Rent overdue (7 days after) | Scheduled job | Tenant | `PAYMENT` | Rent Seriously Overdue | "Rent for {propertyTitle} is 7 days overdue. Late fee may apply." | `/dashboard/payments` |
| Late fee applied | Scheduled job | Tenant | `PAYMENT` | Late Fee Applied | "A late fee of ${amount} has been applied to your rent for {propertyTitle}" | `/dashboard/payments` |
| Landlord waives rent | `PATCH /api/rent-schedule/{leaseId}/{scheduleId}/waive` | Tenant | `PAYMENT` | Rent Waived | "Your rent for {periodMonth} at {propertyTitle} has been waived" | `/dashboard/payments` |
| Manual payment logged | `POST /api/payments/lease/{id}` | Tenant | `PAYMENT` | Payment Recorded | "Landlord recorded a ${amount} payment for {propertyTitle}" | `/dashboard/payments` |

---

### 4. Maintenance Request Events

| Trigger Action | API Call | Recipient | Type | Title | Description Template | Link |
|----------------|----------|-----------|------|-------|---------------------|------|
| Tenant creates request | `POST /api/maintenance` | Landlord | `MAINTENANCE` | New Maintenance Request | "{tenantName} submitted a {priority} maintenance request for {propertyTitle}: {title}" | `/dashboard/maintenance` |
| Tenant creates request | `POST /api/maintenance` | Property Manager (if assigned) | `MAINTENANCE` | New Maintenance Request | "{tenantName} submitted a {priority} maintenance request for {propertyTitle}: {title}" | `/dashboard/maintenance` |
| Landlord/PM accepts request | `PATCH /api/maintenance/{id}/accept` | Tenant | `MAINTENANCE` | Request Accepted | "Your maintenance request for {propertyTitle} has been accepted" | `/dashboard/maintenance` |
| Landlord/PM rejects request | `PATCH /api/maintenance/{id}/reject` | Tenant | `MAINTENANCE` | Request Rejected | "Your maintenance request for {propertyTitle} was rejected. Reason: {reason}" | `/dashboard/maintenance` |
| Landlord/PM schedules work | `PATCH /api/maintenance/{id}/schedule` | Tenant | `MAINTENANCE` | Maintenance Scheduled | "Maintenance for {propertyTitle} is scheduled for {date}" | `/dashboard/maintenance` |
| Landlord/PM starts work | `PATCH /api/maintenance/{id}/start` | Tenant | `MAINTENANCE` | Work In Progress | "Work has started on your maintenance request for {propertyTitle}" | `/dashboard/maintenance` |
| Landlord/PM completes request | `PATCH /api/maintenance/{id}/resolve` | Tenant | `MAINTENANCE` | Maintenance Completed | "Your maintenance request for {propertyTitle} has been completed" | `/dashboard/maintenance` |
| Tenant cancels request | `PATCH /api/maintenance/{id}/cancel` | Landlord | `MAINTENANCE` | Request Cancelled | "{tenantName} cancelled their maintenance request for {propertyTitle}" | `/dashboard/maintenance` |
| Tenant cancels request | `PATCH /api/maintenance/{id}/cancel` | Property Manager (if assigned) | `MAINTENANCE` | Request Cancelled | "{tenantName} cancelled their maintenance request for {propertyTitle}" | `/dashboard/maintenance` |
| Landlord/PM reopens request | `PATCH /api/maintenance/{id}/reopen` | Tenant | `MAINTENANCE` | Request Reopened | "Your maintenance request for {propertyTitle} has been reopened" | `/dashboard/maintenance` |
| Priority changed | `PATCH /api/maintenance/{id}/priority` | Tenant | `MAINTENANCE` | Priority Updated | "Priority for your request at {propertyTitle} changed to {priority}" | `/dashboard/maintenance` |
| New comment added | `POST /api/maintenance/{id}/comments` | Other party | `MAINTENANCE` | New Comment | "{authorName} commented on maintenance request for {propertyTitle}" | `/dashboard/maintenance` |
| Urgent request overdue (3+ days open) | Scheduled job | Landlord | `MAINTENANCE` | Urgent Request Overdue | "Urgent maintenance request at {propertyTitle} has been open for {days} days" | `/dashboard/maintenance` |

---

### 5. Message Events

| Trigger Action | API Call | Recipient | Type | Title | Description Template | Link |
|----------------|----------|-----------|------|-------|---------------------|------|
| New message received | `POST /api/conversations/{id}/messages` or WebSocket | Recipient | `MESSAGE` | New Message | "{senderName} sent you a message about {propertyTitle}" | `/dashboard/messages` |
| New conversation started | `POST /api/conversations` | Landlord/PM | `MESSAGE` | New Conversation | "{tenantName} started a conversation about {propertyTitle}" | `/dashboard/messages` |

---

### 6. Property Events (For Saved Properties)

| Trigger Action | API Call | Recipient | Type | Title | Description Template | Link |
|----------------|----------|-----------|------|-------|---------------------|------|
| Saved property becomes available | Property status change | Tenant (who saved it) | `PROPERTY` | Property Available | "{propertyTitle} is now available!" | `/properties/{id}` |
| Saved property rented | Property status change | Tenant (who saved it) | `PROPERTY` | Property No Longer Available | "{propertyTitle} has been rented" | `/properties/{id}` |
| Saved property price changed | Property update | Tenant (who saved it) | `PROPERTY` | Price Change | "Price for {propertyTitle} changed from ${oldPrice} to ${newPrice}" | `/properties/{id}` |

---

### 7. System Events

| Trigger | Recipient | Type | Title | Description Template | Link |
|---------|-----------|------|-------|---------------------|------|
| Welcome new user | After registration | User | `SYSTEM` | Welcome to RentMate! | "Your account has been created. Start exploring properties!" | `/properties` |
| Account verification | After email verification | User | `SYSTEM` | Email Verified | "Your email has been verified successfully" | `/dashboard` |
| Password changed | After password change | User | `SYSTEM` | Password Changed | "Your password was changed successfully" | `/dashboard/profile` |
| Profile updated | After profile update | User | `SYSTEM` | Profile Updated | "Your profile has been updated" | `/dashboard/profile` |

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

## Notification Count by Feature

| Feature | Notification Triggers |
|---------|----------------------|
| **Applications** | 6 notifications (submit, approve, reject, cancel × recipients) |
| **Leases** | 16+ notifications (create, accept, reject, activate, terminate, expire, reminders) |
| **Payments** | 12+ notifications (acceptance, rent, reminders, overdue, late fees, waive) |
| **Maintenance** | 14 notifications (create, accept, reject, schedule, start, complete, cancel, reopen, priority, comment, overdue) |
| **Messages** | 2 notifications (new message, new conversation) |
| **Properties** | 3 notifications (available, rented, price change for saved properties) |
| **System** | 4 notifications (welcome, verification, password, profile) |

**Total: ~57 notification types covering all user interactions**

---

## Implementation Notes

1. **Authentication**: All endpoints require Bearer token authentication
2. **Authorization**: Users can only access their own notifications
3. **Backend-Generated**: Notifications are created by the backend when events occur, not by frontend API calls
4. **Link Format**: The `link` field contains frontend route paths for navigation
5. **Ordering**: Notifications should be returned in descending order by `createdAt` (newest first)
6. **Property Manager**: When a property has an assigned manager, BOTH landlord AND manager receive relevant notifications
7. **Scheduled Jobs**: Payment reminders and lease expiry warnings require backend scheduled tasks (cron jobs)
8. **Batching**: For scheduled reminders, batch notifications to avoid sending too many at once
9. **Deduplication**: Avoid sending duplicate notifications for the same event
