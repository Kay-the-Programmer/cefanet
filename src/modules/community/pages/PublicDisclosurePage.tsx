import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, FileText, MessageSquare, Bell, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { communityService } from '../api/communityService';

const formatCurrency = (n: number) => `K${n.toLocaleString()}`;

export const PublicDisclosurePage: React.FC = () => {
  const constituencies = communityService.getConstituencies();
  const [constituencyId, setConstituencyId] = useState(constituencies[0]?.id ?? '');

  const summary = useMemo(
    () => (constituencyId ? communityService.getDisclosureSummary(constituencyId) : null),
    [constituencyId]
  );

  const compliance = communityService.reportingComplianceRate();
  const historicalTrend = useMemo(() => communityService.getHistoricalSatisfaction(constituencyId), [constituencyId]);
  const [remindersSent, setRemindersSent] = useState(false);

  const handleReminders = async () => {
    await communityService.sendQuarterlyReminders();
    setRemindersSent(true);
    setTimeout(() => setRemindersSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Public Disclosure</p>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest">CDF Transparency Portal</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Aggregated disbursement data and quarterly reports for each constituency. No personal beneficiary data is shown.
          </p>
          <div className="flex flex-wrap gap-3 pt-1 items-center">
            <Link to="/public/scorecard" className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline">
              ← Submit scorecard
            </Link>
            <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:underline">
              Officer login
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <button onClick={handleReminders} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
               <Bell className="w-3 h-3" />
               {remindersSent ? 'Reminders Sent!' : 'Trigger Reminders (Mock)'}
            </button>
          </div>
        </header>

        <section className="bg-card border border-border p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">National reporting compliance</p>
            <p className="text-3xl font-mono font-bold text-foreground">{compliance.toFixed(0)}%</p>
            <p className="text-[11px] text-muted-foreground">Constituencies that published their quarterly report on time</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">View constituency</label>
            <select
              value={constituencyId}
              onChange={e => setConstituencyId(e.target.value)}
              className="w-full md:w-64 bg-muted border border-border p-3 text-sm focus:border-primary outline-none"
            >
              {constituencies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </section>

        {summary && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="dashboard-card">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Bursaries Awarded</p>
                <p className="text-2xl font-mono font-bold text-foreground mt-1">{summary.bursariesAwarded}</p>
              </div>
              <div className="dashboard-card">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Loans/Grants Disbursed</p>
                <p className="text-2xl font-mono font-bold text-foreground mt-1">{summary.loansDisbursed}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatCurrency(summary.totalLoanValue)}</p>
              </div>
              <div className="dashboard-card">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Citizen Satisfaction</p>
                <p className="text-2xl font-mono font-bold text-foreground mt-1">
                  {summary.satisfactionIndex !== null ? summary.satisfactionIndex.toFixed(1) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Average score (1–5)</p>
              </div>
            </section>

            <section className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                 <Activity className="w-4 h-4 text-primary" />
                 <h2 className="text-xs font-bold uppercase tracking-widest">Citizen Satisfaction Trend</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis domain={[1, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="index" stroke="#F27D26" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Satisfaction Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-card border border-border">
              <div className="p-6 border-b border-border flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Quarterly Reports</h2>
              </div>
              <div className="divide-y divide-border">
                {summary.reports.length === 0 && (
                  <div className="p-8 text-center text-[11px] uppercase font-bold text-muted-foreground">
                    No quarterly reports recorded yet for this constituency.
                  </div>
                )}
                {summary.reports.map(r => {
                  const onTime = r.publishedAt && new Date(r.publishedAt) <= new Date(r.dueDate);
                  return (
                    <div key={r.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">{r.fiscalYear} · Q{r.quarter}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Due {format(new Date(r.dueDate), 'MMM dd, yyyy')}
                          {r.publishedAt
                            ? ` · Published ${format(new Date(r.publishedAt), 'MMM dd, yyyy')}`
                            : ' · Not yet published'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                        r.publishedAt
                          ? onTime
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-600'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {r.publishedAt ? (onTime ? 'On-time' : 'Late') : 'Overdue'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-card border border-border p-6 flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-primary mt-1" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Want to share feedback on services in this constituency? Submit a citizen scorecard — it takes under a
                minute and is anonymous by default.
                <Link to="/public/scorecard" className="ml-1 text-primary font-bold hover:underline">Submit scorecard</Link>.
              </p>
            </section>
          </>
        )}

        <footer className="pt-6 border-t border-border flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Aggregated data only — individual beneficiary records are not disclosed publicly.
        </footer>
      </div>
    </div>
  );
};
