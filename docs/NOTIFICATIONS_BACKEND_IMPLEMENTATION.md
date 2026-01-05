# Notifications Backend Implementation Guide

This document provides complete implementation details for the notification system.

---

## 1. Database Schema

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    related_entity_id BIGINT,
    related_entity_type VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(user_id, type);
```

---

## 2. Enums

```java
public enum NotificationType {
    APPLICATION,
    LEASE,
    MAINTENANCE,
    MESSAGE,
    PAYMENT,
    PROPERTY,
    SYSTEM
}

public enum RelatedEntityType {
    LEASE_APPLICATION,
    LEASE_AGREEMENT,
    MAINTENANCE_REQUEST,
    CONVERSATION,
    PAYMENT,
    PROPERTY,
    USER
}

public enum UserRole {
    TENANT,
    LANDLORD,
    PROPERTY_MANAGER
}
```

---

## 3. Role-Based Link Mapping

```java
public class NotificationLinkResolver {
    
    private static final Map<String, Map<UserRole, String>> ROLE_LINKS = Map.of(
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
        ),
        "properties", Map.of(
            UserRole.TENANT, "/dashboard/rentals",
            UserRole.LANDLORD, "/dashboard/landlord-properties",
            UserRole.PROPERTY_MANAGER, "/dashboard/pm-properties"
        )
    );
    
    public static String getLink(String feature, UserRole role) {
        return ROLE_LINKS.getOrDefault(feature, Map.of()).getOrDefault(role, "/dashboard");
    }
}
```

---

## 4. Notification Service

```java
@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate; // For WebSocket
    
    public Notification createNotification(
            Long userId,
            NotificationType type,
            String title,
            String description,
            String link,
            Long relatedEntityId,
            RelatedEntityType relatedEntityType
    ) {
        Notification notification = Notification.builder()
            .userId(userId)
            .type(type)
            .title(title)
            .description(description)
            .read(false)
            .link(link)
            .relatedEntityId(relatedEntityId)
            .relatedEntityType(relatedEntityType)
            .createdAt(LocalDateTime.now())
            .build();
        
        notification = notificationRepository.save(notification);
        
        // Send real-time via WebSocket
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            notification
        );
        
        return notification;
    }
    
    /**
     * Helper to get user's role for link resolution
     */
    private UserRole getUserRole(Long userId) {
        return userRepository.findById(userId)
            .map(User::getRole)
            .orElse(UserRole.TENANT);
    }
}
```

---

## 5. All Notification Triggers

### 5.1 APPLICATION Notifications

#### Trigger: Tenant Submits Application
**When:** `LeaseApplicationService.createApplication()`

```java
// In LeaseApplicationService.java

public LeaseApplication createApplication(LeaseApplicationRequest request, Long tenantId) {
    // ... create application logic ...
    LeaseApplication application = applicationRepository.save(newApplication);
    
    // Get property owner (landlord)
    Property property = propertyRepository.findById(request.getPropertyId()).orElseThrow();
    Long landlordId = property.getOwnerId();
    UserRole landlordRole = getUserRole(landlordId); // LANDLORD or PROPERTY_MANAGER
    
    // Get tenant name
    User tenant = userRepository.findById(tenantId).orElseThrow();
    
    notificationService.createNotification(
        landlordId,
        NotificationType.APPLICATION,
        "New Lease Application",
        tenant.getFirstName() + " " + tenant.getLastName() + " submitted an application for " + property.getTitle(),
        NotificationLinkResolver.getLink("applications", landlordRole),
        application.getId(),
        RelatedEntityType.LEASE_APPLICATION
    );
    
    return application;
}
```

#### Trigger: Landlord Approves Application
**When:** `LeaseApplicationService.approveApplication()`

```java
public LeaseApplication approveApplication(Long applicationId) {
    LeaseApplication application = applicationRepository.findById(applicationId).orElseThrow();
    application.setStatus(ApplicationStatus.APPROVED);
    application = applicationRepository.save(application);
    
    // Notify tenant
    Long tenantId = application.getTenantId();
    Property property = propertyRepository.findById(application.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        tenantId,
        NotificationType.APPLICATION,
        "Application Approved! 🎉",
        "Your application for " + property.getTitle() + " has been approved. A lease agreement will be sent shortly.",
        NotificationLinkResolver.getLink("applications", UserRole.TENANT),
        application.getId(),
        RelatedEntityType.LEASE_APPLICATION
    );
    
    return application;
}
```

#### Trigger: Landlord Rejects Application
**When:** `LeaseApplicationService.rejectApplication()`

```java
public LeaseApplication rejectApplication(Long applicationId, String reason) {
    LeaseApplication application = applicationRepository.findById(applicationId).orElseThrow();
    application.setStatus(ApplicationStatus.REJECTED);
    application.setRejectionReason(reason);
    application = applicationRepository.save(application);
    
    // Notify tenant
    Long tenantId = application.getTenantId();
    Property property = propertyRepository.findById(application.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        tenantId,
        NotificationType.APPLICATION,
        "Application Update",
        "Your application for " + property.getTitle() + " was not approved." + 
            (reason != null ? " Reason: " + reason : ""),
        NotificationLinkResolver.getLink("applications", UserRole.TENANT),
        application.getId(),
        RelatedEntityType.LEASE_APPLICATION
    );
    
    return application;
}
```

#### Trigger: Tenant Cancels Application
**When:** `LeaseApplicationService.cancelApplication()`

```java
public LeaseApplication cancelApplication(Long applicationId, Long tenantId) {
    LeaseApplication application = applicationRepository.findById(applicationId).orElseThrow();
    application.setStatus(ApplicationStatus.CANCELLED);
    application = applicationRepository.save(application);
    
    // Notify landlord
    Property property = propertyRepository.findById(application.getPropertyId()).orElseThrow();
    Long landlordId = property.getOwnerId();
    UserRole landlordRole = getUserRole(landlordId);
    User tenant = userRepository.findById(tenantId).orElseThrow();
    
    notificationService.createNotification(
        landlordId,
        NotificationType.APPLICATION,
        "Application Withdrawn",
        tenant.getFirstName() + " " + tenant.getLastName() + " withdrew their application for " + property.getTitle(),
        NotificationLinkResolver.getLink("applications", landlordRole),
        application.getId(),
        RelatedEntityType.LEASE_APPLICATION
    );
    
    return application;
}
```

---

### 5.2 LEASE Notifications

#### Trigger: Landlord Creates Lease Agreement
**When:** `LeaseService.createLease()`

```java
public Lease createLease(CreateLeaseRequest request, Long landlordId) {
    // ... create lease logic ...
    Lease lease = leaseRepository.save(newLease);
    
    // Notify tenant
    Long tenantId = request.getTenantId();
    Property property = propertyRepository.findById(request.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        tenantId,
        NotificationType.LEASE,
        "New Lease Agreement",
        "You have received a lease agreement for " + property.getTitle() + ". Please review and respond within the deadline.",
        NotificationLinkResolver.getLink("leases", UserRole.TENANT),
        lease.getId(),
        RelatedEntityType.LEASE_AGREEMENT
    );
    
    return lease;
}
```

#### Trigger: Tenant Accepts Lease
**When:** `LeaseService.acceptLease()`

```java
public Lease acceptLease(Long leaseId, Long tenantId) {
    Lease lease = leaseRepository.findById(leaseId).orElseThrow();
    lease.setStatus(LeaseStatus.PENDING_PAYMENT);
    lease = leaseRepository.save(lease);
    
    // Notify landlord
    Long landlordId = lease.getLandlordId();
    UserRole landlordRole = getUserRole(landlordId);
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    User tenant = userRepository.findById(tenantId).orElseThrow();
    
    notificationService.createNotification(
        landlordId,
        NotificationType.LEASE,
        "Lease Accepted",
        tenant.getFirstName() + " " + tenant.getLastName() + " accepted the lease for " + property.getTitle() + ". Awaiting payment.",
        NotificationLinkResolver.getLink("leases", landlordRole),
        lease.getId(),
        RelatedEntityType.LEASE_AGREEMENT
    );
    
    return lease;
}
```

#### Trigger: Tenant Rejects Lease
**When:** `LeaseService.rejectLease()`

```java
public Lease rejectLease(Long leaseId, Long tenantId, String reason) {
    Lease lease = leaseRepository.findById(leaseId).orElseThrow();
    lease.setStatus(LeaseStatus.REJECTED);
    lease.setRejectionReason(reason);
    lease = leaseRepository.save(lease);
    
    // Notify landlord
    Long landlordId = lease.getLandlordId();
    UserRole landlordRole = getUserRole(landlordId);
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    User tenant = userRepository.findById(tenantId).orElseThrow();
    
    notificationService.createNotification(
        landlordId,
        NotificationType.LEASE,
        "Lease Rejected",
        tenant.getFirstName() + " " + tenant.getLastName() + " rejected the lease for " + property.getTitle() + 
            (reason != null ? ". Reason: " + reason : ""),
        NotificationLinkResolver.getLink("leases", landlordRole),
        lease.getId(),
        RelatedEntityType.LEASE_AGREEMENT
    );
    
    return lease;
}
```

#### Trigger: Lease Activated (After Payment)
**When:** `LeaseService.activateLease()` or `PaymentService` after successful payment

```java
public Lease activateLease(Long leaseId) {
    Lease lease = leaseRepository.findById(leaseId).orElseThrow();
    lease.setStatus(LeaseStatus.ACTIVE);
    lease = leaseRepository.save(lease);
    
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    
    // Notify tenant
    notificationService.createNotification(
        lease.getTenantId(),
        NotificationType.LEASE,
        "Lease Now Active! 🎉",
        "Your lease for " + property.getTitle() + " is now active. Welcome to your new home!",
        NotificationLinkResolver.getLink("leases", UserRole.TENANT),
        lease.getId(),
        RelatedEntityType.LEASE_AGREEMENT
    );
    
    // Notify landlord
    Long landlordId = lease.getLandlordId();
    UserRole landlordRole = getUserRole(landlordId);
    User tenant = userRepository.findById(lease.getTenantId()).orElseThrow();
    
    notificationService.createNotification(
        landlordId,
        NotificationType.LEASE,
        "Lease Activated",
        "The lease for " + property.getTitle() + " with " + tenant.getFirstName() + " " + tenant.getLastName() + " is now active.",
        NotificationLinkResolver.getLink("leases", landlordRole),
        lease.getId(),
        RelatedEntityType.LEASE_AGREEMENT
    );
    
    return lease;
}
```

#### Trigger: Lease Terminated
**When:** `LeaseService.terminateLease()`

```java
public Lease terminateLease(Long leaseId, Long initiatorId) {
    Lease lease = leaseRepository.findById(leaseId).orElseThrow();
    lease.setStatus(LeaseStatus.TERMINATED);
    lease = leaseRepository.save(lease);
    
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    User initiator = userRepository.findById(initiatorId).orElseThrow();
    
    // Determine who to notify (the other party)
    boolean initiatorIsLandlord = initiatorId.equals(lease.getLandlordId());
    
    if (initiatorIsLandlord) {
        // Notify tenant
        notificationService.createNotification(
            lease.getTenantId(),
            NotificationType.LEASE,
            "Lease Terminated",
            "Your lease for " + property.getTitle() + " has been terminated by the landlord.",
            NotificationLinkResolver.getLink("leases", UserRole.TENANT),
            lease.getId(),
            RelatedEntityType.LEASE_AGREEMENT
        );
    } else {
        // Notify landlord
        Long landlordId = lease.getLandlordId();
        UserRole landlordRole = getUserRole(landlordId);
        
        notificationService.createNotification(
            landlordId,
            NotificationType.LEASE,
            "Lease Terminated",
            initiator.getFirstName() + " " + initiator.getLastName() + " terminated the lease for " + property.getTitle(),
            NotificationLinkResolver.getLink("leases", landlordRole),
            lease.getId(),
            RelatedEntityType.LEASE_AGREEMENT
        );
    }
    
    return lease;
}
```

#### Trigger: Lease Expiring Soon (Scheduled Job)
**When:** Daily scheduled task checks for leases expiring in 30/7/1 days

```java
@Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM
public void checkExpiringLeases() {
    LocalDate today = LocalDate.now();
    List<Integer> daysBeforeExpiry = List.of(30, 7, 1);
    
    for (Integer days : daysBeforeExpiry) {
        LocalDate targetDate = today.plusDays(days);
        List<Lease> expiringLeases = leaseRepository.findByEndDateAndStatus(targetDate, LeaseStatus.ACTIVE);
        
        for (Lease lease : expiringLeases) {
            Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
            
            // Notify tenant
            notificationService.createNotification(
                lease.getTenantId(),
                NotificationType.LEASE,
                "Lease Expiring in " + days + " Day" + (days > 1 ? "s" : ""),
                "Your lease for " + property.getTitle() + " will expire on " + lease.getEndDate() + ".",
                NotificationLinkResolver.getLink("leases", UserRole.TENANT),
                lease.getId(),
                RelatedEntityType.LEASE_AGREEMENT
            );
            
            // Notify landlord
            Long landlordId = lease.getLandlordId();
            UserRole landlordRole = getUserRole(landlordId);
            User tenant = userRepository.findById(lease.getTenantId()).orElseThrow();
            
            notificationService.createNotification(
                landlordId,
                NotificationType.LEASE,
                "Lease Expiring in " + days + " Day" + (days > 1 ? "s" : ""),
                "Lease for " + property.getTitle() + " with " + tenant.getFirstName() + " " + tenant.getLastName() + 
                    " expires on " + lease.getEndDate() + ".",
                NotificationLinkResolver.getLink("leases", landlordRole),
                lease.getId(),
                RelatedEntityType.LEASE_AGREEMENT
            );
        }
    }
}
```

---

### 5.3 PAYMENT Notifications

#### Trigger: Tenant Makes Acceptance Payment (Deposit + First Month)
**When:** `PaymentService.makeAcceptancePayment()`

```java
public Payment makeAcceptancePayment(Long leaseId, AcceptancePaymentRequest request, Long tenantId) {
    // ... process payment logic ...
    Payment payment = paymentRepository.save(newPayment);
    
    Lease lease = leaseRepository.findById(leaseId).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    User tenant = userRepository.findById(tenantId).orElseThrow();
    
    // Notify landlord
    Long landlordId = lease.getLandlordId();
    UserRole landlordRole = getUserRole(landlordId);
    
    notificationService.createNotification(
        landlordId,
        NotificationType.PAYMENT,
        "Payment Received - $" + payment.getAmount(),
        tenant.getFirstName() + " " + tenant.getLastName() + " paid deposit and first month rent for " + property.getTitle(),
        NotificationLinkResolver.getLink("payments", landlordRole),
        payment.getId(),
        RelatedEntityType.PAYMENT
    );
    
    // Notify tenant (confirmation)
    notificationService.createNotification(
        tenantId,
        NotificationType.PAYMENT,
        "Payment Successful",
        "Your payment of $" + payment.getAmount() + " for " + property.getTitle() + " was successful.",
        NotificationLinkResolver.getLink("payments", UserRole.TENANT),
        payment.getId(),
        RelatedEntityType.PAYMENT
    );
    
    // Activate the lease
    leaseService.activateLease(leaseId);
    
    return payment;
}
```

#### Trigger: Tenant Pays Monthly Rent
**When:** `PaymentService.payRent()`

```java
public Payment payRent(Long leaseId, Long scheduleId, PayRentRequest request, Long tenantId) {
    // ... process payment logic ...
    Payment payment = paymentRepository.save(newPayment);
    
    Lease lease = leaseRepository.findById(leaseId).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    User tenant = userRepository.findById(tenantId).orElseThrow();
    RentScheduleItem schedule = rentScheduleRepository.findById(scheduleId).orElseThrow();
    
    // Notify landlord
    Long landlordId = lease.getLandlordId();
    UserRole landlordRole = getUserRole(landlordId);
    
    String periodLabel = schedule.getPeriodStart().getMonth() + " " + schedule.getPeriodStart().getYear();
    
    notificationService.createNotification(
        landlordId,
        NotificationType.PAYMENT,
        "Rent Payment Received - $" + payment.getAmount(),
        tenant.getFirstName() + " " + tenant.getLastName() + " paid " + periodLabel + " rent for " + property.getTitle(),
        NotificationLinkResolver.getLink("payments", landlordRole),
        payment.getId(),
        RelatedEntityType.PAYMENT
    );
    
    // Notify tenant (confirmation)
    notificationService.createNotification(
        tenantId,
        NotificationType.PAYMENT,
        "Rent Payment Confirmed",
        "Your " + periodLabel + " rent payment of $" + payment.getAmount() + " for " + property.getTitle() + " was successful.",
        NotificationLinkResolver.getLink("payments", UserRole.TENANT),
        payment.getId(),
        RelatedEntityType.PAYMENT
    );
    
    return payment;
}
```

#### Trigger: Rent Due Reminder (Scheduled Job)
**When:** 3 days before rent due date

```java
@Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM
public void sendRentDueReminders() {
    LocalDate reminderDate = LocalDate.now().plusDays(3);
    List<RentScheduleItem> upcomingDues = rentScheduleRepository.findByDueDateAndStatus(
        reminderDate, RentStatus.PENDING
    );
    
    for (RentScheduleItem schedule : upcomingDues) {
        Lease lease = leaseRepository.findById(schedule.getLeaseId()).orElseThrow();
        Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
        
        notificationService.createNotification(
            lease.getTenantId(),
            NotificationType.PAYMENT,
            "Rent Due in 3 Days",
            "Your rent of $" + schedule.getAmount() + " for " + property.getTitle() + " is due on " + schedule.getDueDate(),
            NotificationLinkResolver.getLink("payments", UserRole.TENANT),
            schedule.getId(),
            RelatedEntityType.PAYMENT
        );
    }
}
```

#### Trigger: Rent Overdue (Scheduled Job)
**When:** Day after rent due date

```java
@Scheduled(cron = "0 0 10 * * *") // Daily at 10 AM
public void checkOverdueRent() {
    LocalDate yesterday = LocalDate.now().minusDays(1);
    List<RentScheduleItem> overdueItems = rentScheduleRepository.findByDueDateBeforeAndStatus(
        yesterday, RentStatus.PENDING
    );
    
    for (RentScheduleItem schedule : overdueItems) {
        schedule.setStatus(RentStatus.OVERDUE);
        rentScheduleRepository.save(schedule);
        
        Lease lease = leaseRepository.findById(schedule.getLeaseId()).orElseThrow();
        Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
        User tenant = userRepository.findById(lease.getTenantId()).orElseThrow();
        
        // Notify tenant
        notificationService.createNotification(
            lease.getTenantId(),
            NotificationType.PAYMENT,
            "⚠️ Rent Overdue",
            "Your rent of $" + schedule.getAmount() + " for " + property.getTitle() + " is overdue. Please pay immediately.",
            NotificationLinkResolver.getLink("payments", UserRole.TENANT),
            schedule.getId(),
            RelatedEntityType.PAYMENT
        );
        
        // Notify landlord
        Long landlordId = lease.getLandlordId();
        UserRole landlordRole = getUserRole(landlordId);
        
        notificationService.createNotification(
            landlordId,
            NotificationType.PAYMENT,
            "Rent Overdue Notice",
            tenant.getFirstName() + " " + tenant.getLastName() + "'s rent for " + property.getTitle() + " is now overdue.",
            NotificationLinkResolver.getLink("payments", landlordRole),
            schedule.getId(),
            RelatedEntityType.PAYMENT
        );
    }
}
```

---

### 5.4 MAINTENANCE Notifications

#### Trigger: Tenant Creates Maintenance Request
**When:** `MaintenanceService.createRequest()`

```java
public MaintenanceRequest createRequest(CreateMaintenanceRequest request, Long tenantId) {
    // ... create request logic ...
    MaintenanceRequest maintenanceRequest = maintenanceRepository.save(newRequest);
    
    Lease lease = leaseRepository.findById(request.getLeaseId()).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    User tenant = userRepository.findById(tenantId).orElseThrow();
    
    // Notify landlord
    Long landlordId = property.getOwnerId();
    UserRole landlordRole = getUserRole(landlordId);
    
    notificationService.createNotification(
        landlordId,
        NotificationType.MAINTENANCE,
        "New Maintenance Request - " + request.getPriority(),
        tenant.getFirstName() + " " + tenant.getLastName() + " submitted a " + request.getPriority().toLowerCase() + 
            " priority request for " + property.getTitle() + ": " + request.getTitle(),
        NotificationLinkResolver.getLink("maintenance", landlordRole),
        maintenanceRequest.getId(),
        RelatedEntityType.MAINTENANCE_REQUEST
    );
    
    return maintenanceRequest;
}
```

#### Trigger: Landlord Accepts Maintenance Request
**When:** `MaintenanceService.acceptRequest()`

```java
public MaintenanceRequest acceptRequest(Long requestId, Long landlordId) {
    MaintenanceRequest request = maintenanceRepository.findById(requestId).orElseThrow();
    request.setStatus(MaintenanceStatus.ACCEPTED);
    request = maintenanceRepository.save(request);
    
    Lease lease = leaseRepository.findById(request.getLeaseId()).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        lease.getTenantId(),
        NotificationType.MAINTENANCE,
        "Maintenance Request Accepted",
        "Your maintenance request for " + property.getTitle() + " (" + request.getTitle() + ") has been accepted.",
        NotificationLinkResolver.getLink("maintenance", UserRole.TENANT),
        request.getId(),
        RelatedEntityType.MAINTENANCE_REQUEST
    );
    
    return request;
}
```

#### Trigger: Landlord Schedules Maintenance
**When:** `MaintenanceService.scheduleRequest()`

```java
public MaintenanceRequest scheduleRequest(Long requestId, ScheduleMaintenanceRequest scheduleData) {
    MaintenanceRequest request = maintenanceRepository.findById(requestId).orElseThrow();
    request.setStatus(MaintenanceStatus.SCHEDULED);
    request.setScheduledDate(scheduleData.getScheduledDate());
    request = maintenanceRepository.save(request);
    
    Lease lease = leaseRepository.findById(request.getLeaseId()).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        lease.getTenantId(),
        NotificationType.MAINTENANCE,
        "Maintenance Scheduled",
        "Your maintenance request for " + property.getTitle() + " (" + request.getTitle() + ") is scheduled for " + 
            scheduleData.getScheduledDate() + ".",
        NotificationLinkResolver.getLink("maintenance", UserRole.TENANT),
        request.getId(),
        RelatedEntityType.MAINTENANCE_REQUEST
    );
    
    return request;
}
```

#### Trigger: Maintenance Started
**When:** `MaintenanceService.startWork()`

```java
public MaintenanceRequest startWork(Long requestId) {
    MaintenanceRequest request = maintenanceRepository.findById(requestId).orElseThrow();
    request.setStatus(MaintenanceStatus.IN_PROGRESS);
    request = maintenanceRepository.save(request);
    
    Lease lease = leaseRepository.findById(request.getLeaseId()).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        lease.getTenantId(),
        NotificationType.MAINTENANCE,
        "Maintenance In Progress",
        "Work has started on your maintenance request for " + property.getTitle() + " (" + request.getTitle() + ").",
        NotificationLinkResolver.getLink("maintenance", UserRole.TENANT),
        request.getId(),
        RelatedEntityType.MAINTENANCE_REQUEST
    );
    
    return request;
}
```

#### Trigger: Maintenance Resolved
**When:** `MaintenanceService.resolveRequest()`

```java
public MaintenanceRequest resolveRequest(Long requestId, String resolution) {
    MaintenanceRequest request = maintenanceRepository.findById(requestId).orElseThrow();
    request.setStatus(MaintenanceStatus.RESOLVED);
    request.setResolution(resolution);
    request = maintenanceRepository.save(request);
    
    Lease lease = leaseRepository.findById(request.getLeaseId()).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        lease.getTenantId(),
        NotificationType.MAINTENANCE,
        "Maintenance Resolved ✓",
        "Your maintenance request for " + property.getTitle() + " (" + request.getTitle() + ") has been resolved.",
        NotificationLinkResolver.getLink("maintenance", UserRole.TENANT),
        request.getId(),
        RelatedEntityType.MAINTENANCE_REQUEST
    );
    
    return request;
}
```

#### Trigger: Maintenance Rejected
**When:** `MaintenanceService.rejectRequest()`

```java
public MaintenanceRequest rejectRequest(Long requestId, String reason) {
    MaintenanceRequest request = maintenanceRepository.findById(requestId).orElseThrow();
    request.setStatus(MaintenanceStatus.REJECTED);
    request.setRejectionReason(reason);
    request = maintenanceRepository.save(request);
    
    Lease lease = leaseRepository.findById(request.getLeaseId()).orElseThrow();
    Property property = propertyRepository.findById(lease.getPropertyId()).orElseThrow();
    
    notificationService.createNotification(
        lease.getTenantId(),
        NotificationType.MAINTENANCE,
        "Maintenance Request Declined",
        "Your maintenance request for " + property.getTitle() + " (" + request.getTitle() + ") was declined." +
            (reason != null ? " Reason: " + reason : ""),
        NotificationLinkResolver.getLink("maintenance", UserRole.TENANT),
        request.getId(),
        RelatedEntityType.MAINTENANCE_REQUEST
    );
    
    return request;
}
```

---

### 5.5 MESSAGE Notifications

#### Trigger: New Message Received
**When:** `MessageService.sendMessage()` or WebSocket message handler

```java
public Message sendMessage(Long conversationId, SendMessageRequest request, Long senderId) {
    // ... save message logic ...
    Message message = messageRepository.save(newMessage);
    
    Conversation conversation = conversationRepository.findById(conversationId).orElseThrow();
    User sender = userRepository.findById(senderId).orElseThrow();
    
    // Get all participants except sender
    List<Long> recipientIds = conversation.getParticipantIds().stream()
        .filter(id -> !id.equals(senderId))
        .toList();
    
    for (Long recipientId : recipientIds) {
        UserRole recipientRole = getUserRole(recipientId);
        
        notificationService.createNotification(
            recipientId,
            NotificationType.MESSAGE,
            "New Message from " + sender.getFirstName(),
            truncateMessage(message.getContent(), 100),
            NotificationLinkResolver.getLink("messages", recipientRole),
            conversation.getId(),
            RelatedEntityType.CONVERSATION
        );
    }
    
    return message;
}

private String truncateMessage(String content, int maxLength) {
    if (content.length() <= maxLength) return content;
    return content.substring(0, maxLength - 3) + "...";
}
```

---

### 5.6 PROPERTY Notifications

#### Trigger: Saved Property Becomes Available
**When:** `PropertyService.updateProperty()` when status changes to AVAILABLE

```java
public Property updateProperty(Long propertyId, UpdatePropertyRequest request) {
    Property property = propertyRepository.findById(propertyId).orElseThrow();
    PropertyStatus oldStatus = property.getStatus();
    
    // ... update property logic ...
    property = propertyRepository.save(property);
    
    // Check if property just became available
    if (oldStatus != PropertyStatus.AVAILABLE && property.getStatus() == PropertyStatus.AVAILABLE) {
        // Notify users who saved this property
        List<SavedProperty> savedBy = savedPropertyRepository.findByPropertyId(propertyId);
        
        for (SavedProperty saved : savedBy) {
            notificationService.createNotification(
                saved.getUserId(),
                NotificationType.PROPERTY,
                "Saved Property Now Available!",
                property.getTitle() + " is now available for rent.",
                "/properties/" + property.getId(),
                property.getId(),
                RelatedEntityType.PROPERTY
            );
        }
    }
    
    return property;
}
```

#### Trigger: Property Price Changed
**When:** `PropertyService.updateProperty()` when price changes

```java
// Add to updateProperty method
if (!oldPrice.equals(property.getPrice())) {
    List<SavedProperty> savedBy = savedPropertyRepository.findByPropertyId(propertyId);
    
    for (SavedProperty saved : savedBy) {
        String priceChange = property.getPrice() < oldPrice ? "decreased" : "increased";
        
        notificationService.createNotification(
            saved.getUserId(),
            NotificationType.PROPERTY,
            "Price Update on Saved Property",
            property.getTitle() + " price " + priceChange + " to $" + property.getPrice() + "/month.",
            "/properties/" + property.getId(),
            property.getId(),
            RelatedEntityType.PROPERTY
        );
    }
}
```

---

### 5.7 SYSTEM Notifications

#### Trigger: Welcome New User
**When:** `AuthService.register()`

```java
public User register(RegisterRequest request) {
    // ... create user logic ...
    User user = userRepository.save(newUser);
    
    notificationService.createNotification(
        user.getId(),
        NotificationType.SYSTEM,
        "Welcome to RentEase! 🎉",
        "Your account has been created successfully. Start exploring properties or list your own!",
        "/dashboard",
        user.getId(),
        RelatedEntityType.USER
    );
    
    return user;
}
```

#### Trigger: Password Changed
**When:** `UserService.changePassword()`

```java
public void changePassword(Long userId, ChangePasswordRequest request) {
    // ... change password logic ...
    
    notificationService.createNotification(
        userId,
        NotificationType.SYSTEM,
        "Password Changed",
        "Your password was changed successfully. If you didn't make this change, contact support immediately.",
        "/dashboard/profile",
        userId,
        RelatedEntityType.USER
    );
}
```

#### Trigger: Email Verified
**When:** `AuthService.verifyEmail()`

```java
public void verifyEmail(String token) {
    // ... verify email logic ...
    User user = userRepository.findByVerificationToken(token).orElseThrow();
    user.setEmailVerified(true);
    userRepository.save(user);
    
    notificationService.createNotification(
        user.getId(),
        NotificationType.SYSTEM,
        "Email Verified ✓",
        "Your email address has been verified successfully.",
        "/dashboard",
        user.getId(),
        RelatedEntityType.USER
    );
}
```

---

## 6. WebSocket Configuration

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue", "/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS();
    }
}
```

---

## 7. Complete Notification Triggers Summary

| # | Event | Type | Recipients | Link Feature |
|---|-------|------|------------|--------------|
| 1 | Application submitted | APPLICATION | Landlord/PM | applications |
| 2 | Application approved | APPLICATION | Tenant | applications |
| 3 | Application rejected | APPLICATION | Tenant | applications |
| 4 | Application cancelled | APPLICATION | Landlord/PM | applications |
| 5 | Lease created | LEASE | Tenant | leases |
| 6 | Lease accepted | LEASE | Landlord/PM | leases |
| 7 | Lease rejected | LEASE | Landlord/PM | leases |
| 8 | Lease activated | LEASE | Both | leases |
| 9 | Lease terminated | LEASE | Other party | leases |
| 10 | Lease expiring (30/7/1 days) | LEASE | Both | leases |
| 11 | Acceptance payment made | PAYMENT | Both | payments |
| 12 | Rent paid | PAYMENT | Both | payments |
| 13 | Rent due reminder (3 days) | PAYMENT | Tenant | payments |
| 14 | Rent overdue | PAYMENT | Both | payments |
| 15 | Maintenance request created | MAINTENANCE | Landlord/PM | maintenance |
| 16 | Maintenance accepted | MAINTENANCE | Tenant | maintenance |
| 17 | Maintenance scheduled | MAINTENANCE | Tenant | maintenance |
| 18 | Maintenance started | MAINTENANCE | Tenant | maintenance |
| 19 | Maintenance resolved | MAINTENANCE | Tenant | maintenance |
| 20 | Maintenance rejected | MAINTENANCE | Tenant | maintenance |
| 21 | New message | MESSAGE | Recipients | messages |
| 22 | Saved property available | PROPERTY | Tenant | /properties/{id} |
| 23 | Saved property price change | PROPERTY | Tenant | /properties/{id} |
| 24 | Welcome | SYSTEM | New user | /dashboard |
| 25 | Password changed | SYSTEM | User | profile |
| 26 | Email verified | SYSTEM | User | /dashboard |

---

## 8. Testing Checklist

- [ ] Application submitted → Landlord gets notification
- [ ] Application approved → Tenant gets notification  
- [ ] Application rejected → Tenant gets notification
- [ ] Lease created → Tenant gets notification
- [ ] Lease accepted → Landlord gets notification
- [ ] Lease rejected → Landlord gets notification
- [ ] Payment made → Both get notifications
- [ ] Maintenance request → Landlord gets notification
- [ ] Maintenance status changes → Tenant gets notifications
- [ ] New message → Recipient gets notification
- [ ] All links navigate to correct role-based pages
