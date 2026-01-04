import { api } from "./client";
import { API_ENDPOINTS } from "./config";
import { LeaseResponseDTO } from "./leaseApi";

// Payment Types
export type PaymentType = 'RENT' | 'DEPOSIT' | 'DEPOSIT_AND_FIRST_RENT' | 'LATE_FEE' | 'MAINTENANCE_FEE' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'OVERDUE' | 'REFUNDED';
export type RentStatus = 'UPCOMING' | 'DUE' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'WAIVED';

export interface PaymentResponseDTO {
  id: number;
  leaseId: number;
  payerName: string;
  amount: number;
  dueDate: string | null;
  paymentDate: string;
  paymentMethod: string | null;
  type: PaymentType;
  status: PaymentStatus;
  description: string | null;
}

export interface AcceptancePaymentRequestDTO {
  amount: number;
  paymentMethod?: string;
  description?: string;
}

export interface AcceptancePaymentResponseDTO {
  payment: PaymentResponseDTO;
  lease: LeaseResponseDTO;
}

export interface PaymentSummaryDTO {
  leaseId: number;
  status: string;
  securityDeposit: number;
  firstMonthRent: number;
  totalDue: number;
  securityDepositPaid: number;
  firstMonthRentPaid: number;
  totalPaid: number;
  remaining: number;
  deadline: string | null;
  hoursRemaining: number | null;
  isExpired: boolean;
}

export interface LogPaymentRequestDTO {
  amount: number;
  paymentDate: string;
  type: PaymentType;
  paymentMethod?: string;
  description?: string;
}

export interface TenantPayRequestDTO {
  amount: number;
  type: PaymentType;
  paymentMethod?: string;
  description?: string;
}

// Rent Schedule Types
export interface RentScheduleItemDTO {
  id: number;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  amountPaid: number;
  status: RentStatus;
  paidAt: string | null;
  paymentId: number | null;
  daysUntilDue: number | null;
  daysOverdue: number | null;
  gracePeriodEnds: string | null;
  lateFeeAmount: number | null;
  lateFeeApplied: boolean;
}

export interface RentScheduleDTO {
  leaseId: number;
  rentAmount: number;
  totalMonths: number;
  paidMonths: number;
  upcomingMonths: number;
  overdueMonths: number;
  schedule: RentScheduleItemDTO[];
}

export interface PayRentRequestDTO {
  amount: number;
  paymentMethod?: string;
}

export interface PayRentResponseDTO {
  rentSchedule: RentScheduleItemDTO;
  payment: PaymentResponseDTO;
}

export interface WaiveRentRequestDTO {
  reason: string;
}

export const paymentApi = {
  // Get payment history for a lease
  getPaymentsForLease: (leaseId: number): Promise<PaymentResponseDTO[]> => {
    return api.get<PaymentResponseDTO[]>(API_ENDPOINTS.PAYMENTS_FOR_LEASE(leaseId));
  },

  // Get payment summary for a lease
  getPaymentSummary: (leaseId: number): Promise<PaymentSummaryDTO> => {
    return api.get<PaymentSummaryDTO>(API_ENDPOINTS.PAYMENT_SUMMARY(leaseId));
  },

  // Tenant makes acceptance payment (deposit + first rent) - auto-activates lease
  makeAcceptancePayment: (leaseId: number, data: AcceptancePaymentRequestDTO): Promise<AcceptancePaymentResponseDTO> => {
    return api.post<AcceptancePaymentResponseDTO>(API_ENDPOINTS.PAYMENT_ACCEPTANCE(leaseId), data);
  },

  // Tenant makes regular payment
  tenantPay: (leaseId: number, data: TenantPayRequestDTO): Promise<PaymentResponseDTO> => {
    return api.post<PaymentResponseDTO>(API_ENDPOINTS.PAYMENT_TENANT_PAY(leaseId), data);
  },

  // Landlord logs a manual payment
  logPayment: (leaseId: number, data: LogPaymentRequestDTO): Promise<PaymentResponseDTO> => {
    return api.post<PaymentResponseDTO>(API_ENDPOINTS.PAYMENTS_FOR_LEASE(leaseId), data);
  },

  // ==================== Rent Schedule APIs ====================

  // Get full rent schedule for a lease
  getRentSchedule: (leaseId: number): Promise<RentScheduleDTO> => {
    return api.get<RentScheduleDTO>(API_ENDPOINTS.RENT_SCHEDULE(leaseId));
  },

  // Get current month's rent due
  getCurrentRentDue: (leaseId: number): Promise<RentScheduleItemDTO> => {
    return api.get<RentScheduleItemDTO>(API_ENDPOINTS.RENT_SCHEDULE_CURRENT(leaseId));
  },

  // Tenant pays specific month's rent
  payRent: (leaseId: number, scheduleId: number, data: PayRentRequestDTO): Promise<PayRentResponseDTO> => {
    return api.post<PayRentResponseDTO>(API_ENDPOINTS.RENT_SCHEDULE_PAY(leaseId, scheduleId), data);
  },

  // Landlord waives rent for a specific month
  waiveRent: (leaseId: number, scheduleId: number, data: WaiveRentRequestDTO): Promise<RentScheduleItemDTO> => {
    return api.patch<RentScheduleItemDTO>(API_ENDPOINTS.RENT_SCHEDULE_WAIVE(leaseId, scheduleId), data);
  },

  // Get all upcoming rent dues for tenant
  getUpcomingRentDues: (): Promise<RentScheduleItemDTO[]> => {
    return api.get<RentScheduleItemDTO[]>(API_ENDPOINTS.RENT_SCHEDULE_UPCOMING);
  },
};
