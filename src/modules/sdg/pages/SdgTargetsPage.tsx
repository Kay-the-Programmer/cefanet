import React, { useState, useEffect } from 'react';
import { Target, Save, RefreshCw } from 'lucide-react';
import { sdgService } from '../api/sdgService';
import { SDG_INDICATORS, SdgEvaluation } from '../types';
import { TrafficLightCard } from '../components/TrafficLight';
import { useAuth } from '../../auth/AuthContext';

const FISCAL_YEARS = ['2024/2025', '2025/2026', '2026/2027'];

export const SdgTargetsPage: React.FC = () => {
  const { user } = useAuth();
  const [fiscalYear, setFiscalYear] = useState('2025/2026');
  const [evaluations, setEvaluations] = useState<SdgEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, { baseline: string; target: string; amber: string; green: string }>>({});

  const load = async () => {
    setLoading(true);
    const evs = await sdgService.evaluateAll(fiscalYear);
    setEvaluations(evs);
    const editInit: typeof editValues = {};
    for (const ev of evs) {
      editInit[ev.indicator.key] = {
        baseline: ev.target?.baseline.toString() ?? '0',
        target: ev.target?.target.toString() ?? '0',
        amber: ev.target?.amberThresholdPct.toString() ?? '50',
        green: ev.target?.greenThresholdPct.toString() ?? '80',
      };
    }
    setEditValues(editInit);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fiscalYear]);

  const handleSave = async (key: typeof SDG_INDICATORS[number]['key']) => {
    const v = editValues[key];
    await sdgService.upsertTarget({
      fiscalYear,
      indicatorKey: key,
      baseline: parseFloat(v.baseline) || 0,
      target: parseFloat(v.target) || 0,
      amberThresholdPct: parseFloat(v.amber) || 50,
      greenThresholdPct: parseFloat(v.green) || 80,
      setBy: user?.id ?? 'system',
    });
    load();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">SDG Targets &amp; Progress</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            FR-SDG-001/002/003 — Baselines, targets and traffic-light visualisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-field py-2 text-[10px]" value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}>
            {FISCAL_YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <button onClick={load} className="btn-outline flex items-center gap-2 text-[10px]">
            <RefreshCw className="w-3.5 h-3.5" /> Recalculate
          </button>
        </div>
      </div>

      {/* Current progress cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse" />)
          : evaluations.map(ev => <TrafficLightCard key={ev.indicator.key} evaluation={ev} />)}
      </div>

      {/* Target editor */}
      <div className="bg-card border border-border">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Configure Targets — FY {fiscalYear}</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="hidden md:grid grid-cols-12 px-5 py-2 bg-muted/40 text-[9px] font-bold uppercase text-muted-foreground tracking-wide">
            <span className="col-span-4">Indicator</span>
            <span className="col-span-1">Unit</span>
            <span className="col-span-2">Baseline</span>
            <span className="col-span-2">Target</span>
            <span className="col-span-1">Amber%</span>
            <span className="col-span-1">Green%</span>
            <span className="col-span-1 text-right">Action</span>
          </div>
          {SDG_INDICATORS.map(ind => {
            const v = editValues[ind.key];
            if (!v) return null;
            return (
              <div key={ind.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-3 items-center">
                <div className="md:col-span-4">
                  <p className="text-[11px] font-bold">{ind.label}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">{ind.sdg.replace('_', ' ')}</p>
                </div>
                <span className="md:col-span-1 text-[10px] font-bold uppercase">{ind.unit}</span>
                <input className="input-field py-1.5 md:col-span-2 text-[11px] font-mono" type="number" value={v.baseline}
                  onChange={e => setEditValues(p => ({ ...p, [ind.key]: { ...v, baseline: e.target.value } }))} />
                <input className="input-field py-1.5 md:col-span-2 text-[11px] font-mono" type="number" value={v.target}
                  onChange={e => setEditValues(p => ({ ...p, [ind.key]: { ...v, target: e.target.value } }))} />
                <input className="input-field py-1.5 md:col-span-1 text-[11px] font-mono" type="number" value={v.amber}
                  onChange={e => setEditValues(p => ({ ...p, [ind.key]: { ...v, amber: e.target.value } }))} />
                <input className="input-field py-1.5 md:col-span-1 text-[11px] font-mono" type="number" value={v.green}
                  onChange={e => setEditValues(p => ({ ...p, [ind.key]: { ...v, green: e.target.value } }))} />
                <button onClick={() => handleSave(ind.key)}
                  className="md:col-span-1 btn-primary py-1.5 text-[10px] flex items-center justify-center gap-1">
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
