import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Clock, DollarSign, Users, MapPin, CheckCircle2, AlertTriangle,
  TrendingUp, Activity, ShieldCheck, Calendar,
} from 'lucide-react';
import { efficiencyService } from '../api/efficiencyService';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';

const fmt = (n: number) => `ZMW ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

export const EfficiencyDashboardPage: React.FC = () => {
  const [timeliness, setTimeliness] = useState<Awaited<ReturnType<typeof efficiencyService.getDisbursementTimeliness>> | null>(null);
  const [costReport, setCostReport] = useState<Awaited<ReturnType<typeof efficiencyService.getAdminCostReport>> | null>(null);
  const [processingTimes, setProcessingTimes] = useState<Awaited<ReturnType<typeof efficiencyService.getProcessingTimes>>>([]);
  const [visitCoverage, setVisitCoverage] = useState<ReturnType<typeof efficiencyService.getVisitCoverageReport>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      efficiencyService.getDisbursementTimeliness(),
      efficiencyService.getAdminCostReport(),
      efficiencyService.getProcessingTimes(),
    ]).then(([t, cr, pt]) => {
      setTimeliness(t);
      setCostReport(cr);
      setProcessingTimes(pt);
      setVisitCoverage(efficiencyService.getVisitCoverageReport());
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="p-8 text-center text-xs uppercase tracking-widest animate-pulse text-muted-foreground">
      Calculating institutional efficiency…
    </div>
  );

  const overdueConstituencies = visitCoverage.filter(v => v.overdueFlag);

  // Cost bar chart data — per constituency, quarter 2 (current)
  const costChartData = MOCK_CONSTITUENCIES.map(c => {
    const q = costReport?.byConstituency[c.id]?.[2];
    return {
      name: c.name.split(' ')[0],
      admin: q?.admin || 0,
      me: q?.me || 0,
      ratio: q?.ratio || 0,
    };
  });

  // Processing time chart
  const processingChart = processingTimes.map(p => ({
    name: p.type,
    avgDays: parseFloat(p.avgDays.toFixed(1)),
    count: p.count,
  }));

  // Visit coverage chart
  const visitChart = visitCoverage.map(v => ({
    name: v.constituencyName.split(' ')[0],
    visits: v.totalVisits,
    overdue: v.overdueFlag ? 1 : 0,
  }));

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Operational Efficiency</h1>
        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
          SDG 16 — Peace, Justice &amp; Strong Institutions
        </p>
      </div>

      {/* 90-day overdue flag banner — FR-OPS-005 */}
      {overdueConstituencies.length > 0 && (
        <div className="border border-amber-400 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">
              FR-OPS-005: {overdueConstituencies.length} {overdueConstituencies.length === 1 ? 'Constituency' : 'Constituencies'} Overdue for Monitoring Visit (&gt;90 days)
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {overdueConstituencies.map(c => c.constituencyName).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="FR-OPS-001: Disbursement Timeliness"
          value={timeliness ? pct(timeliness.timeliness) : '—'}
          subValue={`${timeliness?.onTime ?? 0} of ${timeliness?.totalScheduled ?? 0} on time`}
          icon={CheckCircle2}
          colorClass={timeliness && timeliness.timeliness >= 80 ? 'border-emerald-500' : 'border-red-500'}
        />
        <StatCard
          title="FR-OPS-002: Admin Cost Ratio"
          value={costReport ? pct(costReport.overall.ratio) : '—'}
          subValue="Target: < 5% of disbursed"
          icon={DollarSign}
          colorClass={costReport && costReport.overall.ratio <= 5 ? 'border-emerald-500' : 'border-amber-500'}
        />
        <StatCard
          title="FR-OPS-003: Avg Processing Time"
          value={processingTimes.length > 0
            ? `${(processingTimes.reduce((s, p) => s + p.avgDays, 0) / processingTimes.filter(p => p.count > 0).length).toFixed(1)} days`
            : '—'}
          subValue="All programme types"
          icon={Clock}
          colorClass="border-blue-500"
        />
        <StatCard
          title="FR-OPS-005: Visit Coverage"
          value={`${visitCoverage.filter(v => !v.overdueFlag).length} / ${visitCoverage.length}`}
          subValue="Constituencies within 90 days"
          icon={MapPin}
          colorClass={overdueConstituencies.length === 0 ? 'border-emerald-500' : 'border-amber-500'}
        />
      </div>

      {/* Row 1: Timeliness + Processing Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* FR-OPS-001: Timeliness breakdown */}
        <div className="bg-card border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              FR-OPS-001: Disbursement Timeliness
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {timeliness?.byType.map(t => (
              <div key={t.type}>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                  <span>{t.type}</span>
                  <span className={t.timeliness >= 80 ? 'text-emerald-600' : 'text-red-500'}>
                    {pct(t.timeliness)} ({t.onTime}/{t.scheduled})
                  </span>
                </div>
                <div className="h-2 bg-muted">
                  <div
                    className={`h-2 transition-all ${t.timeliness >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, t.timeliness)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Total Scheduled', val: timeliness?.totalScheduled, color: 'text-foreground' },
                { label: 'On Time', val: timeliness?.onTime, color: 'text-emerald-600' },
                { label: 'Late', val: timeliness?.late, color: 'text-red-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-muted/50 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
                  <p className={`text-xl font-bold font-mono ${color}`}>{val ?? 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FR-OPS-003: Processing times */}
        <div className="bg-card border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              FR-OPS-003: Avg Processing Time by Programme
            </h2>
          </div>
          <div className="p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingChart} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="0" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} unit=" days" />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={70} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 0 }}
                  formatter={(v: number) => [`${v.toFixed(1)} days`, 'Avg']}
                />
                <Bar dataKey="avgDays" radius={0}>
                  {processingChart.map((_, i) => (
                    <Cell key={i} fill={['#F27D26', '#3b82f6', '#8b5cf6'][i % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-6 pb-5 grid grid-cols-3 gap-3">
            {processingTimes.map(p => (
              <div key={p.type} className="bg-muted/40 p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">{p.type}</p>
                <p className="text-lg font-bold font-mono">{p.avgDays.toFixed(1)}<span className="text-xs font-normal text-muted-foreground"> d</span></p>
                <p className="text-[9px] text-muted-foreground">{p.count} records</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Admin costs + Visit coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* FR-OPS-002: Admin cost per constituency Q2 */}
        <div className="bg-card border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              FR-OPS-002: Admin &amp; M&amp;E Costs (Q2)
            </h2>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Per Constituency</span>
          </div>
          <div className="p-6 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costChartData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 0 }}
                  formatter={(v: number) => [fmt(v)]}
                />
                <Bar dataKey="admin" name="Admin" fill="#F27D26" stackId="cost" />
                <Bar dataKey="me" name="M&E" fill="#3b82f6" stackId="cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="px-6 pb-6">
            <div className="border border-border divide-y divide-border">
              <div className="grid grid-cols-4 bg-muted/50 px-3 py-1.5">
                {['Constituency', 'Admin', 'M&E', 'Ratio'].map(h => (
                  <span key={h} className="text-[9px] font-bold uppercase text-muted-foreground">{h}</span>
                ))}
              </div>
              {MOCK_CONSTITUENCIES.map(c => {
                const q = costReport?.byConstituency[c.id]?.[2];
                return (
                  <div key={c.id} className="grid grid-cols-4 px-3 py-2">
                    <span className="text-[10px] font-bold">{c.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-mono">{fmt(q?.admin || 0)}</span>
                    <span className="text-[10px] font-mono">{fmt(q?.me || 0)}</span>
                    <span className={`text-[10px] font-bold font-mono ${(q?.ratio || 0) <= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {pct(q?.ratio || 0)}
                    </span>
                  </div>
                );
              })}
              <div className="grid grid-cols-4 px-3 py-2 bg-muted/30">
                <span className="text-[10px] font-bold uppercase">Overall</span>
                <span className="text-[10px] font-mono col-span-2">{fmt(costReport?.overall.total || 0)}</span>
                <span className={`text-[10px] font-bold font-mono ${(costReport?.overall.ratio || 0) <= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pct(costReport?.overall.ratio || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FR-OPS-005: Visit coverage per constituency */}
        <div className="bg-card border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              FR-OPS-005: Monitoring Visit Coverage
            </h2>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Completed visits</span>
          </div>
          <div className="p-6 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitChart}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 0 }}
                />
                <Bar dataKey="visits" name="Visits" radius={0}>
                  {visitChart.map((entry, i) => (
                    <Cell key={i} fill={entry.overdue ? '#ef4444' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="px-6 pb-6 space-y-2">
            {visitCoverage.map(v => (
              <div key={v.constituencyId} className={`flex items-center justify-between p-3 border ${v.overdueFlag ? 'border-red-300 bg-red-500/5' : 'border-border bg-muted/20'}`}>
                <div className="flex items-center gap-2">
                  {v.overdueFlag
                    ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  <span className="text-[10px] font-bold uppercase">{v.constituencyName}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="text-muted-foreground font-bold">{v.totalVisits} visits</span>
                  {v.lastVisitDate ? (
                    <span className={`font-bold ${v.overdueFlag ? 'text-red-500' : 'text-muted-foreground'}`}>
                      Last: {new Date(v.lastVisitDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold">Never visited</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Overall health */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest">SDG 16 Institution Health Summary</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Timeliness',
              value: timeliness ? pct(timeliness.timeliness) : '—',
              status: timeliness && timeliness.timeliness >= 80 ? 'OPTIMAL' : 'AT RISK',
              ok: !timeliness || timeliness.timeliness >= 80,
            },
            {
              label: 'Cost Efficiency',
              value: costReport ? pct(costReport.overall.ratio) : '—',
              status: costReport && costReport.overall.ratio <= 5 ? 'WITHIN LIMIT' : 'EXCEEDED',
              ok: !costReport || costReport.overall.ratio <= 5,
            },
            {
              label: 'Processing Speed',
              value: processingTimes.length > 0
                ? `${(processingTimes.filter(p => p.count > 0).reduce((s, p) => s + p.avgDays, 0) / (processingTimes.filter(p => p.count > 0).length || 1)).toFixed(0)} days`
                : '—',
              status: 'TRACKED',
              ok: true,
            },
            {
              label: 'Visit Coverage',
              value: `${visitCoverage.filter(v => !v.overdueFlag).length}/${visitCoverage.length}`,
              status: overdueConstituencies.length === 0 ? 'FULL COVERAGE' : 'GAPS DETECTED',
              ok: overdueConstituencies.length === 0,
            },
          ].map(item => (
            <div key={item.label} className={`p-4 border ${item.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-400/30 bg-red-500/5'}`}>
              <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">{item.label}</p>
              <p className="text-xl font-bold font-mono">{item.value}</p>
              <p className={`text-[9px] font-bold uppercase mt-1 ${item.ok ? 'text-emerald-600' : 'text-red-500'}`}>{item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
