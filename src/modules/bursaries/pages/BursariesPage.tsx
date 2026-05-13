import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, GraduationCap, Clock, CheckCircle2, FileText,
  Upload, Download, AlertTriangle, Eye, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { bursaryService } from '../api/bursaryService';
import { BursaryApplication, BursaryApplicationStatus } from '../types';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../../shared/types/auth';

const TERMINAL: BursaryApplicationStatus[] = [
  BursaryApplicationStatus.GRADUATED,
  BursaryApplicationStatus.DROPPED_OUT,
  BursaryApplicationStatus.REJECTED,
];

export const BursariesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [applications, setApplications] = useState<BursaryApplication[]>([]);
  const [overdueAlerts, setOverdueAlerts] = useState<BursaryApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BursaryApplicationStatus | 'ALL'>('ALL');
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COUNCIL_OFFICER;
  const isFinance = user?.role === UserRole.FINANCE_OFFICER;
  const isNational = user?.role === UserRole.ADMIN || user?.role === UserRole.ME_OFFICER || user?.role === UserRole.AUDITOR;

  const load = async () => {
    setLoading(true);
    const cId = isNational ? undefined : user?.constituencyId;
    const [data, overdue] = await Promise.all([
      bursaryService.getApplications(cId),
      Promise.resolve(bursaryService.getOverdueStatusConfirmations()),
    ]);
    setApplications(data);
    setOverdueAlerts(isNational ? overdue : overdue.filter(a => a.constituencyId === user?.constituencyId));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = applications.filter(a => {
    const matchSearch = `${a.firstName} ${a.lastName} ${a.nrcNumber} ${a.schoolName}`
      .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === BursaryApplicationStatus.SUBMITTED || a.status === BursaryApplicationStatus.UNDER_REVIEW).length,
    awarded: applications.filter(a =>
      a.status === BursaryApplicationStatus.APPROVED ||
      a.status === BursaryApplicationStatus.DISBURSED ||
      a.status === BursaryApplicationStatus.ACTIVE ||
      a.status === BursaryApplicationStatus.GRADUATED
    ).length,
    active: applications.filter(a => a.status === BursaryApplicationStatus.ACTIVE).length,
  };

  // ── CSV import ────────────────────────────────────────────────────────────

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const csv = ev.target?.result as string;
      const result = bursaryService.importFromCSV(csv, user?.id ?? 'import');
      setImportResult(result);
      setShowImportResult(true);
      if (result.imported > 0) load();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const csv = bursaryService.csvTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bursary_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColors: Record<BursaryApplicationStatus, string> = {
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Bursary Management</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">SDG 4 — Quality Education</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <button onClick={() => navigate('/bursaries/apply')} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Application
              </button>
              <button onClick={downloadTemplate} className="btn-outline flex items-center gap-2">
                <Download className="w-4 h-4" /> CSV Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-outline flex items-center gap-2">
                <Upload className="w-4 h-4" /> Import CSV
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileImport} />
            </>
          )}
          <button onClick={() => navigate('/bursaries/reports')} className="btn-outline flex items-center gap-2">
            <FileText className="w-4 h-4" /> Reports & KPIs
          </button>
        </div>
      </div>

      {/* FR-BUR-008 — 60-day status confirmation alert */}
      <AnimatePresence>
        {overdueAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-amber-500/10 border border-amber-500/40 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Annual Status Confirmation Required
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {overdueAlerts.length} beneficiar{overdueAlerts.length === 1 ? 'y has' : 'ies have'} not had
                their annual continuation status confirmed for {new Date().getFullYear()}.
                Open each application and record a progress update.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overdueAlerts.slice(0, 5).map(a => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/bursaries/${a.id}`)}
                    className="text-[10px] font-bold uppercase text-amber-700 underline hover:no-underline"
                  >
                    {a.firstName} {a.lastName}
                  </button>
                ))}
                {overdueAlerts.length > 5 && (
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">+{overdueAlerts.length - 5} more</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV import result */}
      <AnimatePresence>
        {showImportResult && importResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`p-4 border flex items-start justify-between gap-3 ${
              importResult.errors.length > 0 && importResult.imported === 0
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">
                {importResult.imported > 0 ? `${importResult.imported} record${importResult.imported !== 1 ? 's' : ''} imported successfully` : 'Import failed'}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {importResult.errors.map((e, i) => <li key={i} className="text-[11px] text-muted-foreground">• {e}</li>)}
                </ul>
              )}
            </div>
            <button onClick={() => setShowImportResult(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.total} icon={GraduationCap} />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} colorClass="border-amber-500" />
        <StatCard title="Awarded" value={stats.awarded} icon={CheckCircle2} colorClass="border-emerald-500" />
        <StatCard title="Active Beneficiaries" value={stats.active} icon={GraduationCap} colorClass="border-primary" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, NRC or school…"
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border text-sm focus:border-primary outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1">
              {(['ALL', ...Object.values(BursaryApplicationStatus)] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground hover:border-primary'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">NRC</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Institution</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount (ZMW)</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quarter</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-muted animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[11px] uppercase font-bold text-muted-foreground">
                    No applications match your filters
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold uppercase tracking-tight">{app.firstName} {app.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{app.gender} · {app.vulnerabilityCategory.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-muted-foreground">{app.nrcNumber || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm">{app.schoolName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{app.schoolType} · {app.academicYear.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold font-mono">{(app.allocatedAmount ?? app.requestedAmount).toLocaleString()}</p>
                      {app.allocatedAmount && app.allocatedAmount !== app.requestedAmount && (
                        <p className="text-[10px] text-muted-foreground">Req: {app.requestedAmount.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 ${statusColors[app.status]}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-muted-foreground font-bold">{app.fiscalYear} Q{app.quarter}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/bursaries/${app.id}`)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
