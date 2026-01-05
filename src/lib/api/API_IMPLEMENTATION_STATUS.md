# API Implementation Status Tracker

This file tracks which APIs have been implemented in the frontend and are connected to the backend.

**Last Updated:** 2026-01-05

---

## Transport Methods

| Transport | Use Case | Endpoint |
|-----------|----------|----------|
| **REST API** | Initial data load, CRUD operations, fallback | `http://localhost:8081/api/...` |
| **WebSocket (STOMP)** | Real-time messaging | `ws://localhost:8081/ws` |

## Legend

| Status | Description |
|--------|-------------|
| ✅ | Fully implemented and connected |
| ⏳ | Partially implemented |
| ❌ | Not implemented yet |

---

## Summary

| Category | Implemented | Total | Percentage |
|----------|-------------|-------|------------|
| Authentication | 6/6 | 6 | 100% |
| User/Profile | 4/4 | 4 | 100% |
| Files | 3/3 | 3 | 100% |
| Properties | 8/8 | 8 | 100% |
| Saved Properties | 4/4 | 4 | 100% |
| Applications | 6/6 | 6 | 100% |
| Lease Agreements | 11/11 | 11 | 100% |
| Payments | 5/5 | 5 | 100% |
| Rent Schedule | 5/5 | 5 | 100% |
| Conversations/Messages | 8/8 | 8 | 100% |
| Notifications | 0/5 | 5 | 0% |
| Maintenance | 0/20 | 20 | 0% |
| Documents | 0/3 | 3 | 0% |
| Property Managers | 0/3 | 3 | 0% |
| Manager Dashboard | 0/4 | 4 | 0% |
| **TOTAL** | **60/92** | **92** | **65%** |

---

## 1. Authentication ✅ (6/6)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| POST /api/auth/register | ✅ | authApi.ts | `authApi.register()` |
| POST /api/auth/login | ✅ | authApi.ts | `authApi.login()` |
| POST /api/auth/logout | ✅ | authApi.ts | `authApi.logout()` |
| POST /api/auth/change-password | ✅ | authApi.ts | `authApi.changePassword()` |
| POST /api/auth/forgot-password | ✅ | authApi.ts | `authApi.forgotPassword()` |
| POST /api/auth/perform-reset | ✅ | authApi.ts | `authApi.performReset()` |

---

## 2. User/Profile ✅ (4/4)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /api/users/:id | ✅ | userApi.ts | `userApi.getPublicProfile()` |
| GET /api/users/me | ✅ | userApi.ts | `userApi.getCurrentProfile()` |
| PUT /api/users/me | ✅ | userApi.ts | `userApi.updateProfile()` |
| DELETE /api/users/me/identity-document | ✅ | config.ts | Endpoint defined |

---

## 3. Files ✅ (3/3)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| POST /api/files/upload | ✅ | fileApi.ts | `fileApi.upload()` - Supports USER_AVATAR, ID_CARD, PROPERTY_PHOTO, LEASE_PDF |
| DELETE /api/files/:documentId | ✅ | fileApi.ts | `fileApi.delete()` |
| GET /api/documents/:id/signed-url | ✅ | fileApi.ts | `fileApi.getSignedUrl()` |

---

## 4. Properties ✅ (8/8)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /api/properties | ✅ | propertyApi.ts | `propertyApi.searchProperties()` - With filters, pagination, sorting |
| GET /api/properties/:id | ✅ | propertyApi.ts | `propertyApi.getProperty()` |
| GET /api/properties/featured | ✅ | propertyApi.ts | `propertyApi.getFeaturedProperties()` |
| GET /api/properties/landlord/:landlordId | ✅ | propertyApi.ts | `propertyApi.getPropertiesByLandlord()` |
| POST /api/properties | ✅ | propertyApi.ts | `propertyApi.createProperty()` |
| PUT /api/properties/:id | ✅ | propertyApi.ts | `propertyApi.updateProperty()` |
| DELETE /api/properties/:id | ✅ | propertyApi.ts | `propertyApi.deleteProperty()` |
| PUT /api/properties/:id/manager | ✅ | propertyApi.ts | `propertyApi.assignManager()` |
| DELETE /api/properties/:id/manager | ✅ | propertyApi.ts | `propertyApi.removeManager()` |

---

## 5. Saved Properties ✅ (4/4)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /api/users/me/saved-properties | ✅ | savedPropertiesApi.ts | `savedPropertiesApi.getSavedProperties()` |
| POST /api/users/me/saved-properties | ✅ | savedPropertiesApi.ts | `savedPropertiesApi.saveProperty()` |
| DELETE /api/users/me/saved-properties/:propertyId | ✅ | savedPropertiesApi.ts | `savedPropertiesApi.unsaveProperty()` |
| GET /api/users/me/saved-properties/:propertyId/status | ✅ | savedPropertiesApi.ts | `savedPropertiesApi.checkSavedStatus()` |

---

## 6. Applications ✅ (6/6)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| POST /api/lease-applications | ✅ | leaseApplicationApi.ts | `leaseApplicationApi.createApplication()` |
| GET /api/lease-applications/my | ✅ | leaseApplicationApi.ts | `leaseApplicationApi.getMyApplications()` |
| GET /api/lease-applications/for-property/:id | ✅ | leaseApplicationApi.ts | `leaseApplicationApi.getApplicationsForProperty()` |
| PATCH /api/lease-applications/:id/approve | ✅ | leaseApplicationApi.ts | `leaseApplicationApi.approveApplication()` |
| PATCH /api/lease-applications/:id/reject | ✅ | leaseApplicationApi.ts | `leaseApplicationApi.rejectApplication()` |
| PATCH /api/lease-applications/:id/cancel | ✅ | leaseApplicationApi.ts | `leaseApplicationApi.cancelApplication()` |

---

## 7. Lease Agreements ✅ (11/11)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| POST /api/lease-agreements | ✅ | leaseApi.ts | `leaseApi.createLease()` - Now includes securityDeposit |
| GET /api/lease-agreements/:id | ✅ | leaseApi.ts | `leaseApi.getLeaseById()` |
| GET /api/lease-agreements/my | ✅ | leaseApi.ts | `leaseApi.getMyLeases()` |
| GET /api/lease-agreements/for-landlord | ✅ | leaseApi.ts | `leaseApi.getLeasesForLandlord()` |
| GET /api/lease-agreements/for-property/:id | ✅ | leaseApi.ts | `leaseApi.getLeasesForProperty()` |
| PATCH /api/lease-agreements/:id/contract | ✅ | leaseApi.ts | `leaseApi.attachContract()` |
| **PATCH /api/lease-agreements/:id/accept** | ✅ | leaseApi.ts | `leaseApi.acceptLease()` - Tenant accepts, status → AWAITING_PAYMENT |
| **PATCH /api/lease-agreements/:id/reject** | ✅ | leaseApi.ts | `leaseApi.rejectLease()` - Tenant rejects with reason |
| **GET /api/lease-agreements/:id/deadline-status** | ✅ | leaseApi.ts | `leaseApi.getDeadlineStatus()` - Check payment deadline |
| PATCH /api/lease-agreements/:id/activate | ✅ | leaseApi.ts | `leaseApi.activateLease()` - Manual activation (backup) |
| PATCH /api/lease-agreements/:id/terminate | ✅ | leaseApi.ts | `leaseApi.terminateLease()` |

### Lease Status Flow

```
PENDING → (tenant accepts) → AWAITING_PAYMENT → (tenant pays) → ACTIVE
    ↓                              ↓                              ↓
(tenant rejects)           (48h deadline expires)          (landlord terminates)
    ↓                              ↓                              ↓
TERMINATED                   TERMINATED                      TERMINATED
                                                            (or EXPIRED if end date)
```

---

## 8. Payments ✅ (5/5)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /api/payments/lease/:leaseId | ✅ | paymentApi.ts | `paymentApi.getPaymentsForLease()` - Get payment history |
| **GET /api/payments/lease/:leaseId/summary** | ✅ | paymentApi.ts | `paymentApi.getPaymentSummary()` - Get payment summary with deadline |
| **POST /api/payments/lease/:leaseId/acceptance-payment** | ✅ | paymentApi.ts | `paymentApi.makeAcceptancePayment()` - Pay deposit+rent, auto-activates lease |
| POST /api/payments/lease/:leaseId/pay | ✅ | paymentApi.ts | `paymentApi.tenantPay()` - Regular rent payment |
| POST /api/payments/lease/:leaseId | ✅ | paymentApi.ts | `paymentApi.logPayment()` - Landlord logs manual payment |

### Payment Types

```
RENT                   → Monthly rent payment
DEPOSIT                → Security deposit only
DEPOSIT_AND_FIRST_RENT → Combined deposit + first rent (for acceptance)
LATE_FEE               → Late payment fee
MAINTENANCE_FEE        → Maintenance charge
OTHER                  → Miscellaneous
```

---

## 9. Rent Schedule ✅ (5/5)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /api/leases/:id/rent-schedule | ✅ | paymentApi.ts | `paymentApi.getRentSchedule()` - Get full rent schedule |
| GET /api/leases/:id/rent-schedule/current | ✅ | paymentApi.ts | `paymentApi.getCurrentRentDue()` - Get current month due |
| POST /api/leases/:id/rent-schedule/:scheduleId/pay | ✅ | paymentApi.ts | `paymentApi.payRent()` - Pay specific month |
| PATCH /api/leases/:id/rent-schedule/:scheduleId/waive | ✅ | paymentApi.ts | `paymentApi.waiveRent()` - Landlord waives rent |
| GET /api/leases/rent-schedule/upcoming | ✅ | paymentApi.ts | `paymentApi.getUpcomingRentDues()` - Get all upcoming dues |

### Rent Status Flow

```
UPCOMING → DUE → PAID
            ↓
         OVERDUE → PAID
            ↓
         WAIVED (by landlord)
```

---

## 10. Conversations & Messages ✅ (8/8)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /api/conversations | ✅ | conversationsApi.ts | `conversationsApi.getConversations()` - Get all user conversations |
| GET /api/conversations/:id | ✅ | conversationsApi.ts | `conversationsApi.getConversation()` - Get conversation with messages |
| POST /api/conversations | ✅ | conversationsApi.ts | `conversationsApi.startConversation()` - Tenant starts new conversation |
| POST /api/conversations/:id/messages | ✅ | conversationsApi.ts | `conversationsApi.sendMessage()` - Send message in conversation |
| PATCH /api/conversations/:id/read | ✅ | conversationsApi.ts | `conversationsApi.markConversationAsRead()` - Mark messages as read |
| GET /api/conversations/property/:propertyId | ✅ | conversationsApi.ts | `conversationsApi.checkExistingConversation()` - Check if conversation exists |
| GET /api/conversations/unread-count | ✅ | conversationsApi.ts | `conversationsApi.getUnreadCount()` - Get global unread count |
| DELETE /api/conversations/:id | ✅ | conversationsApi.ts | `conversationsApi.deleteConversation()` - Soft delete conversation |

### Participant Roles

```
TENANT           → Started the conversation about a property
LANDLORD         → Property owner, receives tenant inquiries
PROPERTY_MANAGER → Assigned to manage the property, can participate in conversations
```

### Conversation Status Flow

```
ACTIVE → (user deletes) → ARCHIVED (soft delete, only for that user)
```

---

## 11. Notifications ❌ (0/5)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /notifications | ❌ | - | Get notifications |
| PUT /notifications/:id/read | ❌ | - | Mark as read |
| PUT /notifications/read-all | ❌ | - | Mark all as read |
| DELETE /notifications/:id | ❌ | - | Delete notification |
| GET /notifications/unread-count | ❌ | - | Get unread count |

---

## 12. Maintenance ❌ (0/20)

See [MAINTENANCE_API_SPECIFICATION.md](../../docs/MAINTENANCE_API_SPECIFICATION.md) for full details.

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| POST /api/maintenance | ❌ | - | Create request (tenant) |
| GET /api/maintenance/my | ❌ | - | Get tenant's requests |
| GET /api/maintenance/{id} | ❌ | - | Get request detail |
| PATCH /api/maintenance/{id}/cancel | ❌ | - | Cancel request (tenant) |
| POST /api/maintenance/{id}/comments | ❌ | - | Add comment |
| GET /api/maintenance/{id}/comments | ❌ | - | Get comments |
| POST /api/maintenance/{id}/images | ❌ | - | Upload image |
| GET /api/maintenance/for-landlord | ❌ | - | Get landlord's requests |
| GET /api/maintenance/for-manager | ❌ | - | Get manager's requests |
| GET /api/maintenance/summary | ❌ | - | Get statistics |
| PATCH /api/maintenance/{id}/accept | ❌ | - | Accept request |
| PATCH /api/maintenance/{id}/reject | ❌ | - | Reject request |
| PATCH /api/maintenance/{id}/start | ❌ | - | Start work |
| PATCH /api/maintenance/{id}/schedule | ❌ | - | Schedule work |
| PATCH /api/maintenance/{id}/resolve | ❌ | - | Mark resolved |
| PATCH /api/maintenance/{id}/reopen | ❌ | - | Reopen request |
| PATCH /api/maintenance/{id}/priority | ❌ | - | Update priority |
| GET /api/maintenance/{id}/timeline | ❌ | - | Get timeline |
| GET /api/maintenance/lease/{leaseId} | ❌ | - | Get by lease |
| GET /api/maintenance/property/{propertyId} | ❌ | - | Get by property |

---

## 12. Documents ❌ (0/3)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /documents | ❌ | - | Get user's documents |
| POST /documents/upload | ❌ | - | Upload document |
| DELETE /documents/:id | ❌ | - | Delete document |

---

## 13. Property Managers ❌ (0/3)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /properties/:id/managers | ❌ | - | Get managers for property |
| POST /properties/:id/managers | ❌ | - | Add manager |
| DELETE /properties/:id/managers/:managerId | ❌ | - | Remove manager |

---

## 14. Manager Dashboard ❌ (0/4)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /manager/properties | ❌ | - | Get managed properties |
| GET /manager/applications | ❌ | - | Get applications for managed properties |
| GET /manager/leases | ❌ | - | Get leases for managed properties |
| GET /manager/maintenance | ❌ | - | Get maintenance for managed properties |

---

## Implementation History

| Date | Changes |
|------|---------|
| 2026-01-03 | Initial tracking document created |
| - | Auth APIs (6): register, login, logout, change-password, forgot-password, perform-reset |
| - | User APIs (4): public profile, current profile, update profile, unlink ID document |
| - | File APIs (3): upload, delete, signed URL |
| - | Property APIs (8): search, get, featured, by landlord, create, update, delete, assign/remove manager |
| 2026-01-03 | Saved Properties APIs (4): get saved, save, unsave, check status |
| 2026-01-03 | Lease Applications APIs (6): create, get my, get for property, approve, reject, cancel |
| 2026-01-04 | Lease Agreements APIs (8): create, get by id, get my, get for landlord, get for property, attach contract, activate, terminate |
| 2026-01-04 | **Lease Flow Enhancement**: Added accept/reject/deadline-status (3 new endpoints), payments API (5 endpoints) |
| - | New lease statuses: AWAITING_PAYMENT |
| - | New lease fields: securityDeposit, acceptedAt, acceptanceDeadline, rejectedAt, rejectionReason, depositPaid, firstRentPaid, totalDueOnAcceptance, totalPaidOnAcceptance |
| 2026-01-04 | **Rent Schedule APIs (5)**: getRentSchedule, getCurrentRentDue, payRent, waiveRent, getUpcomingRentDues |
| - | Updated TenantPayments.tsx with rent schedule timeline view |
| - | Added RentPaymentModal component for paying specific months |
| 2026-01-04 | **Conversations/Messages APIs (8)**: Full implementation |
| - | Created conversationsApi.ts with all endpoints |
| - | Updated TenantMessages, LandlordMessages, PropertyManagerMessages components |
| - | Updated ContactLandlordModal to use real API with existing conversation check |
| - | All 3 roles (Tenant, Landlord, Property Manager) fully supported |
| 2026-01-05 | **WebSocket Integration**: Real-time messaging support |
| - | Created chatWebSocket.ts service (STOMP over SockJS) |
| - | Created useChatWebSocket.ts hook with auto-reconnect and REST fallback |
| - | Updated all 3 message pages with real-time message delivery |
| - | Added connection status indicator (Wifi/WifiOff icons) |
| - | WebSocket endpoints: `/app/chat.send/{id}`, `/app/chat.read/{id}`, `/topic/conversations/{id}` |

## Next Priority APIs to Implement

1. **Notifications** - Enable real-time notifications
2. **Maintenance** - Enable maintenance request workflow
3. **Documents** - Document management for leases
