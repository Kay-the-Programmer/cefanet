import { JobsBreakdown } from '../../loans/types';

export interface BusinessMonitoring {
  id: string;
  beneficiaryId: string;
  loanId?: string;
  checkDate: string;
  status: 'ACTIVE' | 'STRUGGLING' | 'CLOSED';
  businessStatus: 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'RESTRUCTURED';
  revenueGrowth: number;
  jobsCreated: number;
  jobsBreakdown: JobsBreakdown;
  householdIncomeImproved: boolean;
  survivalMonths: number;
  performanceNotes: string;
  monitoredBy: string;
  createdAt: string;
}

export interface WorkflowMetrics {
  applicationId: string;
  submissionDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  approvalTurnaroundDays?: number;
  disbursementTurnaroundDays?: number;
}

export interface AdministrativeCost {
  id: string;
  costType: 'ADMIN' | 'ME';
  category: 'TRANSPORT' | 'OFFICE' | 'PERSONNEL' | 'COMMUNICATION' | 'OTHER';
  amount: number;
  date: string;
  quarter: 1 | 2 | 3 | 4;
  description: string;
  constituencyId: string;
  recordedBy: string;
}

export interface ActionItem {
  description: string;
  dueDate: string;
  responsibleOfficer: string;
  completed: boolean;
}

export interface VisitAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface MonitoringVisit {
  id: string;
  title: string;
  type: 'FIELD_INSPECTION' | 'VERIFICATION' | 'FOLLOW_UP';
  scheduledDate: string;
  visitDate?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  team: string[];
  officerConducting?: string;
  constituencyId: string;
  beneficiariesVisited?: string[];
  findings?: string;
  recommendations?: string;
  attachments?: VisitAttachment[];
  actionItems?: ActionItem[];
  reportSummary?: string;
  inspectionFindings?: 'SATISFACTORY' | 'CONCERNING' | 'FAILED';
  createdAt: string;
}

export interface CommunitySession {
  id: string;
  sessionType: 'DIALOGUE' | 'WORKSHOP' | 'SCORECARD_DISTRIBUTION' | 'OTHER';
  title: string;
  date: string;
  location: string;
  constituencyId: string;
  attendeesCount: number;
  femaleAttendees: number;
  maleAttendees: number;
  issuesRaised: string;
  actionsCommitted: string;
  keyOutcomes: string;
  feedbackIncorporated?: 'YES' | 'NO' | 'PARTIAL';
  organizerId: string;
  attendanceSheetFile?: { name: string; size: number };
  createdAt: string;
}

/** @deprecated use CommunitySession */
export type CommunityMeeting = CommunitySession;
