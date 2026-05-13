export enum VulnerabilityCategory {
  ORPHAN = 'ORPHAN',
  PWD = 'PWD',
  RURAL_STUDENT = 'RURAL_STUDENT',
  OTHER = 'OTHER',
}

export enum BursaryApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  DROPPED_OUT = 'DROPPED_OUT',
  REJECTED = 'REJECTED',
}

export const BURSARY_STATUS_FLOW: BursaryApplicationStatus[] = [
  BursaryApplicationStatus.DRAFT,
  BursaryApplicationStatus.SUBMITTED,
  BursaryApplicationStatus.UNDER_REVIEW,
  BursaryApplicationStatus.APPROVED,
  BursaryApplicationStatus.DISBURSED,
  BursaryApplicationStatus.ACTIVE,
];

export enum AcademicYear {
  YEAR_1 = 'YEAR_1',
  YEAR_2 = 'YEAR_2',
  YEAR_3 = 'YEAR_3',
  YEAR_4 = 'YEAR_4',
  YEAR_5 = 'YEAR_5',
  YEAR_6 = 'YEAR_6',
  YEAR_7 = 'YEAR_7',
}

export enum ContinuationStatus {
  CONTINUING = 'CONTINUING',
  GRADUATED = 'GRADUATED',
  DROPPED_OUT = 'DROPPED_OUT',
  ON_LEAVE = 'ON_LEAVE',
}

export enum PaymentMethodBursary {
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CASH = 'CASH',
}

export interface BursaryApplication {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  nrcNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  /** Spec 5.4: multi-select array. Single-value `vulnerabilityCategory` kept for back-compat. */
  vulnerabilityCategories?: VulnerabilityCategory[];
  vulnerabilityCategory: VulnerabilityCategory;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  schoolName: string;
  schoolType: string;
  academicYear: AcademicYear;
  courseOfStudy: string;
  requestedAmount: number;
  allocatedAmount?: number;
  status: BursaryApplicationStatus;
  constituencyId: string;
  quarter: number;
  fiscalYear: string;
  reviewNotes?: string;
  reviewedBy?: string;
  actionDate?: string;
  createdAt: string;
  updatedAt: string;
  /** The academic-year label this cohort started (e.g. "2025/2026"). Used for FR-BUR-005. */
  startFiscalYear: string;
}

export interface BursaryDisbursement {
  id: string;
  bursaryApplicationId: string;
  amount: number;
  expectedDisbursementDate?: string;
  disbursementDate: string;
  paymentMethod: PaymentMethodBursary;
  referenceNumber: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  bursaryApplicationId: string;
  academicYear: AcademicYear;
  fiscalYear: string;
  continuationStatus: ContinuationStatus;
  currentResult?: string;
  lastUpdated: string;
  remarks?: string;
}
