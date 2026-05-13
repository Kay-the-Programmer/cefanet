export type FeedbackIncorporation = 'YES' | 'NO' | 'PARTIAL' | 'NOT_REVIEWED';

/** FR-CE-003 — track whether community feedback was incorporated per project. */
export interface CommunityProject {
  id: string;
  title: string;
  constituencyId: string;
  programmeArea: 'BURSARY' | 'LOAN' | 'GRANT' | 'INFRASTRUCTURE' | 'OTHER';
  description: string;
  feedbackIncorporated: FeedbackIncorporation;
  feedbackNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CitizenScorecard {
  id: string;
  constituencyId: string;
  fiscalYear: string;
  quarter: number;
  accessibilityScore: number; // 1-5
  timelinessScore: number;
  fairnessScore: number;
  communicationScore: number;
  impactScore: number;
  feedbackText?: string;
  submitterName?: string;
  submittedAt: string;
}

export interface QuarterlyReport {
  id: string;
  constituencyId: string;
  fiscalYear: string;
  quarter: number;
  publishedAt?: string;
  dueDate: string;
}
