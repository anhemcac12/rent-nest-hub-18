# API Implementation Status Tracker

This file tracks which APIs have been implemented in the frontend and are connected to the backend.

**Last Updated:** 2026-01-03

---

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
| Leases | 0/7 | 7 | 0% |
| Conversations/Messages | 0/5 | 5 | 0% |
| Notifications | 0/5 | 5 | 0% |
| Maintenance | 0/3 | 3 | 0% |
| Payments | 0/2 | 2 | 0% |
| Documents | 0/3 | 3 | 0% |
| Property Managers | 0/3 | 3 | 0% |
| Manager Dashboard | 0/4 | 4 | 0% |
| **TOTAL** | **31/66** | **66** | **47%** |

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

## 7. Leases ❌ (0/7)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /leases | ❌ | - | Get user's leases |
| GET /landlord/leases | ❌ | - | Get landlord's leases |
| POST /landlord/leases | ❌ | - | Create lease |
| PUT /landlord/leases/:id/send | ❌ | - | Send lease to tenant |
| PUT /leases/:id/accept | ❌ | - | Accept lease (tenant) |
| PUT /leases/:id/reject | ❌ | - | Reject lease (tenant) |
| PUT /leases/:id/pay | ❌ | - | Process payment |

---

## 8. Conversations & Messages ❌ (0/5)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /conversations | ❌ | - | Get all conversations |
| GET /conversations/:id | ❌ | - | Get conversation with messages |
| POST /conversations | ❌ | - | Create conversation |
| POST /conversations/:id/messages | ❌ | - | Send message |
| GET /conversations/property/:propertyId | ❌ | - | Get/check property conversation |

---

## 9. Notifications ❌ (0/5)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /notifications | ❌ | - | Get notifications |
| PUT /notifications/:id/read | ❌ | - | Mark as read |
| PUT /notifications/read-all | ❌ | - | Mark all as read |
| DELETE /notifications/:id | ❌ | - | Delete notification |
| GET /notifications/unread-count | ❌ | - | Get unread count |

---

## 10. Maintenance ❌ (0/3)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /maintenance | ❌ | - | Get maintenance requests |
| POST /maintenance | ❌ | - | Create request (tenant) |
| PUT /landlord/maintenance/:id/status | ❌ | - | Update status (landlord) |

---

## 11. Payments ❌ (0/2)

| Endpoint | Status | API File | Notes |
|----------|--------|----------|-------|
| GET /payments | ❌ | - | Get payment history |
| POST /payments/:id/pay | ❌ | - | Process payment |

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

---

## Next Priority APIs to Implement

1. **Leases** - Enable lease management
2. **Conversations/Messages** - Enable landlord-tenant communication
3. **Notifications** - Enable real-time notifications
4. **Maintenance** - Enable maintenance request workflow
5. **Payments** - Enable payment processing
