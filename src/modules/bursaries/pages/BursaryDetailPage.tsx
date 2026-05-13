import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, School, Users, ShieldCheck, History, TrendingUp,
  AlertTriangle, CheckCircle2, XCircle, Plus, DollarSign, ChevronRight,
} from 'lucide-react';
import { bursaryService } from '../api/bursaryService';
import {
  BursaryApplication, BursaryApplicationStatus, BursaryDisbursement,
  StudentProgress, AcademicYear, ContinuationStatus, PaymentMethodBursary,
  BURSARY_STATUS_FLOW,
} from '../types';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../../shared/types/auth';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';

const CURRENT_FISCAL_YEAR = '2025/2026';

const statusColor: Record<BursaryApplicationStatus, string> = {
  [BursaryApplicationStatus.DRAFT]: 'bg-zinc-100 text-zinc-500',
  [BursaryApplicationStatus.SUBMITTED]: 'bg-blue-500/10 text-blue-600',
  [BursaryApplicationStatus.UNDER_REVIEW]: 'bg-amber-500/10 text-amber-600',
  [BursaryApplicationStatus.APPROVED]: 'bg-emerald-500/10 text-emerald-600',
  [BursaryApplicationStatus.DISBURSED]: 'bg-emerald-600/10 text-emerald-700',
  [BursaryApplicationStatus.ACTIVE]: 'bg-primary/10 text-primary',
  [BursaryApplicationStatus.GRADUATED]: 'bg-purple-500/10 text-purple-600',
  [BursaryApplicationStatus.DROPPED_OUT]: 'bg-red-500/10 text-red-500',
  [BursaryApplicationStatus.REJECTED]: 'bg-red-500/10 text-red-500',
};

const NEXT_STATUS: Partial<Record<BursaryApplicationStatus, BursaryApplicationStatus>> = {
  [BursaryApplicationStatus.DRAFT]: BursaryApplicationStatus.SUBMITTED,
  [BursaryApplicationStatus.SUBMITTED]: BursaryApplicationStatus.UNDER_REVIEW,
  [BursaryApplicationStatus.UNDER_REVIEW]: BursaryApplicationStatus.APPROVED,
  [BursaryApplicationStatus.APPROVED]: BursaryApplicationStatus.DISBURSED,
  [BursaryApplicationStatus.DISBURSED]: BursaryApplicationStatus.ACTIVE,
  [BursaryApplicationStatus.ACTIVE]: BursaryApplicationStatus.GRADUATED,
};

// Roles that can advance the workflow
const canAdvance = (role: UserRole, from: BursaryApplicationStatus) => {
  if (role === UserRole.ADMIN) return true;
  if (role === UserRole.COUNCIL_OFFICER) return [
    BursaryApplicationStatus.DRAFT,
    BursaryApplicationStatus.SUBMITTED,
    BursaryApplicationStatus.UNDER_REVIEW,
  ].includes(from);
  if (role === UserRole.FINANCE_OFFICER) return [
    BursaryApplicationStatus.APPROVED,
    BursaryApplicationStatus.DISBURSED,
  ].includes(from);
  if (role === UserRole.ME_OFFICER || role === UserRole.FIELD_OFFICER) return [
    BursaryApplicationStatus.ACTIVE,
  ].includes(from);
  return false;
};

export const BursaryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [app, setApp] = useState<BursaryApplication | null>(null);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [disbursements, setDisbursements] = useState<BursaryDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'disbursements'>('details');

  // Workflow fields
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Progress form
  const [progForm, setProgForm] = useState({
    academicYear: AcademicYear.YEAR_1,
    fiscalYear: CURRENT_FISCAL_YEAR,
    continuationStatus: ContinuationStatus.CONTINUING,
    currentResult: '',
    remarks: '',
  });

  // Disbursement form
  const [disbForm, setDisbForm] = useState({
    amount: '',
    disbursementDate: new Date().toISOString().slice(0, 10),
    paymentMethod: PaymentMethodBursary.BANK_TRANSFER,
    referenceNumber: '',
    notes: '',
  });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [a, p, d] = await Promise.all([
      bursaryService.getApplicationById(id),
      app ? bursaryService.getStudentProgress(app.studentId) : Promise.resolve([]),
      bursaryService.getDisbursements(id),
    ]);
    if (a) {
      setApp(a);
      setAllocatedAmount(String(a.allocatedAmount ?? a.requestedAmount));
      setReviewNotes(a.reviewNotes ?? '');
      const prog = await bursaryService.getStudentProgress(a.studentId);
      setProgress(prog);
    }
    setDisbursements(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const constituency = MOCK_CONSTITUENCIES.find(c => c.id === app?.constituencyId);

  const handleAdvance = async (next: BursaryApplicationStatus) => {
    if (!app || !id) return;
    setBusy(true);
    const updated = await bursaryService.updateStatus(id, next, {
      allocatedAmount: next === BursaryApplicationStatus.APPROVED ? parseFloat(allocatedAmount) : undefined,
      reviewNotes,
      reviewedBy: `${user?.firstName} ${user?.lastName}`,
    });
    setApp(updated);
    setBusy(false);
  };

  const handleReject = async () => {
    if (!app || !id) return;
    setBusy(true);
    const updated = await bursaryService.updateStatus(id, BursaryApplicationStatus.REJECTED, {
      reviewNotes,
      reviewedBy: `${user?.firstName} ${user?.lastName}`,
    });
    setApp(updated);
    setBusy(false);
  };

  const handleDropOut = async () => {
    if (!app || !id) return;
    setBusy(true);
    const updated = await bursaryService.updateStatus(id, BursaryApplicationStatus.DROPPED_OUT, {
      reviewNotes,
      reviewedBy: `${user?.firstName} ${user?.lastName}`,
    });
    setApp(updated);
    setBusy(false);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    setBusy(true);
    await bursaryService.recordProgress({ studentId: app.studentId, bursaryApplicationId: app.id, ...progForm });
    const prog = await bursaryService.getStudentProgress(app.studentId);
    setProgress(prog);
    setProgForm(p => ({ ...p, currentResult: '', remarks: '' }));
    setBusy(false);
  };

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !id) return;
    setBusy(true);
    const d = await bursaryService.recordDisbursement({
      bursaryApplicationId: id,
      amount: parseFloat(disbForm.amount),
      disbursementDate: new Date(disbForm.disbursementDate).toISOString(),
      paymentMethod: disbForm.paymentMethod,
      referenceNumber: disbForm.referenceNumber,
      recordedBy: `${user?.firstName} ${user?.lastName}`,
      notes: disbForm.notes || undefined,
    });
    setDisbursements(prev => [d, ...prev]);
    setDisbForm(f => ({ ...f, amount: '', referenceNumber: '', notes: '' }));
    setBusy(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>;
  }

  if (!app) {
    return <div className="text-center py-20">
      <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-lg font-bold uppercase tracking-widest">Application not found</h2>
      <button onClick={() => navigate('/bursaries')} className="btn-primary mt-6">Back</button>
    </div>;
  }

  const nextStatus = NEXT_STATUS[app.status];
  const userCanAdvance = user && canAdvance(user.role, app.status);
  const isTerminal = app.status === BursaryApplicationStatus.GRADUATED ||
    app.status === BursaryApplicationStatus.DROPPED_OUT ||
    app.status === BursaryApplicationStatus.REJECTED;

  // FR-BUR-008: flag if no progress recorded this year
  const missingCurrentYear = (
    app.status === BursaryApplicationStatus.ACTIVE ||
    app.status === BursaryApplicationStatus.APPROVED ||
    app.status === BursaryApplicationStatus.DISBURSED
  ) && !progress.some(p => p.fiscalYear === CURRENT_FISCAL_YEAR);

  const totalDisbursed = disbursements.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/bursaries')} className="p-2 text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold uppercase tracking-widest truncate">{app.firstName} {app.lastName}</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Ref: {app.id}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-3 py-1.5 shrink-0 ${statusColor[app.status]}`}>
          {app.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* FR-BUR-008 alert */}
      {missingCurrentYear && (
        <div className="bg-amber-500/10 border border-amber-500/40 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            Annual status for {CURRENT_FISCAL_YEAR} not yet confirmed. Please record a progress update.
          </p>
          <button onClick={() => setActiveTab('progress')} className="ml-auto text-[10px] font-bold uppercase text-amber-700 underline hover:no-underline shrink-0">
            Record Now
          </button>
        </div>
      )}

      {/* Workflow stepper */}
      <div className="bg-card border border-border p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Application Workflow</p>
        <div className="flex items-center gap-0 overflow-x-auto">
          {BURSARY_STATUS_FLOW.map((s, i) => {
            const idx = BURSARY_STATUS_FLOW.indexOf(app.status);
            const done = i < idx || (i === idx && !isTerminal);
            const active = i === idx;
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 shrink-0 px-2 py-1 text-[10px] font-bold uppercase ${
                  active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground'
                }`}>
                  {done && !active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className={`w-2.5 h-2.5 rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />}
                  <span className="whitespace-nowrap">{s.replace(/_/g, ' ')}</span>
                </div>
                {i < BURSARY_STATUS_FLOW.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </React.Fragment>
            );
          })}
          {(app.status === BursaryApplicationStatus.GRADUATED || app.status === BursaryApplicationStatus.DROPPED_OUT) && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className={`text-[10px] font-bold uppercase px-2 ${statusColor[app.status]}`}>
                {app.status.replace(/_/g, ' ')}
              </span>
            </>
          )}
          {app.status === BursaryApplicationStatus.REJECTED && (
            <span className="ml-3 text-[10px] font-bold uppercase text-red-500">REJECTED</span>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-border">
        {(['details', 'progress', 'disbursements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {tab === 'disbursements' && disbursements.length > 0 && (
              <span className="ml-1.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {disbursements.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Details ─────────────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal */}
            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Personal Information</h2>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ['Full Name', `${app.firstName} ${app.lastName}`],
                  ['NRC Number', app.nrcNumber],
                  ['Gender', app.gender],
                  ['Vulnerability', app.vulnerabilityCategory.replace(/_/g, ' ')],
                  ['Constituency', constituency?.name ?? app.constituencyId],
                  ['Fiscal Year', `${app.fiscalYear} Q${app.quarter}`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guardian */}
            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Guardian / Parent</h2>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ['Name', app.guardianName],
                  ['Phone', app.guardianPhone],
                  ['Relation', app.guardianRelation],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic */}
            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <School className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Academic Details</h2>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ['Institution', app.schoolName],
                  ['Type', app.schoolType],
                  ['Year of Study', app.academicYear.replace(/_/g, ' ')],
                  ['Programme', app.courseOfStudy],
                  ['Requested (ZMW)', app.requestedAmount.toLocaleString()],
                  ['Allocated (ZMW)', app.allocatedAmount?.toLocaleString() ?? '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow panel */}
          <div className="space-y-4">
            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Review & Workflow</h2>
              </div>
              <div className="p-5 space-y-4">
                {isTerminal ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Final Decision</p>
                    <span className={`text-xs font-bold uppercase px-2 py-1 ${statusColor[app.status]}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                    {app.reviewNotes && <p className="text-[11px] text-muted-foreground mt-2">{app.reviewNotes}</p>}
                    {app.reviewedBy && <p className="text-[10px] text-muted-foreground">By: {app.reviewedBy}</p>}
                  </div>
                ) : userCanAdvance ? (
                  <>
                    {/* Show allocated amount field only at approval step */}
                    {app.status === BursaryApplicationStatus.UNDER_REVIEW && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Allocated Amount (ZMW)
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          value={allocatedAmount}
                          onChange={e => setAllocatedAmount(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">Requested: {app.requestedAmount.toLocaleString()}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
                      <textarea
                        rows={3}
                        className="input-field resize-none"
                        placeholder="Add review notes…"
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      {nextStatus && (
                        <button
                          disabled={busy}
                          onClick={() => handleAdvance(nextStatus)}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Advance to {nextStatus.replace(/_/g, ' ')}
                        </button>
                      )}
                      {/* Reject / Drop-out options */}
                      {[BursaryApplicationStatus.SUBMITTED, BursaryApplicationStatus.UNDER_REVIEW].includes(app.status) && (
                        <button
                          disabled={busy}
                          onClick={handleReject}
                          className="btn-outline w-full flex items-center justify-center gap-2 text-red-500 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Application
                        </button>
                      )}
                      {app.status === BursaryApplicationStatus.ACTIVE && (
                        <button
                          disabled={busy}
                          onClick={handleDropOut}
                          className="btn-outline w-full flex items-center justify-center gap-2 text-red-500 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Mark as Dropped Out
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">You do not have permission to advance this application at its current stage.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Progress (FR-BUR-004) ──────────────────────────────────── */}
      {activeTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Academic Progress History</h2>
            </div>
            <div className="divide-y divide-border">
              {progress.length === 0 ? (
                <div className="p-10 text-center text-[11px] uppercase font-bold text-muted-foreground">
                  No progress records yet
                </div>
              ) : (
                progress.map(p => (
                  <div key={p.id} className="p-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase">{p.fiscalYear} · {p.academicYear.replace(/_/g, ' ')}</p>
                      {p.currentResult && <p className="text-[11px] text-muted-foreground mt-0.5">Result: {p.currentResult}</p>}
                      {p.remarks && <p className="text-[11px] text-muted-foreground italic mt-1">{p.remarks}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Updated: {new Date(p.lastUpdated).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 shrink-0 ${
                      p.continuationStatus === ContinuationStatus.CONTINUING ? 'bg-blue-500/10 text-blue-600' :
                      p.continuationStatus === ContinuationStatus.GRADUATED ? 'bg-purple-500/10 text-purple-600' :
                      p.continuationStatus === ContinuationStatus.DROPPED_OUT ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {p.continuationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Record progress form */}
          <div className="bg-card border border-border self-start">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Record Annual Status</h2>
            </div>
            <form onSubmit={handleProgressSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fiscal Year</label>
                <select className="input-field" value={progForm.fiscalYear} onChange={e => setProgForm(f => ({ ...f, fiscalYear: e.target.value }))}>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year of Study</label>
                <select className="input-field" value={progForm.academicYear} onChange={e => setProgForm(f => ({ ...f, academicYear: e.target.value as AcademicYear }))}>
                  {Object.values(AcademicYear).map(y => <option key={y} value={y}>{y.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Continuation Status</label>
                <select className="input-field" value={progForm.continuationStatus} onChange={e => setProgForm(f => ({ ...f, continuationStatus: e.target.value as ContinuationStatus }))}>
                  {Object.values(ContinuationStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Result / GPA</label>
                <input className="input-field" placeholder="e.g. GPA 3.5 / Pass" value={progForm.currentResult} onChange={e => setProgForm(f => ({ ...f, currentResult: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Remarks</label>
                <textarea rows={2} className="input-field resize-none" value={progForm.remarks} onChange={e => setProgForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Save Progress Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab: Disbursements (FR-BUR-007) ─────────────────────────────── */}
      {activeTab === 'disbursements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Summary strip */}
            <div className="bg-card border border-border p-5 flex flex-wrap gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Allocated</p>
                <p className="text-xl font-mono font-bold">ZMW {(app.allocatedAmount ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Disbursed</p>
                <p className="text-xl font-mono font-bold text-emerald-600">ZMW {totalDisbursed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Remaining</p>
                <p className="text-xl font-mono font-bold text-amber-600">
                  ZMW {Math.max(0, (app.allocatedAmount ?? 0) - totalDisbursed).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Disbursement Transactions</h2>
              </div>
              <div className="divide-y divide-border">
                {disbursements.length === 0 ? (
                  <div className="p-10 text-center text-[11px] uppercase font-bold text-muted-foreground">
                    No disbursements recorded yet
                  </div>
                ) : (
                  disbursements.map(d => (
                    <div key={d.id} className="p-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold font-mono">ZMW {d.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(d.disbursementDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{d.paymentMethod.replace(/_/g, ' ')}
                          {' · '}Ref: {d.referenceNumber}
                        </p>
                        {d.notes && <p className="text-[11px] text-muted-foreground italic mt-1">{d.notes}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">Recorded by: {d.recordedBy}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Disbursement form — Finance Officer only */}
          {(user?.role === UserRole.FINANCE_OFFICER || user?.role === UserRole.ADMIN) && (
            <div className="bg-card border border-border self-start">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Record Disbursement</h2>
              </div>
              <form onSubmit={handleDisbursementSubmit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (ZMW)<span className="text-red-500 ml-0.5">*</span></label>
                  <input required type="number" min={1} className="input-field" value={disbForm.amount} onChange={e => setDisbForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disbursement Date<span className="text-red-500 ml-0.5">*</span></label>
                  <input required type="date" className="input-field" value={disbForm.disbursementDate} onChange={e => setDisbForm(f => ({ ...f, disbursementDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Method<span className="text-red-500 ml-0.5">*</span></label>
                  <select required className="input-field" value={disbForm.paymentMethod} onChange={e => setDisbForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethodBursary }))}>
                    {Object.values(PaymentMethodBursary).map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reference Number<span className="text-red-500 ml-0.5">*</span></label>
                  <input required className="input-field" placeholder="e.g. BDT-2026-0001" value={disbForm.referenceNumber} onChange={e => setDisbForm(f => ({ ...f, referenceNumber: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
                  <textarea rows={2} className="input-field resize-none" value={disbForm.notes} onChange={e => setDisbForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
                  {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  Record Transaction
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
