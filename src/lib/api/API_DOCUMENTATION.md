# RentMate API Documentation

## Overview

This document outlines all API endpoints required to connect the RentMate frontend to your backend.

### Configuration

```
Base URL: [YOUR_NGROK_URL]
Example: https://your-subdomain.ngrok.io/api/v1
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Common Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### HTTP Status Codes

| Code | Description      |
| ---- | ---------------- |
| 200  | Success          |
| 201  | Created          |
| 400  | Bad Request      |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not Found        |
| 422  | Validation Error |
| 500  | Server Error     |

---

## 1. Authentication Endpoints (DONE)

### POST /auth/login

Login with email and password. (DONE)

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant" | "landlord" | "property_manager",
      "avatar": "https://...",
      "phone": "+1234567890",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_here",
    "expiresAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### POST /auth/register (DONE)

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "tenant" | "landlord" | "property_manager",
  "phone": "+1234567890" // optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

---

### POST /auth/logout

Logout current user (invalidate token).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /auth/me

Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "tenant",
    "avatar": "https://...",
    "phone": "+1234567890",
    "bio": "...",
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "+1234567890",
      "relationship": "Spouse"
    },
    "preferences": {
      "emailNotifications": true,
      "smsAlerts": false,
      "language": "en"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 2. User Profile Endpoints

### GET /profile

Get current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same as GET /auth/me

---

### PUT /profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "About me...",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "relationship": "Spouse"
  },
  "preferences": {
    "emailNotifications": true,
    "smsAlerts": false,
    "language": "en"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* updated user object */ }
}
```

---

### PUT /profile/avatar

Upload/update profile avatar.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:** FormData with `avatar` file field

**Response:**

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://..."
  }
}
```

---

## 3. Properties Endpoints

### GET /properties

List all available properties with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search in title, description, address |
| type | string[] | apartment, house, studio, room, condo, townhouse |
| priceMin | number | Minimum price |
| priceMax | number | Maximum price |
| bedrooms | number[] | Number of bedrooms filter |
| bathrooms | number[] | Number of bathrooms filter |
| furnished | boolean | Furnished filter |
| petFriendly | boolean | Pet friendly filter |
| amenities | string[] | Required amenities |
| city | string | City filter |
| sortBy | string | price_asc, price_desc, newest, rating, views |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 12) |

**Response:**

```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "uuid",
        "title": "Modern Downtown Apartment",
        "description": "Beautiful apartment...",
        "type": "apartment",
        "status": "available" | "rented" | "pending",
        "price": 2500,
        "currency": "USD",
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "bedrooms": 2,
        "bathrooms": 1,
        "size": 850,
        "floor": 5,
        "totalFloors": 10,
        "yearBuilt": 2020,
        "furnished": true,
        "petFriendly": false,
        "parkingSpaces": 1,
        "amenities": ["WiFi", "Air Conditioning", "Gym"],
        "images": ["https://..."],
        "thumbnail": "https://...",
        "landlord": {
          "id": "uuid",
          "name": "Property Owner",
          "avatar": "https://...",
          "phone": "+1234567890",
          "email": "owner@example.com",
          "responseRate": 95,
          "responseTime": "within 1 hour",
          "propertiesCount": 5,
          "verified": true
        },
        "rating": 4.5,
        "reviewsCount": 12,
        "availableFrom": "2024-02-01",
        "minimumLease": 12,
        "rules": ["No smoking", "No parties"],
        "featured": true,
        "isNew": false,
        "verified": true,
        "views": 234,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 100,
      "totalPages": 9
    }
  }
}
```

---

### GET /properties/:id

Get single property details.

**Response:**

```json
{
  "success": true,
  "data": { /* full property object as above */ }
}
```

---

### GET /properties/featured

Get featured properties for homepage.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of properties (default: 6) |

**Response:**

```json
{
  "success": true,
  "data": [ /* array of property objects */ ]
}
```

---

### POST /properties

Create a new property (landlord only).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "title": "Modern Downtown Apartment",
  "description": "Beautiful apartment...",
  "type": "apartment",
  "price": 2500,
  "currency": "USD",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "bedrooms": 2,
  "bathrooms": 1,
  "size": 850,
  "floor": 5,
  "totalFloors": 10,
  "yearBuilt": 2020,
  "furnished": true,
  "petFriendly": false,
  "parkingSpaces": 1,
  "amenities": ["WiFi", "Air Conditioning"],
  "images": ["https://..."],
  "availableFrom": "2024-02-01",
  "minimumLease": 12,
  "rules": ["No smoking"]
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created property object */ }
}
```

---

### PUT /properties/:id

Update a property (landlord only).

**Headers:** `Authorization: Bearer <token>`

**Request:** Same as POST /properties (partial update allowed)

**Response:**

```json
{
  "success": true,
  "data": { /* updated property object */ }
}
```

---

### DELETE /properties/:id

Delete a property (landlord only).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

### GET /landlord/properties

Get all properties owned by current landlord.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [ /* array of property objects */ ]
}
```

---

## 4. Saved Properties Endpoints

### GET /saved-properties

Get user's saved/favorite properties.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [ /* array of property objects */ ]
}
```

---

### POST /saved-properties/:propertyId

Save a property to favorites.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Property saved successfully"
}
```

---

### DELETE /saved-properties/:propertyId

Remove a property from favorites.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Property removed from saved"
}
```

---

### GET /saved-properties/check/:propertyId

Check if a property is saved.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "isSaved": true
  }
}
```

---

## 5. Applications Endpoints

### GET /applications

Get current user's applications (tenant).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "property": { /* property object */ },
      "tenantId": "uuid",
      "status": "pending" | "under_review" | "approved" | "rejected" | "withdrawn",
      "appliedAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "notes": "Optional notes...",
      "documents": ["https://..."],
      "timeline": [
        {
          "id": "uuid",
          "status": "pending",
          "message": "Application submitted",
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

---

### POST /applications

Submit a new application.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "propertyId": "uuid",
  "notes": "I'm interested in this property...",
  "documents": ["https://..."] // optional pre-uploaded docs
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created application object */ }
}
```

---

### PUT /applications/:id/withdraw

Withdraw an application (tenant).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": { /* updated application with status: "withdrawn" */ }
}
```

---

### GET /applications/check/:propertyId

Check if user has applied to a property.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "hasApplied": true,
    "applicationId": "uuid",
    "status": "pending"
  }
}
```

---

### GET /landlord/applications

Get all applications for landlord's properties.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| propertyId | string | Filter by property |
| status | string | Filter by status |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "property": { /* property object */ },
      "tenantId": "uuid",
      "tenant": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "avatar": "https://...",
        "phone": "+1234567890"
      },
      "status": "pending",
      "appliedAt": "2024-01-01T00:00:00Z",
      "notes": "...",
      "documents": ["https://..."],
      "timeline": [ /* events */ ]
    }
  ]
}
```

---

### PUT /landlord/applications/:id/status

Update application status (landlord).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "status": "under_review" | "approved" | "rejected",
  "message": "Optional message to tenant"
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* updated application object */ }
}
```

---

## 6. Lease Agreements Endpoints

### GET /leases

Get current user's leases (tenant or landlord).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "applicationId": "uuid",
      "propertyId": "uuid",
      "property": { /* property object */ },
      "tenantId": "uuid",
      "tenantName": "John Doe",
      "tenantEmail": "john@example.com",
      "tenantAvatar": "https://...",
      "landlordId": "uuid",
      "startDate": "2024-02-01",
      "endDate": "2025-02-01",
      "monthlyRent": 2500,
      "securityDeposit": 5000,
      "documents": [
        {
          "id": "uuid",
          "name": "Lease Agreement.pdf",
          "type": "pdf",
          "url": "https://...",
          "uploadedAt": "2024-01-01T00:00:00Z"
        }
      ],
      "status": "draft" | "pending_tenant" | "tenant_accepted" | "payment_pending" | "active" | "rejected" | "expired" | "terminated",
      "paymentStatus": "unpaid" | "paid" | "processing",
      "paymentAmount": 7500,
      "paidAt": "2024-01-15T00:00:00Z",
      "rejectionReason": "...",
      "sentToTenantAt": "2024-01-01T00:00:00Z",
      "tenantRespondedAt": "2024-01-02T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /landlord/leases

Get all leases for landlord's properties.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same format as GET /leases

---

### POST /landlord/leases

Create a new lease agreement (landlord).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "applicationId": "uuid",
  "propertyId": "uuid",
  "tenantId": "uuid",
  "startDate": "2024-02-01",
  "endDate": "2025-02-01",
  "monthlyRent": 2500,
  "securityDeposit": 5000,
  "documents": [
    {
      "name": "Lease Agreement.pdf",
      "type": "pdf",
      "url": "https://..."
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created lease object */ }
}
```

---

### PUT /landlord/leases/:id/send

Send lease to tenant for review.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": { /* lease with status: "pending_tenant" */ }
}
```

---

### PUT /leases/:id/accept

Accept a lease (tenant).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": { /* lease with status: "tenant_accepted" or "payment_pending" */ }
}
```

---

### PUT /leases/:id/reject

Reject a lease (tenant).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "reason": "The terms don't work for me..."
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* lease with status: "rejected" */ }
}
```

---

### PUT /leases/:id/pay

Process payment for lease (tenant).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "paymentMethod": "card" | "bank_transfer",
  "paymentDetails": { /* payment processor specific */ }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    /* lease with status: "active", paymentStatus: "paid" */
  }
}
```

---

## 7. Conversations & Messages Endpoints

### GET /conversations

Get all conversations for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "participants": [
        {
          "id": "uuid",
          "name": "John Doe",
          "avatar": "https://...",
          "role": "tenant"
        },
        {
          "id": "uuid",
          "name": "Property Owner",
          "avatar": "https://...",
          "role": "landlord"
        }
      ],
      "propertyId": "uuid",
      "propertyTitle": "Modern Downtown Apartment",
      "lastMessage": "Thanks for your interest!",
      "lastMessageAt": "2024-01-01T12:00:00Z",
      "unreadCount": 2
    }
  ]
}
```

---

### GET /conversations/:id

Get single conversation with messages.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "participants": [ /* participant objects */ ],
    "propertyId": "uuid",
    "propertyTitle": "Modern Downtown Apartment",
    "messages": [
      {
        "id": "uuid",
        "conversationId": "uuid",
        "senderId": "uuid",
        "senderType": "tenant" | "landlord",
        "content": "Hello, I'm interested in your property",
        "timestamp": "2024-01-01T10:00:00Z",
        "read": true
      }
    ]
  }
}
```

---

### POST /conversations

Create a new conversation.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "recipientId": "uuid",
  "propertyId": "uuid",
  "initialMessage": "Hello, I'm interested in your property..."
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created conversation object */ }
}
```

---

### POST /conversations/:id/messages

Send a message in a conversation.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "content": "Thank you for your response!"
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created message object */ }
}
```

---

### GET /conversations/property/:propertyId

Get or check conversation for a specific property.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "exists": true,
    "conversation": { /* conversation object if exists */ }
  }
}
```

---

## 8. Notifications Endpoints

### GET /notifications

Get all notifications for current user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| unreadOnly | boolean | Only return unread notifications |
| type | string | Filter by type |
| page | number | Page number |
| limit | number | Items per page |

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "userId": "uuid",
        "type": "application" | "message" | "property" | "payment" | "maintenance" | "system",
        "title": "Application Approved",
        "description": "Your application for Modern Downtown Apartment has been approved!",
        "read": false,
        "link": "/dashboard/applications",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### PUT /notifications/:id/read

Mark a notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": { /* updated notification */ }
}
```

---

### PUT /notifications/read-all

Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### DELETE /notifications/:id

Delete a notification.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### GET /notifications/unread-count

Get count of unread notifications.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## 9. Maintenance Requests Endpoints

### GET /maintenance

Get maintenance requests (tenant or landlord view).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rentalId": "uuid",
      "propertyId": "uuid",
      "propertyTitle": "Modern Downtown Apartment",
      "tenantId": "uuid",
      "tenantName": "John Doe",
      "landlordId": "uuid",
      "title": "Broken AC Unit",
      "description": "The air conditioning unit is making loud noises...",
      "priority": "low" | "medium" | "high" | "urgent",
      "status": "open" | "accepted" | "rejected" | "in_progress" | "scheduled" | "completed",
      "images": ["https://..."],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "scheduledFor": "2024-01-05T10:00:00Z",
      "completedAt": "2024-01-05T12:00:00Z",
      "notes": "Technician will arrive between 10-12",
      "rejectionReason": "...",
      "timeline": [
        {
          "id": "uuid",
          "status": "open",
          "message": "Request submitted",
          "timestamp": "2024-01-01T00:00:00Z",
          "actor": "tenant"
        }
      ]
    }
  ]
}
```

---

### POST /maintenance

Create a maintenance request (tenant).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "rentalId": "uuid",
  "propertyId": "uuid",
  "title": "Broken AC Unit",
  "description": "The air conditioning unit is making loud noises...",
  "priority": "medium",
  "images": ["https://..."]
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created maintenance request */ }
}
```

---

### PUT /landlord/maintenance/:id/status

Update maintenance request status (landlord).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "status": "accepted" | "rejected" | "in_progress" | "scheduled" | "completed",
  "notes": "Technician scheduled for tomorrow",
  "scheduledFor": "2024-01-05T10:00:00Z",
  "rejectionReason": "Not covered under warranty"
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* updated maintenance request */ }
}
```

---

## 10. Payments Endpoints

### GET /payments

Get payment history (tenant).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rentalId": "uuid",
      "propertyTitle": "Modern Downtown Apartment",
      "amount": 2500,
      "type": "rent" | "deposit" | "fee" | "utility",
      "status": "paid" | "pending" | "overdue" | "scheduled",
      "dueDate": "2024-01-01",
      "paidAt": "2024-01-01T10:00:00Z",
      "method": "card",
      "receiptUrl": "https://..."
    }
  ]
}
```

---

### POST /payments/:id/pay

Process a payment.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "paymentMethod": "card" | "bank_transfer",
  "paymentDetails": { /* payment processor specific */ }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "payment": { /* updated payment with status: "paid" */ },
    "receiptUrl": "https://..."
  }
}
```

---

## 11. Documents Endpoints

### GET /documents

Get user's documents.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | lease, receipt, maintenance, other |
| propertyId | string | Filter by property |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Lease Agreement.pdf",
      "type": "lease",
      "fileType": "pdf",
      "propertyId": "uuid",
      "propertyTitle": "Modern Downtown Apartment",
      "uploadedAt": "2024-01-01T00:00:00Z",
      "size": 1024000,
      "url": "https://..."
    }
  ]
}
```

---

### POST /documents/upload

Upload a document.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:** FormData with:

- `file`: The document file
- `type`: Document type (lease, receipt, maintenance, other)
- `propertyId`: Optional property association

**Response:**

```json
{
  "success": true,
  "data": { /* created document object */ }
}
```

---

### DELETE /documents/:id

Delete a document.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Document deleted"
}
```

---

## 12. Property Managers Endpoints

### GET /properties/:id/managers

Get managers for a property (landlord only).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "userId": "uuid",
      "userName": "Manager Name",
      "userEmail": "manager@example.com",
      "userAvatar": "https://...",
      "role": "manager" | "assistant",
      "addedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /properties/:id/managers

Add a manager to a property (landlord only).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "email": "manager@example.com",
  "role": "manager" | "assistant"
}
```

**Response:**

```json
{
  "success": true,
  "data": { /* created property manager object */ }
}
```

---

### DELETE /properties/:id/managers/:managerId

Remove a manager from a property (landlord only).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Manager removed"
}
```

---

## 13. Property Manager Dashboard Endpoints

### GET /manager/properties

Get properties managed by current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [ /* array of property objects */ ]
}
```

---

### GET /manager/applications

Get applications for managed properties.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same format as GET /landlord/applications

---

### GET /manager/leases

Get leases for managed properties.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same format as GET /leases

---

### GET /manager/maintenance

Get maintenance requests for managed properties.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same format as GET /maintenance

---

## Implementation Notes

### For Your Backend Team

1. **Authentication**
   - Use JWT tokens with appropriate expiration
   - Include user role in token payload for authorization
   - Implement refresh token mechanism for long sessions

2. **Authorization**
   - Verify user ownership/access on all endpoints
   - Landlords can only access their own properties/applications
   - Tenants can only access their own data
   - Property managers can access assigned properties only

3. **File Uploads**
   - Use pre-signed URLs for large file uploads
   - Validate file types and sizes
   - Store files in cloud storage (S3, etc.)

4. **Real-time Updates (Optional)**
   - Consider WebSocket for messages and notifications
   - Or use polling with appropriate intervals

5. **Pagination**
   - Implement cursor-based or offset pagination
   - Return total count for UI pagination

6. **Error Handling**
   - Use consistent error codes
   - Include helpful error messages
   - Log errors for debugging

---

## API Checklist

Use this checklist to track which APIs are ready:

- [x] POST /auth/login
- [x] POST /auth/register
- [x] POST /auth/logout
- [x] GET /auth/me
- [x] GET /profile
- [x] PUT /profile
- [x] PUT /profile/avatar (via POST /files/upload with USER_AVATAR category)
- [x] GET /properties
- [x] GET /properties/:id
- [x] GET /properties/featured
- [x] POST /properties
- [x] PUT /properties/:id
- [x] DELETE /properties/:id
- [x] GET /landlord/properties (via GET /properties/landlord/:landlordId)
- [x] PUT /properties/:id/manager (assign manager)
- [x] DELETE /properties/:id/manager (remove manager)
- [ ] GET /saved-properties
- [ ] POST /saved-properties/:propertyId
- [ ] DELETE /saved-properties/:propertyId
- [ ] GET /saved-properties/check/:propertyId
- [ ] GET /applications
- [ ] POST /applications
- [ ] PUT /applications/:id/withdraw
- [ ] GET /applications/check/:propertyId
- [ ] GET /landlord/applications
- [ ] PUT /landlord/applications/:id/status
- [ ] GET /leases
- [ ] GET /landlord/leases
- [ ] POST /landlord/leases
- [ ] PUT /landlord/leases/:id/send
- [ ] PUT /leases/:id/accept
- [ ] PUT /leases/:id/reject
- [ ] PUT /leases/:id/pay
- [ ] GET /conversations
- [ ] GET /conversations/:id
- [ ] POST /conversations
- [ ] POST /conversations/:id/messages
- [ ] GET /conversations/property/:propertyId
- [ ] GET /notifications
- [ ] PUT /notifications/:id/read
- [ ] PUT /notifications/read-all
- [ ] DELETE /notifications/:id
- [ ] GET /notifications/unread-count
- [ ] GET /maintenance
- [ ] POST /maintenance
- [ ] PUT /landlord/maintenance/:id/status
- [ ] GET /payments
- [ ] POST /payments/:id/pay
- [ ] GET /documents
- [ ] POST /documents/upload
- [ ] DELETE /documents/:id
- [ ] GET /properties/:id/managers
- [ ] POST /properties/:id/managers
- [ ] DELETE /properties/:id/managers/:managerId
- [ ] GET /manager/properties
- [ ] GET /manager/applications
- [ ] GET /manager/leases
- [ ] GET /manager/maintenance

---

## Next Steps

1. Share your ngrok URL
2. Let me know which APIs are ready
3. Provide any differences in your response format
4. I'll create the API service layer to connect them
