import {
  AdministrativeCost,
  MonitoringVisit,
  CommunitySession,
  WorkflowMetrics,
} from '../types';
import { LoanApplicationStatus } from '../../loans/types';
import { NotificationType } from '../../notifications/types';
import {
  MOCK_ADMIN_COSTS,
  MOCK_MONITORING_VISITS,
  MOCK_COMMUNITY_SESSIONS,
  MOCK_LOAN_APPLICATIONS,
  MOCK_BURSARY_APPLICATIONS,
  MOCK_BURSARY_DISBURSEMENTS,
  MOCK_CONSTITUENCIES,
} from '../../../shared/api/mockData';
import { loanService } from '../../loans/api/loanService';
import { notificationService } from '../../notifications/api/notificationService';
import { differenceInDays } from 'date-fns';

const quarterOf = (dateStr: string): 1 | 2 | 3 | 4 => {
  const m = new Date(dateStr).getMonth();
  return (Math.floor(m / 3) + 1) as 1 | 2 | 3 | 4;
};

class EfficiencyService {
  private adminCosts: AdministrativeCost[] = [...MOCK_ADMIN_COSTS];
  private visits: MonitoringVisit[] = [...MOCK_MONITORING_VISITS];
  private sessions: CommunitySession[] = [...MOCK_COMMUNITY_SESSIONS];

  // ── Admin Costs (FR-OPS-002) ─────────────────────────────────────────────

  async getAdminCosts(): Promise<AdministrativeCost[]> {
    return [...this.adminCosts];
  }

  async addAdminCost(cost: Omit<AdministrativeCost, 'id'>): Promise<AdministrativeCost> {
    const newCost: AdministrativeCost = { ...cost, id: `ac${Date.now()}` };
    this.adminCosts.push(newCost);
    return newCost;
  }

  /**
   * FR-OPS-002: Admin + M&E cost ratio per quarter per constituency.
   * Returns { [constituencyId]: { [quarter]: { admin, me, total, disbursed, ratio } } }
   */
  async getAdminCostReport(): Promise<{
    byConstituency: Record<string, Record<number, { admin: number; me: number; total: number; disbursed: number; ratio: number }>>;
    overall: { total: number; disbursed: number; ratio: number };
  }> {
    const applications = await loanService.getApplications();
    const bursaryDisbursements = MOCK_BURSARY_DISBURSEMENTS;

    const byConstituency: Record<string, Record<number, { admin: number; me: number; total: number; disbursed: number; ratio: number }>> = {};

    for (const c of MOCK_CONSTITUENCIES) {
      const qMap: Record<number, { admin: number; me: number; total: number; disbursed: number; ratio: number }> = {};
      for (let q = 1; q <= 4; q++) {
        const costs = this.adminCosts.filter(ac => ac.constituencyId === c.id && ac.quarter === q);
        const admin = costs.filter(ac => ac.costType === 'ADMIN').reduce((s, ac) => s + ac.amount, 0);
        const me = costs.filter(ac => ac.costType === 'ME').reduce((s, ac) => s + ac.amount, 0);
        const total = admin + me;

        // Loan/grant disbursements for this constituency and quarter
        const loanDisbursed = applications
          .filter(a => a.constituencyId === c.id && a.disbursementDate && quarterOf(a.disbursementDate) === q)
          .reduce((s, a) => s + (a.amountApproved || 0), 0);

        // Bursary disbursements for this constituency and quarter
        const bursaryIds = new Set(
          MOCK_BURSARY_APPLICATIONS.filter(b => b.constituencyId === c.id).map(b => b.id)
        );
        const bursaryDisbursed = bursaryDisbursements
          .filter(d => bursaryIds.has(d.bursaryApplicationId) && quarterOf(d.disbursementDate) === q)
          .reduce((s, d) => s + d.amount, 0);

        const disbursed = loanDisbursed + bursaryDisbursed;
        const ratio = disbursed > 0 ? (total / disbursed) * 100 : 0;
        qMap[q] = { admin, me, total, disbursed, ratio };
      }
      byConstituency[c.id] = qMap;
    }

    const overallAdmin = this.adminCosts.reduce((s, c) => s + c.amount, 0);
    const overallDisbursed = applications
      .filter(a => a.disbursementDate)
      .reduce((s, a) => s + (a.amountApproved || 0), 0)
      + bursaryDisbursements.reduce((s, d) => s + d.amount, 0);

    return {
      byConstituency,
      overall: {
        total: overallAdmin,
        disbursed: overallDisbursed,
        ratio: overallDisbursed > 0 ? (overallAdmin / overallDisbursed) * 100 : 0,
      },
    };
  }

  // ── Disbursement Timeliness (FR-OPS-001) ──────────────────────────────────

  /**
   * FR-OPS-001: Calculates timeliness across loans/grants and bursaries.
   * Timeliness = (on-time ÷ total scheduled) × 100.
   * On-time = disbursementDate ≤ expectedDisbursementDate.
   */
  async getDisbursementTimeliness(): Promise<{
    totalScheduled: number;
    onTime: number;
    late: number;
    timeliness: number;
    byType: Array<{ type: string; scheduled: number; onTime: number; timeliness: number }>;
  }> {
    const applications = await loanService.getApplications();

    // Loan/grant disbursements
    const loanScheduled = applications.filter(a => a.expectedDisbursementDate && a.disbursementDate);
    const loanOnTime = loanScheduled.filter(
      a => new Date(a.disbursementDate!) <= new Date(a.expectedDisbursementDate!)
    );

    // Bursary disbursements
    const bursaryScheduled = MOCK_BURSARY_DISBURSEMENTS.filter(d => d.expectedDisbursementDate);
    const bursaryOnTime = bursaryScheduled.filter(
      d => new Date(d.disbursementDate) <= new Date(d.expectedDisbursementDate!)
    );

    const totalScheduled = loanScheduled.length + bursaryScheduled.length;
    const onTime = loanOnTime.length + bursaryOnTime.length;

    return {
      totalScheduled,
      onTime,
      late: totalScheduled - onTime,
      timeliness: totalScheduled > 0 ? (onTime / totalScheduled) * 100 : 0,
      byType: [
        {
          type: 'Loans & Grants',
          scheduled: loanScheduled.length,
          onTime: loanOnTime.length,
          timeliness: loanScheduled.length > 0 ? (loanOnTime.length / loanScheduled.length) * 100 : 0,
        },
        {
          type: 'Bursaries',
          scheduled: bursaryScheduled.length,
          onTime: bursaryOnTime.length,
          timeliness: bursaryScheduled.length > 0 ? (bursaryOnTime.length / bursaryScheduled.length) * 100 : 0,
        },
      ],
    };
  }

  // ── Processing Times (FR-OPS-003) ─────────────────────────────────────────

  /**
   * FR-OPS-003: Average(disbursementDate − submissionDate) per programme type.
   */
  async getProcessingTimes(): Promise<Array<{ type: string; avgDays: number; count: number; minDays: number; maxDays: number }>> {
    const applications = await loanService.getApplications();
    const bursaries = MOCK_BURSARY_APPLICATIONS;

    // Loans
    const loanDays = applications
      .filter(a => a.disbursementDate && a.submissionDate && a.fundingType === 'LOAN')
      .map(a => differenceInDays(new Date(a.disbursementDate!), new Date(a.submissionDate)));

    // Grants
    const grantDays = applications
      .filter(a => a.disbursementDate && a.submissionDate && a.fundingType === 'GRANT')
      .map(a => differenceInDays(new Date(a.disbursementDate!), new Date(a.submissionDate)));

    // Bursaries — use actionDate (approval/disbursement action) vs createdAt
    const bursaryDays = bursaries
      .filter(b => b.actionDate && b.createdAt)
      .map(b => differenceInDays(new Date(b.actionDate!), new Date(b.createdAt)));

    const summarise = (days: number[], type: string) => ({
      type,
      count: days.length,
      avgDays: days.length > 0 ? days.reduce((s, d) => s + d, 0) / days.length : 0,
      minDays: days.length > 0 ? Math.min(...days) : 0,
      maxDays: days.length > 0 ? Math.max(...days) : 0,
    });

    return [
      summarise(loanDays, 'Loans'),
      summarise(grantDays, 'Grants'),
      summarise(bursaryDays, 'Bursaries'),
    ];
  }

  // ── Monitoring Visits (FR-OPS-004, FR-OPS-005) ────────────────────────────

  async getMonitoringVisits(): Promise<MonitoringVisit[]> {
    return [...this.visits];
  }

  async addMonitoringVisit(visit: Omit<MonitoringVisit, 'id' | 'createdAt'>): Promise<MonitoringVisit> {
    const newVisit: MonitoringVisit = {
      ...visit,
      id: `mv${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.visits.push(newVisit);

    for (const memberEmail of visit.team) {
      await notificationService.sendNotification({
        userId: memberEmail,
        title: 'New Monitoring Assignment',
        message: `You have been assigned to "${visit.title}" scheduled for ${visit.scheduledDate}.`,
        type: NotificationType.MONITORING_SCHEDULED,
        link: '/field-monitoring',
      });
    }

    return newVisit;
  }

  async updateVisit(id: string, updates: Partial<MonitoringVisit>): Promise<MonitoringVisit | undefined> {
    const idx = this.visits.findIndex(v => v.id === id);
    if (idx === -1) return undefined;
    this.visits[idx] = { ...this.visits[idx], ...updates };
    return this.visits[idx];
  }

  /**
   * FR-OPS-005: Visits per constituency per quarter.
   * Flags constituencies with no completed visit in the last 90 days.
   */
  getVisitCoverageReport(): Array<{
    constituencyId: string;
    constituencyName: string;
    visitsByQuarter: Record<number, number>;
    totalVisits: number;
    lastVisitDate: string | null;
    overdueFlag: boolean;
  }> {
    const now = Date.now();
    return MOCK_CONSTITUENCIES.map(c => {
      const cVisits = this.visits.filter(v => v.constituencyId === c.id && v.status === 'COMPLETED');
      const byQ: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const v of cVisits) {
        const q = quarterOf(v.visitDate || v.scheduledDate);
        byQ[q] = (byQ[q] || 0) + 1;
      }

      const sorted = [...cVisits].sort((a, b) =>
        new Date(b.visitDate || b.scheduledDate).getTime() - new Date(a.visitDate || a.scheduledDate).getTime()
      );
      const lastVisitDate = sorted[0]?.visitDate || sorted[0]?.scheduledDate || null;
      const daysSinceLast = lastVisitDate
        ? (now - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      return {
        constituencyId: c.id,
        constituencyName: c.name,
        visitsByQuarter: byQ,
        totalVisits: cVisits.length,
        lastVisitDate,
        overdueFlag: daysSinceLast > 90,
      };
    });
  }

  // ── Community Sessions (FR-OPS-006) ──────────────────────────────────────

  async getCommunitySessions(): Promise<CommunitySession[]> {
    return [...this.sessions];
  }

  async addCommunitySession(session: Omit<CommunitySession, 'id' | 'createdAt'>): Promise<CommunitySession> {
    const newSession: CommunitySession = {
      ...session,
      id: `cs${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.sessions.push(newSession);
    return newSession;
  }

  /** @deprecated use getCommunitySessions */
  async getCommunityMeetings() { return this.getCommunitySessions(); }
  /** @deprecated use addCommunitySession */
  async addCommunityMeeting(m: Omit<CommunitySession, 'id' | 'createdAt'>) { return this.addCommunitySession(m); }

  // ── Legacy full report (used by meService, EfficiencyDashboard) ──────────

  async getEfficiencyReport() {
    const applications = await loanService.getApplications();

    const workflowMetrics: WorkflowMetrics[] = applications
      .filter(app => app.status !== LoanApplicationStatus.APPLIED)
      .map(app => {
        const metrics: WorkflowMetrics = {
          applicationId: app.id,
          submissionDate: app.submissionDate,
          approvalDate: app.approvalDate,
          disbursementDate: app.disbursementDate,
        };
        if (app.approvalDate)
          metrics.approvalTurnaroundDays = differenceInDays(new Date(app.approvalDate), new Date(app.submissionDate));
        if (app.approvalDate && app.disbursementDate)
          metrics.disbursementTurnaroundDays = differenceInDays(new Date(app.disbursementDate), new Date(app.approvalDate));
        return metrics;
      });

    const avgApprovalTime =
      workflowMetrics.filter(m => m.approvalTurnaroundDays !== undefined)
        .reduce((acc, m) => acc + (m.approvalTurnaroundDays || 0), 0) /
      (workflowMetrics.filter(m => m.approvalTurnaroundDays !== undefined).length || 1);

    const avgDisbursementTime =
      workflowMetrics.filter(m => m.disbursementTurnaroundDays !== undefined)
        .reduce((acc, m) => acc + (m.disbursementTurnaroundDays || 0), 0) /
      (workflowMetrics.filter(m => m.disbursementTurnaroundDays !== undefined).length || 1);

    const totalAdminCost = this.adminCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalDisbursed = applications
      .filter(a => a.status === LoanApplicationStatus.FULLY_DISBURSED || a.status === LoanApplicationStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.amountApproved || 0), 0);
    const adminCostRatio = totalDisbursed > 0 ? (totalAdminCost / totalDisbursed) * 100 : 0;

    const uniqueConstituenciesInVisits = new Set(this.visits.map(v => v.constituencyId)).size;
    const totalAttendees = this.sessions.reduce((sum, s) => sum + s.attendeesCount, 0);

    return {
      avgApprovalTime,
      avgDisbursementTime,
      totalAdminCost,
      adminCostRatio,
      totalAttendees,
      visitCount: this.visits.length,
      meetingCount: this.sessions.length,
      coverageConstituencies: uniqueConstituenciesInVisits,
    };
  }

  async sendRepaymentReminders(): Promise<number> {
    return 0;
  }
}

export const efficiencyService = new EfficiencyService();
