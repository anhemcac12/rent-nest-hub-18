# Lease Agreement & Payment Flow - API Specification

## Overview

This document defines the complete lease agreement lifecycle from creation to activation/termination, including tenant acceptance, payment processing, and automatic status management.

---

## Lease Lifecycle State Machine

```
                                    ┌─────────────────────────────────────┐
                                    │                                     │
                                    ▼                                     │
┌──────────┐    Landlord    ┌───────────┐    Tenant     ┌────────────┐   │
│ APPROVED │───creates───▶  │  PENDING  │───accepts───▶ │ AWAITING   │   │
│APPLICATION│   lease       │  (Draft)  │               │  PAYMENT   │   │
└──────────┘                └───────────┘               └────────────┘   │
                                   │                          │          │
                                   │                          │          │
                            Tenant rejects           Tenant pays         │
                            OR 2 days expire         (deposit + rent)    │
                            without payment                   │          │
                                   │                          │          │
                                   ▼                          ▼          │
                            ┌────────────┐            ┌────────────┐     │
                            │ TERMINATED │            │   ACTIVE   │─────┘
                            │            │            │            │  Landlord
                            └────────────┘            └────────────┘  terminates
                                                           │
                                                           │ End date
                                                           │ reached
                                                           ▼
                                                      ┌────────────┐
                                                      │  EXPIRED   │
                                                      └────────────┘
```

---

## Lease Status Enum (Updated)

```java
public enum LeaseStatus {
    PENDING,          // Draft created by landlord, awaiting tenant review
    AWAITING_PAYMENT, // Tenant accepted, awaiting payment (2 days to pay)
    ACTIVE,           // Payment completed, lease is active
    TERMINATED,       // Ended early (landlord terminated OR tenant rejected OR payment timeout)
    EXPIRED           // Natural end date reached
}
```

---

## Updated Data Structures

### LeaseResponseDTO (Updated)

```json
{
  "id": 1,
  
  // Property Info
  "propertyId": 5,
  "propertyTitle": "Modern Downtown Apartment",
  "propertyAddress": "123 Main St, New York, NY 10001",
  "propertyCoverImageUrl": "https://storage/properties/image.jpg",
  
  // Tenant Info
  "tenantId": 10,
  "tenantName": "John Doe",
  "tenantEmail": "tenant@example.com",
  "tenantAvatarUrl": "https://storage/avatars/avatar.jpg",
  
  // Landlord Info
  "landlordId": 3,
  "landlordName": "Jane Smith",
  
  // Lease Terms
  "startDate": "2025-01-15",
  "endDate": "2026-01-15",
  "rentAmount": 2500.00,
  "securityDeposit": 2500.00,          // NEW FIELD
  "status": "PENDING",
  
  // Contract Document
  "contractFileId": 25,
  "contractFileUrl": "leases/contract-123.pdf",
  
  // NEW: Acceptance Tracking
  "acceptedAt": null,                   // Timestamp when tenant accepted
  "acceptanceDeadline": null,           // Calculated: acceptedAt + 2 days (for payment)
  "rejectedAt": null,                   // Timestamp when tenant rejected
  "rejectionReason": null,              // Reason provided by tenant
  
  // NEW: Payment Status
  "depositPaid": false,
  "firstRentPaid": false,
  "totalDueOnAcceptance": 5000.00,      // securityDeposit + rentAmount
  "totalPaidOnAcceptance": 0.00
}
```

### CreateLeaseRequestDTO (Updated)

```json
{
  "approvedApplicationId": 1,
  "startDate": "2025-01-15",
  "endDate": "2026-01-15",
  "rentAmount": 2500.00,
  "securityDeposit": 2500.00            // NEW FIELD (required)
}
```

### PaymentResponseDTO

```json
{
  "id": 1,
  "leaseId": 5,
  "tenantId": 10,
  "tenantName": "John Doe",
  "landlordId": 3,
  
  "amount": 2500.00,
  "type": "DEPOSIT",                    // DEPOSIT, RENT, LATE_FEE, OTHER
  "status": "COMPLETED",                // PENDING, COMPLETED, FAILED, REFUNDED
  "paymentMethod": "Online Portal",
  "description": "Security deposit payment",
  
  "paymentDate": "2025-01-10",
  "createdAt": "2025-01-10T14:30:00Z",
  "updatedAt": "2025-01-10T14:30:00Z"
}
```

### TenantAcceptLeaseDTO (Request)

```json
{
  // No body required - just endpoint call
  // OR optionally for future e-signature:
  "signature": "base64_signature_data",
  "agreedToTerms": true
}
```

### TenantRejectLeaseDTO (Request)

```json
{
  "reason": "The rent is higher than discussed during viewing."
}
```

### InitiatePaymentRequestDTO

```json
{
  "amount": 5000.00,
  "type": "DEPOSIT_AND_FIRST_RENT",     // Or separate: DEPOSIT, RENT
  "paymentMethod": "Credit Card",
  "description": "Security deposit and first month rent"
}
```

---

## New API Endpoints

### 1. Tenant Accepts Lease Agreement

**Endpoint:** `PATCH /api/lease-agreements/{id}/accept`

**Actor:** Tenant (who is assigned to this lease)

**Description:** Tenant accepts the lease terms. This changes status from `PENDING` to `AWAITING_PAYMENT` and starts the 2-day payment window.

**Request:**
```http
PATCH /api/lease-agreements/5/accept
Authorization: Bearer {{tenant_jwt}}
Content-Type: application/json

{
  "agreedToTerms": true
}
```

**Success Response:** `200 OK`
```json
{
  "id": 5,
  "status": "AWAITING_PAYMENT",
  "acceptedAt": "2025-01-10T14:30:00Z",
  "acceptanceDeadline": "2025-01-12T14:30:00Z",
  "totalDueOnAcceptance": 5000.00,
  ...
}
```

**Business Logic:**
1. Verify tenant is the one assigned to this lease
2. Verify lease status is `PENDING`
3. Verify contract document is attached
4. Set `acceptedAt` = current timestamp
5. Set `acceptanceDeadline` = current timestamp + 48 hours
6. Change status to `AWAITING_PAYMENT`
7. (Optional) Send notification to landlord

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | "Only pending leases can be accepted." |
| 400 | "Cannot accept lease without contract document." |
| 403 | "You are not the tenant on this lease." |
| 404 | "Lease agreement not found." |

---

### 2. Tenant Rejects Lease Agreement

**Endpoint:** `PATCH /api/lease-agreements/{id}/reject`

**Actor:** Tenant

**Description:** Tenant rejects the lease. This immediately terminates the lease and frees the property.

**Request:**
```http
PATCH /api/lease-agreements/5/reject
Authorization: Bearer {{tenant_jwt}}
Content-Type: application/json

{
  "reason": "The rent amount is higher than initially discussed."
}
```

**Success Response:** `200 OK`
```json
{
  "id": 5,
  "status": "TERMINATED",
  "rejectedAt": "2025-01-10T14:30:00Z",
  "rejectionReason": "The rent amount is higher than initially discussed.",
  ...
}
```

**Business Logic:**
1. Verify tenant is assigned to this lease
2. Verify lease status is `PENDING` or `AWAITING_PAYMENT`
3. Set `rejectedAt` = current timestamp
4. Set `rejectionReason` = provided reason
5. Change status to `TERMINATED`
6. Change property status back to `AVAILABLE`
7. (Optional) Send notification to landlord
8. (If any payments were made) Initiate refund process

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | "Only pending or awaiting payment leases can be rejected." |
| 400 | "Rejection reason is required." |
| 403 | "You are not the tenant on this lease." |
| 404 | "Lease agreement not found." |

---

### 3. Tenant Makes Acceptance Payment

**Endpoint:** `POST /api/payments/lease/{leaseId}/acceptance-payment`

**Actor:** Tenant

**Description:** Tenant pays the security deposit and first month's rent. On successful full payment, lease automatically activates.

**Request:**
```http
POST /api/payments/lease/5/acceptance-payment
Authorization: Bearer {{tenant_jwt}}
Content-Type: application/json

{
  "amount": 5000.00,
  "paymentMethod": "Credit Card",
  "cardToken": "tok_visa_xxx"          // If using payment processor
}
```

**Success Response:** `201 Created`
```json
{
  "payment": {
    "id": 1,
    "leaseId": 5,
    "amount": 5000.00,
    "type": "DEPOSIT_AND_FIRST_RENT",
    "status": "COMPLETED",
    "paymentDate": "2025-01-10"
  },
  "lease": {
    "id": 5,
    "status": "ACTIVE",                // Auto-activated!
    "depositPaid": true,
    "firstRentPaid": true,
    "totalPaidOnAcceptance": 5000.00
  }
}
```

**Business Logic:**
1. Verify tenant is assigned to this lease
2. Verify lease status is `AWAITING_PAYMENT`
3. Verify `acceptanceDeadline` has not passed
4. Verify amount matches `totalDueOnAcceptance` (or handle partial payments if allowed)
5. Process payment (integrate with payment gateway)
6. Create payment record(s) - one for DEPOSIT, one for RENT
7. Update lease: `depositPaid = true`, `firstRentPaid = true`
8. **AUTO-ACTIVATE**: Change lease status to `ACTIVE`
9. Change property status to `RENTED`
10. Reject all other pending applications for this property
11. Send notifications to both parties

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | "Payment can only be made for leases awaiting payment." |
| 400 | "Payment deadline has expired. Lease is no longer valid." |
| 400 | "Invalid payment amount. Expected: $5000.00" |
| 402 | "Payment failed: Insufficient funds." |
| 403 | "You are not the tenant on this lease." |
| 404 | "Lease agreement not found." |

---

### 4. Get Payment Summary for Lease (Before Payment)

**Endpoint:** `GET /api/payments/lease/{leaseId}/summary`

**Actor:** Tenant or Landlord

**Description:** Get payment summary showing what's due, what's paid, deadline, etc.

**Request:**
```http
GET /api/payments/lease/5/summary
Authorization: Bearer {{tenant_jwt}}
```

**Success Response:** `200 OK`
```json
{
  "leaseId": 5,
  "status": "AWAITING_PAYMENT",
  
  "breakdown": {
    "securityDeposit": 2500.00,
    "firstMonthRent": 2500.00,
    "totalDue": 5000.00
  },
  
  "paid": {
    "securityDeposit": 0.00,
    "firstMonthRent": 0.00,
    "totalPaid": 0.00
  },
  
  "remaining": 5000.00,
  
  "deadline": "2025-01-12T14:30:00Z",
  "hoursRemaining": 36,
  "isExpired": false
}
```

---

### 5. Check Payment Deadline Status

**Endpoint:** `GET /api/lease-agreements/{id}/deadline-status`

**Actor:** Tenant or Landlord

**Description:** Check if payment deadline has passed and current status.

**Request:**
```http
GET /api/lease-agreements/5/deadline-status
Authorization: Bearer {{token}}
```

**Success Response:** `200 OK`
```json
{
  "leaseId": 5,
  "status": "AWAITING_PAYMENT",
  "acceptedAt": "2025-01-10T14:30:00Z",
  "deadline": "2025-01-12T14:30:00Z",
  "currentTime": "2025-01-11T10:00:00Z",
  "hoursRemaining": 28.5,
  "isExpired": false,
  "willAutoTerminateAt": "2025-01-12T14:30:00Z"
}
```

---

## Background Job: Auto-Terminate Expired Leases

### Scheduled Task (Cron Job)

**Schedule:** Every hour (or every 15 minutes for more precision)

**Logic:**
```sql
-- Find all leases that are AWAITING_PAYMENT and past deadline
UPDATE lease_agreements
SET 
    status = 'TERMINATED',
    updated_at = NOW(),
    termination_reason = 'Payment deadline expired'
WHERE 
    status = 'AWAITING_PAYMENT'
    AND acceptance_deadline < NOW();

-- Also update the associated properties back to AVAILABLE
UPDATE properties
SET status = 'AVAILABLE'
WHERE id IN (
    SELECT property_id FROM lease_agreements
    WHERE status = 'TERMINATED'
    AND termination_reason = 'Payment deadline expired'
    AND updated_at > NOW() - INTERVAL '1 minute'
);
```

**Alternative: Lazy Evaluation (Check on Access)**

Instead of a cron job, check deadline on every lease access:

```java
@GetMapping("/lease-agreements/{id}")
public LeaseResponseDTO getLease(@PathVariable Long id) {
    LeaseAgreement lease = leaseRepository.findById(id);
    
    // Auto-terminate if deadline passed
    if (lease.getStatus() == AWAITING_PAYMENT 
        && lease.getAcceptanceDeadline().isBefore(Instant.now())) {
        
        lease.setStatus(TERMINATED);
        lease.setTerminationReason("Payment deadline expired");
        leaseRepository.save(lease);
        
        // Free up property
        propertyService.setPropertyAvailable(lease.getPropertyId());
    }
    
    return toDTO(lease);
}
```

---

## Complete Updated Endpoint Reference

| Method | Endpoint | Actor | Description |
|--------|----------|-------|-------------|
| **Lease Management** |
| POST | `/api/lease-agreements` | Landlord | Create draft from approved application |
| GET | `/api/lease-agreements/{id}` | All parties | Get single lease |
| GET | `/api/lease-agreements/my` | Tenant | Get my leases |
| GET | `/api/lease-agreements/for-landlord` | Landlord | Get all my property leases |
| GET | `/api/lease-agreements/for-property/{id}` | Landlord | Get leases for property |
| PATCH | `/api/lease-agreements/{id}/contract` | Landlord | Attach contract document |
| **NEW** PATCH | `/api/lease-agreements/{id}/accept` | Tenant | Accept lease (→ AWAITING_PAYMENT) |
| **NEW** PATCH | `/api/lease-agreements/{id}/reject` | Tenant | Reject lease (→ TERMINATED) |
| PATCH | `/api/lease-agreements/{id}/activate` | Landlord | Manual activation (if needed) |
| PATCH | `/api/lease-agreements/{id}/terminate` | Landlord | Terminate active lease |
| **NEW** GET | `/api/lease-agreements/{id}/deadline-status` | All | Check payment deadline |
| **Payments** |
| POST | `/api/payments/lease/{leaseId}` | Landlord | Log manual payment |
| POST | `/api/payments/lease/{leaseId}/pay` | Tenant | Regular rent payment |
| **NEW** POST | `/api/payments/lease/{leaseId}/acceptance-payment` | Tenant | Pay deposit + first rent (auto-activates) |
| GET | `/api/payments/lease/{leaseId}` | All parties | Get payment history |
| **NEW** GET | `/api/payments/lease/{leaseId}/summary` | All parties | Get payment summary |

---

## Complete Flow Example

### Happy Path: Tenant Accepts and Pays

```
Timeline:
─────────────────────────────────────────────────────────────────────────────

Day 1, 10:00 AM
├── Landlord: POST /api/lease-agreements
│   └── Creates lease with status = PENDING
│
├── Landlord: POST /api/files/upload (contract PDF)
│   └── Gets documentId = 25
│
├── Landlord: PATCH /api/lease-agreements/5/contract
│   └── Attaches contract to lease
│
│   [Tenant receives notification: "New lease agreement to review"]

Day 1, 2:00 PM
├── Tenant: GET /api/lease-agreements/5
│   └── Views lease details and contract
│
├── Tenant: PATCH /api/lease-agreements/5/accept
│   └── Status changes: PENDING → AWAITING_PAYMENT
│   └── Deadline set: Day 3, 2:00 PM (48 hours)
│
│   [Landlord receives notification: "Tenant accepted, awaiting payment"]

Day 1, 3:00 PM
├── Tenant: GET /api/payments/lease/5/summary
│   └── Sees: $5000 due (deposit + rent), 47 hours remaining
│
├── Tenant: POST /api/payments/lease/5/acceptance-payment
│   └── Pays $5000
│   └── Status changes: AWAITING_PAYMENT → ACTIVE
│   └── Property status: AVAILABLE → RENTED
│
│   [Both parties receive notification: "Lease is now active!"]
│   [Other applicants notified: "Application rejected"]

─────────────────────────────────────────────────────────────────────────────
```

### Rejection Path

```
Day 1, 2:00 PM
├── Tenant: PATCH /api/lease-agreements/5/reject
│   Body: { "reason": "Rent too high" }
│   └── Status changes: PENDING → TERMINATED
│   └── Property status remains: AVAILABLE
│
│   [Landlord receives notification: "Tenant rejected the lease"]
│   [Landlord can create new lease for another applicant]
```

### Timeout Path (No Payment in 48 Hours)

```
Day 1, 2:00 PM
├── Tenant: PATCH /api/lease-agreements/5/accept
│   └── Status: AWAITING_PAYMENT
│   └── Deadline: Day 3, 2:00 PM

Day 2
├── [No payment made]

Day 3, 2:01 PM
├── [Cron job runs OR next access triggers check]
│   └── Status changes: AWAITING_PAYMENT → TERMINATED
│   └── Reason: "Payment deadline expired"
│   └── Property status: AVAILABLE
│
│   [Both parties notified: "Lease expired due to non-payment"]
```

---

## Database Schema Suggestions

### lease_agreements table updates

```sql
ALTER TABLE lease_agreements ADD COLUMN security_deposit DECIMAL(10,2);
ALTER TABLE lease_agreements ADD COLUMN accepted_at TIMESTAMP;
ALTER TABLE lease_agreements ADD COLUMN acceptance_deadline TIMESTAMP;
ALTER TABLE lease_agreements ADD COLUMN rejected_at TIMESTAMP;
ALTER TABLE lease_agreements ADD COLUMN rejection_reason TEXT;
ALTER TABLE lease_agreements ADD COLUMN termination_reason TEXT;
ALTER TABLE lease_agreements ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE lease_agreements ADD COLUMN first_rent_paid BOOLEAN DEFAULT FALSE;

-- Update status enum
-- PENDING, AWAITING_PAYMENT, ACTIVE, TERMINATED, EXPIRED
```

### payments table

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    lease_id BIGINT REFERENCES lease_agreements(id),
    tenant_id BIGINT REFERENCES users(id),
    landlord_id BIGINT REFERENCES users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- DEPOSIT, RENT, DEPOSIT_AND_FIRST_RENT, LATE_FEE, OTHER
    status VARCHAR(50) NOT NULL, -- PENDING, COMPLETED, FAILED, REFUNDED
    
    payment_method VARCHAR(100),
    description TEXT,
    payment_date DATE,
    
    -- For payment processor integration
    external_payment_id VARCHAR(255),
    external_payment_status VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Notification Events

| Event | Recipients | Message |
|-------|------------|---------|
| Lease created | Tenant | "You have a new lease agreement to review for {property}" |
| Tenant accepts | Landlord | "{tenant} accepted the lease. Awaiting payment." |
| Payment received | Both | "Payment of ${amount} received. Lease is now active!" |
| Tenant rejects | Landlord | "{tenant} rejected the lease. Reason: {reason}" |
| Payment deadline warning (24h) | Tenant | "Payment deadline in 24 hours for {property}" |
| Payment deadline expired | Both | "Lease terminated due to non-payment" |
| Lease terminated by landlord | Tenant | "Your lease for {property} has been terminated" |

---

## Edge Cases & Business Rules

1. **Partial Payments**: Currently not supported. Tenant must pay full amount.

2. **Payment Deadline Extension**: Not supported in MVP. Landlord would need to terminate and create new lease.

3. **Multiple Acceptance Attempts**: Once rejected, tenant cannot accept. New lease must be created.

4. **Contract Required**: Tenant cannot accept lease without contract document attached.

5. **Property Already Rented**: If property status changes to RENTED by another lease, pending leases should be auto-terminated.

6. **Refunds**: If lease is terminated after partial payment, refund logic needed (out of scope for MVP).

7. **Concurrent Leases**: A property can only have ONE active lease at a time.

---

## API Config Updates Needed

```typescript
// Add to API_ENDPOINTS in config.ts
export const API_ENDPOINTS = {
  // ... existing endpoints ...
  
  // Lease Agreement - New endpoints
  LEASE_AGREEMENT_ACCEPT: (leaseId: number) => `/api/lease-agreements/${leaseId}/accept`,
  LEASE_AGREEMENT_REJECT: (leaseId: number) => `/api/lease-agreements/${leaseId}/reject`,
  LEASE_AGREEMENT_DEADLINE: (leaseId: number) => `/api/lease-agreements/${leaseId}/deadline-status`,
  
  // Payments
  PAYMENTS_FOR_LEASE: (leaseId: number) => `/api/payments/lease/${leaseId}`,
  PAYMENTS_LOG: (leaseId: number) => `/api/payments/lease/${leaseId}`,
  PAYMENTS_TENANT_PAY: (leaseId: number) => `/api/payments/lease/${leaseId}/pay`,
  PAYMENTS_ACCEPTANCE: (leaseId: number) => `/api/payments/lease/${leaseId}/acceptance-payment`,
  PAYMENTS_SUMMARY: (leaseId: number) => `/api/payments/lease/${leaseId}/summary`,
} as const;
```

---

## Questions for Backend Team

1. **Payment Gateway Integration**: Will you use Stripe, PayPal, or mock payments for now?

2. **Cron Job vs Lazy Eval**: Which approach for auto-termination - scheduled job or check on access?

3. **Notification System**: Is there an existing notification/email system to integrate with?

4. **Timezone Handling**: Should deadlines be calculated in UTC or user's local timezone?

5. **Partial Payments**: Should we support paying deposit and rent separately?

---

*Document Version: 1.0*
*Created: January 2025*
*For: Backend Implementation Team*
