import {
  User,
  UserRole,
  Constituency,
  Beneficiary,
  BeneficiaryType,
  AuditLog,
  BursaryApplication,
  BursaryApplicationStatus,
  BursaryDisbursement,
  PaymentMethodBursary,
  Gender,
  VulnerabilityCategory,
  AcademicYear,
  ContinuationStatus,
  StudentProgress,
  LoanGrantApplication,
  FundingType,
  LoanApplicationStatus,
  BusinessSector,
  LoanRepayment,
  PaymentMethod,
  BusinessMonitoring,
  DemographicGroup,
  AdministrativeCost,
  MonitoringVisit,
  CommunitySession,
  CitizenScorecard,
  QuarterlyReport,
  CommunityProject
} from '../types';

const storedConstituencies = JSON.parse(localStorage.getItem('cdf_constituencies') || '[]');

export const MOCK_CONSTITUENCIES: Constituency[] = [
  { id: 'c1', name: 'Lusaka Central', district: 'Lusaka', province: 'Lusaka', createdAt: '2020-01-01T00:00:00Z' },
  { id: 'c2', name: 'Munali', district: 'Lusaka', province: 'Lusaka', createdAt: '2020-01-01T00:00:00Z' },
  { id: 'c3', name: 'Kafue', district: 'Kafue', province: 'Lusaka', createdAt: '2020-01-01T00:00:00Z' },
  ...storedConstituencies
];

export const addConstituency = (c: Constituency) => {
  MOCK_CONSTITUENCIES.push(c);
  const stored = JSON.parse(localStorage.getItem('cdf_constituencies') || '[]');
  stored.push(c);
  localStorage.setItem('cdf_constituencies', JSON.stringify(stored));
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    firstName: 'Mwansa',
    lastName: 'Kabwe',
    email: 'm.kabwe@council.gov.zm',
    phone: '+260 97 123 4567',
    role: UserRole.COUNCIL_OFFICER,
    constituencyId: 'c1',
    isActive: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2026-05-06T09:30:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mwansa'
  },
  {
    id: 'u2',
    firstName: 'Sarah',
    lastName: 'Mulenga',
    email: 's.mulenga@finance.gov.zm',
    phone: '+260 96 555 1122',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: '2023-11-15T08:00:00Z',
    updatedAt: '2026-05-06T08:15:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: 'u3',
    firstName: 'Kelvin',
    lastName: 'Phiri',
    email: 'k.phiri@audit.gov.zm',
    phone: '+260 95 111 2222',
    role: UserRole.AUDITOR,
    isActive: true,
    createdAt: '2024-02-20T14:20:00Z',
    updatedAt: '2026-05-05T14:20:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kelvin'
  },
  {
    id: 'u4',
    firstName: 'Godfrey',
    lastName: 'Lunganyana',
    email: 'g.lunganyana@me.gov.zm',
    phone: '+260 97 123 0000',
    role: UserRole.ME_OFFICER,
    isActive: true,
    createdAt: '2024-05-01T08:00:00Z',
    updatedAt: '2026-05-01T08:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Godfrey'
  },
  {
    id: 'u5',
    firstName: 'Bwalya',
    lastName: 'Chungu',
    email: 'b.chungu@field.gov.zm',
    phone: '+260 96 222 3333',
    role: UserRole.FIELD_OFFICER,
    constituencyId: 'c1',
    isActive: true,
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bwalya'
  },
  {
    id: 'u6',
    firstName: 'Natasha',
    lastName: 'Banda',
    email: 'n.banda@finance.gov.zm',
    phone: '+260 97 555 4444',
    role: UserRole.FINANCE_OFFICER,
    constituencyId: 'c1',
    isActive: true,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2026-05-04T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Natasha'
  },
  {
    id: 'u7',
    firstName: 'John',
    lastName: 'Tembo',
    email: 'j.tembo@example.com',
    phone: '+260 95 666 5555',
    role: UserRole.BENEFICIARY,
    isActive: true,
    createdAt: '2024-04-01T12:00:00Z',
    updatedAt: '2026-05-02T12:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  {
    id: 'u8',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@transparency.org',
    phone: '+260 97 000 9999',
    role: UserRole.PUBLIC_USER,
    isActive: true,
    createdAt: '2024-04-10T13:00:00Z',
    updatedAt: '2026-05-01T13:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
  }
];

export const MOCK_USER = MOCK_USERS[0];

export const MOCK_BENEFICIARIES: Beneficiary[] = [
  {
    id: 'b1',
    name: 'Kabwata Youth Cooperative',
    type: BeneficiaryType.YOUTH_GROUP,
    registrationNumber: 'PACRA-12345',
    phone: '+260 97 123 4567',
    constituencyId: 'c1',
    createdAt: '2025-10-12T00:00:00Z'
  },
  {
    id: 'b2',
    name: 'Chilenje Women Group',
    type: BeneficiaryType.WOMEN_GROUP,
    registrationNumber: 'PACRA-22987',
    phone: '+260 97 555 8821',
    constituencyId: 'c1',
    createdAt: '2025-12-02T00:00:00Z'
  },
  {
    id: 'b3',
    name: 'Munali SME Hub',
    type: BeneficiaryType.SME,
    registrationNumber: 'PACRA-31456',
    phone: '+260 96 770 1234',
    constituencyId: 'c2',
    createdAt: '2026-03-04T00:00:00Z'
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l1',
    userId: 'u1',
    action: 'CREATE_BURSARY',
    entityType: 'BURSARY',
    entityId: 'ba1',
    description: 'Registered bursary application for John Tembo',
    timestamp: '2025-07-20T09:00:00Z'
  }
];

export const MOCK_BURSARY_APPLICATIONS: BursaryApplication[] = [
  {
    id: 'ba1',
    studentId: 'u7',
    firstName: 'John',
    lastName: 'Tembo',
    nrcNumber: '123456/78/1',
    gender: Gender.MALE,
    vulnerabilityCategory: VulnerabilityCategory.OTHER,
    guardianName: 'Grace Tembo',
    guardianPhone: '+260 97 111 2233',
    guardianRelation: 'Mother',
    schoolName: 'University of Zambia',
    schoolType: 'University',
    academicYear: AcademicYear.YEAR_2,
    courseOfStudy: 'Computer Science',
    requestedAmount: 15000,
    allocatedAmount: 15000,
    status: BursaryApplicationStatus.ACTIVE,
    constituencyId: 'c1',
    quarter: 1,
    fiscalYear: '2025/2026',
    startFiscalYear: '2024/2025',
    reviewedBy: 'u1',
    actionDate: '2025-08-15T10:00:00Z',
    createdAt: '2025-07-20T09:00:00Z',
    updatedAt: '2025-08-15T10:00:00Z'
  },
  {
    id: 'ba2',
    studentId: 'u10',
    firstName: 'Mercy',
    lastName: 'Chanda',
    nrcNumber: '234567/89/2',
    gender: Gender.FEMALE,
    vulnerabilityCategory: VulnerabilityCategory.PWD,
    guardianName: 'Peter Chanda',
    guardianPhone: '+260 96 888 4455',
    guardianRelation: 'Father',
    schoolName: 'Evelyn Hone College',
    schoolType: 'College',
    academicYear: AcademicYear.YEAR_1,
    courseOfStudy: 'Public Administration',
    requestedAmount: 8000,
    status: BursaryApplicationStatus.SUBMITTED,
    constituencyId: 'c1',
    quarter: 2,
    fiscalYear: '2025/2026',
    startFiscalYear: '2025/2026',
    createdAt: '2025-10-05T14:30:00Z',
    updatedAt: '2025-10-05T14:30:00Z'
  },
  {
    id: 'ba3',
    studentId: 'u11',
    firstName: 'Bupe',
    lastName: 'Mutale',
    nrcNumber: '345678/90/3',
    gender: Gender.FEMALE,
    vulnerabilityCategory: VulnerabilityCategory.ORPHAN,
    guardianName: 'Aunt Mary Mutale',
    guardianPhone: '+260 95 777 3344',
    guardianRelation: 'Aunt',
    schoolName: 'Munali Girls Secondary',
    schoolType: 'Secondary School',
    academicYear: AcademicYear.YEAR_1,
    courseOfStudy: 'Grade 11 — General Studies',
    requestedAmount: 5000,
    status: BursaryApplicationStatus.DRAFT,
    constituencyId: 'c2',
    quarter: 3,
    fiscalYear: '2025/2026',
    startFiscalYear: '2025/2026',
    createdAt: '2026-04-02T08:00:00Z',
    updatedAt: '2026-04-02T08:00:00Z'
  },
  {
    id: 'ba4',
    studentId: 'u12',
    firstName: 'Chisomo',
    lastName: 'Phiri',
    nrcNumber: '456789/01/4',
    gender: Gender.MALE,
    vulnerabilityCategory: VulnerabilityCategory.RURAL_STUDENT,
    guardianName: 'James Phiri',
    guardianPhone: '+260 97 222 5566',
    guardianRelation: 'Father',
    schoolName: 'Copperbelt University',
    schoolType: 'University',
    academicYear: AcademicYear.YEAR_3,
    courseOfStudy: 'Mining Engineering',
    requestedAmount: 18000,
    allocatedAmount: 16000,
    status: BursaryApplicationStatus.GRADUATED,
    constituencyId: 'c3',
    quarter: 1,
    fiscalYear: '2024/2025',
    startFiscalYear: '2022/2023',
    reviewedBy: 'u1',
    actionDate: '2024-09-10T10:00:00Z',
    createdAt: '2024-08-01T09:00:00Z',
    updatedAt: '2026-04-30T09:00:00Z'
  }
];

export const MOCK_STUDENT_PROGRESS: StudentProgress[] = [
  {
    id: 'sp1',
    studentId: 'u7',
    bursaryApplicationId: 'ba1',
    academicYear: AcademicYear.YEAR_2,
    fiscalYear: '2025/2026',
    continuationStatus: ContinuationStatus.CONTINUING,
    currentResult: 'GPA 3.8/5.0',
    lastUpdated: '2026-01-20T00:00:00Z',
    remarks: 'Performing well in all courses.'
  },
  {
    id: 'sp2',
    studentId: 'u12',
    bursaryApplicationId: 'ba4',
    academicYear: AcademicYear.YEAR_3,
    fiscalYear: '2024/2025',
    continuationStatus: ContinuationStatus.GRADUATED,
    currentResult: 'GPA 4.1/5.0 — Distinction',
    lastUpdated: '2026-04-30T09:00:00Z',
    remarks: 'Completed programme with distinction.'
  }
];

export const MOCK_BURSARY_DISBURSEMENTS: BursaryDisbursement[] = [
  {
    id: 'bd1',
    bursaryApplicationId: 'ba1',
    amount: 7500,
    expectedDisbursementDate: '2025-08-15T00:00:00Z',
    disbursementDate: '2025-08-20T09:00:00Z',
    paymentMethod: PaymentMethodBursary.BANK_TRANSFER,
    referenceNumber: 'BDT-2025-0081',
    recordedBy: 'u6',
    notes: 'First semester disbursement.',
    createdAt: '2025-08-20T09:00:00Z'
  },
  {
    id: 'bd2',
    bursaryApplicationId: 'ba1',
    amount: 7500,
    expectedDisbursementDate: '2026-01-10T00:00:00Z',
    disbursementDate: '2026-01-15T10:00:00Z',
    paymentMethod: PaymentMethodBursary.BANK_TRANSFER,
    referenceNumber: 'BDT-2026-0014',
    recordedBy: 'u6',
    notes: 'Second semester disbursement.',
    createdAt: '2026-01-15T10:00:00Z'
  }
];

export const MOCK_LOAN_APPLICATIONS: LoanGrantApplication[] = [
  {
    id: 'la1',
    beneficiaryId: 'b1',
    applicantName: 'James Kabwata (Rep)',
    applicantNrc: '101010/10/1',
    applicantPhone: '+260 97 123 4567',
    businessName: 'Kabwata Youth Tailoring',
    businessSector: BusinessSector.MANUFACTURING,
    fundingType: FundingType.LOAN,
    amountRequested: 50000,
    amountApproved: 45000,
    interestRate: 5,
    repaymentPeriod: 12,
    monthlyInstallment: 3937.5,
    purpose: 'Procurement of tailoring equipment.',
    status: LoanApplicationStatus.ACTIVE,
    constituencyId: 'c1',
    demographicGroup: DemographicGroup.YOUTH,
    submissionDate: '2025-11-20T00:00:00Z',
    approvalDate: '2025-12-05T00:00:00Z',
    disbursementDate: '2025-12-15T00:00:00Z',
    expectedDisbursementDate: '2025-12-10T00:00:00Z',
    disbursementReference: 'DISB-2025-102',
    createdAt: '2025-11-20T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z'
  },
  {
    id: 'la2',
    beneficiaryId: 'b2',
    applicantName: 'Grace Mulenga (Rep)',
    applicantNrc: '202020/20/2',
    applicantPhone: '+260 97 555 8821',
    businessName: 'Chilenje Poultry Farm',
    businessSector: BusinessSector.AGRICULTURE,
    fundingType: FundingType.GRANT,
    amountRequested: 20000,
    amountApproved: 20000,
    purpose: 'Setting up a community poultry farm.',
    status: LoanApplicationStatus.ACTIVE,
    constituencyId: 'c1',
    demographicGroup: DemographicGroup.WOMAN,
    submissionDate: '2026-01-10T00:00:00Z',
    approvalDate: '2026-01-25T00:00:00Z',
    disbursementDate: '2026-02-05T00:00:00Z',
    expectedDisbursementDate: '2026-02-01T00:00:00Z',
    disbursementReference: 'DISB-2026-003',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z'
  },
  {
    id: 'la3',
    beneficiaryId: 'b3',
    applicantName: 'Peter Mwale',
    applicantNrc: '303030/30/3',
    applicantPhone: '+260 96 770 1234',
    businessName: 'Munali Cold Storage Hub',
    businessSector: BusinessSector.TRADE,
    fundingType: FundingType.LOAN,
    amountRequested: 150000,
    status: LoanApplicationStatus.APPLIED,
    constituencyId: 'c2',
    demographicGroup: DemographicGroup.MAN,
    submissionDate: '2026-04-15T00:00:00Z',
    purpose: 'Expansion of cold storage facilities.',
    createdAt: '2026-04-15T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z'
  },
  {
    id: 'la4',
    beneficiaryId: 'b1',
    applicantName: 'Ruth Phiri',
    applicantNrc: '404040/40/4',
    applicantPhone: '+260 95 333 7788',
    businessName: 'Kafue Women Services Coop',
    businessSector: BusinessSector.SERVICES,
    fundingType: FundingType.LOAN,
    amountRequested: 30000,
    amountApproved: 28000,
    interestRate: 5,
    repaymentPeriod: 12,
    monthlyInstallment: 2450,
    purpose: 'Purchase of salon equipment and training.',
    status: LoanApplicationStatus.FULLY_DISBURSED,
    constituencyId: 'c3',
    demographicGroup: DemographicGroup.WOMAN,
    submissionDate: '2025-08-01T00:00:00Z',
    approvalDate: '2025-08-20T00:00:00Z',
    disbursementDate: '2025-09-01T00:00:00Z',
    expectedDisbursementDate: '2025-08-28T00:00:00Z',
    disbursementReference: 'DISB-2025-078',
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2025-09-01T00:00:00Z'
  }
];

export const MOCK_REPAYMENTS: LoanRepayment[] = [
  {
    id: 'lr1',
    loanId: 'la1',
    amount: 4000,
    paymentDate: '2026-01-15T14:00:00Z',
    paymentMethod: PaymentMethod.MOBILE_MONEY,
    reference: 'MM-RT-92834',
    receivedBy: 'u6',
    createdAt: '2026-01-15T14:00:00Z'
  },
  {
    id: 'lr2',
    loanId: 'la1',
    amount: 4000,
    paymentDate: '2026-02-15T10:00:00Z',
    paymentMethod: PaymentMethod.MOBILE_MONEY,
    reference: 'MM-RT-95512',
    receivedBy: 'u6',
    createdAt: '2026-02-15T10:00:00Z'
  }
];

export const MOCK_BUSINESS_MONITORING: BusinessMonitoring[] = [
  {
    id: 'bm1',
    beneficiaryId: 'b1',
    loanId: 'la1',
    checkDate: '2026-06-15T00:00:00Z',
    status: 'ACTIVE',
    businessStatus: 'ACTIVE',
    revenueGrowth: 25,
    jobsCreated: 5,
    jobsBreakdown: {
      female: 2,
      male: 3,
      youth: 3,
      adult: 2,
      pwd: 0,
      nonPwd: 5,
      fullTime: 3,
      partTime: 1,
      seasonal: 1,
      total: 5
    },
    householdIncomeImproved: true,
    survivalMonths: 6,
    performanceNotes: 'Business is thriving. Tailoring shop fully operational.',
    monitoredBy: 'u5',
    createdAt: '2026-06-15T00:00:00Z'
  },
  {
    id: 'bm2',
    beneficiaryId: 'b2',
    loanId: 'la4',
    checkDate: '2026-03-05T00:00:00Z',
    status: 'ACTIVE',
    businessStatus: 'ACTIVE',
    revenueGrowth: 18,
    jobsCreated: 3,
    jobsBreakdown: {
      female: 3,
      male: 0,
      youth: 2,
      adult: 1,
      pwd: 1,
      nonPwd: 2,
      fullTime: 2,
      partTime: 1,
      seasonal: 0,
      total: 3
    },
    householdIncomeImproved: true,
    survivalMonths: 6,
    performanceNotes: 'Salon operational. Revenue growing steadily.',
    monitoredBy: 'u5',
    createdAt: '2026-03-05T00:00:00Z'
  }
];

export const MOCK_ADMIN_COSTS: AdministrativeCost[] = [
  {
    id: 'ac1',
    costType: 'ADMIN',
    category: 'TRANSPORT',
    amount: 5500,
    date: '2026-04-10T09:00:00Z',
    quarter: 2,
    description: 'Fuel and vehicle maintenance for field monitoring visits.',
    constituencyId: 'c1',
    recordedBy: 'u1'
  },
  {
    id: 'ac2',
    costType: 'ADMIN',
    category: 'PERSONNEL',
    amount: 12000,
    date: '2026-04-30T17:00:00Z',
    quarter: 2,
    description: 'Lunch allowances for community engagement facilitators.',
    constituencyId: 'c1',
    recordedBy: 'u1'
  },
  {
    id: 'ac3',
    costType: 'ME',
    category: 'TRANSPORT',
    amount: 3200,
    date: '2026-04-18T10:00:00Z',
    quarter: 2,
    description: 'M&E field visit transport to Munali and Kafue.',
    constituencyId: 'c2',
    recordedBy: 'u4'
  },
  {
    id: 'ac4',
    costType: 'ME',
    category: 'OFFICE',
    amount: 1800,
    date: '2026-01-20T09:00:00Z',
    quarter: 1,
    description: 'M&E data collection tools and printing.',
    constituencyId: 'c1',
    recordedBy: 'u4'
  },
  {
    id: 'ac5',
    costType: 'ADMIN',
    category: 'COMMUNICATION',
    amount: 2400,
    date: '2026-01-31T16:00:00Z',
    quarter: 1,
    description: 'Airtime and data bundles for officer communications.',
    constituencyId: 'c3',
    recordedBy: 'u1'
  }
];

export const MOCK_MONITORING_VISITS: MonitoringVisit[] = [
  {
    id: 'mv1',
    title: 'Munali Poultry Inspection',
    type: 'FIELD_INSPECTION',
    scheduledDate: '2026-05-15T10:00:00Z',
    status: 'SCHEDULED',
    team: ['John Musonda', 'Sarah Phiri'],
    officerConducting: 'John Musonda',
    constituencyId: 'c2',
    createdAt: '2026-05-01T00:00:00Z'
  },
  {
    id: 'mv2',
    title: 'Kabwata Tailoring Audit',
    type: 'VERIFICATION',
    scheduledDate: '2026-05-02T14:30:00Z',
    visitDate: '2026-05-02T14:30:00Z',
    status: 'COMPLETED',
    team: ['Mwenya Kapotwe'],
    officerConducting: 'Mwenya Kapotwe',
    constituencyId: 'c1',
    beneficiariesVisited: ['b1'],
    findings: 'Equipment verified as per application. Business is operational and generating revenue.',
    recommendations: 'Encourage beneficiary to open a business bank account for better financial tracking.',
    reportSummary: 'Equipment verified as per application. Business is operational.',
    inspectionFindings: 'SATISFACTORY',
    actionItems: [
      { description: 'Follow up on bank account opening', dueDate: '2026-06-15T00:00:00Z', responsibleOfficer: 'Mwenya Kapotwe', completed: false }
    ],
    createdAt: '2026-04-20T00:00:00Z'
  },
  {
    id: 'mv3',
    title: 'Chilenje Women Group Follow-up',
    type: 'FOLLOW_UP',
    scheduledDate: '2026-04-10T09:00:00Z',
    visitDate: '2026-04-10T09:00:00Z',
    status: 'COMPLETED',
    team: ['Bwalya Chungu', 'Natasha Banda'],
    officerConducting: 'Bwalya Chungu',
    constituencyId: 'c1',
    beneficiariesVisited: ['b2'],
    findings: 'Poultry farm expanding. Flock size has doubled since initial disbursement. Revenue increasing.',
    recommendations: 'Consider applying for additional grant for storage facility. Connect with veterinary services.',
    inspectionFindings: 'SATISFACTORY',
    reportSummary: 'Strong business performance observed. Household income noticeably improved.',
    actionItems: [
      { description: 'Link beneficiary to vet services', dueDate: '2026-05-01T00:00:00Z', responsibleOfficer: 'Bwalya Chungu', completed: true },
      { description: 'Advise on grant application for storage', dueDate: '2026-06-01T00:00:00Z', responsibleOfficer: 'Natasha Banda', completed: false }
    ],
    createdAt: '2026-04-01T00:00:00Z'
  }
];

export const MOCK_COMMUNITY_SESSIONS: CommunitySession[] = [
  {
    id: 'cm1',
    sessionType: 'WORKSHOP',
    title: 'Financial Literacy Workshop for Women Groups',
    date: '2026-04-12T09:00:00Z',
    location: 'Chilenje Community Hall',
    constituencyId: 'c1',
    attendeesCount: 45,
    femaleAttendees: 38,
    maleAttendees: 7,
    issuesRaised: 'Lack of collateral for loan applications. Difficulty accessing mobile money in rural areas.',
    actionsCommitted: 'Arrange collateral-free loan awareness session. Work with telecom provider for agent expansion.',
    keyOutcomes: 'Groups trained on basic bookkeeping and loan repayment cycles.',
    organizerId: 'u1',
    createdAt: '2026-04-05T00:00:00Z'
  },
  {
    id: 'cm2',
    sessionType: 'DIALOGUE',
    title: 'Community Budget Transparency Dialogue',
    date: '2026-02-20T10:00:00Z',
    location: 'Munali Council Chambers',
    constituencyId: 'c2',
    attendeesCount: 62,
    femaleAttendees: 29,
    maleAttendees: 33,
    issuesRaised: 'Community members questioned delay in bursary disbursements. Youth requested more loan categories.',
    actionsCommitted: 'Finance officer to publish disbursement schedule. Youth loan category to be reviewed by committee.',
    keyOutcomes: 'Budget allocations presented. Community endorsed Q3 priorities.',
    organizerId: 'u4',
    createdAt: '2026-02-15T00:00:00Z'
  },
  {
    id: 'cm3',
    sessionType: 'SCORECARD_DISTRIBUTION',
    title: 'Q2 Citizen Scorecard Distribution — Kafue',
    date: '2026-05-05T08:00:00Z',
    location: 'Kafue Civic Centre',
    constituencyId: 'c3',
    attendeesCount: 30,
    femaleAttendees: 14,
    maleAttendees: 16,
    issuesRaised: 'Some beneficiaries had not received their confirmation letters.',
    actionsCommitted: 'Registry officer to resend letters. Digital copy to be shared via WhatsApp group.',
    keyOutcomes: 'Scorecards distributed to 30 households. Feedback collection opened.',
    organizerId: 'u1',
    createdAt: '2026-04-28T00:00:00Z'
  }
];

/** @deprecated use MOCK_COMMUNITY_SESSIONS */
export const MOCK_COMMUNITY_MEETINGS = MOCK_COMMUNITY_SESSIONS;

export const MOCK_CITIZEN_SCORECARDS: CitizenScorecard[] = [
  {
    id: 'cs1',
    constituencyId: 'c1',
    fiscalYear: '2025/2026',
    quarter: 2,
    accessibilityScore: 4,
    timelinessScore: 3,
    fairnessScore: 4,
    communicationScore: 4,
    impactScore: 5,
    feedbackText: 'The bursary disbursements were timely and the officers were helpful.',
    submitterName: 'Anonymous',
    submittedAt: '2026-04-10T11:30:00Z'
  },
  {
    id: 'cs2',
    constituencyId: 'c1',
    fiscalYear: '2025/2026',
    quarter: 2,
    accessibilityScore: 3,
    timelinessScore: 2,
    fairnessScore: 4,
    communicationScore: 3,
    impactScore: 4,
    submittedAt: '2026-04-22T08:15:00Z'
  }
];

export const MOCK_COMMUNITY_PROJECTS: CommunityProject[] = [
  {
    id: 'cp1', title: 'Kabwata Youth Tailoring Loan Programme', constituencyId: 'c1',
    programmeArea: 'LOAN',
    description: 'Loan-funded tailoring cooperative; community feedback shaped repayment grace period.',
    feedbackIncorporated: 'YES',
    feedbackNotes: 'Adopted community recommendation for 30-day grace before first repayment.',
    reviewedBy: 'u1', reviewedAt: '2026-02-10T00:00:00Z',
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'cp2', title: 'Chilenje Women Group Poultry Grant', constituencyId: 'c1',
    programmeArea: 'GRANT',
    description: 'Grant for community poultry farm.',
    feedbackIncorporated: 'PARTIAL',
    feedbackNotes: 'Partial uptake of community vet-services suggestion; budget constraints prevented full rollout.',
    reviewedBy: 'u1', reviewedAt: '2026-03-15T00:00:00Z',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'cp3', title: 'Munali Bursary Outreach', constituencyId: 'c2',
    programmeArea: 'BURSARY',
    description: 'Bursary outreach to rural students.',
    feedbackIncorporated: 'NOT_REVIEWED',
    createdAt: '2026-04-20T00:00:00Z',
  },
];

export const MOCK_QUARTERLY_REPORTS: QuarterlyReport[] = [
  {
    id: 'qr1',
    constituencyId: 'c1',
    fiscalYear: '2025/2026',
    quarter: 1,
    publishedAt: '2025-10-12T08:00:00Z',
    dueDate: '2025-10-15T23:59:59Z'
  },
  {
    id: 'qr2',
    constituencyId: 'c1',
    fiscalYear: '2025/2026',
    quarter: 2,
    publishedAt: '2026-01-14T09:30:00Z',
    dueDate: '2026-01-15T23:59:59Z'
  },
  {
    id: 'qr3',
    constituencyId: 'c2',
    fiscalYear: '2025/2026',
    quarter: 1,
    publishedAt: '2025-10-10T08:00:00Z',
    dueDate: '2025-10-15T23:59:59Z'
  },
  {
    id: 'qr4',
    constituencyId: 'c2',
    fiscalYear: '2025/2026',
    quarter: 2,
    dueDate: '2026-01-15T23:59:59Z'
  },
  {
    id: 'qr5',
    constituencyId: 'c3',
    fiscalYear: '2025/2026',
    quarter: 2,
    dueDate: '2026-01-15T23:59:59Z'
  }
];
