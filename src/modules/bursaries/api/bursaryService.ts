import {
  BursaryApplication,
  BursaryApplicationStatus,
  BursaryDisbursement,
  StudentProgress,
  ContinuationStatus,
  VulnerabilityCategory,
  AcademicYear,
  PaymentMethodBursary,
} from '../types';
import { Gender } from '../../../shared/types/auth';
import {
  MOCK_BURSARY_APPLICATIONS,
  MOCK_STUDENT_PROGRESS,
  MOCK_BURSARY_DISBURSEMENTS,
  MOCK_CONSTITUENCIES,
} from '../../../shared/api/mockData';
import { logAudit, AuditAction } from '../../monitoring/api/auditService';

const CURRENT_FISCAL_YEAR = '2025/2026';
/** Academic year start: 1 February. 60-day alert fires if it's past 1 April and no progress recorded this year. */
const ACADEMIC_YEAR_START_MONTH = 1; // February (0-indexed)
const ALERT_THRESHOLD_DAYS = 60;

class BursaryService {
  private applications: BursaryApplication[] = [...MOCK_BURSARY_APPLICATIONS];
  private progress: StudentProgress[] = [...MOCK_STUDENT_PROGRESS];
  private disbursements: BursaryDisbursement[] = [...MOCK_BURSARY_DISBURSEMENTS];

  // ── Applications ──────────────────────────────────────────────────────────

  async getApplications(constituencyId?: string): Promise<BursaryApplication[]> {
    if (constituencyId) return this.applications.filter(a => a.constituencyId === constituencyId);
    return this.applications;
  }

  async getApplicationById(id: string): Promise<BursaryApplication | undefined> {
    return this.applications.find(a => a.id === id);
  }

  async saveApplication(
    input: Omit<BursaryApplication, 'id' | 'createdAt' | 'updatedAt'>,
    asDraft = false
  ): Promise<BursaryApplication> {
    const newApp: BursaryApplication = {
      ...input,
      id: `ba${Date.now()}`,
      status: asDraft ? BursaryApplicationStatus.DRAFT : BursaryApplicationStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applications.push(newApp);
    await logAudit(AuditAction.CREATE, 'BursaryApplication', newApp.id, {
      module: 'bursary',
      newValue: { firstName: newApp.firstName, lastName: newApp.lastName, status: newApp.status },
      description: `Bursary application ${asDraft ? 'saved as draft' : 'submitted'} for ${newApp.firstName} ${newApp.lastName}`,
    });
    return newApp;
  }

  /** Advance (or set) a bursary through its workflow. */
  async updateStatus(
    id: string,
    status: BursaryApplicationStatus,
    opts?: { allocatedAmount?: number; reviewNotes?: string; reviewedBy?: string }
  ): Promise<BursaryApplication> {
    const idx = this.applications.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Application not found');
    const oldStatus = this.applications[idx].status;
    this.applications[idx] = {
      ...this.applications[idx],
      status,
      ...(opts?.allocatedAmount !== undefined && { allocatedAmount: opts.allocatedAmount }),
      ...(opts?.reviewNotes !== undefined && { reviewNotes: opts.reviewNotes }),
      ...(opts?.reviewedBy !== undefined && { reviewedBy: opts.reviewedBy }),
      actionDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await logAudit(AuditAction.UPDATE, 'BursaryApplication', id, {
      module: 'bursary',
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: status,
      description: `Bursary status: ${oldStatus} → ${status}`,
    });
    return this.applications[idx];
  }

  // ── Bulk CSV import (FR-BUR-006) ──────────────────────────────────────────

  /**
   * Parse a CSV string using the standard template columns and import records.
   * Columns (header row required):
   * firstName,lastName,nrcNumber,gender,vulnerabilityCategory,guardianName,guardianPhone,
   * guardianRelation,schoolName,schoolType,academicYear,courseOfStudy,requestedAmount,
   * constituencyId,fiscalYear,quarter
   */
  importFromCSV(csv: string, submittedBy: string): { imported: number; errors: string[] } {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return { imported: 0, errors: ['CSV file is empty or has no data rows.'] };

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['firstname', 'lastname', 'nrcnumber', 'gender', 'vulnerabilitycategory',
      'guardianname', 'guardianphone', 'guardianrelation', 'schoolname', 'schooltype',
      'academicyear', 'courseofstudy', 'requestedamount', 'constituencyid'];
    const missingHeaders = required.filter(r => !headers.includes(r));
    if (missingHeaders.length > 0) {
      return { imported: 0, errors: [`Missing required columns: ${missingHeaders.join(', ')}`] };
    }

    const get = (row: string[], col: string) => {
      const i = headers.indexOf(col);
      return i >= 0 ? (row[i] ?? '').trim() : '';
    };

    let imported = 0;
    const errors: string[] = [];

    lines.slice(1).forEach((line, idx) => {
      const lineNo = idx + 2;
      if (!line.trim()) return;
      const row = line.split(',');
      const firstName = get(row, 'firstname');
      const lastName = get(row, 'lastname');
      const nrcNumber = get(row, 'nrcnumber');
      const gender = get(row, 'gender').toUpperCase() as Gender;
      const vuln = get(row, 'vulnerabilitycategory').toUpperCase() as VulnerabilityCategory;
      const amount = parseFloat(get(row, 'requestedamount'));
      const constituencyId = get(row, 'constituencyid');

      if (!firstName || !lastName) { errors.push(`Row ${lineNo}: firstName and lastName are required.`); return; }
      if (!Object.values(Gender).includes(gender)) { errors.push(`Row ${lineNo}: invalid gender "${gender}".`); return; }
      if (!Object.values(VulnerabilityCategory).includes(vuln)) { errors.push(`Row ${lineNo}: invalid vulnerability category.`); return; }
      if (isNaN(amount) || amount <= 0) { errors.push(`Row ${lineNo}: invalid requestedAmount.`); return; }
      if (!MOCK_CONSTITUENCIES.find(c => c.id === constituencyId)) {
        errors.push(`Row ${lineNo}: unknown constituencyId "${constituencyId}".`); return;
      }

      const yearRaw = get(row, 'academicyear').toUpperCase().replace(' ', '_');
      const academicYear = Object.values(AcademicYear).includes(yearRaw as AcademicYear)
        ? (yearRaw as AcademicYear) : AcademicYear.YEAR_1;

      this.applications.push({
        id: `ba${Date.now()}-${idx}`,
        studentId: submittedBy,
        firstName,
        lastName,
        nrcNumber,
        gender,
        vulnerabilityCategory: vuln,
        guardianName: get(row, 'guardianname'),
        guardianPhone: get(row, 'guardianphone'),
        guardianRelation: get(row, 'guardianrelation'),
        schoolName: get(row, 'schoolname'),
        schoolType: get(row, 'schooltype') || 'University',
        academicYear,
        courseOfStudy: get(row, 'courseofstudy'),
        requestedAmount: amount,
        status: BursaryApplicationStatus.SUBMITTED,
        constituencyId,
        quarter: parseInt(get(row, 'quarter')) || 1,
        fiscalYear: get(row, 'fiscalyear') || CURRENT_FISCAL_YEAR,
        startFiscalYear: get(row, 'fiscalyear') || CURRENT_FISCAL_YEAR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      imported++;
    });

    return { imported, errors };
  }

  /** Generate a downloadable CSV template string. */
  csvTemplate(): string {
    const headers = [
      'firstName', 'lastName', 'nrcNumber', 'gender', 'vulnerabilityCategory',
      'guardianName', 'guardianPhone', 'guardianRelation', 'schoolName', 'schoolType',
      'academicYear', 'courseOfStudy', 'requestedAmount', 'constituencyId', 'fiscalYear', 'quarter',
    ];
    const example = [
      'Jane', 'Banda', '123456/78/1', 'FEMALE', 'ORPHAN',
      'Mary Banda', '+260971234567', 'Aunt', 'University of Zambia', 'University',
      'YEAR_1', 'Law', '15000', 'c1', '2025/2026', '1',
    ];
    return [headers.join(','), example.join(',')].join('\n');
  }

  // ── Disbursements (FR-BUR-007) ─────────────────────────────────────────────

  async getDisbursements(bursaryApplicationId: string): Promise<BursaryDisbursement[]> {
    return this.disbursements.filter(d => d.bursaryApplicationId === bursaryApplicationId);
  }

  async recordDisbursement(input: Omit<BursaryDisbursement, 'id' | 'createdAt'>): Promise<BursaryDisbursement> {
    const d: BursaryDisbursement = {
      ...input,
      id: `bd${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.disbursements.push(d);
    await logAudit(AuditAction.CREATE, 'BursaryDisbursement', d.id, {
      module: 'bursary',
      newValue: { amount: d.amount, reference: d.referenceNumber },
      description: `Disbursement of ZMW ${d.amount.toLocaleString()} recorded for bursary ${d.bursaryApplicationId}`,
    });
    return d;
  }

  // ── Student progress / retention (FR-BUR-004) ─────────────────────────────

  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    return this.progress.filter(p => p.studentId === studentId);
  }

  async recordProgress(input: Omit<StudentProgress, 'id' | 'lastUpdated'>): Promise<StudentProgress> {
    const p: StudentProgress = {
      ...input,
      id: `sp${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    this.progress.push(p);
    return p;
  }

  /**
   * FR-BUR-008: Return applications where the student is ACTIVE/APPROVED but has no
   * progress record for the current fiscal year and the academic year started > 60 days ago.
   */
  getOverdueStatusConfirmations(): BursaryApplication[] {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), ACADEMIC_YEAR_START_MONTH, 1);
    const daysSinceStart = Math.floor((now.getTime() - yearStart.getTime()) / 86_400_000);
    if (daysSinceStart < ALERT_THRESHOLD_DAYS) return [];

    const activeStatuses: BursaryApplicationStatus[] = [
      BursaryApplicationStatus.ACTIVE,
      BursaryApplicationStatus.APPROVED,
      BursaryApplicationStatus.DISBURSED,
    ];

    return this.applications.filter(app => {
      if (!activeStatuses.includes(app.status)) return false;
      const hasCurrentYearProgress = this.progress.some(
        p => p.studentId === app.studentId && p.fiscalYear === CURRENT_FISCAL_YEAR
      );
      return !hasCurrentYearProgress;
    });
  }

  // ── KPI stats (FR-BUR-003, FR-BUR-004, FR-BUR-005) ───────────────────────

  async getBursaryStats(constituencyId?: string) {
    const apps = constituencyId
      ? this.applications.filter(a => a.constituencyId === constituencyId)
      : this.applications;

    const awarded = apps.filter(
      a => a.status === BursaryApplicationStatus.APPROVED ||
           a.status === BursaryApplicationStatus.DISBURSED ||
           a.status === BursaryApplicationStatus.ACTIVE ||
           a.status === BursaryApplicationStatus.GRADUATED
    );

    // FR-BUR-003: awards per quarter
    const awardsPerQuarter = [1, 2, 3, 4].map(q => ({
      quarter: `Q${q}`,
      count: awarded.filter(a => a.quarter === q).length,
    }));

    // FR-BUR-003: gender distribution
    const genderDist = Object.values(Gender).map(g => ({
      name: g.charAt(0) + g.slice(1).toLowerCase(),
      value: awarded.filter(a => a.gender === g).length,
    }));

    // FR-BUR-003: vulnerability category proportions (counts each category in the multi-select array)
    const vulnerableDist = Object.values(VulnerabilityCategory).map(cat => ({
      category: cat.replace(/_/g, ' '),
      count: awarded.filter(a => {
        const cats = a.vulnerabilityCategories ?? [a.vulnerabilityCategory];
        return cats.includes(cat);
      }).length,
    }));

    // FR-BUR-004: retention rate
    const prevYearApps = apps.filter(
      a => a.fiscalYear !== CURRENT_FISCAL_YEAR && (
        a.status === BursaryApplicationStatus.ACTIVE ||
        a.status === BursaryApplicationStatus.APPROVED ||
        a.status === BursaryApplicationStatus.DISBURSED ||
        a.status === BursaryApplicationStatus.GRADUATED
      )
    );
    const prevStudentIds = new Set(prevYearApps.map(a => a.studentId));
    const continuingIds = new Set(
      this.progress
        .filter(p => p.continuationStatus === ContinuationStatus.CONTINUING && p.fiscalYear === CURRENT_FISCAL_YEAR)
        .map(p => p.studentId)
    );
    const retentionRate = prevStudentIds.size > 0
      ? ([...prevStudentIds].filter(id => continuingIds.has(id)).length / prevStudentIds.size) * 100
      : 0;

    // FR-BUR-005: completion rate by cohort (startFiscalYear)
    const cohorts = [...new Set(apps.map(a => a.startFiscalYear))].sort();
    const completionByCohort = cohorts.map(yr => {
      const cohortApps = apps.filter(a => a.startFiscalYear === yr);
      const graduated = cohortApps.filter(a => a.status === BursaryApplicationStatus.GRADUATED).length;
      return { cohort: yr, total: cohortApps.length, graduated, rate: cohortApps.length > 0 ? Math.round((graduated / cohortApps.length) * 100) : 0 };
    });

    const graduatedCount = awarded.filter(a => a.status === BursaryApplicationStatus.GRADUATED).length;
    const completionRate = awarded.length > 0 ? Math.round((graduatedCount / awarded.length) * 100) : 0;

    return {
      totalAwarded: awarded.length,
      awardsPerQuarter,
      genderDist,
      vulnerableDist,
      retentionRate,
      completionRate,
      completionByCohort,
      graduatedCount,
    };
  }

  getConstituencies() {
    return MOCK_CONSTITUENCIES;
  }
}

export const bursaryService = new BursaryService();
