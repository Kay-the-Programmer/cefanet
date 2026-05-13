import {
  LoanGrantApplication,
  LoanRepayment,
  LoanApplicationStatus,
  FundingType,
  LOAN_STATUS_FLOW,
  RepaymentSchedule,
  InstallmentStatus,
} from '../types';
import { BusinessMonitoring } from '../../monitoring/types';
import { NotificationType } from '../../notifications/types';
import {
  MOCK_LOAN_APPLICATIONS,
  MOCK_REPAYMENTS,
  MOCK_BUSINESS_MONITORING,
  MOCK_CONSTITUENCIES,
} from '../../../shared/api/mockData';
import { notificationService } from '../../notifications/api/notificationService';
import { logAudit, AuditAction } from '../../monitoring/api/auditService';

const NEXT_STATUS: Partial<Record<LoanApplicationStatus, LoanApplicationStatus>> = {
  [LoanApplicationStatus.APPLIED]: LoanApplicationStatus.UNDER_REVIEW,
  [LoanApplicationStatus.UNDER_REVIEW]: LoanApplicationStatus.APPROVED,
  [LoanApplicationStatus.APPROVED]: LoanApplicationStatus.PARTIALLY_DISBURSED,
  [LoanApplicationStatus.PARTIALLY_DISBURSED]: LoanApplicationStatus.FULLY_DISBURSED,
  [LoanApplicationStatus.FULLY_DISBURSED]: LoanApplicationStatus.ACTIVE,
  [LoanApplicationStatus.ACTIVE]: LoanApplicationStatus.COMPLETED,
};

/** Days window around the 6/12-month mark to trigger a reminder */
const REMINDER_WINDOW_DAYS = 7;

class LoanService {
  private applications: LoanGrantApplication[] = [...MOCK_LOAN_APPLICATIONS];
  private repayments: LoanRepayment[] = [...MOCK_REPAYMENTS];
  private monitoring: BusinessMonitoring[] = [...MOCK_BUSINESS_MONITORING];
  private schedules: RepaymentSchedule[] = [];

  // ── Applications ──────────────────────────────────────────────────────────

  async getApplications(constituencyId?: string): Promise<LoanGrantApplication[]> {
    if (constituencyId) return this.applications.filter(a => a.constituencyId === constituencyId);
    return [...this.applications];
  }

  async getApplicationById(id: string): Promise<LoanGrantApplication | undefined> {
    return this.applications.find(a => a.id === id);
  }

  async createApplication(
    input: Omit<LoanGrantApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<LoanGrantApplication> {
    const monthlyInstallment = input.fundingType === FundingType.LOAN && input.amountApproved && input.repaymentPeriod
      ? (input.amountApproved * (1 + (input.interestRate ?? 0) / 100)) / input.repaymentPeriod
      : undefined;

    const app: LoanGrantApplication = {
      ...input,
      id: `la${Date.now()}`,
      status: LoanApplicationStatus.APPLIED,
      monthlyInstallment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applications.push(app);
    await logAudit(AuditAction.CREATE, 'LoanGrantApplication', app.id, {
      module: 'loans',
      newValue: { applicantName: app.applicantName, businessName: app.businessName, amount: app.amountRequested },
      description: `${app.fundingType} application for ${app.businessName} submitted`,
    });
    return app;
  }

  async advanceStatus(
    id: string,
    opts?: { amountApproved?: number; notes?: string; disbursementReference?: string; reviewedBy?: string }
  ): Promise<LoanGrantApplication | undefined> {
    const idx = this.applications.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    const app = this.applications[idx];
    const next = NEXT_STATUS[app.status];
    if (!next) return undefined;

    const monthlyInstallment =
      next === LoanApplicationStatus.PARTIALLY_DISBURSED && opts?.amountApproved && app.repaymentPeriod
        ? (opts.amountApproved * (1 + (app.interestRate ?? 0) / 100)) / app.repaymentPeriod
        : app.monthlyInstallment;

    this.applications[idx] = {
      ...app,
      status: next,
      updatedAt: new Date().toISOString(),
      ...(opts?.amountApproved !== undefined && { amountApproved: opts.amountApproved }),
      ...(monthlyInstallment !== undefined && { monthlyInstallment }),
      ...(next === LoanApplicationStatus.APPROVED && { approvalDate: new Date().toISOString() }),
      ...(next === LoanApplicationStatus.FULLY_DISBURSED && { disbursementDate: new Date().toISOString() }),
      ...(opts?.disbursementReference && { disbursementReference: opts.disbursementReference }),
    };

    if (next === LoanApplicationStatus.APPROVED) {
      await notificationService.sendNotification({
        userId: app.beneficiaryId,
        title: 'Application Approved',
        message: `Your ${app.fundingType.toLowerCase()} application for "${app.businessName}" has been approved.`,
        type: NotificationType.APPLICATION_APPROVED,
        link: '/loans',
      });
    }

    await logAudit(AuditAction.UPDATE, 'LoanGrantApplication', id, {
      module: 'loans',
      fieldChanged: 'status',
      oldValue: app.status,
      newValue: next,
      description: `Loan status: ${app.status} → ${next}`,
    });

    // Auto-generate installment schedule on full disbursement
    if (next === LoanApplicationStatus.FULLY_DISBURSED && app.fundingType === FundingType.LOAN) {
      this.generateSchedule(id);
    }

    return this.applications[idx];
  }

  async rejectApplication(id: string, notes?: string): Promise<LoanGrantApplication | undefined> {
    const idx = this.applications.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    const app = this.applications[idx];
    this.applications[idx] = { ...app, status: LoanApplicationStatus.REJECTED, updatedAt: new Date().toISOString() };
    await notificationService.sendNotification({
      userId: app.beneficiaryId,
      title: 'Application Rejected',
      message: `Your application for "${app.businessName}" was not approved. ${notes ? `Reason: ${notes}` : ''}`,
      type: NotificationType.APPLICATION_REJECTED,
    });
    return this.applications[idx];
  }

  async markDefaulted(id: string): Promise<LoanGrantApplication | undefined> {
    const idx = this.applications.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.applications[idx] = { ...this.applications[idx], status: LoanApplicationStatus.DEFAULTED, updatedAt: new Date().toISOString() };
    return this.applications[idx];
  }

  getConstituencies() {
    return MOCK_CONSTITUENCIES;
  }

  // ── Repayments (FR-LOAN-004) ──────────────────────────────────────────────

  async getRepayments(loanId?: string): Promise<LoanRepayment[]> {
    return loanId ? this.repayments.filter(r => r.loanId === loanId) : [...this.repayments];
  }

  async addRepayment(repayment: Omit<LoanRepayment, 'id' | 'createdAt'>): Promise<LoanRepayment> {
    const r: LoanRepayment = { ...repayment, id: `lr${Date.now()}`, createdAt: new Date().toISOString() };
    this.repayments.push(r);
    await logAudit(AuditAction.CREATE, 'LoanRepayment', r.id, {
      module: 'loans',
      newValue: { amount: r.amount, reference: r.reference, loanId: r.loanId },
      description: `Repayment of ZMW ${r.amount.toLocaleString()} recorded for loan ${r.loanId}`,
    });

    // Re-apply against the per-installment schedule
    if (this.schedules.some(s => s.loanId === r.loanId)) {
      this.applyRepaymentsToSchedule(r.loanId);
    }

    // Auto-complete if fully repaid
    const loan = this.applications.find(a => a.id === repayment.loanId);
    if (loan?.amountApproved) {
      const totalRepaid = this.repayments.filter(x => x.loanId === loan.id).reduce((s, x) => s + x.amount, 0);
      if (totalRepaid >= loan.amountApproved && loan.status === LoanApplicationStatus.ACTIVE) {
        const idx = this.applications.findIndex(a => a.id === loan.id);
        this.applications[idx] = { ...this.applications[idx], status: LoanApplicationStatus.COMPLETED, updatedAt: new Date().toISOString() };
      }
    }
    return r;
  }

  /**
   * FR-LOAN-004: Calculate outstanding balance for a loan.
   * Returns { totalRepaid, outstanding, overdueAmount, repaymentRate }
   */
  getRepaymentSummary(loanId: string) {
    const loan = this.applications.find(a => a.id === loanId);
    if (!loan || !loan.amountApproved) return null;

    const loanRepayments = this.repayments.filter(r => r.loanId === loanId);
    const totalRepaid = loanRepayments.reduce((s, r) => s + r.amount, 0);
    const outstanding = Math.max(0, loan.amountApproved - totalRepaid);
    const repaymentRate = (totalRepaid / loan.amountApproved) * 100;

    // Overdue: months elapsed × monthly installment - total repaid
    let overdueAmount = 0;
    if (loan.disbursementDate && loan.monthlyInstallment) {
      const monthsElapsed = Math.floor(
        (Date.now() - new Date(loan.disbursementDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      const expectedByNow = Math.min(monthsElapsed, loan.repaymentPeriod ?? 0) * loan.monthlyInstallment;
      overdueAmount = Math.max(0, expectedByNow - totalRepaid);
    }

    return { totalRepaid, outstanding, overdueAmount, repaymentRate };
  }

  /** FR-LOAN-004: All loans with overdue balance > 0. */
  getOverdueLoans(): LoanGrantApplication[] {
    return this.applications.filter(a => {
      if (a.fundingType !== FundingType.LOAN) return false;
      if (![LoanApplicationStatus.ACTIVE, LoanApplicationStatus.FULLY_DISBURSED].includes(a.status)) return false;
      const summary = this.getRepaymentSummary(a.id);
      return summary ? summary.overdueAmount > 0 : false;
    });
  }

  // ── Business monitoring (FR-LOAN-005) ────────────────────────────────────

  async getMonitoring(beneficiaryId?: string): Promise<BusinessMonitoring[]> {
    return beneficiaryId ? this.monitoring.filter(m => m.beneficiaryId === beneficiaryId) : [...this.monitoring];
  }

  async addMonitoring(data: Omit<BusinessMonitoring, 'id' | 'createdAt'>): Promise<BusinessMonitoring> {
    const m: BusinessMonitoring = { ...data, id: `bm${Date.now()}`, createdAt: new Date().toISOString() };
    this.monitoring.push(m);
    return m;
  }

  // ── FR-LOAN-007: 6-month and 12-month follow-up reminders ────────────────

  /**
   * Returns disbursed loans whose disbursement date is within ±7 days of the
   * 6-month or 12-month mark and have not yet had a monitoring record at that stage.
   */
  getFollowUpsDue(): Array<{ loan: LoanGrantApplication; milestone: 6 | 12 }> {
    const now = Date.now();
    const result: Array<{ loan: LoanGrantApplication; milestone: 6 | 12 }> = [];

    const disbursedStatuses: LoanApplicationStatus[] = [
      LoanApplicationStatus.ACTIVE,
      LoanApplicationStatus.FULLY_DISBURSED,
      LoanApplicationStatus.PARTIALLY_DISBURSED,
    ];

    for (const loan of this.applications) {
      if (!disbursedStatuses.includes(loan.status) || !loan.disbursementDate) continue;

      const disbMs = new Date(loan.disbursementDate).getTime();
      const monitoringForLoan = this.monitoring.filter(m => m.loanId === loan.id);

      for (const milestone of [6, 12] as const) {
        const milestoneMs = disbMs + milestone * 30 * 24 * 60 * 60 * 1000;
        const diffDays = Math.abs(now - milestoneMs) / (24 * 60 * 60 * 1000);

        if (diffDays <= REMINDER_WINDOW_DAYS) {
          // Check if a monitoring record at this survivalMonths mark already exists
          const alreadyDone = monitoringForLoan.some(m => m.survivalMonths === milestone);
          if (!alreadyDone) result.push({ loan, milestone });
        }
      }
    }
    return result;
  }

  // ── Reports (FR-LOAN-003) ─────────────────────────────────────────────────

  async getReportData(filters?: { constituencyId?: string; demographicGroup?: string; fundingType?: string }) {
    let disbursed = this.applications.filter(a =>
      a.status === LoanApplicationStatus.ACTIVE ||
      a.status === LoanApplicationStatus.FULLY_DISBURSED ||
      a.status === LoanApplicationStatus.PARTIALLY_DISBURSED ||
      a.status === LoanApplicationStatus.COMPLETED ||
      a.status === LoanApplicationStatus.DEFAULTED
    );

    if (filters?.constituencyId && filters.constituencyId !== 'all')
      disbursed = disbursed.filter(a => a.constituencyId === filters.constituencyId);
    if (filters?.demographicGroup && filters.demographicGroup !== 'all')
      disbursed = disbursed.filter(a => a.demographicGroup === filters.demographicGroup);
    if (filters?.fundingType && filters.fundingType !== 'all')
      disbursed = disbursed.filter(a => a.fundingType === filters.fundingType);

    const disbursedIds = new Set(disbursed.map(a => a.id));
    const filteredMonitoring = this.monitoring.filter(m => m.loanId && disbursedIds.has(m.loanId));
    const filteredRepayments = this.repayments.filter(r => disbursedIds.has(r.loanId));

    const totalDisbursed = disbursed.reduce((s, a) => s + (a.amountApproved || 0), 0);
    const avgLoanSize = totalDisbursed / (disbursed.length || 1);

    // FR-LOAN-003: category proportions
    const proportions: Record<string, number> = {};
    for (const a of disbursed) {
      proportions[a.demographicGroup] = (proportions[a.demographicGroup] || 0) + 1;
    }

    // FR-LOAN-003: quarterly disbursements
    const quarterly: Record<string, { count: number; amount: number }> = { Q1: { count: 0, amount: 0 }, Q2: { count: 0, amount: 0 }, Q3: { count: 0, amount: 0 }, Q4: { count: 0, amount: 0 } };
    for (const a of disbursed) {
      if (a.disbursementDate) {
        const q = `Q${Math.floor(new Date(a.disbursementDate).getMonth() / 3) + 1}`;
        quarterly[q].count += 1;
        quarterly[q].amount += a.amountApproved || 0;
      }
    }

    // FR-LOAN-004: repayment rate
    const loansOnly = disbursed.filter(a => a.fundingType === FundingType.LOAN);
    const totalLoanAmount = loansOnly.reduce((s, a) => s + (a.amountApproved || 0), 0);
    const totalRepaid = filteredRepayments.reduce((s, r) => s + r.amount, 0);
    const repaymentRate = totalLoanAmount > 0 ? (totalRepaid / totalLoanAmount) * 100 : 0;

    // FR-LOAN-005: business survival
    const activeMonitored = filteredMonitoring.filter(m => m.businessStatus === 'ACTIVE').length;
    const survivalRate = filteredMonitoring.length > 0 ? (activeMonitored / filteredMonitoring.length) * 100 : 0;

    // FR-LOAN-006: aggregated jobs breakdown
    const jobs = filteredMonitoring.reduce((acc, m) => {
      const b = m.jobsBreakdown;
      acc.female += b?.female || 0;
      acc.male += b?.male || 0;
      acc.youth += b?.youth || 0;
      acc.adult += b?.adult || 0;
      acc.pwd += b?.pwd || 0;
      acc.nonPwd += b?.nonPwd || 0;
      acc.fullTime += b?.fullTime || 0;
      acc.partTime += b?.partTime || 0;
      acc.seasonal += b?.seasonal || 0;
      acc.total += m.jobsCreated || 0;
      return acc;
    }, { female: 0, male: 0, youth: 0, adult: 0, pwd: 0, nonPwd: 0, fullTime: 0, partTime: 0, seasonal: 0, total: 0 });

    const improvedIncome = filteredMonitoring.filter(m => m.householdIncomeImproved).length;
    const sdg1Rate = filteredMonitoring.length > 0 ? (improvedIncome / filteredMonitoring.length) * 100 : 0;

    const overdueCount = this.getOverdueLoans().length;

    return {
      totalDisbursed,
      avgLoanSize,
      disbursementCount: disbursed.length,
      proportions,
      quarterly,
      repaymentRate,
      totalRepaid,
      overdueCount,
      survivalRate,
      sdg1Rate,
      jobs,
      totalApplications: this.applications.length,
    };
  }

  // ── Per-installment schedule (spec 5.4 repayment_records) ────────────────

  /**
   * Generate a flat installment schedule for a loan when it becomes ACTIVE/FULLY_DISBURSED.
   * Idempotent — does nothing if a schedule already exists.
   */
  generateSchedule(loanId: string): RepaymentSchedule[] {
    const existing = this.schedules.filter(s => s.loanId === loanId);
    if (existing.length > 0) return existing;

    const loan = this.applications.find(a => a.id === loanId);
    if (!loan || !loan.amountApproved || !loan.repaymentPeriod || !loan.disbursementDate) return [];

    const installmentAmount = loan.monthlyInstallment ?? (loan.amountApproved / loan.repaymentPeriod);
    const start = new Date(loan.disbursementDate);
    const rows: RepaymentSchedule[] = [];
    for (let i = 1; i <= loan.repaymentPeriod; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      rows.push({
        id: `sch-${loanId}-${i}`,
        loanId,
        installmentNumber: i,
        installmentDueDate: due.toISOString(),
        amountDue: installmentAmount,
        amountPaid: 0,
        status: 'PENDING',
      });
    }
    this.schedules.push(...rows);
    this.applyRepaymentsToSchedule(loanId);
    return rows;
  }

  /** Apply existing recorded repayments against the schedule, oldest installment first. */
  private applyRepaymentsToSchedule(loanId: string) {
    const sched = this.schedules.filter(s => s.loanId === loanId).sort((a, b) => a.installmentNumber - b.installmentNumber);
    const payments = [...this.repayments.filter(r => r.loanId === loanId)].sort((a, b) =>
      new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

    let remainingByPayment = payments.map(p => p.amount);
    sched.forEach(s => { s.amountPaid = 0; s.paymentDate = undefined; s.paymentReference = undefined; });

    for (const s of sched) {
      let need = s.amountDue;
      for (let i = 0; i < remainingByPayment.length && need > 0; i++) {
        if (remainingByPayment[i] <= 0) continue;
        const take = Math.min(remainingByPayment[i], need);
        remainingByPayment[i] -= take;
        s.amountPaid += take;
        need -= take;
        if (!s.paymentDate) {
          s.paymentDate = payments[i].paymentDate;
          s.paymentReference = payments[i].reference;
        }
      }
    }

    const now = Date.now();
    sched.forEach(s => {
      const due = new Date(s.installmentDueDate).getTime();
      if (s.amountPaid >= s.amountDue) s.status = 'PAID';
      else if (s.amountPaid > 0 && due < now) s.status = 'OVERDUE';
      else if (s.amountPaid > 0) s.status = 'PARTIALLY_PAID';
      else if (due < now) s.status = 'OVERDUE';
      else s.status = 'PENDING';
    });
  }

  getSchedule(loanId: string): RepaymentSchedule[] {
    if (this.schedules.filter(s => s.loanId === loanId).length === 0) {
      this.generateSchedule(loanId);
    } else {
      this.applyRepaymentsToSchedule(loanId);
    }
    return this.schedules.filter(s => s.loanId === loanId).sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  /** All overdue installments across all loans — used by the dashboard. */
  getOverdueInstallments(): Array<RepaymentSchedule & { loan: LoanGrantApplication }> {
    // Ensure schedules are generated for every funded loan
    this.applications
      .filter(a => a.fundingType === FundingType.LOAN && a.disbursementDate)
      .forEach(a => this.getSchedule(a.id));

    return this.schedules
      .filter(s => s.status === 'OVERDUE')
      .map(s => ({ ...s, loan: this.applications.find(a => a.id === s.loanId)! }))
      .filter(x => x.loan);
  }

  async sendRepaymentReminders(): Promise<number> {
    const activeLoans = this.applications.filter(
      a => a.status === LoanApplicationStatus.ACTIVE && a.fundingType === FundingType.LOAN
    );
    let count = 0;
    for (const loan of activeLoans) {
      await notificationService.sendNotification({
        userId: loan.beneficiaryId,
        title: 'Repayment Reminder',
        message: `A repayment for "${loan.businessName}" is due soon.`,
        type: NotificationType.REPAYMENT_REMINDER,
        link: '/loans',
      });
      count++;
    }
    return count;
  }
}

export const loanService = new LoanService();
