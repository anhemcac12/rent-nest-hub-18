import { api } from "./client";
import { API_ENDPOINTS } from "./config";
import { LeaseResponseDTO } from "./leaseApi";

// Payment Types
export type PaymentType = 'RENT' | 'DEPOSIT' | 'DEPOSIT_AND_FIRST_RENT' | 'LATE_FEE' | 'MAINTENANCE_FEE' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'OVERDUE' | 'REFUNDED';

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
};
