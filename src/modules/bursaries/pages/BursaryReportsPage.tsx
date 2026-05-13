import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ArrowLeft, TrendingUp, Users, ShieldCheck, GraduationCap, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bursaryService } from '../api/bursaryService';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../../shared/types/auth';

const COLORS = ['#F27D26', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

export const BursaryReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNational = user?.role === UserRole.ADMIN || user?.role === UserRole.ME_OFFICER || user?.role === UserRole.AUDITOR;

  const [constituencyId, setConstituencyId] = useState(
    isNational ? '' : (user?.constituencyId ?? '')
  );
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async (cId?: string) => {
    setLoading(true);
    const data = await bursaryService.getBursaryStats(cId || undefined);
    setStats(data);
    setLoading(false);
  };

  useEffect(() => { load(constituencyId || undefined); }, [constituencyId]);

  const handleConstituencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConstituencyId(e.target.value);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bursaries')} className="p-2 text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest">Bursary KPIs & Reports</h1>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">SDG 4 — Impact Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isNational && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">View by:</label>
              <select
                className="input-field py-2 text-sm"
                value={constituencyId}
                onChange={handleConstituencyChange}
              >
                <option value="">National (All)</option>
                {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Awarded" value={stats.totalAwarded} icon={Users} />
        <StatCard
          title="Retention Rate"
          value={`${stats.retentionRate.toFixed(1)}%`}
          icon={TrendingUp}
          colorClass="border-emerald-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={GraduationCap}
          colorClass="border-purple-500"
        />
        <StatCard
          title="Graduated"
          value={stats.graduatedCount}
          icon={ShieldCheck}
          colorClass="border-blue-500"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FR-BUR-003: Awards per quarter */}
        <div className="bg-card border border-border p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-BUR-003</p>
          <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5 mb-5">Awards per Quarter</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.awardsPerQuarter}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '11px' }} />
                <Bar dataKey="count" fill="#F27D26" name="Awarded" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FR-BUR-003: Gender distribution */}
        <div className="bg-card border border-border p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-BUR-003</p>
          <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5 mb-5">Gender Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.genderDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {stats.genderDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Percentages */}
          <div className="mt-4 space-y-1">
            {stats.genderDist.filter((g: any) => g.value > 0).map((g: any, i: number) => (
              <div key={g.name} className="flex items-center justify-between text-[10px] font-bold uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{g.name}</span>
                </div>
                <span>
                  {stats.totalAwarded > 0 ? Math.round((g.value / stats.totalAwarded) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FR-BUR-003: Vulnerability distribution */}
      <div className="bg-card border border-border p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-BUR-003</p>
        <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5 mb-5">Vulnerability Category Distribution</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.vulnerableDist} layout="vertical">
              <CartesianGrid strokeDasharray="0" horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={140} />
              <Tooltip contentStyle={{ fontSize: '11px' }} />
              <Bar dataKey="count" fill="#3b82f6" name="Beneficiaries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FR-BUR-005: Completion rate by cohort */}
      <div className="bg-card border border-border">
        <div className="p-6 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-BUR-005</p>
          <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5">Completion Rate by Starting Cohort</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Graduated ÷ Total enrolled per cohort year</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cohort (Start Year)</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Enrolled</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Graduated</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.completionByCohort.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-[11px] text-muted-foreground uppercase font-bold">No cohort data available</td></tr>
              ) : (
                stats.completionByCohort.map((row: any) => (
                  <tr key={row.cohort}>
                    <td className="px-6 py-4 text-sm font-bold">{row.cohort}</td>
                    <td className="px-6 py-4 text-sm font-mono">{row.total}</td>
                    <td className="px-6 py-4 text-sm font-mono">{row.graduated}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted h-2 max-w-[120px]">
                          <div
                            className="h-2 bg-purple-500"
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold font-mono">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FR-BUR-004: Retention rate detail */}
      <div className="bg-card border border-border p-6 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-BUR-004 — Retention Rate</p>
          <p className="text-4xl font-mono font-bold text-foreground mt-1">{stats.retentionRate.toFixed(1)}%</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Continuing beneficiaries ÷ Previous year total · Calculated for {new Date().getFullYear()}
          </p>
        </div>
        <div className="w-full md:w-64 bg-muted h-3">
          <div className="h-3 bg-emerald-500" style={{ width: `${Math.min(100, stats.retentionRate)}%` }} />
        </div>
      </div>
    </div>
  );
};
