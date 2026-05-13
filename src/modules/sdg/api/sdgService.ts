import {
  SdgTarget,
  SdgEvaluation,
  IndicatorKey,
  SDG_INDICATORS,
  SdgIndicatorDef,
} from '../types';
import { bursaryService } from '../../bursaries/api/bursaryService';
import { loanService } from '../../loans/api/loanService';
import { efficiencyService } from '../../monitoring/api/efficiencyService';
import { communityService } from '../../community/api/communityService';
import { logAudit, AuditAction } from '../../monitoring/api/auditService';

const STORAGE_KEY = 'cdf_sdg_targets';

const SEED_TARGETS: SdgTarget[] = [
  { id: 't-r-26', fiscalYear: '2025/2026', indicatorKey: 'BURSARY_RETENTION', baseline: 60, target: 80, amberThresholdPct: 50, greenThresholdPct: 80, setBy: 'u4', setAt: '2025-07-01T00:00:00Z' },
  { id: 't-i-26', fiscalYear: '2025/2026', indicatorKey: 'INCOME_IMPROVEMENT', baseline: 35, target: 65, amberThresholdPct: 50, greenThresholdPct: 80, setBy: 'u4', setAt: '2025-07-01T00:00:00Z' },
  { id: 't-j-26', fiscalYear: '2025/2026', indicatorKey: 'JOBS_CREATED', baseline: 0, target: 50, amberThresholdPct: 50, greenThresholdPct: 80, setBy: 'u4', setAt: '2025-07-01T00:00:00Z' },
  { id: 't-t-26', fiscalYear: '2025/2026', indicatorKey: 'TRANSPARENCY_BENCHMARK', baseline: 50, target: 90, amberThresholdPct: 50, greenThresholdPct: 80, setBy: 'u4', setAt: '2025-07-01T00:00:00Z' },
];

class SdgService {
  private targets: SdgTarget[] = this.load();

  private load(): SdgTarget[] {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as SdgTarget[] | null;
      return stored && stored.length > 0 ? stored : [...SEED_TARGETS];
    } catch {
      return [...SEED_TARGETS];
    }
  }

  private persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.targets)); } catch { /* */ }
  }

  getTargets(fiscalYear?: string): SdgTarget[] {
    return fiscalYear ? this.targets.filter(t => t.fiscalYear === fiscalYear) : [...this.targets];
  }

  async upsertTarget(input: Omit<SdgTarget, 'id' | 'setAt'> & { id?: string }): Promise<SdgTarget> {
    const existing = this.targets.find(t => t.fiscalYear === input.fiscalYear && t.indicatorKey === input.indicatorKey);
    const oldVal = existing ? { baseline: existing.baseline, target: existing.target } : null;
    if (existing) {
      Object.assign(existing, {
        baseline: input.baseline,
        target: input.target,
        amberThresholdPct: input.amberThresholdPct,
        greenThresholdPct: input.greenThresholdPct,
        setBy: input.setBy,
        setAt: new Date().toISOString(),
      });
    } else {
      this.targets.push({
        ...input,
        id: input.id ?? `tgt-${Date.now()}`,
        setAt: new Date().toISOString(),
      });
    }
    this.persist();
    await logAudit(existing ? AuditAction.UPDATE : AuditAction.CREATE, 'SdgTarget',
      input.fiscalYear + ':' + input.indicatorKey, {
        module: 'sdg',
        oldValue: oldVal,
        newValue: { baseline: input.baseline, target: input.target },
        description: `SDG target ${existing ? 'updated' : 'created'} for ${input.indicatorKey} ${input.fiscalYear}`,
      });
    return this.targets.find(t => t.fiscalYear === input.fiscalYear && t.indicatorKey === input.indicatorKey)!;
  }

  /** Compute current actual value for an indicator. */
  private async computeCurrent(key: IndicatorKey): Promise<number> {
    switch (key) {
      case 'BURSARY_RETENTION': {
        const stats = await bursaryService.getBursaryStats();
        return stats.retentionRate;
      }
      case 'INCOME_IMPROVEMENT': {
        const data = await loanService.getReportData();
        return data.sdg1Rate;
      }
      case 'JOBS_CREATED': {
        const data = await loanService.getReportData();
        return data.jobs.total;
      }
      case 'TRANSPARENCY_BENCHMARK': {
        // Reporting compliance × satisfaction-meeting-baseline factor
        const compliance = communityService.reportingComplianceRate();
        const efficiency = await efficiencyService.getEfficiencyReport();
        const transparencyPenalty = (efficiency.adminCostRatio > 5 ? 10 : 0) + (efficiency.avgApprovalTime > 14 ? 5 : 0);
        return Math.max(0, compliance - transparencyPenalty);
      }
    }
  }

  classify(current: number, target: SdgTarget | null, def: SdgIndicatorDef): { progressPct: number; light: SdgEvaluation['light'] } {
    if (!target) return { progressPct: 0, light: 'UNSET' };
    if (target.target === 0) return { progressPct: 0, light: 'UNSET' };
    const progressPct = def.higherIsBetter
      ? (current / target.target) * 100
      : ((target.target / Math.max(current, 0.0001)) * 100);
    let light: SdgEvaluation['light'];
    if (progressPct >= target.greenThresholdPct) light = 'GREEN';
    else if (progressPct >= target.amberThresholdPct) light = 'AMBER';
    else light = 'RED';
    return { progressPct: Math.min(200, progressPct), light };
  }

  async evaluateAll(fiscalYear: string): Promise<SdgEvaluation[]> {
    const results: SdgEvaluation[] = [];
    for (const def of SDG_INDICATORS) {
      const target = this.targets.find(t => t.fiscalYear === fiscalYear && t.indicatorKey === def.key) ?? null;
      const current = await this.computeCurrent(def.key);
      const { progressPct, light } = this.classify(current, target, def);
      results.push({ indicator: def, fiscalYear, target, current, progressPct, light });
    }
    return results;
  }
}

export const sdgService = new SdgService();
