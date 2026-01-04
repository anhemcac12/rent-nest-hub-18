# Monthly Rent Tracking - Backend Specification

## Current Gap Analysis

The current API does **NOT** include automatic monthly rent tracking. Currently:
- Payments are logged manually (by landlord) or initiated by tenant
- No automatic generation of monthly rent dues
- No tracking of which months are paid vs unpaid

---

## Required Backend Features

### 1. Rent Schedule Generation

When a lease becomes `ACTIVE`, the backend should auto-generate rent schedule entries.

#### New Entity: `RentSchedule`

```java
@Entity
@Table(name = "rent_schedules")
public class RentSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "lease_id", nullable = false)
    private LeaseAgreement lease;
    
    @Column(nullable = false)
    private LocalDate dueDate;           // e.g., 2025-02-01
    
    @Column(nullable = false)
    private LocalDate periodStart;       // e.g., 2025-02-01
    
    @Column(nullable = false)
    private LocalDate periodEnd;         // e.g., 2025-02-28
    
    @Column(nullable = false)
    private BigDecimal amountDue;        // Rent amount
    
    @Column(nullable = false)
    private BigDecimal amountPaid = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentStatus status = RentStatus.UPCOMING;
    
    private LocalDateTime paidAt;
    
    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;             // Link to payment when paid
    
    private Integer gracePeriodDays = 5; // Days after due before late fee
    
    private BigDecimal lateFeeAmount;
    private boolean lateFeeApplied = false;
}

public enum RentStatus {
    UPCOMING,    // Future rent, not yet due
    DUE,         // Currently due (within grace period)
    PAID,        // Fully paid
    PARTIAL,     // Partially paid
    OVERDUE,     // Past grace period, unpaid
    WAIVED       // Landlord waived this payment
}
```

---

### 2. Auto-Generation Logic

#### On Lease Activation:
```java
public void generateRentSchedule(LeaseAgreement lease) {
    LocalDate current = lease.getStartDate();
    LocalDate end = lease.getEndDate();
    
    while (current.isBefore(end) || current.isEqual(end)) {
        RentSchedule schedule = new RentSchedule();
        schedule.setLease(lease);
        schedule.setDueDate(current);
        schedule.setPeriodStart(current);
        schedule.setPeriodEnd(current.plusMonths(1).minusDays(1));
        schedule.setAmountDue(lease.getRentAmount());
        schedule.setStatus(
            current.isAfter(LocalDate.now()) ? RentStatus.UPCOMING : RentStatus.DUE
        );
        rentScheduleRepository.save(schedule);
        
        current = current.plusMonths(1);
    }
}
```

---

### 3. New API Endpoints

#### 3.1 Get Rent Schedule for Lease

```http
GET /api/leases/{leaseId}/rent-schedule
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "leaseId": 5,
  "rentAmount": 2500.00,
  "totalMonths": 12,
  "paidMonths": 3,
  "upcomingMonths": 8,
  "overdueMonths": 1,
  "schedule": [
    {
      "id": 1,
      "dueDate": "2025-01-01",
      "periodStart": "2025-01-01",
      "periodEnd": "2025-01-31",
      "amountDue": 2500.00,
      "amountPaid": 2500.00,
      "status": "PAID",
      "paidAt": "2025-01-02T10:30:00",
      "paymentId": 15
    },
    {
      "id": 2,
      "dueDate": "2025-02-01",
      "periodStart": "2025-02-01",
      "periodEnd": "2025-02-28",
      "amountDue": 2500.00,
      "amountPaid": 0,
      "status": "DUE",
      "daysUntilDue": 5,
      "gracePeriodEnds": "2025-02-06"
    },
    {
      "id": 3,
      "dueDate": "2025-03-01",
      "periodStart": "2025-03-01",
      "periodEnd": "2025-03-31",
      "amountDue": 2500.00,
      "amountPaid": 0,
      "status": "UPCOMING"
    }
  ]
}
```

#### 3.2 Pay Specific Month's Rent

```http
POST /api/leases/{leaseId}/rent-schedule/{scheduleId}/pay
Authorization: Bearer {{tenant_jwt}}
Content-Type: application/json

{
  "amount": 2500.00,
  "paymentMethod": "Credit Card"
}
```

**Response:** `200 OK`
```json
{
  "rentSchedule": {
    "id": 2,
    "status": "PAID",
    "amountPaid": 2500.00,
    "paidAt": "2025-02-01T14:00:00"
  },
  "payment": {
    "id": 20,
    "amount": 2500.00,
    "type": "RENT",
    "status": "COMPLETED"
  }
}
```

#### 3.3 Get Current Month Due (Convenience)

```http
GET /api/leases/{leaseId}/rent-schedule/current
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "id": 2,
  "dueDate": "2025-02-01",
  "amountDue": 2500.00,
  "amountPaid": 0,
  "status": "DUE",
  "daysRemaining": 5,
  "isOverdue": false,
  "lateFeeAmount": null
}
```

#### 3.4 Landlord Waive Rent

```http
PATCH /api/leases/{leaseId}/rent-schedule/{scheduleId}/waive
Authorization: Bearer {{landlord_jwt}}
Content-Type: application/json

{
  "reason": "Tenant helped with property repairs"
}
```

---

### 4. Background Jobs

#### 4.1 Daily Status Update Job

```java
@Scheduled(cron = "0 0 1 * * *") // Run at 1 AM daily
public void updateRentStatuses() {
    LocalDate today = LocalDate.now();
    
    // Mark UPCOMING → DUE when due date arrives
    rentScheduleRepository.findByStatusAndDueDateLessThanEqual(
        RentStatus.UPCOMING, today
    ).forEach(schedule -> {
        schedule.setStatus(RentStatus.DUE);
        rentScheduleRepository.save(schedule);
        // Send notification to tenant
        notificationService.sendRentDueReminder(schedule);
    });
    
    // Mark DUE → OVERDUE when grace period expires
    rentScheduleRepository.findByStatusAndDueDateBefore(
        RentStatus.DUE, today.minusDays(5)
    ).forEach(schedule -> {
        schedule.setStatus(RentStatus.OVERDUE);
        if (schedule.getLateFeeAmount() != null && !schedule.isLateFeeApplied()) {
            schedule.setAmountDue(
                schedule.getAmountDue().add(schedule.getLateFeeAmount())
            );
            schedule.setLateFeeApplied(true);
        }
        rentScheduleRepository.save(schedule);
        // Send overdue notification
        notificationService.sendRentOverdueNotice(schedule);
    });
}
```

#### 4.2 Rent Reminder Notifications

```java
@Scheduled(cron = "0 0 9 * * *") // Run at 9 AM daily
public void sendRentReminders() {
    LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
    
    // Remind 3 days before due
    rentScheduleRepository.findByStatusAndDueDate(
        RentStatus.UPCOMING, threeDaysFromNow
    ).forEach(schedule -> {
        notificationService.sendRentReminderEmail(schedule, 3);
    });
    
    // Remind on due date
    rentScheduleRepository.findByStatusAndDueDate(
        RentStatus.DUE, LocalDate.now()
    ).forEach(schedule -> {
        notificationService.sendRentDueTodayEmail(schedule);
    });
}
```

---

### 5. TypeScript Interfaces (Frontend)

```typescript
interface RentScheduleItemDTO {
  id: number;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  amountPaid: number;
  status: 'UPCOMING' | 'DUE' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'WAIVED';
  paidAt: string | null;
  paymentId: number | null;
  daysUntilDue: number | null;
  daysOverdue: number | null;
  gracePeriodEnds: string | null;
  lateFeeAmount: number | null;
  lateFeeApplied: boolean;
}

interface RentScheduleDTO {
  leaseId: number;
  rentAmount: number;
  totalMonths: number;
  paidMonths: number;
  upcomingMonths: number;
  overdueMonths: number;
  schedule: RentScheduleItemDTO[];
}

interface PayRentRequestDTO {
  amount: number;
  paymentMethod?: string;
}

interface PayRentResponseDTO {
  rentSchedule: RentScheduleItemDTO;
  payment: PaymentResponseDTO;
}
```

---

### 6. Database Schema

```sql
CREATE TABLE rent_schedules (
    id BIGSERIAL PRIMARY KEY,
    lease_id BIGINT NOT NULL REFERENCES lease_agreements(id),
    due_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    paid_at TIMESTAMP,
    payment_id BIGINT REFERENCES payments(id),
    grace_period_days INTEGER DEFAULT 5,
    late_fee_amount DECIMAL(10,2),
    late_fee_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_lease_due_date UNIQUE(lease_id, due_date)
);

CREATE INDEX idx_rent_schedules_lease ON rent_schedules(lease_id);
CREATE INDEX idx_rent_schedules_status ON rent_schedules(status);
CREATE INDEX idx_rent_schedules_due_date ON rent_schedules(due_date);
```

---

### 7. API Endpoints Summary

| Method | Endpoint | Actor | Description |
|--------|----------|-------|-------------|
| GET | `/api/leases/{id}/rent-schedule` | All | Get full rent schedule |
| GET | `/api/leases/{id}/rent-schedule/current` | All | Get current month due |
| POST | `/api/leases/{id}/rent-schedule/{scheduleId}/pay` | Tenant | Pay specific month |
| PATCH | `/api/leases/{id}/rent-schedule/{scheduleId}/waive` | Landlord | Waive rent |
| GET | `/api/payments/tenant/upcoming` | Tenant | Get all upcoming rent dues |

---

### 8. Integration with Existing Payment API

When tenant pays via `/rent-schedule/{id}/pay`:
1. Create `Payment` record with type `RENT`
2. Update `RentSchedule.status` to `PAID`
3. Link `RentSchedule.paymentId` to new payment
4. Set `RentSchedule.paidAt` timestamp

This keeps the existing payment history intact while adding structured rent tracking.

---

## Summary

**What backend needs to implement:**
1. ✅ New `RentSchedule` entity and repository
2. ✅ Auto-generate schedule when lease becomes ACTIVE
3. ✅ New endpoints for rent schedule CRUD
4. ✅ Background job for status updates (UPCOMING → DUE → OVERDUE)
5. ✅ Background job for reminder notifications
6. ✅ Late fee calculation logic
7. ✅ Integration with existing Payment entity

Once implemented, the frontend can display a calendar/timeline view of rent payments with clear status indicators.
