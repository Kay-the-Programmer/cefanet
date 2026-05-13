import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { CardSkeleton, ChartSkeleton } from '../../../shared/components/ui/Skeleton';
import {
  MOCK_BURSARY_APPLICATIONS,
  MOCK_LOAN_APPLICATIONS,
  MOCK_REPAYMENTS,
  MOCK_BUSINESS_MONITORING,
  MOCK_QUARTERLY_REPORTS,
  MOCK_CITIZEN_SCORECARDS,
  MOCK_CONSTITUENCIES,
  MOCK_MONITORING_VISITS,
  MOCK_COMMUNITY_MEETINGS,
  MOCK_ADMIN_COSTS,
  MOCK_AUDIT_LOGS,
} from '../../../shared/api/mockData';
import { BursaryApplicationStatus } from '../../bursaries/types';
import { LoanApplicationStatus } from '../../loans/types';
import { UserRole } from '../../../shared/types/auth';
import { useAuth } from '../../auth/AuthContext';
import {
  GraduationCap,
  HandCoins,
  Briefcase,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CalendarCheck2,
  Users2,
  TrendingUp,
  FileText,
  Star,
  CheckCircle2,
  DollarSign,
  Target,
  Map,
  Activity
} from 'lucide-react';

const fmt = (n: number) => `K${n.toLocaleString()}`;

const scopeByConstituency = <T extends { constituencyId?: string }>(
  rows: T[],
  cId: string | undefined,
  bypass: boolean
) => (bypass || !cId ? rows : rows.filter(r => r.constituencyId === cId));

// ── Shared helpers ────────────────────────────────────────────────────────────

const useData = (constituencyId: string | undefined, bypass: boolean) => {
  const scope = <T extends { constituencyId?: string }>(rows: T[]) =>
    scopeByConstituency(rows, constituencyId, bypass);

  const bursaries = scope(MOCK_BURSARY_APPLICATIONS);
  const loans = scope(MOCK_LOAN_APPLICATIONS);
  const reports = scope(MOCK_QUARTERLY_REPORTS);
  const scorecards = scope(MOCK_CITIZEN_SCORECARDS);
  const visits = scope(MOCK_MONITORING_VISITS);
  const meetings = scope(MOCK_COMMUNITY_MEETINGS);
  const costs = scope(MOCK_ADMIN_COSTS);

  const awardedBursaries = bursaries.filter(
    b => b.status === BursaryApplicationStatus.APPROVED || b.status === BursaryApplicationStatus.DISBURSED
  );
  const pendingBursaries = bursaries.filter(b =>
    b.status === BursaryApplicationStatus.SUBMITTED || b.status === BursaryApplicationStatus.UNDER_REVIEW
  );
  const disbursedLoans = loans.filter(
    l => l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED
  );
  const pendingLoans = loans.filter(l => l.status === LoanApplicationStatus.APPLIED);
  const onTimeReports = reports.filter(r => r.publishedAt && new Date(r.publishedAt) <= new Date(r.dueDate));
  const complianceRate = reports.length > 0 ? Math.round((onTimeReports.length / reports.length) * 100) : 0;
  const totalDisbursed = disbursedLoans.reduce((s, l) => s + (l.amountApproved || 0), 0);
  const jobsCreated = MOCK_BUSINESS_MONITORING.reduce((s, m) => s + (m.jobsCreated || 0), 0);
  const satisfactionAvg = scorecards.length > 0
    ? scorecards.reduce((s, c) =>
        s + (c.accessibilityScore + c.timelinessScore + c.fairnessScore + c.communicationScore + c.impactScore) / 5, 0
      ) / scorecards.length
    : null;
  const totalRepaid = MOCK_REPAYMENTS.filter(r =>
    loans.some(l => l.id === r.loanId)
  ).reduce((s, r) => s + r.amount, 0);
  const repaymentRate = totalDisbursed > 0 ? Math.round((totalRepaid / totalDisbursed) * 100) : 0;
  const totalAdminCost = costs.reduce((s, c) => s + c.amount, 0);
  const adminCostRatio = totalDisbursed > 0 ? ((totalAdminCost / totalDisbursed) * 100).toFixed(1) : '—';
  const upcomingVisits = visits.filter(v => v.status === 'SCHEDULED');
  const overdueLoans = disbursedLoans.filter(l => {
    if (!l.expectedDisbursementDate || !l.disbursementDate) return false;
    return new Date(l.disbursementDate) > new Date(l.expectedDisbursementDate);
  });

  return {
    bursaries, loans, reports, scorecards, visits, meetings, costs,
    awardedBursaries, pendingBursaries, disbursedLoans, pendingLoans,
    onTimeReports, complianceRate, totalDisbursed, jobsCreated,
    satisfactionAvg, totalRepaid, repaymentRate, adminCostRatio,
    upcomingVisits, overdueLoans,
  };
};

// ── Role-specific panels ──────────────────────────────────────────────────────

const AdminPanel: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard title="Bursaries Awarded (SDG 4)" value={d.awardedBursaries.length} icon={GraduationCap} colorClass="border-primary" />
      <StatCard title="Loans/Grants Disbursed" value={fmt(d.totalDisbursed)} subValue={`${d.disbursedLoans.length} beneficiaries`} icon={HandCoins} colorClass="border-emerald-500" />
      <StatCard title="Jobs Created (SDG 8)" value={d.jobsCreated} icon={Briefcase} colorClass="border-blue-500" />
      <StatCard title="Reporting Compliance" value={`${d.complianceRate}%`} subValue={`${d.onTimeReports.length}/${d.reports.length} on-time`} icon={ShieldCheck} colorClass="border-purple-500" />
    </div>

    {/* New Dashboard Elements */}
    <SDGScorecard d={d} />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <ConstituencyHeatMap />
       <TrendCharts d={d} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 dashboard-card !p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="section-title">Constituency Activity</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            Approved bursaries &amp; disbursed loans per constituency
          </p>
        </div>
        <div className="p-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_CONSTITUENCIES.map(c => ({
              name: c.name,
              bursaries: MOCK_BURSARY_APPLICATIONS.filter(b => b.constituencyId === c.id && (b.status === BursaryApplicationStatus.APPROVED || b.status === BursaryApplicationStatus.DISBURSED)).length,
              loans: MOCK_LOAN_APPLICATIONS.filter(l => l.constituencyId === c.id && (l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED)).length,
            }))}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: '11px' }} />
              <Bar dataKey="bursaries" fill="#F27D26" name="Bursaries" />
              <Bar dataKey="loans" fill="#3b82f6" name="Loans/Grants" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <SatisfactionPanel scorecards={d.scorecards} satisfactionAvg={d.satisfactionAvg} />
    </div>
  </>
);

const CouncilPanel: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard title="Pending Bursary Applications" value={d.pendingBursaries.length} icon={GraduationCap} colorClass="border-amber-500" />
      <StatCard title="Pending Loan Applications" value={d.pendingLoans.length} icon={HandCoins} colorClass="border-blue-500" />
      <StatCard title="Total Disbursed" value={fmt(d.totalDisbursed)} icon={DollarSign} colorClass="border-emerald-500" />
      <StatCard
        title="Citizen Satisfaction"
        value={d.satisfactionAvg !== null ? d.satisfactionAvg.toFixed(1) : '—'}
        subValue={`${d.scorecards.length} scorecard${d.scorecards.length !== 1 ? 's' : ''}`}
        icon={Star}
        colorClass="border-purple-500"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RecentApplicationsPanel />
      <SatisfactionPanel scorecards={d.scorecards} satisfactionAvg={d.satisfactionAvg} />
    </div>
  </>
);

const FinancePanel: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard title="Total Disbursed" value={fmt(d.totalDisbursed)} icon={DollarSign} colorClass="border-primary" />
      <StatCard title="Total Repaid" value={fmt(d.totalRepaid)} icon={TrendingUp} colorClass="border-emerald-500" />
      <StatCard title="Repayment Rate" value={`${d.repaymentRate}%`} icon={CheckCircle2} colorClass={d.repaymentRate >= 80 ? 'border-emerald-500' : 'border-amber-500'} />
      <StatCard title="Admin Cost Ratio" value={`${d.adminCostRatio}%`} subValue="of total disbursed" icon={ShieldCheck} colorClass="border-blue-500" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="dashboard-card !p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="section-title">Disbursements by Constituency</h3>
        </div>
        <div className="p-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_CONSTITUENCIES.map(c => ({
              name: c.name,
              disbursed: MOCK_LOAN_APPLICATIONS
                .filter(l => l.constituencyId === c.id && (l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED))
                .reduce((s, l) => s + (l.amountApproved || 0), 0),
            }))}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: '11px' }} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="disbursed" fill="#F27D26" name="Disbursed (K)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card !p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="section-title">Overdue Disbursements</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            Loans disbursed after expected date
          </p>
        </div>
        <div className="divide-y divide-border flex-1">
          {d.overdueLoans.length === 0 ? (
            <div className="p-8 text-center text-[11px] uppercase font-bold text-muted-foreground">No overdue disbursements</div>
          ) : (
            d.overdueLoans.map(l => (
              <div key={l.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">{l.beneficiaryName}</p>
                  <p className="text-[10px] text-muted-foreground">{l.disbursementReference}</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-amber-500/10 text-amber-600">Late</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </>
);

const FieldPanel: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard title="Upcoming Visits" value={d.upcomingVisits.length} icon={CalendarCheck2} colorClass="border-primary" />
      <StatCard title="Total Visits" value={d.visits.length} icon={TrendingUp} colorClass="border-blue-500" />
      <StatCard title="Community Meetings" value={d.meetings.length} icon={Users2} colorClass="border-emerald-500" />
      <StatCard title="Businesses Monitored" value={MOCK_BUSINESS_MONITORING.length} icon={Briefcase} colorClass="border-purple-500" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="dashboard-card !p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="section-title">Upcoming Monitoring Visits</h3>
        </div>
        <div className="divide-y divide-border flex-1">
          {d.upcomingVisits.length === 0 ? (
            <div className="p-8 text-center text-[11px] uppercase font-bold text-muted-foreground">No upcoming visits scheduled</div>
          ) : (
            d.upcomingVisits.map(v => (
              <div key={v.id} className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">{v.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(v.scheduledDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Team: {v.team.join(', ')}</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-blue-500/10 text-blue-500 shrink-0">{v.type.replace('_', ' ')}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-card !p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="section-title">Recent Community Meetings</h3>
        </div>
        <div className="divide-y divide-border flex-1">
          {d.meetings.length === 0 ? (
            <div className="p-8 text-center text-[11px] uppercase font-bold text-muted-foreground">No meetings recorded</div>
          ) : (
            d.meetings.map(m => (
              <div key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold">{m.title}</p>
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-emerald-500/10 text-emerald-500 shrink-0">{m.type}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{m.location} · {m.attendeesCount} attendees</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </>
);

const AuditorPanel: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard title="Audit Log Entries" value={MOCK_AUDIT_LOGS.length} icon={ShieldCheck} colorClass="border-primary" />
      <StatCard title="Reporting Compliance" value={`${d.complianceRate}%`} subValue={`${d.onTimeReports.length}/${d.reports.length} on-time`} icon={FileText} colorClass="border-emerald-500" />
      <StatCard title="Admin Cost Ratio" value={`${d.adminCostRatio}%`} subValue="of disbursed funds" icon={AlertTriangle} colorClass="border-amber-500" />
      <StatCard title="Disbursed Loans/Grants" value={d.disbursedLoans.length} icon={HandCoins} colorClass="border-blue-500" />
    </div>

    <div className="dashboard-card !p-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="section-title">Quarterly Report Status</h3>
      </div>
      <div className="divide-y divide-border">
        {d.reports.map(r => {
          const onTime = r.publishedAt && new Date(r.publishedAt) <= new Date(r.dueDate);
          return (
            <div key={r.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase">{r.fiscalYear} · Q{r.quarter}</p>
                <p className="text-[10px] text-muted-foreground">
                  {MOCK_CONSTITUENCIES.find(c => c.id === r.constituencyId)?.name ?? r.constituencyId}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 ${
                r.publishedAt
                  ? onTime ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {r.publishedAt ? (onTime ? 'On-time' : 'Late') : 'Overdue'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </>
);

const BeneficiaryPanel: React.FC<{ userId: string | undefined }> = ({ userId }) => {
  const myBursaries = MOCK_BURSARY_APPLICATIONS.filter(b => b.studentId === userId);
  const totalReceived = myBursaries
    .filter(b => b.status === BursaryApplicationStatus.DISBURSED)
    .reduce((s, b) => s + (b.allocatedAmount || 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="My Bursary Applications" value={myBursaries.length} icon={GraduationCap} colorClass="border-primary" />
        <StatCard
          title="Approved Applications"
          value={myBursaries.filter(b => b.status === BursaryApplicationStatus.APPROVED || b.status === BursaryApplicationStatus.DISBURSED).length}
          icon={CheckCircle2}
          colorClass="border-emerald-500"
        />
        <StatCard title="Total Funding Received" value={totalReceived > 0 ? fmt(totalReceived) : 'K0'} icon={DollarSign} colorClass="border-blue-500" />
      </div>

      <div className="dashboard-card !p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="section-title">My Applications</h3>
        </div>
        <div className="divide-y divide-border">
          {myBursaries.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">No applications found</p>
              <Link to="/bursaries/apply" className="btn-primary text-[11px] inline-block px-4 py-2">Apply for Bursary</Link>
            </div>
          ) : (
            myBursaries.map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">{b.schoolName} — {b.courseOfStudy}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Year {b.academicYear?.replace('YEAR_', '')} · {b.fiscalYear} Q{b.quarter}
                  </p>
                  {b.allocatedAmount && (
                    <p className="text-[10px] text-muted-foreground">Allocated: {fmt(b.allocatedAmount)}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 ${
                  b.status === BursaryApplicationStatus.APPROVED || b.status === BursaryApplicationStatus.DISBURSED
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : (b.status === BursaryApplicationStatus.SUBMITTED || b.status === BursaryApplicationStatus.UNDER_REVIEW)
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {b.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

const PublicPanel: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <StatCard title="Bursaries Awarded" value={d.awardedBursaries.length} icon={GraduationCap} colorClass="border-primary" />
      <StatCard title="Loans/Grants Disbursed" value={fmt(d.totalDisbursed)} subValue={`${d.disbursedLoans.length} recipients`} icon={HandCoins} colorClass="border-blue-500" />
      <StatCard title="Reporting Compliance" value={`${d.complianceRate}%`} icon={ShieldCheck} colorClass="border-emerald-500" />
    </div>
    <div className="bg-card border border-border p-6 text-center space-y-3">
      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Want more detail?</p>
      <div className="flex justify-center gap-4">
        <Link to="/public/disclosure" className="btn-primary text-[11px] px-4 py-2">View Full Disclosure</Link>
        <Link to="/public/scorecard" className="btn-outline text-[11px] px-4 py-2">Submit Scorecard</Link>
      </div>
    </div>
  </>
);

// ── Shared sub-components ─────────────────────────────────────────────────────

const SDGScorecard: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => {
  const sdgs = [
    { id: 1, title: 'No Poverty', target: 50, current: d.disbursedLoans.length, color: 'bg-red-500', unit: 'loans' },
    { id: 4, title: 'Quality Education', target: 100, current: d.awardedBursaries.length, color: 'bg-red-600', unit: 'bursaries' },
    { id: 8, title: 'Decent Work', target: 20, current: d.jobsCreated, color: 'bg-rose-800', unit: 'jobs' },
    { id: 16, title: 'Strong Institutions', target: 100, current: d.complianceRate, color: 'bg-blue-600', unit: '%' }
  ];

  return (
    <div className="dashboard-card !p-0 flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
           <h3 className="section-title flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> SDG Alignment Scorecard</h3>
           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1">Progress towards Sustainable Development Goals</p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {sdgs.map(sdg => {
          const progress = Math.min(100, Math.round((sdg.current / sdg.target) * 100));
          return (
            <div key={sdg.id} className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span>SDG {sdg.id}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <p className="text-xs font-semibold">{sdg.title}</p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className={`h-full ${sdg.color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {sdg.current} / {sdg.target} {sdg.unit}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  );
};

const ConstituencyHeatMap: React.FC = () => {
  const data = MOCK_CONSTITUENCIES.map(c => {
    const loans = MOCK_LOAN_APPLICATIONS.filter(l => l.constituencyId === c.id && l.status === LoanApplicationStatus.FULLY_DISBURSED).length;
    const bursaries = MOCK_BURSARY_APPLICATIONS.filter(b => b.constituencyId === c.id && b.status === BursaryApplicationStatus.APPROVED).length;
    const score = loans + bursaries;
    return { ...c, score, loans, bursaries };
  });

  const maxScore = Math.max(...data.map(d => d.score), 1);

  return (
    <div className="dashboard-card !p-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="section-title flex items-center gap-2"><Map className="w-4 h-4 text-primary" /> Constituency Heat Map</h3>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1">Performance by district density</p>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {data.map(c => {
          const intensity = c.score / maxScore;
          // Calculate a heat color from yellow/orange to red based on intensity
          const r = 242; // F2
          const g = Math.round(125 + (1 - intensity) * 100); // 7D -> lighter
          const b = Math.round(38 + (1 - intensity) * 50); // 26 -> lighter
          
          return (
            <div 
              key={c.id} 
              className="p-4 rounded-md border border-border flex flex-col items-center justify-center text-center transition-transform hover:scale-105 cursor-default"
              style={{ backgroundColor: intensity > 0 ? `rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.9})` : 'var(--color-muted)' }}
            >
              <span className={`text-xs font-bold ${intensity > 0.5 ? 'text-white' : 'text-foreground'}`}>{c.name}</span>
              <span className={`text-[10px] font-medium uppercase mt-1 ${intensity > 0.5 ? 'text-white/80' : 'text-muted-foreground'}`}>
                Score: {c.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrendCharts: React.FC<{ d: ReturnType<typeof useData> }> = ({ d }) => {
  // Mock trend data based on quarters
  const trendData = [
    { name: 'Q1', loans: 12, bursaries: 25, jobs: 5 },
    { name: 'Q2', loans: 18, bursaries: 30, jobs: 12 },
    { name: 'Q3', loans: 15, bursaries: 15, jobs: 8 },
    { name: 'Q4', loans: d.disbursedLoans.length, bursaries: d.awardedBursaries.length, jobs: d.jobsCreated },
  ];

  return (
    <div className="dashboard-card !p-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="section-title flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> KPI Trends (Annual)</h3>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1">Disbursements & Job Creation over time</p>
      </div>
      <div className="p-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="loans" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Loans" />
            <Line type="monotone" dataKey="bursaries" stroke="#F27D26" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Bursaries" />
            <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Jobs" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const RecentApplicationsPanel: React.FC = () => {
  const recent = [...MOCK_BURSARY_APPLICATIONS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div className="dashboard-card !p-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="section-title">Recent Bursary Applications</h3>
      </div>
      <div className="divide-y divide-border flex-1">
        {recent.map(b => (
          <div key={b.id} className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold">{b.firstName} {b.lastName}</p>
              <p className="text-[10px] text-muted-foreground">{b.schoolName} · {b.courseOfStudy}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 ${
              b.status === BursaryApplicationStatus.APPROVED || b.status === BursaryApplicationStatus.DISBURSED || b.status === BursaryApplicationStatus.ACTIVE || b.status === BursaryApplicationStatus.GRADUATED
                ? 'bg-emerald-500/10 text-emerald-500'
                : b.status === BursaryApplicationStatus.SUBMITTED || b.status === BursaryApplicationStatus.UNDER_REVIEW
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {b.status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SatisfactionPanel: React.FC<{
  scorecards: ReturnType<typeof useData>['scorecards'];
  satisfactionAvg: number | null;
}> = ({ scorecards, satisfactionAvg }) => (
  <div className="dashboard-card !p-0 flex flex-col">
    <div className="p-6 border-b border-border">
      <h3 className="section-title">Citizen Satisfaction</h3>
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
        Mean scorecard rating (1–5)
      </p>
    </div>
    <div className="p-6 flex-1 flex flex-col items-center justify-center">
      <p className="text-5xl font-mono font-bold text-primary">
        {satisfactionAvg !== null ? satisfactionAvg.toFixed(1) : '—'}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2">
        From {scorecards.length} scorecard{scorecards.length !== 1 ? 's' : ''}
      </p>
      <div className="mt-6 w-full space-y-3">
        {(['accessibility', 'timeliness', 'fairness', 'communication', 'impact'] as const).map(dim => {
          const avg = scorecards.length > 0
            ? (scorecards.reduce((s, c) => s + (c as any)[`${dim}Score`], 0) / scorecards.length).toFixed(1)
            : '—';
          return (
            <div key={dim} className="flex items-center justify-between text-[10px] uppercase font-bold">
              <span className="text-muted-foreground capitalize">{dim}</span>
              <span className="text-foreground font-mono">{avg}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const isNational = user?.role === UserRole.ADMIN || user?.role === UserRole.ME_OFFICER || user?.role === UserRole.AUDITOR;
  const d = useData(user?.constituencyId, isNational || !user?.constituencyId);

  const headline = (() => {
    switch (user?.role) {
      case UserRole.ADMIN:           return { title: 'CDF National Dashboard', subtitle: 'Full system administration & oversight' };
      case UserRole.ME_OFFICER:      return { title: 'M&E National Dashboard', subtitle: 'Aggregate KPIs across all constituencies' };
      case UserRole.COUNCIL_OFFICER: return { title: 'Constituency Dashboard', subtitle: 'Applications & disbursements in your area' };
      case UserRole.FINANCE_OFFICER: return { title: 'Finance Dashboard', subtitle: 'Disbursements, repayments & cost ratios' };
      case UserRole.FIELD_OFFICER:   return { title: 'Field Monitoring Dashboard', subtitle: 'Visits, meetings & business follow-up' };
      case UserRole.AUDITOR:         return { title: 'Audit & Compliance Dashboard', subtitle: 'Read-only oversight of all financial activity' };
      case UserRole.BENEFICIARY:     return { title: 'Beneficiary Portal', subtitle: 'Your applications & funding status' };
      default:                       return { title: 'CDF Public Dashboard', subtitle: 'Aggregated national CDF activity' };
    }
  })();

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <div className="h-7 bg-muted rounded w-64 animate-pulse" />
          <div className="h-3 bg-muted rounded w-48 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
      case UserRole.ME_OFFICER:
        return <AdminPanel d={d} />;
      case UserRole.COUNCIL_OFFICER:
        return <CouncilPanel d={d} />;
      case UserRole.FINANCE_OFFICER:
        return <FinancePanel d={d} />;
      case UserRole.FIELD_OFFICER:
        return <FieldPanel d={d} />;
      case UserRole.AUDITOR:
        return <AuditorPanel d={d} />;
      case UserRole.BENEFICIARY:
        return <BeneficiaryPanel userId={user?.id} />;
      default:
        return <PublicPanel d={d} />;
    }
  };

  return (
    <div className="space-y-8 pb-10 text-foreground">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest">{headline.title}</h1>
        <p className="text-[11px] text-muted-foreground mt-1 uppercase font-semibold tracking-wide">{headline.subtitle}</p>
      </div>
      {renderPanel()}
    </div>
  );
};
