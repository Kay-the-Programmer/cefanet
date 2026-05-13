import { CitizenScorecard, QuarterlyReport, CommunityProject, FeedbackIncorporation } from '../types';
import {
  MOCK_CITIZEN_SCORECARDS,
  MOCK_QUARTERLY_REPORTS,
  MOCK_CONSTITUENCIES,
  MOCK_LOAN_APPLICATIONS,
  MOCK_BURSARY_APPLICATIONS,
  MOCK_COMMUNITY_PROJECTS,
} from '../../../shared/api/mockData';
import { LoanApplicationStatus } from '../../loans/types';
import { BursaryApplicationStatus } from '../../bursaries/types';
import { logAudit, AuditAction } from '../../monitoring/api/auditService';
import { notificationService } from '../../notifications/api/notificationService';
import { NotificationType } from '../../notifications/types';

const STORAGE_KEY = 'cdf_citizen_scorecards';

const loadStored = (): CitizenScorecard[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const persistStored = (rows: CitizenScorecard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* no-op */
  }
};

const currentQuarter = () => {
  const now = new Date();
  return Math.floor(now.getMonth() / 3) + 1;
};

const currentFiscalYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
};

const PROJECTS_KEY = 'cdf_community_projects';

const loadProjects = (): CommunityProject[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(PROJECTS_KEY) || 'null') as CommunityProject[] | null;
    return stored && stored.length > 0 ? stored : [...MOCK_COMMUNITY_PROJECTS];
  } catch { return [...MOCK_COMMUNITY_PROJECTS]; }
};

const persistProjects = (rows: CommunityProject[]) => {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(rows)); } catch { /* */ }
};

class CommunityService {
  private projects: CommunityProject[] = loadProjects();

  getConstituencies() {
    return MOCK_CONSTITUENCIES;
  }

  // ── FR-CE-003: Project + feedback incorporation tracking ─────────────────

  getProjects(constituencyId?: string): CommunityProject[] {
    return constituencyId
      ? this.projects.filter(p => p.constituencyId === constituencyId)
      : [...this.projects];
  }

  async createProject(input: Omit<CommunityProject, 'id' | 'createdAt' | 'feedbackIncorporated'>): Promise<CommunityProject> {
    const p: CommunityProject = {
      ...input,
      id: `cp-${Date.now()}`,
      feedbackIncorporated: 'NOT_REVIEWED',
      createdAt: new Date().toISOString(),
    };
    this.projects.unshift(p);
    persistProjects(this.projects);
    await logAudit(AuditAction.CREATE, 'CommunityProject', p.id, {
      module: 'community', newValue: { title: p.title, programmeArea: p.programmeArea },
      description: `Project "${p.title}" created`,
    });
    return p;
  }

  async setFeedbackIncorporation(
    projectId: string,
    status: FeedbackIncorporation,
    notes: string,
    reviewedBy: string,
  ): Promise<CommunityProject | undefined> {
    const p = this.projects.find(x => x.id === projectId);
    if (!p) return undefined;
    const old = p.feedbackIncorporated;
    p.feedbackIncorporated = status;
    p.feedbackNotes = notes;
    p.reviewedBy = reviewedBy;
    p.reviewedAt = new Date().toISOString();
    persistProjects(this.projects);
    await logAudit(AuditAction.UPDATE, 'CommunityProject', projectId, {
      module: 'community', fieldChanged: 'feedbackIncorporated',
      oldValue: old, newValue: status,
      description: `Project feedback incorporation set to ${status}`,
    });
    return p;
  }

  /** FR-CE-003 KPI: % of reviewed projects that incorporated feedback (YES or PARTIAL count). */
  feedbackIncorporationRate(constituencyId?: string): { rate: number; reviewed: number; incorporated: number } {
    const ps = this.getProjects(constituencyId).filter(p => p.feedbackIncorporated !== 'NOT_REVIEWED');
    const incorporated = ps.filter(p => p.feedbackIncorporated === 'YES' || p.feedbackIncorporated === 'PARTIAL').length;
    return {
      rate: ps.length > 0 ? (incorporated / ps.length) * 100 : 0,
      reviewed: ps.length,
      incorporated,
    };
  }

  getScorecards(constituencyId?: string): CitizenScorecard[] {
    const all = [...MOCK_CITIZEN_SCORECARDS, ...loadStored()];
    return constituencyId ? all.filter(s => s.constituencyId === constituencyId) : all;
  }

  submitScorecard(input: {
    constituencyId: string;
    accessibilityScore: number;
    timelinessScore: number;
    fairnessScore: number;
    communicationScore: number;
    impactScore: number;
    feedbackText?: string;
    submitterName?: string;
  }): CitizenScorecard {
    const scorecard: CitizenScorecard = {
      id: `cs-${Date.now()}`,
      constituencyId: input.constituencyId,
      fiscalYear: currentFiscalYear(),
      quarter: currentQuarter(),
      accessibilityScore: input.accessibilityScore,
      timelinessScore: input.timelinessScore,
      fairnessScore: input.fairnessScore,
      communicationScore: input.communicationScore,
      impactScore: input.impactScore,
      feedbackText: input.feedbackText,
      submitterName: input.submitterName,
      submittedAt: new Date().toISOString(),
    };
    const stored = loadStored();
    persistStored([scorecard, ...stored]);
    return scorecard;
  }

  satisfactionIndex(constituencyId: string, fiscalYear?: string, quarter?: number): number | null {
    const filtered = this.getScorecards(constituencyId).filter(s =>
      (!fiscalYear || s.fiscalYear === fiscalYear) && (!quarter || s.quarter === quarter)
    );
    if (filtered.length === 0) return null;
    const total = filtered.reduce(
      (sum, s) => sum + (s.accessibilityScore + s.timelinessScore + s.fairnessScore + s.communicationScore + s.impactScore) / 5,
      0
    );
    return total / filtered.length;
  }

  private quarterlyReports: QuarterlyReport[] = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cdf_quarterly_reports') || 'null') as QuarterlyReport[] | null;
      return stored && stored.length > 0 ? stored : [...MOCK_QUARTERLY_REPORTS];
    } catch { return [...MOCK_QUARTERLY_REPORTS]; }
  })();

  private persistReports() {
    try { localStorage.setItem('cdf_quarterly_reports', JSON.stringify(this.quarterlyReports)); } catch { /* */ }
  }

  getQuarterlyReports(): QuarterlyReport[] {
    return [...this.quarterlyReports];
  }

  /** FR-CE-005: publish quarterly report. Creates record if missing, sets publishedAt. */
  async publishQuarterlyReport(constituencyId: string, fiscalYear: string, quarter: number): Promise<QuarterlyReport> {
    let r = this.quarterlyReports.find(x => x.constituencyId === constituencyId && x.fiscalYear === fiscalYear && x.quarter === quarter);
    const now = new Date();
    if (!r) {
      // Default due date: end of month following the quarter
      const dueMonth = quarter * 3; // Q1=3 (April), Q2=6 (July), etc.
      const dueDate = new Date(parseInt(fiscalYear.split('/')[0]), dueMonth, 15).toISOString();
      r = { id: `qr-${Date.now()}`, constituencyId, fiscalYear, quarter, dueDate };
      this.quarterlyReports.push(r);
    }
    r.publishedAt = now.toISOString();
    this.persistReports();
    await logAudit(AuditAction.CREATE, 'QuarterlyReport', r.id, {
      module: 'community',
      newValue: { constituencyId, fiscalYear, quarter, publishedAt: r.publishedAt },
      description: `Quarterly report published for ${constituencyId} Q${quarter} ${fiscalYear}`,
    });
    return r;
  }

  /**
   * FR-CE-006: Find reports due in 14 or 3 days that have not yet been published
   * and dispatch reminder notifications. Returns count sent.
   */
  async dispatchUpcomingDeadlineReminders(): Promise<{ at14Days: number; at3Days: number }> {
    const now = Date.now();
    const win = (target: number) => 24 * 60 * 60 * 1000 * target;
    let at14 = 0, at3 = 0;
    for (const r of this.quarterlyReports) {
      if (r.publishedAt) continue;
      const due = new Date(r.dueDate).getTime();
      const daysOut = (due - now) / (24 * 60 * 60 * 1000);
      if (daysOut > 13.5 && daysOut <= 14.5) {
        await notificationService.sendNotification({
          userId: 'constituency-officer-' + r.constituencyId,
          title: 'Quarterly Report Due in 14 Days',
          message: `Q${r.quarter} ${r.fiscalYear} report is due ${new Date(r.dueDate).toLocaleDateString()}.`,
          type: NotificationType.REPORT_DEADLINE,
          link: '/reports',
        });
        at14++;
      } else if (daysOut > 2.5 && daysOut <= 3.5) {
        await notificationService.sendNotification({
          userId: 'constituency-officer-' + r.constituencyId,
          title: 'URGENT: Quarterly Report Due in 3 Days',
          message: `Q${r.quarter} ${r.fiscalYear} report is due ${new Date(r.dueDate).toLocaleDateString()}.`,
          type: NotificationType.REPORT_DEADLINE,
          link: '/reports',
        });
        at3++;
      }
      void win;
    }
    return { at14Days: at14, at3Days: at3 };
  }

  /** Constituencies that missed their deadline. */
  getMissedDeadlines(): QuarterlyReport[] {
    const now = Date.now();
    return this.quarterlyReports.filter(r => !r.publishedAt && new Date(r.dueDate).getTime() < now);
  }

  reportingComplianceRate(): number {
    const reports = this.getQuarterlyReports();
    if (reports.length === 0) return 0;
    const onTime = reports.filter(r => r.publishedAt && new Date(r.publishedAt) <= new Date(r.dueDate)).length;
    return (onTime / reports.length) * 100;
  }

  /** Update old `sendQuarterlyReminders` to delegate to the dated dispatcher. */
  async sendQuarterlyReminders(): Promise<{ sent: number; message: string }> {
    const { at14Days, at3Days } = await this.dispatchUpcomingDeadlineReminders();
    const sent = at14Days + at3Days;
    return { sent, message: `Dispatched ${at14Days} 14-day and ${at3Days} 3-day reminders.` };
  }

  getDisclosureSummary(constituencyId: string) {
    const loans = MOCK_LOAN_APPLICATIONS.filter(
      l => l.constituencyId === constituencyId && (l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED)
    );
    const bursaries = MOCK_BURSARY_APPLICATIONS.filter(
      b => b.constituencyId === constituencyId && (b.status === BursaryApplicationStatus.APPROVED || b.status === BursaryApplicationStatus.DISBURSED)
    );
    return {
      bursariesAwarded: bursaries.length,
      loansDisbursed: loans.length,
      totalLoanValue: loans.reduce((sum, l) => sum + (l.amountApproved || 0), 0),
      reports: this.getQuarterlyReports().filter(r => r.constituencyId === constituencyId),
      satisfactionIndex: this.satisfactionIndex(constituencyId),
    };
  }

  getHistoricalSatisfaction(constituencyId: string) {
    // Return mock historical trend data for the line chart
    return [
      { period: '2025 Q3', index: this.satisfactionIndex(constituencyId, '2025/2026', 3) || 3.2 },
      { period: '2025 Q4', index: this.satisfactionIndex(constituencyId, '2025/2026', 4) || 3.5 },
      { period: '2026 Q1', index: this.satisfactionIndex(constituencyId, '2026/2027', 1) || 3.8 },
      { period: '2026 Q2', index: this.satisfactionIndex(constituencyId) || 4.1 },
    ];
  }

}

export const communityService = new CommunityService();
