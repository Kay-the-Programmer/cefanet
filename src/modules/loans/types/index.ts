import { PaymentMethod } from '../../../shared/types/common';

export enum FundingType {
  LOAN = 'LOAN',
  GRANT = 'GRANT',
}

export enum DemographicGroup {
  YOUTH = 'YOUTH',
  WOMAN = 'WOMAN',
  MAN = 'MAN',
  PWD = 'PWD',
}

export enum BusinessSector {
  AGRICULTURE = 'AGRICULTURE',
  TRADE = 'TRADE',
  MANUFACTURING = 'MANUFACTURING',
  SERVICES = 'SERVICES',
  OTHER = 'OTHER',
}

/** FR-LOAN-002 full lifecycle */
export enum LoanApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PARTIALLY_DISBURSED = 'PARTIALLY_DISBURSED',
  FULLY_DISBURSED = 'FULLY_DISBURSED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  REJECTED = 'REJECTED',
}

export const LOAN_STATUS_FLOW: LoanApplicationStatus[] = [
  LoanApplicationStatus.APPLIED,
  LoanApplicationStatus.UNDER_REVIEW,
  LoanApplicationStatus.APPROVED,
  LoanApplicationStatus.PARTIALLY_DISBURSED,
  LoanApplicationStatus.FULLY_DISBURSED,
  LoanApplicationStatus.ACTIVE,
];

/** FR-LOAN-006: disaggregated jobs breakdown */
export interface JobsBreakdown {
  // by gender
  female: number;
  male: number;
  // by age group
  youth: number;   // 15–35
  adult: number;   // 36+
  // by disability
  pwd: number;
  nonPwd: number;
  // by employment type
  fullTime: number;
  partTime: number;
  seasonal: number;
  total: number;
}

export interface LoanGrantApplication {
  id: string;
  // Applicant info (FR-LOAN-001)
  applicantName: string;
  applicantNrc: string;
  applicantPhone: string;
  businessName: string;
  businessSector: BusinessSector;
  // Legacy beneficiary fields (kept for compatibility with monitoring service)
  beneficiaryId: string;
  fundingType: FundingType;
  amountRequested: number;
  amountApproved?: number;
  interestRate?: number;
  repaymentPeriod?: number;  // months
  monthlyInstallment?: number;  // auto-calculated
  purpose: string;
  status: LoanApplicationStatus;
  constituencyId: string;
  demographicGroup: DemographicGroup;
  submissionDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  expectedDisbursementDate?: string;
  disbursementReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  /** Optional FK to a scheduled installment if payment was applied against a specific row. */
  installmentId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export type InstallmentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';

/** Spec 5.4 `repayment_records`: per-installment schedule row. */
export interface RepaymentSchedule {
  id: string;
  loanId: string;
  installmentNumber: number;
  installmentDueDate: string;
  amountDue: number;
  amountPaid: number;
  paymentDate?: string;
  paymentReference?: string;
  status: InstallmentStatus;
}
