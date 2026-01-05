# Notifications API Specification

## Overview

This document specifies the API endpoints and notification triggers for the notification system. Notifications are **created by the backend** when specific events occur, and sent to the appropriate users with role-appropriate links.

**IMPORTANT**: All notification links MUST be role-aware. The backend determines the recipient's role and uses the appropriate dashboard path.

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
      "link": "/dashboard/landlord-maintenance",
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
      "link": "/dashboard/landlord-applications",
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

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

### 3. Mark Single Notification as Read

**PATCH** `/api/notifications/{id}/read`

**Response (200 OK):** Returns the updated notification object.

---

### 4. Mark All Notifications as Read

**PATCH** `/api/notifications/read-all`

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

**Response:** `204 No Content`

---

### 6. Delete All Read Notifications

**DELETE** `/api/notifications/read`

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

## Role-Based Link Mapping

**CRITICAL**: The backend MUST use role-appropriate links when creating notifications.

### Dashboard Routes by Role

| Feature | TENANT | LANDLORD | PROPERTY_MANAGER |
|---------|--------|----------|------------------|
| Applications | `/dashboard/applications` | `/dashboard/landlord-applications` | `/dashboard/pm-applications` |
| Leases | `/dashboard/leases` | `/dashboard/landlord-leases` | `/dashboard/pm-leases` |
| Maintenance | `/dashboard/maintenance` | `/dashboard/landlord-maintenance` | `/dashboard/pm-maintenance` |
| Payments | `/dashboard/payments` | `/dashboard/landlord-leases` | `/dashboard/pm-leases` |
| Messages | `/dashboard/messages` | `/dashboard/landlord-messages` | `/dashboard/pm-messages` |
| Properties | `/dashboard/rentals` | `/dashboard/landlord-properties` | `/dashboard/pm-properties` |
| Profile | `/dashboard/profile` | `/dashboard/profile` | `/dashboard/profile` |
| Home | `/dashboard` | `/dashboard/landlord` | `/dashboard/pm` |

---

## Notification Triggers - Complete List

### 1. APPLICATION Notifications

#### 1.1 New Application Submitted
**Trigger**: Tenant submits a lease application
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "APPLICATION",
  "title": "New Application Received",
  "description": "{tenantName} applied for {propertyTitle}",
  "link": "/dashboard/landlord-applications",  // or /dashboard/pm-applications
  "relatedEntityId": {applicationId},
  "relatedEntityType": "LEASE_APPLICATION"
}
```

#### 1.2 Application Approved
**Trigger**: Landlord/PM approves an application
**Recipients**: Tenant

```json
{
  "type": "APPLICATION",
  "title": "Application Approved!",
  "description": "Your application for {propertyTitle} has been approved. Please wait for the lease agreement.",
  "link": "/dashboard/applications",
  "relatedEntityId": {applicationId},
  "relatedEntityType": "LEASE_APPLICATION"
}
```

#### 1.3 Application Rejected
**Trigger**: Landlord/PM rejects an application
**Recipients**: Tenant

```json
{
  "type": "APPLICATION",
  "title": "Application Not Approved",
  "description": "Your application for {propertyTitle} was not approved.",
  "link": "/dashboard/applications",
  "relatedEntityId": {applicationId},
  "relatedEntityType": "LEASE_APPLICATION"
}
```

#### 1.4 Application Cancelled
**Trigger**: Tenant cancels their own application
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "APPLICATION",
  "title": "Application Cancelled",
  "description": "{tenantName} cancelled their application for {propertyTitle}",
  "link": "/dashboard/landlord-applications",  // or /dashboard/pm-applications
  "relatedEntityId": {applicationId},
  "relatedEntityType": "LEASE_APPLICATION"
}
```

---

### 2. LEASE Notifications

#### 2.1 Lease Created (Sent to Tenant)
**Trigger**: Landlord creates a lease agreement for an approved application
**Recipients**: Tenant

```json
{
  "type": "LEASE",
  "title": "New Lease Agreement",
  "description": "You have received a lease agreement for {propertyTitle}. Please review and accept within 48 hours.",
  "link": "/dashboard/leases",
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.2 Lease Contract Attached
**Trigger**: Landlord attaches a PDF contract to the lease
**Recipients**: Tenant

```json
{
  "type": "LEASE",
  "title": "Lease Contract Ready",
  "description": "The contract document for {propertyTitle} is now available for download.",
  "link": "/dashboard/leases",
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.3 Lease Accepted by Tenant
**Trigger**: Tenant accepts the lease agreement
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "LEASE",
  "title": "Lease Accepted",
  "description": "{tenantName} has accepted the lease for {propertyTitle}. Awaiting payment.",
  "link": "/dashboard/landlord-leases",  // or /dashboard/pm-leases
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.4 Lease Rejected by Tenant
**Trigger**: Tenant rejects the lease agreement
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "LEASE",
  "title": "Lease Rejected",
  "description": "{tenantName} has rejected the lease for {propertyTitle}.",
  "link": "/dashboard/landlord-leases",  // or /dashboard/pm-leases
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.5 Lease Activated
**Trigger**: Payment completed and lease becomes active
**Recipients**: Tenant

```json
{
  "type": "LEASE",
  "title": "Lease Now Active",
  "description": "Your lease for {propertyTitle} is now active. Welcome to your new home!",
  "link": "/dashboard/leases",
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.6 Lease Terminated
**Trigger**: Lease is terminated early
**Recipients**: ALL parties (Tenant, Landlord, PM)

```json
{
  "type": "LEASE",
  "title": "Lease Terminated",
  "description": "The lease for {propertyTitle} has been terminated.",
  "link": "/dashboard/leases",  // Role-appropriate link
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.7 Lease Expiring Soon (30/7/1 days)
**Trigger**: Scheduled job detects upcoming expiration
**Recipients**: ALL parties

```json
{
  "type": "LEASE",
  "title": "Lease Expiring in {days} Days",
  "description": "Your lease for {propertyTitle} expires on {expiryDate}.",
  "link": "/dashboard/leases",  // Role-appropriate link
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.8 Acceptance Deadline Warning (12/6/2 hours)
**Trigger**: Tenant has not paid within 48-hour window
**Recipients**: Tenant

```json
{
  "type": "LEASE",
  "title": "Payment Deadline Approaching",
  "description": "You have {hours} hours left to complete payment for {propertyTitle}.",
  "link": "/dashboard/leases",
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 2.9 Lease Expired (Deadline Passed)
**Trigger**: 48-hour payment window expired
**Recipients**: ALL parties

```json
{
  "type": "LEASE",
  "title": "Lease Offer Expired",
  "description": "The lease offer for {propertyTitle} has expired due to missed payment deadline.",
  "link": "/dashboard/leases",  // Role-appropriate
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

---

### 3. PAYMENT Notifications

#### 3.1 Acceptance Payment Received
**Trigger**: Tenant pays security deposit + first month rent
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "PAYMENT",
  "title": "Payment Received",
  "description": "{tenantName} has paid ${amount} for {propertyTitle} (security deposit + first month).",
  "link": "/dashboard/landlord-leases",  // or /dashboard/pm-leases
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

#### 3.2 Rent Payment Received
**Trigger**: Tenant pays monthly rent
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "PAYMENT",
  "title": "Rent Payment Received",
  "description": "{tenantName} has paid ${amount} rent for {propertyTitle} ({month}).",
  "link": "/dashboard/landlord-leases",  // View lease details
  "relatedEntityId": {rentPaymentId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.3 Rent Due Reminder (7 days)
**Trigger**: Scheduled job, 7 days before due date
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Rent Due in 7 Days",
  "description": "Your rent of ${amount} for {propertyTitle} is due on {dueDate}.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.4 Rent Due Reminder (3 days)
**Trigger**: Scheduled job, 3 days before due date
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Rent Due in 3 Days",
  "description": "Your rent of ${amount} for {propertyTitle} is due on {dueDate}.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.5 Rent Due Tomorrow
**Trigger**: Scheduled job, 1 day before due date
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Rent Due Tomorrow",
  "description": "Your rent of ${amount} for {propertyTitle} is due tomorrow.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.6 Rent Due Today
**Trigger**: Scheduled job, on due date
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Rent Due Today",
  "description": "Your rent of ${amount} for {propertyTitle} is due today.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.7 Rent Overdue
**Trigger**: Day after due date (and daily until paid)
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Rent Overdue",
  "description": "Your rent of ${amount} for {propertyTitle} is {days} day(s) overdue.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.8 Late Fee Applied
**Trigger**: Late fee added to overdue rent
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Late Fee Applied",
  "description": "A late fee of ${feeAmount} has been applied to your overdue rent for {propertyTitle}.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.9 Late Fee Waived
**Trigger**: Landlord waives the late fee
**Recipients**: Tenant

```json
{
  "type": "PAYMENT",
  "title": "Late Fee Waived",
  "description": "The late fee for {propertyTitle} has been waived by your landlord.",
  "link": "/dashboard/payments",
  "relatedEntityId": {rentScheduleId},
  "relatedEntityType": "PAYMENT"
}
```

#### 3.10 Rent Payment Overdue Alert (To Landlord)
**Trigger**: Rent is 3+ days overdue
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "PAYMENT",
  "title": "Tenant Rent Overdue",
  "description": "{tenantName}'s rent for {propertyTitle} is {days} days overdue.",
  "link": "/dashboard/landlord-leases",
  "relatedEntityId": {leaseId},
  "relatedEntityType": "LEASE_AGREEMENT"
}
```

---

### 4. MAINTENANCE Notifications

#### 4.1 New Maintenance Request
**Trigger**: Tenant creates a maintenance request
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "MAINTENANCE",
  "title": "New Maintenance Request",
  "description": "{tenantName} submitted a {priority} priority request for {propertyTitle}: {title}",
  "link": "/dashboard/landlord-maintenance",  // or /dashboard/pm-maintenance
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.2 Request Accepted
**Trigger**: Landlord/PM accepts the request
**Recipients**: Tenant

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Request Accepted",
  "description": "Your maintenance request for {propertyTitle} has been accepted.",
  "link": "/dashboard/maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.3 Request Rejected
**Trigger**: Landlord/PM rejects the request
**Recipients**: Tenant

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Request Rejected",
  "description": "Your maintenance request for {propertyTitle} was rejected: {reason}",
  "link": "/dashboard/maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.4 Request Scheduled
**Trigger**: Landlord/PM schedules the work
**Recipients**: Tenant

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Scheduled",
  "description": "Maintenance for {propertyTitle} is scheduled for {scheduledDate}.",
  "link": "/dashboard/maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.5 Work Started
**Trigger**: Landlord/PM marks work as in progress
**Recipients**: Tenant

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance In Progress",
  "description": "Work has started on your maintenance request for {propertyTitle}.",
  "link": "/dashboard/maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.6 Request Completed
**Trigger**: Landlord/PM marks request as resolved
**Recipients**: Tenant

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Completed",
  "description": "Your maintenance request for {propertyTitle} has been resolved.",
  "link": "/dashboard/maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.7 Request Cancelled (by Tenant)
**Trigger**: Tenant cancels their request
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Request Cancelled",
  "description": "{tenantName} cancelled their maintenance request for {propertyTitle}.",
  "link": "/dashboard/landlord-maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.8 Request Reopened
**Trigger**: Tenant reopens a resolved request
**Recipients**: Landlord AND Property Manager (if assigned)

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Request Reopened",
  "description": "{tenantName} reopened a maintenance request for {propertyTitle}.",
  "link": "/dashboard/landlord-maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.9 Priority Changed
**Trigger**: Priority level updated
**Recipients**: Tenant (if changed by landlord), Landlord (if changed by system)

```json
{
  "type": "MAINTENANCE",
  "title": "Maintenance Priority Updated",
  "description": "Your maintenance request for {propertyTitle} priority changed to {newPriority}.",
  "link": "/dashboard/maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.10 New Comment Added
**Trigger**: Someone adds a comment to the request
**Recipients**: The OTHER party (tenant sees landlord's comments, landlord sees tenant's)

```json
{
  "type": "MAINTENANCE",
  "title": "New Comment on Maintenance Request",
  "description": "{commenterName} added a comment to the maintenance request for {propertyTitle}.",
  "link": "/dashboard/maintenance",  // Role-appropriate
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

#### 4.11 Urgent Request Overdue (24h+)
**Trigger**: HIGH/URGENT priority request not addressed within 24 hours
**Recipients**: Landlord AND Property Manager

```json
{
  "type": "MAINTENANCE",
  "title": "Urgent Maintenance Overdue",
  "description": "A {priority} priority maintenance request for {propertyTitle} has not been addressed for 24+ hours.",
  "link": "/dashboard/landlord-maintenance",
  "relatedEntityId": {requestId},
  "relatedEntityType": "MAINTENANCE_REQUEST"
}
```

---

### 5. MESSAGE Notifications

#### 5.1 New Message
**Trigger**: User receives a new message in a conversation
**Recipients**: Message recipient

```json
{
  "type": "MESSAGE",
  "title": "New Message from {senderName}",
  "description": "{messagePreview}...",
  "link": "/dashboard/messages",  // Role-appropriate
  "relatedEntityId": {conversationId},
  "relatedEntityType": "CONVERSATION"
}
```

#### 5.2 New Conversation Started
**Trigger**: Someone initiates a new conversation
**Recipients**: Conversation recipient

```json
{
  "type": "MESSAGE",
  "title": "New Conversation",
  "description": "{senderName} started a conversation with you.",
  "link": "/dashboard/messages",  // Role-appropriate
  "relatedEntityId": {conversationId},
  "relatedEntityType": "CONVERSATION"
}
```

---

### 6. PROPERTY Notifications

#### 6.1 Saved Property Now Available
**Trigger**: A saved property becomes available for rent
**Recipients**: Users who saved the property

```json
{
  "type": "PROPERTY",
  "title": "Saved Property Available",
  "description": "{propertyTitle} is now available for rent!",
  "link": "/properties/{propertyId}",
  "relatedEntityId": {propertyId},
  "relatedEntityType": "PROPERTY"
}
```

#### 6.2 Saved Property Rented
**Trigger**: A saved property is rented to someone else
**Recipients**: Users who saved the property

```json
{
  "type": "PROPERTY",
  "title": "Saved Property Rented",
  "description": "{propertyTitle} has been rented.",
  "link": "/properties/{propertyId}",
  "relatedEntityId": {propertyId},
  "relatedEntityType": "PROPERTY"
}
```

#### 6.3 Saved Property Price Changed
**Trigger**: Landlord changes the rent price
**Recipients**: Users who saved the property

```json
{
  "type": "PROPERTY",
  "title": "Price Changed",
  "description": "{propertyTitle} rent changed from ${oldPrice} to ${newPrice}/month.",
  "link": "/properties/{propertyId}",
  "relatedEntityId": {propertyId},
  "relatedEntityType": "PROPERTY"
}
```

---

### 7. SYSTEM Notifications

#### 7.1 Welcome
**Trigger**: New user registration
**Recipients**: New user

```json
{
  "type": "SYSTEM",
  "title": "Welcome to RentMate!",
  "description": "Your account has been created successfully. Start exploring properties!",
  "link": "/dashboard",  // Role-appropriate home
  "relatedEntityId": null,
  "relatedEntityType": null
}
```

#### 7.2 Email Verified
**Trigger**: User verifies their email
**Recipients**: User

```json
{
  "type": "SYSTEM",
  "title": "Email Verified",
  "description": "Your email address has been verified successfully.",
  "link": "/dashboard/profile",
  "relatedEntityId": null,
  "relatedEntityType": null
}
```

#### 7.3 Password Changed
**Trigger**: User changes their password
**Recipients**: User

```json
{
  "type": "SYSTEM",
  "title": "Password Changed",
  "description": "Your password has been changed successfully.",
  "link": "/dashboard/profile",
  "relatedEntityId": null,
  "relatedEntityType": null
}
```

#### 7.4 Profile Updated
**Trigger**: User updates profile info
**Recipients**: User

```json
{
  "type": "SYSTEM",
  "title": "Profile Updated",
  "description": "Your profile information has been updated.",
  "link": "/dashboard/profile",
  "relatedEntityId": null,
  "relatedEntityType": null
}
```

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

## Backend Implementation Notes

### Creating Notifications

When creating notifications, the backend should:

1. Determine the recipient user(s)
2. Look up each recipient's role
3. Use the role-appropriate link from the mapping table
4. Save the notification with the correct link

Example Java/Kotlin pseudocode:

```java
public void createApplicationNotification(LeaseApplication application) {
    // Notify landlord
    User landlord = application.getProperty().getOwner();
    String landlordLink = getLinkForRole(landlord.getRole(), "applications");
    // landlordLink = "/dashboard/landlord-applications"
    
    notificationRepository.save(new Notification(
        landlord.getId(),
        NotificationType.APPLICATION,
        "New Application Received",
        application.getTenant().getFullName() + " applied for " + application.getProperty().getTitle(),
        landlordLink,
        application.getId(),
        RelatedEntityType.LEASE_APPLICATION
    ));
    
    // Also notify property manager if assigned
    if (application.getProperty().getPropertyManager() != null) {
        User pm = application.getProperty().getPropertyManager();
        String pmLink = getLinkForRole(pm.getRole(), "applications");
        // pmLink = "/dashboard/pm-applications"
        
        notificationRepository.save(new Notification(
            pm.getId(),
            NotificationType.APPLICATION,
            "New Application Received",
            application.getTenant().getFullName() + " applied for " + application.getProperty().getTitle(),
            pmLink,
            application.getId(),
            RelatedEntityType.LEASE_APPLICATION
        ));
    }
}

private String getLinkForRole(UserRole role, String feature) {
    Map<String, Map<UserRole, String>> linkMap = Map.of(
        "applications", Map.of(
            UserRole.TENANT, "/dashboard/applications",
            UserRole.LANDLORD, "/dashboard/landlord-applications",
            UserRole.PROPERTY_MANAGER, "/dashboard/pm-applications"
        ),
        "leases", Map.of(
            UserRole.TENANT, "/dashboard/leases",
            UserRole.LANDLORD, "/dashboard/landlord-leases",
            UserRole.PROPERTY_MANAGER, "/dashboard/pm-leases"
        ),
        "maintenance", Map.of(
            UserRole.TENANT, "/dashboard/maintenance",
            UserRole.LANDLORD, "/dashboard/landlord-maintenance",
            UserRole.PROPERTY_MANAGER, "/dashboard/pm-maintenance"
        ),
        "payments", Map.of(
            UserRole.TENANT, "/dashboard/payments",
            UserRole.LANDLORD, "/dashboard/landlord-leases",
            UserRole.PROPERTY_MANAGER, "/dashboard/pm-leases"
        ),
        "messages", Map.of(
            UserRole.TENANT, "/dashboard/messages",
            UserRole.LANDLORD, "/dashboard/landlord-messages",
            UserRole.PROPERTY_MANAGER, "/dashboard/pm-messages"
        )
    );
    return linkMap.get(feature).get(role);
}
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

## Summary: All 42 Notification Triggers

| # | Event | Type | Recipients |
|---|-------|------|------------|
| 1 | Application submitted | APPLICATION | Landlord, PM |
| 2 | Application approved | APPLICATION | Tenant |
| 3 | Application rejected | APPLICATION | Tenant |
| 4 | Application cancelled | APPLICATION | Landlord, PM |
| 5 | Lease created | LEASE | Tenant |
| 6 | Contract attached | LEASE | Tenant |
| 7 | Lease accepted | LEASE | Landlord, PM |
| 8 | Lease rejected | LEASE | Landlord, PM |
| 9 | Lease activated | LEASE | Tenant |
| 10 | Lease terminated | LEASE | All parties |
| 11 | Lease expiring (30/7/1d) | LEASE | All parties |
| 12 | Acceptance deadline warning | LEASE | Tenant |
| 13 | Lease expired | LEASE | All parties |
| 14 | Acceptance payment received | PAYMENT | Landlord, PM |
| 15 | Rent payment received | PAYMENT | Landlord, PM |
| 16 | Rent due (7d) | PAYMENT | Tenant |
| 17 | Rent due (3d) | PAYMENT | Tenant |
| 18 | Rent due (1d) | PAYMENT | Tenant |
| 19 | Rent due today | PAYMENT | Tenant |
| 20 | Rent overdue | PAYMENT | Tenant |
| 21 | Late fee applied | PAYMENT | Tenant |
| 22 | Late fee waived | PAYMENT | Tenant |
| 23 | Rent overdue alert | PAYMENT | Landlord, PM |
| 24 | Maintenance created | MAINTENANCE | Landlord, PM |
| 25 | Maintenance accepted | MAINTENANCE | Tenant |
| 26 | Maintenance rejected | MAINTENANCE | Tenant |
| 27 | Maintenance scheduled | MAINTENANCE | Tenant |
| 28 | Maintenance in progress | MAINTENANCE | Tenant |
| 29 | Maintenance completed | MAINTENANCE | Tenant |
| 30 | Maintenance cancelled | MAINTENANCE | Landlord, PM |
| 31 | Maintenance reopened | MAINTENANCE | Landlord, PM |
| 32 | Priority changed | MAINTENANCE | Relevant party |
| 33 | Comment added | MAINTENANCE | Other party |
| 34 | Urgent overdue | MAINTENANCE | Landlord, PM |
| 35 | New message | MESSAGE | Recipient |
| 36 | New conversation | MESSAGE | Recipient |
| 37 | Saved property available | PROPERTY | Savers |
| 38 | Saved property rented | PROPERTY | Savers |
| 39 | Saved property price changed | PROPERTY | Savers |
| 40 | Welcome | SYSTEM | New user |
| 41 | Email verified | SYSTEM | User |
| 42 | Password changed | SYSTEM | User |

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
