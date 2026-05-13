import React, { useState, useEffect } from 'react';
import { FileCheck, AlertCircle, Send, Calendar } from 'lucide-react';
import { communityService } from '../api/communityService';
import { QuarterlyReport } from '../types';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { StatCard } from '../../../shared/components/ui/StatCard';

export const QuarterlyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<QuarterlyReport[]>([]);
  const [reminderResult, setReminderResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => setReports(communityService.getQuarterlyReports());
  useEffect(load, []);

  const compliance = communityService.reportingComplianceRate();
  const missed = communityService.getMissedDeadlines();

  const handlePublish = async (constituencyId: string, fiscalYear: string, quarter: number) => {
    await communityService.publishQuarterlyReport(constituencyId, fiscalYear, quarter);
    load();
  };

  const handleSendReminders = async () => {
    setBusy(true);
    const r = await communityService.dispatchUpcomingDeadlineReminders();
    setReminderResult(`Dispatched ${r.at14Days} 14-day and ${r.at3Days} 3-day reminders.`);
    setBusy(false);
    setTimeout(() => setReminderResult(null), 6000);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Quarterly Reporting</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            FR-CE-005 / FR-CE-006 — Publish reports &amp; auto-reminders
          </p>
        </div>
        <button onClick={handleSendReminders} disabled={busy} className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" />
          {busy ? 'Dispatching…' : 'Run Reminder Sweep'}
        </button>
      </div>

      {reminderResult && (
        <div className="border border-blue-300 bg-blue-500/10 p-3 text-[11px] font-bold uppercase text-blue-600">
          {reminderResult}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Compliance Rate" value={`${compliance.toFixed(1)}%`}
          subValue="On-time published reports"
          icon={FileCheck}
          colorClass={compliance >= 80 ? 'border-emerald-500' : 'border-amber-500'} />
        <StatCard title="Missed Deadlines" value={missed.length} icon={AlertCircle}
          colorClass={missed.length === 0 ? 'border-emerald-500' : 'border-red-500'} />
        <StatCard title="Total Reports Tracked" value={reports.length} icon={Calendar} colorClass="border-primary" />
      </div>

      {/* Missed deadlines flag */}
      {missed.length > 0 && (
        <div className="border border-red-300 bg-red-500/10 p-4">
          <p className="text-[10px] font-bold uppercase text-red-500 mb-1">
            {missed.length} {missed.length === 1 ? 'constituency has' : 'constituencies have'} missed their reporting deadline
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {missed.map(r => (
              <span key={r.id} className="text-[10px] font-bold uppercase bg-red-500/20 text-red-600 px-2 py-0.5">
                {MOCK_CONSTITUENCIES.find(c => c.id === r.constituencyId)?.name} · Q{r.quarter} {r.fiscalYear}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reports table */}
      <div className="bg-card border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-widest">All Tracked Reports</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="hidden md:grid grid-cols-12 px-5 py-2 bg-muted/40 text-[9px] font-bold uppercase text-muted-foreground tracking-wide">
            <span className="col-span-3">Constituency</span>
            <span className="col-span-2">Period</span>
            <span className="col-span-2">Due Date</span>
            <span className="col-span-2">Published</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Action</span>
          </div>
          {reports.map(r => {
            const constituency = MOCK_CONSTITUENCIES.find(c => c.id === r.constituencyId);
            const due = new Date(r.dueDate);
            const onTime = r.publishedAt && new Date(r.publishedAt) <= due;
            const status = r.publishedAt
              ? (onTime ? { label: 'On Time', color: 'text-emerald-600 bg-emerald-500/10' } : { label: 'Late', color: 'text-amber-500 bg-amber-500/10' })
              : (Date.now() > due.getTime() ? { label: 'Missed', color: 'text-red-500 bg-red-500/10' } : { label: 'Pending', color: 'text-blue-500 bg-blue-500/10' });
            return (
              <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-3 items-center">
                <span className="md:col-span-3 text-[11px] font-bold">{constituency?.name}</span>
                <span className="md:col-span-2 text-[10px] font-bold uppercase text-muted-foreground">Q{r.quarter} {r.fiscalYear}</span>
                <span className="md:col-span-2 text-[10px] font-mono">{due.toLocaleDateString()}</span>
                <span className="md:col-span-2 text-[10px] font-mono">{r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : '—'}</span>
                <span className={`md:col-span-1 text-[9px] font-bold uppercase px-2 py-0.5 ${status.color} text-center`}>{status.label}</span>
                <div className="md:col-span-2 flex justify-end">
                  {!r.publishedAt && (
                    <button onClick={() => handlePublish(r.constituencyId, r.fiscalYear, r.quarter)}
                      className="btn-primary text-[10px] py-1.5 px-3">Publish Now</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
