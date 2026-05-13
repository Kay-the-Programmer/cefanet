import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Eye, CheckCircle, XCircle, Clock,
  HandCoins, TrendingUp, Users, CreditCard, ClipboardCheck,
  AlertTriangle, ChevronRight, BarChart3, Filter,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { loanService } from '../api/loanService';
import {
  LoanGrantApplication, LoanApplicationStatus, FundingType,
  DemographicGroup, BusinessSector, LOAN_STATUS_FLOW,
} from '../types';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { LoanApplicationModal } from '../components/LoanApplicationModal';
import { RepaymentModal } from '../components/RepaymentModal';
import { BusinessSurveyModal } from '../components/BusinessSurveyModal';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../../shared/types/auth';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';

const cn = (...c: (string | boolean | undefined)[]) => c.filter(Boolean).join(' ');

const STATUS_COLORS: Record<LoanApplicationStatus, string> = {
  [LoanApplicationStatus.APPLIED]: 'bg-zinc-100 text-zinc-500',
  [LoanApplicationStatus.UNDER_REVIEW]: 'bg-amber-500/10 text-amber-600',
  [LoanApplicationStatus.APPROVED]: 'bg-blue-500/10 text-blue-600',
  [LoanApplicationStatus.PARTIALLY_DISBURSED]: 'bg-cyan-500/10 text-cyan-600',
  [LoanApplicationStatus.FULLY_DISBURSED]: 'bg-emerald-500/10 text-emerald-600',
  [LoanApplicationStatus.ACTIVE]: 'bg-primary/10 text-primary',
  [LoanApplicationStatus.COMPLETED]: 'bg-purple-500/10 text-purple-600',
  [LoanApplicationStatus.DEFAULTED]: 'bg-red-500/10 text-red-500',
  [LoanApplicationStatus.REJECTED]: 'bg-red-500/10 text-red-500',
};

const NEXT_LABEL: Partial<Record<LoanApplicationStatus, string>> = {
  [LoanApplicationStatus.APPLIED]: 'Start Review',
  [LoanApplicationStatus.UNDER_REVIEW]: 'Approve',
  [LoanApplicationStatus.APPROVED]: 'Partially Disburse',
  [LoanApplicationStatus.PARTIALLY_DISBURSED]: 'Fully Disburse',
  [LoanApplicationStatus.FULLY_DISBURSED]: 'Mark Active',
  [LoanApplicationStatus.ACTIVE]: 'Mark Completed',
};

const PIE_COLORS = ['#F27D26', '#3b82f6', '#10b981', '#8b5cf6'];

export const LoansPage: React.FC = () => {
  const { user } = useAuth();
  const isNational = user?.role === UserRole.ADMIN || user?.role === UserRole.ME_OFFICER || user?.role === UserRole.AUDITOR;
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COUNCIL_OFFICER || user?.role === UserRole.FINANCE_OFFICER;

  const [applications, setApplications] = useState<LoanGrantApplication[]>([]);
  const [followUps, setFollowUps] = useState<ReturnType<typeof loanService.getFollowUpsDue>>([]);
  const [overdueLoans, setOverdueLoans] = useState<LoanGrantApplication[]>([]);
  const [reportData, setReportData] = useState<Awaited<ReturnType<typeof loanService.getReportData>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'reports'>('applications');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [constituencyFilter, setConstituencyFilter] = useState(isNational ? 'all' : (user?.constituencyId ?? 'all'));
  const [demographicFilter, setDemographicFilter] = useState('all');

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanGrantApplication | null>(null);
  const [surveyMilestone, setSurveyMilestone] = useState<6 | 12>(6);

  const load = async () => {
    setLoading(true);
    const cId = isNational ? undefined : user?.constituencyId;
    const [data, report] = await Promise.all([
      loanService.getApplications(cId),
      loanService.getReportData({
        constituencyId: constituencyFilter !== 'all' ? constituencyFilter : undefined,
        demographicGroup: demographicFilter !== 'all' ? demographicFilter : undefined,
        fundingType: typeFilter !== 'all' ? typeFilter : undefined,
      }),
    ]);
    setApplications(data);
    setReportData(report);
    setFollowUps(loanService.getFollowUpsDue());
    setOverdueLoans(loanService.getOverdueLoans());
    setLoading(false);
  };

  useEffect(() => { load(); }, [constituencyFilter, demographicFilter, typeFilter]);

  const filtered = applications.filter(a => {
    const matchSearch = `${a.applicantName} ${a.businessName} ${a.purpose}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchType = typeFilter === 'all' || a.fundingType === typeFilter;
    const matchC = constituencyFilter === 'all' || a.constituencyId === constituencyFilter;
    const matchD = demographicFilter === 'all' || a.demographicGroup === demographicFilter;
    return matchSearch && matchStatus && matchType && matchC && matchD;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === LoanApplicationStatus.APPLIED || a.status === LoanApplicationStatus.UNDER_REVIEW).length,
    active: applications.filter(a => a.status === LoanApplicationStatus.ACTIVE || a.status === LoanApplicationStatus.FULLY_DISBURSED || a.status === LoanApplicationStatus.PARTIALLY_DISBURSED).length,
    totalDisbursed: applications.filter(a => [LoanApplicationStatus.ACTIVE, LoanApplicationStatus.FULLY_DISBURSED, LoanApplicationStatus.PARTIALLY_DISBURSED, LoanApplicationStatus.COMPLETED].includes(a.status))
      .reduce((s, a) => s + (a.amountApproved || 0), 0),
  };

  const handleAdvance = async (id: string) => { await loanService.advanceStatus(id); load(); };
  const handleReject = async (id: string) => { await loanService.rejectApplication(id); load(); };

  const openRepay = (loan: LoanGrantApplication) => { setSelectedLoan(loan); setRepayModalOpen(true); };
  const openSurvey = (loan: LoanGrantApplication, milestone: 6 | 12) => {
    setSelectedLoan(loan); setSurveyMilestone(milestone); setSurveyModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Loans & Grants</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">SDG 1 & 8 — No Poverty · Decent Work</p>
        </div>
        {canEdit && (
          <button onClick={() => setAppModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Application
          </button>
        )}
      </div>

      {/* FR-LOAN-007: 6/12-month follow-up reminders */}
      <AnimatePresence>
        {followUps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-blue-500/10 border border-blue-500/30 p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Follow-up Visits Due</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                The following loans are at their 6 or 12-month milestone. Please record a business survey.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {followUps.map(({ loan, milestone }) => (
                  <button key={`${loan.id}-${milestone}`}
                    onClick={() => openSurvey(loan, milestone)}
                    className="text-[10px] font-bold uppercase text-blue-700 bg-blue-500/10 px-2 py-1 hover:bg-blue-500/20 transition-colors">
                    {loan.businessName} ({milestone}mo)
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FR-LOAN-004: Overdue banner */}
      <AnimatePresence>
        {overdueLoans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-500">Overdue Repayments</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {overdueLoans.length} loan{overdueLoans.length !== 1 ? 's have' : ' has'} missed expected repayment instalments.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overdueLoans.map(l => {
                  const s = loanService.getRepaymentSummary(l.id);
                  return (
                    <span key={l.id} className="text-[10px] font-bold uppercase text-red-600 bg-red-500/10 px-2 py-1">
                      {l.businessName} — ZMW {s?.overdueAmount.toLocaleString()}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.total} icon={HandCoins} />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} colorClass="border-amber-500" />
        <StatCard title="Active Portfolios" value={stats.active} icon={TrendingUp} colorClass="border-emerald-500" />
        <StatCard title="Total Disbursed" value={`K${(stats.totalDisbursed / 1000).toFixed(1)}k`} icon={CreditCard} colorClass="border-primary" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['applications', 'reports'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors',
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab === 'applications' ? 'Applications & Disbursements' : 'Reporting & Impact (SDG 1 & 8)'}
          </button>
        ))}
      </div>

      {/* ── Applications tab ──────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="bg-card border border-border">
          {/* Filters */}
          <div className="p-4 border-b border-border flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-48 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search name, business, purpose…"
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border text-sm focus:border-primary outline-none"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              {/* Status */}
              <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {Object.values(LoanApplicationStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              {/* Type */}
              <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
                value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value={FundingType.LOAN}>Loan</option>
                <option value={FundingType.GRANT}>Grant</option>
              </select>
              {/* Constituency */}
              {isNational && (
                <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
                  value={constituencyFilter} onChange={e => setConstituencyFilter(e.target.value)}>
                  <option value="all">All Constituencies</option>
                  {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {/* Demographic */}
              <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
                value={demographicFilter} onChange={e => setDemographicFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {Object.values(DemographicGroup).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Applicant / Business', 'Category', 'Type', 'Amount (ZMW)', 'Status', 'Submitted', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-muted animate-pulse w-full" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-[11px] uppercase font-bold text-muted-foreground">No applications match filters</td></tr>
                ) : (
                  filtered.map(app => {
                    const summary = app.fundingType === FundingType.LOAN ? loanService.getRepaymentSummary(app.id) : null;
                    const isOverdue = summary && summary.overdueAmount > 0;
                    return (
                      <tr key={app.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold uppercase tracking-tight">{app.businessName}</p>
                          <p className="text-[10px] text-muted-foreground">{app.applicantName} · {app.applicantNrc}</p>
                          <p className="text-[10px] text-muted-foreground">{app.businessSector}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold uppercase px-2 py-1 bg-muted">{app.demographicGroup}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('text-[10px] font-bold uppercase px-2 py-1',
                            app.fundingType === FundingType.LOAN ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500')}>
                            {app.fundingType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold font-mono">{(app.amountApproved ?? app.amountRequested).toLocaleString()}</p>
                          {summary && (
                            <p className={cn('text-[10px] font-bold', isOverdue ? 'text-red-500' : 'text-muted-foreground')}>
                              {isOverdue ? `Overdue: ${summary.overdueAmount.toLocaleString()}` : `Repaid: ${summary.totalRepaid.toLocaleString()}`}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('text-[10px] font-bold uppercase px-2 py-1', STATUS_COLORS[app.status])}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[10px] text-muted-foreground font-mono">
                          {format(new Date(app.submissionDate), 'dd MMM yy')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && NEXT_LABEL[app.status] && (
                              <button title={NEXT_LABEL[app.status]}
                                onClick={() => handleAdvance(app.id)}
                                className="p-1.5 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                            {canEdit && (app.status === LoanApplicationStatus.APPLIED || app.status === LoanApplicationStatus.UNDER_REVIEW) && (
                              <button title="Reject" onClick={() => handleReject(app.id)}
                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded text-muted-foreground transition-colors">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {canEdit && app.fundingType === FundingType.LOAN && [LoanApplicationStatus.ACTIVE, LoanApplicationStatus.FULLY_DISBURSED].includes(app.status) && (
                              <button title="Record Repayment" onClick={() => openRepay(app)}
                                className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-500 rounded text-muted-foreground transition-colors">
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            {[LoanApplicationStatus.ACTIVE, LoanApplicationStatus.FULLY_DISBURSED, LoanApplicationStatus.COMPLETED].includes(app.status) && (
                              <button title="Business Survey" onClick={() => openSurvey(app, 12)}
                                className="p-1.5 hover:bg-amber-500/10 hover:text-amber-500 rounded text-muted-foreground transition-colors">
                                <ClipboardCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reports tab ───────────────────────────────────────────────────── */}
      {activeTab === 'reports' && reportData && (
        <div className="space-y-6">
          {/* Report filters */}
          <div className="bg-card border border-border p-4 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filters:</span>
            {isNational && (
              <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
                value={constituencyFilter} onChange={e => setConstituencyFilter(e.target.value)}>
                <option value="all">All Constituencies</option>
                {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
              value={demographicFilter} onChange={e => setDemographicFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {Object.values(DemographicGroup).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="bg-muted border border-border text-[10px] uppercase font-bold px-3 py-2 outline-none"
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">Loan & Grant</option>
              <option value={FundingType.LOAN}>Loan only</option>
              <option value={FundingType.GRANT}>Grant only</option>
            </select>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Disbursed" value={`K${(reportData.totalDisbursed / 1000).toFixed(1)}k`} icon={HandCoins} colorClass="border-primary" />
            <StatCard title="Avg Loan/Grant Size" value={`K${(reportData.avgLoanSize / 1000).toFixed(1)}k`} icon={BarChart3} colorClass="border-blue-500" />
            <StatCard title="Repayment Rate" value={`${reportData.repaymentRate.toFixed(1)}%`} icon={TrendingUp} colorClass="border-emerald-500" />
            <StatCard title="Business Survival" value={`${reportData.survivalRate.toFixed(1)}%`} icon={CheckCircle} colorClass="border-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FR-LOAN-003: Quarterly disbursements */}
            <div className="bg-card border border-border p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-LOAN-003</p>
              <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5 mb-5">Disbursements per Quarter</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(reportData.quarterly).map(([q, v]) => ({ quarter: q, count: (v as any).count, amount: (v as any).amount }))}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#F27D26" name="Disbursements" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">
                Cumulative: {reportData.disbursementCount} disbursements · ZMW {reportData.totalDisbursed.toLocaleString()}
              </p>
            </div>

            {/* FR-LOAN-003: Category proportions */}
            <div className="bg-card border border-border p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-LOAN-003</p>
              <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5 mb-5">Beneficiary Category Proportions</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={Object.entries(reportData.proportions).map(([k, v]) => ({ name: k, value: v }))}
                      cx="50%" cy="50%" outerRadius={60} dataKey="value">
                      {Object.keys(reportData.proportions).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1">
                {Object.entries(reportData.proportions).map(([group, count]: [string, any], i) => (
                  <div key={group} className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{group}</span>
                    </div>
                    <span>{reportData.disbursementCount > 0 ? Math.round((count / reportData.disbursementCount) * 100) : 0}% ({count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FR-LOAN-006: Jobs breakdown */}
          <div className="bg-card border border-border p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FR-LOAN-006</p>
            <h3 className="text-sm font-bold uppercase tracking-tight mt-0.5 mb-5">
              Jobs Created — {reportData.jobs.total} Total (SDG 8)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* By employment type */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">By Employment Type</p>
                {[['fullTime', 'Full-time'], ['partTime', 'Part-time'], ['seasonal', 'Seasonal']].map(([k, l]) => {
                  const v = (reportData.jobs as any)[k];
                  return (
                    <div key={k} className="mb-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span className="text-muted-foreground">{l}</span><span>{v}</span>
                      </div>
                      <div className="h-1.5 bg-muted"><div className="h-1.5 bg-primary" style={{ width: `${reportData.jobs.total > 0 ? (v / reportData.jobs.total) * 100 : 0}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              {/* By gender */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">By Gender</p>
                {[['female', 'Female'], ['male', 'Male']].map(([k, l]) => {
                  const v = (reportData.jobs as any)[k];
                  return (
                    <div key={k} className="mb-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span className="text-muted-foreground">{l}</span><span>{v}</span>
                      </div>
                      <div className="h-1.5 bg-muted"><div className="h-1.5 bg-blue-500" style={{ width: `${reportData.jobs.total > 0 ? (v / reportData.jobs.total) * 100 : 0}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              {/* By age + disability */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">By Age & Disability</p>
                {[['youth', 'Youth (15–35)'], ['adult', 'Adult (36+)'], ['pwd', 'PWD'], ['nonPwd', 'Non-PWD']].map(([k, l]) => {
                  const v = (reportData.jobs as any)[k];
                  return (
                    <div key={k} className="mb-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span className="text-muted-foreground">{l}</span><span>{v}</span>
                      </div>
                      <div className="h-1.5 bg-muted"><div className="h-1.5 bg-emerald-500" style={{ width: `${reportData.jobs.total > 0 ? (v / reportData.jobs.total) * 100 : 0}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SDG 1 impact */}
          <div className="bg-card border border-border p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SDG 1 Impact</p>
              <p className="text-4xl font-mono font-bold mt-1">{reportData.sdg1Rate.toFixed(1)}%</p>
              <p className="text-[11px] text-muted-foreground mt-1">of monitored beneficiaries report improved household income</p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="h-3 bg-muted"><div className="h-3 bg-emerald-500" style={{ width: `${Math.min(100, reportData.sdg1Rate)}%` }} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {appModalOpen && <LoanApplicationModal onClose={() => setAppModalOpen(false)} onSuccess={load} />}
        {repayModalOpen && selectedLoan && (
          <RepaymentModal loan={selectedLoan} isOpen={repayModalOpen} onClose={() => setRepayModalOpen(false)} onSuccess={load} />
        )}
        {surveyModalOpen && selectedLoan && (
          <BusinessSurveyModal loan={selectedLoan} milestone={surveyMilestone} onClose={() => setSurveyModalOpen(false)} onSuccess={load} />
        )}
      </AnimatePresence>
    </div>
  );
};
