# Monthly Rent Tracking - Backend Specification

Complete specification for implementing monthly rent schedule tracking.

---

## CRITICAL: Rent Period Calculation Rules

### ❌ WRONG: Calendar Month Approach
```
Lease starts: Jan 25, 2025
Month 1: January 2025 (Jan 1 - Jan 31) ← WRONG!
Month 2: February 2025 (Feb 1 - Feb 28)
```
**Problem**: If tenant moves in Jan 25, why pay for Jan 1-24?

### ✅ CORRECT: Rolling 30-Day Periods
```
Lease starts: Jan 25, 2025
Period 1: Jan 25 - Feb 23 (30 days)
Period 2: Feb 24 - Mar 25 (30 days)
Period 3: Mar 26 - Apr 24 (30 days)
... and so on
```

### Period Calculation Algorithm
```java
public List<RentSchedule> generateRentSchedule(Lease lease) {
    LocalDate periodStart = lease.getStartDate();
    LocalDate leaseEnd = lease.getEndDate();
    List<RentSchedule> schedule = new ArrayList<>();
    int periodNumber = 1;
    
    while (periodStart.isBefore(leaseEnd) || periodStart.isEqual(leaseEnd)) {
        LocalDate periodEnd = periodStart.plusDays(29); // 30 days inclusive
        
        // If this period extends past lease end, cap it
        if (periodEnd.isAfter(leaseEnd)) {
            periodEnd = leaseEnd;
        }
        
        RentSchedule entry = new RentSchedule();
        entry.setLeaseId(lease.getId());
        entry.setPeriodNumber(periodNumber);
        entry.setPeriodStart(periodStart);
        entry.setPeriodEnd(periodEnd);
        entry.setDueDate(periodStart); // Rent due on first day of period
        entry.setAmountDue(lease.getRentAmount());
        entry.setAmountPaid(BigDecimal.ZERO);
        
        // CRITICAL: First period is PAID via acceptance payment!
        if (periodNumber == 1) {
            entry.setStatus(RentStatus.PAID);
            entry.setAmountPaid(lease.getRentAmount());
            entry.setPaidAt(lease.getActivatedAt()); // Use activation timestamp
            // Link to acceptance payment
        } else {
            entry.setStatus(RentStatus.UPCOMING);
        }
        
        schedule.add(entry);
        
        // Move to next period
        periodStart = periodEnd.plusDays(1);
        periodNumber++;
    }
    
    return schedule;
}
```

### Example: 1-Year Lease Starting Jan 25, 2025

| Period | Start Date | End Date | Due Date | Status (Initial) |
|--------|------------|----------|----------|------------------|
| 1 | Jan 25, 2025 | Feb 23, 2025 | Jan 25, 2025 | **PAID** (acceptance) |
| 2 | Feb 24, 2025 | Mar 25, 2025 | Feb 24, 2025 | UPCOMING |
| 3 | Mar 26, 2025 | Apr 24, 2025 | Mar 26, 2025 | UPCOMING |
| 4 | Apr 25, 2025 | May 24, 2025 | Apr 25, 2025 | UPCOMING |
| 5 | May 25, 2025 | Jun 23, 2025 | May 25, 2025 | UPCOMING |
| 6 | Jun 24, 2025 | Jul 23, 2025 | Jun 24, 2025 | UPCOMING |
| 7 | Jul 24, 2025 | Aug 22, 2025 | Jul 24, 2025 | UPCOMING |
| 8 | Aug 23, 2025 | Sep 21, 2025 | Aug 23, 2025 | UPCOMING |
| 9 | Sep 22, 2025 | Oct 21, 2025 | Sep 22, 2025 | UPCOMING |
| 10 | Oct 22, 2025 | Nov 20, 2025 | Oct 22, 2025 | UPCOMING |
| 11 | Nov 21, 2025 | Dec 20, 2025 | Nov 21, 2025 | UPCOMING |
| 12 | Dec 21, 2025 | Jan 19, 2026 | Dec 21, 2025 | UPCOMING |

### First Month Payment Flow

```
1. Tenant accepts lease
   → Status: AWAITING_PAYMENT
   → totalDue = securityDeposit + rentAmount

2. Tenant pays acceptance payment ($5000)
   → Payment recorded with type: DEPOSIT_AND_FIRST_RENT
   → Lease status: ACTIVE
   → Generate rent schedule (12 entries)
   → Period 1 status: PAID (linked to acceptance payment)
   → Period 2-12 status: UPCOMING

3. On Feb 24 (Period 2 due date):
   → Background job updates Period 2: UPCOMING → DUE
   → Tenant gets notification
```

---

## Quick Reference

| Method | Endpoint | Actor | Description |
|--------|----------|-------|-------------|
| GET | `/api/leases/{id}/rent-schedule` | All | Get full rent schedule |
| GET | `/api/leases/{id}/rent-schedule/current` | All | Get current month due |
| POST | `/api/leases/{id}/rent-schedule/{scheduleId}/pay` | Tenant | Pay specific month |
| PATCH | `/api/leases/{id}/rent-schedule/{scheduleId}/waive` | Landlord | Waive rent |
| GET | `/api/leases/rent-schedule/upcoming` | Tenant | Get all upcoming dues |

---

## How It Works

1. **Auto-generation**: When a lease becomes `ACTIVE` (after tenant pays deposit + first rent), the system automatically generates rent entries for all months.

2. **Status Flow**:
   ```
   UPCOMING → DUE → PAID
              ↓
           OVERDUE → PAID
              ↓
           WAIVED (by landlord)
   ```

3. **First month handling**: The first month's rent is paid via the acceptance payment flow, so it starts as `PAID`.

---

## Data Structures

### RentScheduleDTO (Full Schedule)

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
      "paymentId": 15,
      "daysUntilDue": null,
      "daysOverdue": null,
      "gracePeriodEnds": null,
      "lateFeeAmount": null,
      "lateFeeApplied": false
    }
  ]
}
```

### RentScheduleItemDTO

```json
{
  "id": 2,
  "dueDate": "2025-02-01",
  "periodStart": "2025-02-01",
  "periodEnd": "2025-02-28",
  "amountDue": 2500.00,
  "amountPaid": 0,
  "status": "DUE",
  "paidAt": null,
  "paymentId": null,
  "daysUntilDue": 5,
  "daysOverdue": null,
  "gracePeriodEnds": "2025-02-06",
  "lateFeeAmount": null,
  "lateFeeApplied": false
}
```

### RentStatus Enum

```
UPCOMING → Future rent, not yet due
DUE      → Currently due (within grace period)
PAID     → Fully paid
PARTIAL  → Partially paid
OVERDUE  → Past grace period, unpaid
WAIVED   → Landlord waived this payment
```

---

## API Endpoints

### 1. Get Full Rent Schedule

```http
GET /api/leases/{leaseId}/rent-schedule
Authorization: Bearer {{token}}
```

**Response:** `200 OK`
```json
{
  "leaseId": 5,
  "rentAmount": 2500.00,
  "totalMonths": 12,
  "paidMonths": 1,
  "upcomingMonths": 10,
  "overdueMonths": 1,
  "schedule": [...]
}
```

---

### 2. Get Current Month Due

```http
GET /api/leases/{leaseId}/rent-schedule/current
Authorization: Bearer {{token}}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "dueDate": "2025-02-01",
  "amountDue": 2500.00,
  "amountPaid": 0,
  "status": "DUE",
  "daysUntilDue": 5,
  "gracePeriodEnds": "2025-02-06"
}
```

---

### 3. Tenant Pays Rent

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
    "amountDue": 2500.00,
    "amountPaid": 2500.00,
    "paidAt": "2025-02-01T14:00:00",
    "paymentId": 20
  },
  "payment": {
    "id": 20,
    "amount": 2500.00,
    "type": "RENT",
    "status": "COMPLETED"
  }
}
```

**Errors:**
- 400: "This rent period is already paid."
- 400: "Payment amount exceeds remaining due."
- 403: "You are not the tenant on this lease."

---

### 4. Landlord Waives Rent

```http
PATCH /api/leases/{leaseId}/rent-schedule/{scheduleId}/waive
Authorization: Bearer {{landlord_jwt}}
Content-Type: application/json

{
  "reason": "Tenant helped with property repairs"
}
```

**Response:** `200 OK`
```json
{
  "id": 3,
  "status": "WAIVED",
  "amountDue": 2500.00,
  "amountPaid": 2500.00
}
```

---

### 5. Get All Upcoming Dues (Tenant)

```http
GET /api/leases/rent-schedule/upcoming
Authorization: Bearer {{tenant_jwt}}
```

**Response:** `200 OK`
```json
[
  {
    "id": 2,
    "dueDate": "2025-02-01",
    "amountDue": 2500.00,
    "status": "DUE"
  }
]
```

---

## Required Backend Implementation

### 1. New Entity: `RentSchedule`

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
    private LocalDate dueDate;
    
    @Column(nullable = false)
    private LocalDate periodStart;
    
    @Column(nullable = false)
    private LocalDate periodEnd;
    
    @Column(nullable = false)
    private BigDecimal amountDue;
    
    @Column(nullable = false)
    private BigDecimal amountPaid = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentStatus status = RentStatus.UPCOMING;
    
    private LocalDateTime paidAt;
    
    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;
    
    private Integer gracePeriodDays = 5;
    private BigDecimal lateFeeAmount;
    private boolean lateFeeApplied = false;
}

public enum RentStatus {
    UPCOMING,
    DUE,
    PAID,
    PARTIAL,
    OVERDUE,
    WAIVED
}
```

---

### 2. Auto-Generation Logic

When a lease becomes `ACTIVE`:

```java
public void generateRentSchedule(LeaseAgreement lease) {
    LocalDate current = lease.getStartDate();
    LocalDate end = lease.getEndDate();
    boolean isFirstMonth = true;
    
    while (current.isBefore(end) || current.isEqual(end)) {
        RentSchedule schedule = new RentSchedule();
        schedule.setLease(lease);
        schedule.setDueDate(current);
        schedule.setPeriodStart(current);
        schedule.setPeriodEnd(current.plusMonths(1).minusDays(1));
        schedule.setAmountDue(lease.getRentAmount());
        
        if (isFirstMonth) {
            // First month is already paid via acceptance payment
            schedule.setStatus(RentStatus.PAID);
            schedule.setAmountPaid(lease.getRentAmount());
            schedule.setPaidAt(LocalDateTime.now());
            isFirstMonth = false;
        } else {
            schedule.setStatus(
                current.isAfter(LocalDate.now()) ? RentStatus.UPCOMING : RentStatus.DUE
            );
        }
        
        rentScheduleRepository.save(schedule);
        current = current.plusMonths(1);
    }
}
```

---

### 3. Background Jobs

#### Daily Status Update Job

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
        notificationService.sendRentDueReminder(schedule);
    });
    
    // Mark DUE → OVERDUE when grace period expires (5 days)
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
        notificationService.sendRentOverdueNotice(schedule);
    });
}
```

#### Rent Reminder Notifications

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

### 4. Database Schema

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

### 5. Integration with Payment System

When tenant pays via `/rent-schedule/{id}/pay`:

1. Validate lease status is ACTIVE
2. Validate rent schedule belongs to lease
3. Validate tenant is the payer
4. Validate payment amount doesn't exceed remaining due
5. Create `Payment` record with type `RENT`
6. Update `RentSchedule`:
   - Add to `amountPaid`
   - Set `status` to `PAID` (or `PARTIAL` if not fully paid)
   - Set `paidAt` timestamp
   - Link `paymentId` to new payment

---

## TypeScript Interfaces (Frontend)

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

interface WaiveRentRequestDTO {
  reason: string;
}
```

---

## Typical Flow

```
1. Lease becomes ACTIVE (via acceptance-payment)
   → System auto-generates 12 rent entries (for 1-year lease)
   → First month is already PAID (part of acceptance payment)

2. Each month:
   - Background job updates UPCOMING → DUE on due date
   - Background job updates DUE → OVERDUE after grace period
   - Tenant receives notifications

3. Tenant pays:
   GET /api/leases/{id}/rent-schedule/current
   → See what's due

   POST /api/leases/{id}/rent-schedule/{scheduleId}/pay
   → Pay the rent
   → Status: DUE → PAID

4. Landlord can view:
   GET /api/leases/{id}/rent-schedule
   → See full payment history and upcoming

5. If tenant can't pay, landlord can:
   PATCH /api/leases/{id}/rent-schedule/{scheduleId}/waive
   → Waive that month's rent
```

---

## Summary

**Backend needs to implement:**
1. ✅ New `RentSchedule` entity and repository
2. ✅ Auto-generate schedule when lease becomes ACTIVE
3. ✅ New endpoints for rent schedule CRUD
4. ✅ Background job for status updates (UPCOMING → DUE → OVERDUE)
5. ✅ Background job for reminder notifications
6. ✅ Late fee calculation logic
7. ✅ Integration with existing Payment entity
