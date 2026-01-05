# Maintenance Request API Specification

This document specifies the complete API for the Maintenance Request system supporting Tenants, Landlords, and Property Managers.

**Last Updated:** 2026-01-05

---

## Overview

The Maintenance system allows tenants to submit repair/maintenance requests for their rented properties. Landlords and Property Managers can view, manage, and resolve these requests.

### Roles & Permissions

| Role | Can Do |
|------|--------|
| **Tenant** | Create requests, view own requests, cancel pending requests, add comments/images |
| **Landlord** | View all requests for owned properties, accept/reject, assign to contractor, schedule, mark as resolved |
| **Property Manager** | Same as Landlord for assigned properties |

### Request Status Flow

```
           ┌──────────────────────────────────────────────────────────────┐
           │                                                              │
           ▼                                                              │
        ┌──────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐  │
  ──►   │ OPEN │ ──► │ ACCEPTED │ ──► │ IN_PROGRESS │ ──► │ COMPLETED │  │
        └──────┘     └──────────┘     └─────────────┘     └───────────┘  │
           │              │                  │                            │
           │              │                  ▼                            │
           │              │           ┌───────────┐                       │
           │              └─────────► │ SCHEDULED │ ──────────────────────┘
           │                          └───────────┘
           │
           ▼
      ┌──────────┐
      │ REJECTED │
      └──────────┘
           │
           ▼
      ┌───────────┐
      │ CANCELLED │  (by tenant, only when OPEN)
      └───────────┘
```

### Priority Levels

| Priority | Response Time | Description |
|----------|---------------|-------------|
| `LOW` | 7 days | Minor issues, cosmetic |
| `MEDIUM` | 3 days | Standard repairs |
| `HIGH` | 24 hours | Significant issues affecting daily life |
| `URGENT` | Same day | Safety hazards, no water/electricity |

---

## Base URL

```
http://localhost:8081/api/maintenance
```

---

## Data Models

### MaintenanceRequest

```json
{
  "id": 1,
  "leaseId": 5,
  "propertyId": 10,
  "propertyTitle": "Sunset Apartments Unit 4B",
  "propertyAddress": "123 Main St, Apt 4B",
  "tenantId": 20,
  "tenantName": "John Doe",
  "tenantEmail": "john@example.com",
  "tenantPhone": "+1234567890",
  "landlordId": 15,
  "landlordName": "Jane Owner",
  "managerId": null,
  "managerName": null,
  "title": "Broken AC unit",
  "description": "The AC unit in the living room is not cooling. It makes a clicking noise when turned on.",
  "priority": "HIGH",
  "status": "OPEN",
  "images": [
    {
      "id": 1,
      "url": "https://storage.example.com/maintenance/img1.jpg",
      "uploadedAt": "2026-01-05T10:00:00"
    }
  ],
  "scheduledFor": null,
  "assignedTo": null,
  "assignedContractor": null,
  "estimatedCost": null,
  "actualCost": null,
  "resolutionNotes": null,
  "rejectionReason": null,
  "createdAt": "2026-01-05T10:00:00",
  "updatedAt": "2026-01-05T10:00:00",
  "acceptedAt": null,
  "resolvedAt": null,
  "timeline": [
    {
      "id": 1,
      "status": "OPEN",
      "message": "Request submitted by tenant",
      "actor": "TENANT",
      "timestamp": "2026-01-05T10:00:00"
    }
  ]
}
```

### MaintenanceComment

```json
{
  "id": 1,
  "requestId": 5,
  "userId": 20,
  "userName": "John Doe",
  "userRole": "TENANT",
  "content": "The issue is getting worse, please prioritize.",
  "images": [],
  "createdAt": "2026-01-05T12:00:00"
}
```

### MaintenanceSummary (for dashboard)

```json
{
  "total": 15,
  "open": 3,
  "accepted": 2,
  "inProgress": 4,
  "scheduled": 2,
  "completed": 3,
  "rejected": 1,
  "avgResolutionDays": 2.5,
  "urgentCount": 1,
  "overdueCount": 0
}
```

---

## API Endpoints

### 1. Tenant APIs

#### 1.1 Create Maintenance Request

**POST** `/api/maintenance`

**Role:** `TENANT`

Creates a new maintenance request for an active lease.

**Request Body:**
```json
{
  "leaseId": 5,
  "title": "Broken AC unit",
  "description": "The AC unit in the living room is not cooling.",
  "priority": "HIGH",
  "imageIds": [101, 102]
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "leaseId": 5,
  "propertyTitle": "Sunset Apartments Unit 4B",
  "title": "Broken AC unit",
  "priority": "HIGH",
  "status": "OPEN",
  "createdAt": "2026-01-05T10:00:00",
  "message": "Maintenance request submitted successfully"
}
```

**Errors:**
- `400`: Missing required fields
- `403`: User is not a tenant or doesn't have active lease
- `404`: Lease not found

---

#### 1.2 Get My Maintenance Requests

**GET** `/api/maintenance/my`

**Role:** `TENANT`

Returns all maintenance requests submitted by the tenant.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `ALL` | Filter by status: `OPEN`, `ACCEPTED`, `IN_PROGRESS`, `SCHEDULED`, `COMPLETED`, `REJECTED`, `CANCELLED`, `ALL` |
| `priority` | string | `ALL` | Filter by priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, `ALL` |
| `leaseId` | number | - | Filter by specific lease |
| `page` | number | 0 | Page number |
| `size` | number | 10 | Page size |
| `sort` | string | `createdAt,desc` | Sort field and direction |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "propertyTitle": "Sunset Apartments Unit 4B",
      "title": "Broken AC unit",
      "priority": "HIGH",
      "status": "OPEN",
      "createdAt": "2026-01-05T10:00:00",
      "updatedAt": "2026-01-05T10:00:00",
      "hasUnreadUpdates": false
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "number": 0,
  "size": 10
}
```

---

#### 1.3 Get Maintenance Request Detail

**GET** `/api/maintenance/{id}`

**Role:** `TENANT`, `LANDLORD`, `PROPERTY_MANAGER`

Returns full details of a maintenance request.

**Response (200 OK):**
Returns full `MaintenanceRequest` object (see Data Models).

**Errors:**
- `403`: User not authorized to view this request
- `404`: Request not found

---

#### 1.4 Cancel Maintenance Request

**PATCH** `/api/maintenance/{id}/cancel`

**Role:** `TENANT`

Cancels a maintenance request (only allowed when status is `OPEN`).

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "CANCELLED",
  "message": "Request cancelled successfully"
}
```

**Errors:**
- `400`: Request cannot be cancelled (not in OPEN status)
- `403`: User is not the request owner
- `404`: Request not found

---

#### 1.5 Add Comment to Request

**POST** `/api/maintenance/{id}/comments`

**Role:** `TENANT`, `LANDLORD`, `PROPERTY_MANAGER`

Adds a comment or update to an existing request.

**Request Body:**
```json
{
  "content": "The issue is getting worse, please prioritize.",
  "imageIds": []
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "requestId": 1,
  "userName": "John Doe",
  "userRole": "TENANT",
  "content": "The issue is getting worse, please prioritize.",
  "createdAt": "2026-01-05T12:00:00"
}
```

---

#### 1.6 Get Comments for Request

**GET** `/api/maintenance/{id}/comments`

**Role:** `TENANT`, `LANDLORD`, `PROPERTY_MANAGER`

Returns all comments for a maintenance request.

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 5,
      "userName": "John Doe",
      "userRole": "TENANT",
      "content": "The issue is getting worse.",
      "images": [],
      "createdAt": "2026-01-05T12:00:00"
    },
    {
      "id": 6,
      "userName": "Jane Owner",
      "userRole": "LANDLORD",
      "content": "Technician will be there tomorrow.",
      "images": [],
      "createdAt": "2026-01-05T14:00:00"
    }
  ],
  "totalElements": 2
}
```

---

#### 1.7 Upload Maintenance Image

**POST** `/api/maintenance/{id}/images`

**Role:** `TENANT`, `LANDLORD`, `PROPERTY_MANAGER`

Uploads an image for a maintenance request.

**Request:** `multipart/form-data`
- `file`: Image file (max 5MB, jpg/png/webp)

**Response (201 Created):**
```json
{
  "id": 101,
  "url": "https://storage.example.com/maintenance/img1.jpg",
  "uploadedAt": "2026-01-05T10:00:00"
}
```

---

### 2. Landlord / Property Manager APIs

#### 2.1 Get Maintenance Requests for My Properties

**GET** `/api/maintenance/for-landlord`

**Role:** `LANDLORD`

Returns all maintenance requests for properties owned by the landlord.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `ALL` | Filter by status |
| `priority` | string | `ALL` | Filter by priority |
| `propertyId` | number | - | Filter by specific property |
| `page` | number | 0 | Page number |
| `size` | number | 10 | Page size |
| `sort` | string | `createdAt,desc` | Sort field |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "propertyId": 10,
      "propertyTitle": "Sunset Apartments Unit 4B",
      "tenantName": "John Doe",
      "title": "Broken AC unit",
      "priority": "HIGH",
      "status": "OPEN",
      "createdAt": "2026-01-05T10:00:00",
      "daysOpen": 2
    }
  ],
  "totalElements": 8,
  "totalPages": 1
}
```

---

#### 2.2 Get Maintenance Requests for Managed Properties

**GET** `/api/maintenance/for-manager`

**Role:** `PROPERTY_MANAGER`

Returns all maintenance requests for properties managed by the property manager.

Same parameters and response as 2.1.

---

#### 2.3 Get Maintenance Summary

**GET** `/api/maintenance/summary`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Returns aggregate statistics for maintenance requests.

**Response (200 OK):**
```json
{
  "total": 15,
  "open": 3,
  "accepted": 2,
  "inProgress": 4,
  "scheduled": 2,
  "completed": 3,
  "rejected": 1,
  "avgResolutionDays": 2.5,
  "urgentCount": 1,
  "overdueCount": 0,
  "byProperty": [
    {
      "propertyId": 10,
      "propertyTitle": "Sunset Apartments",
      "openCount": 2,
      "totalCount": 5
    }
  ]
}
```

---

#### 2.4 Accept Maintenance Request

**PATCH** `/api/maintenance/{id}/accept`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Accepts a maintenance request, indicating it will be addressed.

**Request Body (optional):**
```json
{
  "notes": "Will schedule a technician this week.",
  "estimatedCost": 250.00
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "ACCEPTED",
  "acceptedAt": "2026-01-05T14:00:00",
  "message": "Request accepted"
}
```

**Errors:**
- `400`: Request not in OPEN status
- `403`: User not authorized

---

#### 2.5 Reject Maintenance Request

**PATCH** `/api/maintenance/{id}/reject`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Rejects a maintenance request with a reason.

**Request Body:**
```json
{
  "reason": "This is a cosmetic issue not covered by the lease agreement."
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "REJECTED",
  "rejectionReason": "This is a cosmetic issue not covered by the lease agreement.",
  "message": "Request rejected"
}
```

**Errors:**
- `400`: Missing rejection reason or request not in OPEN/ACCEPTED status

---

#### 2.6 Start Work on Request

**PATCH** `/api/maintenance/{id}/start`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Marks a request as in progress (work has begun).

**Request Body (optional):**
```json
{
  "assignedContractor": "ABC Repairs Inc.",
  "notes": "Contractor dispatched"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "IN_PROGRESS",
  "assignedContractor": "ABC Repairs Inc.",
  "message": "Work started"
}
```

---

#### 2.7 Schedule Maintenance

**PATCH** `/api/maintenance/{id}/schedule`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Schedules a date/time for the maintenance work.

**Request Body:**
```json
{
  "scheduledFor": "2026-01-10T10:00:00",
  "assignedContractor": "ABC Repairs Inc.",
  "notes": "Please ensure someone is home"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "SCHEDULED",
  "scheduledFor": "2026-01-10T10:00:00",
  "message": "Maintenance scheduled"
}
```

---

#### 2.8 Mark as Resolved/Completed

**PATCH** `/api/maintenance/{id}/resolve`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Marks a maintenance request as completed.

**Request Body:**
```json
{
  "resolutionNotes": "Replaced AC compressor, unit working normally now.",
  "actualCost": 320.00,
  "resolvedAt": "2026-01-10T15:00:00"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "COMPLETED",
  "resolvedAt": "2026-01-10T15:00:00",
  "resolutionNotes": "Replaced AC compressor, unit working normally now.",
  "actualCost": 320.00,
  "message": "Request marked as resolved"
}
```

---

#### 2.9 Reopen Request

**PATCH** `/api/maintenance/{id}/reopen`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Reopens a completed or rejected request if issue persists.

**Request Body:**
```json
{
  "reason": "Issue reoccurred after repair"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "OPEN",
  "message": "Request reopened"
}
```

---

#### 2.10 Update Priority

**PATCH** `/api/maintenance/{id}/priority`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Updates the priority of a maintenance request.

**Request Body:**
```json
{
  "priority": "URGENT",
  "reason": "Safety hazard identified"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "priority": "URGENT",
  "message": "Priority updated"
}
```

---

### 3. Shared APIs

#### 3.1 Get Request Timeline

**GET** `/api/maintenance/{id}/timeline`

**Role:** `TENANT`, `LANDLORD`, `PROPERTY_MANAGER`

Returns the full timeline of events for a request.

**Response (200 OK):**
```json
{
  "requestId": 1,
  "timeline": [
    {
      "id": 1,
      "status": "OPEN",
      "message": "Request submitted by tenant",
      "actor": "TENANT",
      "actorName": "John Doe",
      "timestamp": "2026-01-05T10:00:00"
    },
    {
      "id": 2,
      "status": "ACCEPTED",
      "message": "Request accepted by landlord",
      "actor": "LANDLORD",
      "actorName": "Jane Owner",
      "timestamp": "2026-01-05T14:00:00"
    },
    {
      "id": 3,
      "status": "SCHEDULED",
      "message": "Scheduled for Jan 10, 2026 at 10:00 AM",
      "actor": "LANDLORD",
      "actorName": "Jane Owner",
      "timestamp": "2026-01-06T09:00:00"
    }
  ]
}
```

---

#### 3.2 Get Maintenance for Lease

**GET** `/api/maintenance/lease/{leaseId}`

**Role:** `TENANT`, `LANDLORD`, `PROPERTY_MANAGER`

Returns all maintenance requests for a specific lease.

**Response (200 OK):**
Same format as list endpoints.

---

#### 3.3 Get Maintenance for Property

**GET** `/api/maintenance/property/{propertyId}`

**Role:** `LANDLORD`, `PROPERTY_MANAGER`

Returns all maintenance requests for a specific property.

**Response (200 OK):**
Same format as list endpoints.

---

## Notifications (Server-Sent)

The following notifications should be sent when maintenance events occur:

| Event | Recipients | Notification Type |
|-------|------------|-------------------|
| Request Created | Landlord, Property Manager | `MAINTENANCE_NEW` |
| Request Accepted | Tenant | `MAINTENANCE_ACCEPTED` |
| Request Rejected | Tenant | `MAINTENANCE_REJECTED` |
| Work Started | Tenant | `MAINTENANCE_IN_PROGRESS` |
| Scheduled | Tenant | `MAINTENANCE_SCHEDULED` |
| Resolved | Tenant | `MAINTENANCE_RESOLVED` |
| Comment Added | Other participants | `MAINTENANCE_COMMENT` |
| Priority Changed | Tenant | `MAINTENANCE_PRIORITY_CHANGED` |

---

## API Summary Table

| # | Method | Endpoint | Role | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/api/maintenance` | TENANT | Create new request |
| 2 | GET | `/api/maintenance/my` | TENANT | Get my requests |
| 3 | GET | `/api/maintenance/{id}` | ALL | Get request detail |
| 4 | PATCH | `/api/maintenance/{id}/cancel` | TENANT | Cancel request |
| 5 | POST | `/api/maintenance/{id}/comments` | ALL | Add comment |
| 6 | GET | `/api/maintenance/{id}/comments` | ALL | Get comments |
| 7 | POST | `/api/maintenance/{id}/images` | ALL | Upload image |
| 8 | GET | `/api/maintenance/for-landlord` | LANDLORD | Get landlord's requests |
| 9 | GET | `/api/maintenance/for-manager` | PM | Get manager's requests |
| 10 | GET | `/api/maintenance/summary` | LANDLORD, PM | Get statistics |
| 11 | PATCH | `/api/maintenance/{id}/accept` | LANDLORD, PM | Accept request |
| 12 | PATCH | `/api/maintenance/{id}/reject` | LANDLORD, PM | Reject request |
| 13 | PATCH | `/api/maintenance/{id}/start` | LANDLORD, PM | Start work |
| 14 | PATCH | `/api/maintenance/{id}/schedule` | LANDLORD, PM | Schedule work |
| 15 | PATCH | `/api/maintenance/{id}/resolve` | LANDLORD, PM | Mark resolved |
| 16 | PATCH | `/api/maintenance/{id}/reopen` | LANDLORD, PM | Reopen request |
| 17 | PATCH | `/api/maintenance/{id}/priority` | LANDLORD, PM | Update priority |
| 18 | GET | `/api/maintenance/{id}/timeline` | ALL | Get timeline |
| 19 | GET | `/api/maintenance/lease/{leaseId}` | ALL | Get by lease |
| 20 | GET | `/api/maintenance/property/{propertyId}` | LANDLORD, PM | Get by property |

**Total: 20 endpoints** (up from 3)

---

## Implementation Notes

### Frontend API File Structure

```typescript
// src/lib/api/maintenanceApi.ts

export const maintenanceApi = {
  // Tenant
  createRequest: (data) => api.post('/api/maintenance', data),
  getMyRequests: (params) => api.get('/api/maintenance/my', { params }),
  cancelRequest: (id) => api.patch(`/api/maintenance/${id}/cancel`),
  
  // Shared
  getRequest: (id) => api.get(`/api/maintenance/${id}`),
  addComment: (id, data) => api.post(`/api/maintenance/${id}/comments`, data),
  getComments: (id) => api.get(`/api/maintenance/${id}/comments`),
  uploadImage: (id, file) => api.postForm(`/api/maintenance/${id}/images`, { file }),
  getTimeline: (id) => api.get(`/api/maintenance/${id}/timeline`),
  getByLease: (leaseId, params) => api.get(`/api/maintenance/lease/${leaseId}`, { params }),
  
  // Landlord
  getForLandlord: (params) => api.get('/api/maintenance/for-landlord', { params }),
  getSummary: () => api.get('/api/maintenance/summary'),
  acceptRequest: (id, data) => api.patch(`/api/maintenance/${id}/accept`, data),
  rejectRequest: (id, data) => api.patch(`/api/maintenance/${id}/reject`, data),
  startWork: (id, data) => api.patch(`/api/maintenance/${id}/start`, data),
  scheduleWork: (id, data) => api.patch(`/api/maintenance/${id}/schedule`, data),
  resolveRequest: (id, data) => api.patch(`/api/maintenance/${id}/resolve`, data),
  reopenRequest: (id, data) => api.patch(`/api/maintenance/${id}/reopen`, data),
  updatePriority: (id, data) => api.patch(`/api/maintenance/${id}/priority`, data),
  getByProperty: (propertyId, params) => api.get(`/api/maintenance/property/${propertyId}`, { params }),
  
  // Property Manager
  getForManager: (params) => api.get('/api/maintenance/for-manager', { params }),
};
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid data or state transition |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - Not authorized for this action |
| 404 | Not Found - Request doesn't exist |
| 409 | Conflict - Duplicate request or invalid state |
| 422 | Unprocessable - Validation failed |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-05 | Initial specification created with 20 endpoints |
