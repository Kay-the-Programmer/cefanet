import { loanService } from '../../loans/api/loanService';
import { bursaryService } from '../../bursaries/api/bursaryService';
import { efficiencyService } from '../../monitoring/api/efficiencyService';
import { meService } from '../../monitoring/api/meService';
import { LoanApplicationStatus, FundingType } from '../../loans/types';
import { format, startOfQuarter, endOfQuarter, isWithinInterval, parseISO } from 'date-fns';
import { MOCK_REPAYMENTS, MOCK_LOAN_APPLICATIONS, MOCK_BURSARY_APPLICATIONS } from '../../../shared/api/mockData';

export interface ReportSection {
  title: string;
  data: any[];
  headers: string[];
}

export interface SystemReport {
  id: string;
  name: string;
  timestamp: string;
  period: string;
  sections: ReportSection[];
}

export interface ReportSchedule {
  id: string;
  reportName: string;
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  recipients: string; // comma-separated emails
  startAt: string;
  lastRunAt?: string;
  createdAt: string;
}

export interface ReportFilters {
  constituencyId?: string;
  startDate?: string;
  endDate?: string;
  programmeType?: string;
  gender?: string;
  beneficiaryCategory?: string;
  disbursementStatus?: string;
}

class ReportingService {
  /** FR-RPT-005: ad-hoc filtering on every dimension. */
  private applyFilters<T>(
    data: T[],
    filters: ReportFilters,
    dateField: keyof T,
    constituencyField: keyof T = 'constituencyId' as keyof T,
  ): T[] {
    return data.filter(itemT => {
      const item = itemT as unknown as Record<string, unknown>;
      const c = item[constituencyField as string];
      if (filters.constituencyId && filters.constituencyId !== 'ALL' && c !== filters.constituencyId) return false;
      const d = item[dateField as string] as string | undefined;
      if (filters.startDate && d && new Date(d) < new Date(filters.startDate)) return false;
      if (filters.endDate && d && new Date(d) > new Date(filters.endDate)) return false;

      if (filters.programmeType && filters.programmeType !== 'ALL') {
        const pt = item.fundingType as string | undefined;
        if (pt && pt !== filters.programmeType) return false;
      }
      if (filters.gender && filters.gender !== 'ALL') {
        const g = item.gender as string | undefined;
        if (g && g !== filters.gender) return false;
      }
      if (filters.beneficiaryCategory && filters.beneficiaryCategory !== 'ALL') {
        const cat = (item.demographicGroup ?? item.vulnerabilityCategory) as string | undefined;
        if (cat && cat !== filters.beneficiaryCategory) return false;
      }
      if (filters.disbursementStatus && filters.disbursementStatus !== 'ALL') {
        const s = item.status as string | undefined;
        if (s && s !== filters.disbursementStatus) return false;
      }
      return true;
    });
  }

  // ── FR-RPT-006: scheduled report delivery ──────────────────────────────
  private SCHEDULES_KEY = 'cdf_report_schedules';

  getSchedules(): ReportSchedule[] {
    try { return JSON.parse(localStorage.getItem(this.SCHEDULES_KEY) || '[]'); }
    catch { return []; }
  }

  saveSchedule(s: Omit<ReportSchedule, 'id' | 'createdAt' | 'lastRunAt'>): ReportSchedule {
    const schedules = this.getSchedules();
    const row: ReportSchedule = {
      ...s,
      id: `sched-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    schedules.unshift(row);
    localStorage.setItem(this.SCHEDULES_KEY, JSON.stringify(schedules));
    return row;
  }

  removeSchedule(id: string) {
    const schedules = this.getSchedules().filter(s => s.id !== id);
    localStorage.setItem(this.SCHEDULES_KEY, JSON.stringify(schedules));
  }

  /** Mock the scheduled job runner — fires any schedules whose nextRunAt has passed. */
  async runDueSchedules(): Promise<{ delivered: number }> {
    const schedules = this.getSchedules();
    const now = Date.now();
    let delivered = 0;
    for (const s of schedules) {
      const nextDue = s.lastRunAt
        ? new Date(s.lastRunAt).getTime() + this.intervalMs(s.cadence)
        : new Date(s.startAt).getTime();
      if (now >= nextDue) {
        // "Deliver" by writing to the email outbox + marking lastRunAt
        const recipients = s.recipients.split(',').map(r => r.trim()).filter(Boolean);
        for (const r of recipients) {
          try {
            const outbox = JSON.parse(localStorage.getItem('cdf_email_outbox') || '[]');
            outbox.unshift({
              to: r,
              subject: `[CDF Scheduled] ${s.reportName}`,
              body: `Your scheduled "${s.reportName}" report is attached.`,
              sentAt: new Date().toISOString(),
              type: 'SCHEDULED_REPORT',
            });
            localStorage.setItem('cdf_email_outbox', JSON.stringify(outbox.slice(0, 200)));
          } catch { /* */ }
          delivered++;
        }
        s.lastRunAt = new Date().toISOString();
      }
    }
    localStorage.setItem(this.SCHEDULES_KEY, JSON.stringify(schedules));
    return { delivered };
  }

  private intervalMs(cadence: ReportSchedule['cadence']): number {
    switch (cadence) {
      case 'DAILY':   return 24 * 60 * 60 * 1000;
      case 'WEEKLY':  return 7 * 24 * 60 * 60 * 1000;
      case 'MONTHLY': return 30 * 24 * 60 * 60 * 1000;
      case 'QUARTERLY': return 90 * 24 * 60 * 60 * 1000;
    }
  }

  async generateQuarterlyReport(year: number, quarter: 1 | 2 | 3 | 4, filters: ReportFilters = {}): Promise<SystemReport> {
    const start = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
    const end = endOfQuarter(start);
    const periodStr = `Q${quarter} ${year}`;

    const loans = await loanService.getApplications();
    const bursaries = await bursaryService.getApplications();
    const efficiency = await efficiencyService.getEfficiencyReport();

    // Filter by period
    let qLoans = loans.filter(l => isWithinInterval(new Date(l.submissionDate), { start, end }));
    let qBursaries = bursaries.filter(b => isWithinInterval(new Date(b.createdAt), { start, end }));

    qLoans = this.applyFilters(qLoans, filters, 'submissionDate');
    qBursaries = this.applyFilters(qBursaries, filters, 'createdAt');

    return {
      id: `rep-q-${Date.now()}`,
      name: 'Quarterly M&E Report',
      timestamp: new Date().toISOString(),
      period: periodStr,
      sections: [
        {
          title: 'Financial Interventions (Loans & Grants)',
          headers: ['Beneficiary', 'Type', 'Amount', 'Status'],
          data: qLoans.map(l => [
            l.applicantName,
            l.fundingType,
            `K${l.amountRequested.toLocaleString()}`,
            l.status
          ])
        },
        {
          title: 'Educational Support (Bursaries)',
          headers: ['Student', 'Institution', 'Status', 'Vulnerability'],
          data: qBursaries.map(b => [
            `${b.firstName} ${b.lastName}`,
            b.schoolName,
            b.status,
            b.vulnerabilityCategory
          ])
        },
        {
          title: 'Institutional Efficiency',
          headers: ['Metric', 'Performance'],
          data: [
            ['Avg. Approval Time', `${efficiency.avgApprovalTime.toFixed(1)} Days`],
            ['Admin Cost Ratio', `${efficiency.adminCostRatio.toFixed(2)}%`],
            ['Transparency Score', `${(100 - efficiency.adminCostRatio).toFixed(1)}%`]
          ]
        }
      ]
    };
  }

  async generateAnnualImpactReport(filters: ReportFilters = {}): Promise<SystemReport> {
    const meData = await meService.getMeDashboardData();
    
    return {
      id: `rep-sdg-${Date.now()}`,
      name: 'Annual Impact Report (SDG)',
      timestamp: new Date().toISOString(),
      period: 'Annual Progress',
      sections: [
        {
          title: 'Global Goal Contributions',
          headers: ['Goal', 'Impact Metric', 'Compliance'],
          data: meData.analytics.sdgImpact.map(s => [s.sdg, s.label, `${s.metric}%`])
        },
        {
          title: 'Inclusive Development Index',
          headers: ['Category', 'Representation'],
          data: meData.demographics.map(d => [d.name, `${d.value}%`])
        }
      ]
    };
  }

  async generateDisbursementReport(filters: ReportFilters = {}): Promise<SystemReport> {
    const loans = await loanService.getApplications();
    let dLoans = loans.filter(l => l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED);
    dLoans = this.applyFilters(dLoans, filters, 'disbursementDate');

    return {
      id: `rep-disb-${Date.now()}`,
      name: 'Disbursement Reconciliation Report',
      timestamp: new Date().toISOString(),
      period: 'Ad Hoc',
      sections: [
        {
          title: 'Disbursed Funds',
          headers: ['Reference', 'Beneficiary', 'Date', 'Amount', 'Type'],
          data: dLoans.map(l => [
            l.disbursementReference || 'N/A',
            l.applicantName,
            l.disbursementDate ? format(new Date(l.disbursementDate), 'yyyy-MM-dd') : 'N/A',
            `K${(l.amountApproved || 0).toLocaleString()}`,
            l.fundingType
          ])
        }
      ]
    };
  }

  async generateLoanRepaymentReport(filters: ReportFilters = {}): Promise<SystemReport> {
    let repayments = MOCK_REPAYMENTS;
    const loans = MOCK_LOAN_APPLICATIONS;

    // Apply basic filters
    if (filters.startDate) repayments = repayments.filter(r => new Date(r.paymentDate) >= new Date(filters.startDate!));
    if (filters.endDate) repayments = repayments.filter(r => new Date(r.paymentDate) <= new Date(filters.endDate!));

    return {
      id: `rep-rep-${Date.now()}`,
      name: 'Loan Repayment Status Report',
      timestamp: new Date().toISOString(),
      period: 'Ad Hoc',
      sections: [
        {
          title: 'Repayment Transactions',
          headers: ['Receipt Ref', 'Loan ID', 'Payment Date', 'Amount'],
          data: repayments.map(r => [
            r.reference,
            r.loanId,
            format(new Date(r.paymentDate), 'yyyy-MM-dd'),
            `K${r.amount.toLocaleString()}`
          ])
        }
      ]
    };
  }

  async generateBeneficiaryReport(filters: ReportFilters = {}): Promise<SystemReport> {
    const loans = await loanService.getApplications();
    const bursaries = await bursaryService.getApplications();
    
    let fLoans = this.applyFilters(loans, filters, 'createdAt');
    let fBursaries = this.applyFilters(bursaries, filters, 'createdAt');

    return {
      id: `rep-ben-${Date.now()}`,
      name: 'Beneficiary Disaggregation Report',
      timestamp: new Date().toISOString(),
      period: 'Ad Hoc',
      sections: [
        {
          title: 'Loans/Grants Demographics',
          headers: ['Beneficiary', 'Category', 'Sector'],
          data: fLoans.map(l => [l.applicantName, l.demographicGroup, l.businessSector])
        },
        {
          title: 'Bursaries Demographics',
          headers: ['Student', 'Gender', 'Vulnerability'],
          data: fBursaries.map(b => [`${b.firstName} ${b.lastName}`, b.gender, b.vulnerabilityCategory])
        }
      ]
    };
  }
}

export const reportingService = new ReportingService();
