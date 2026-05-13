import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ClipboardCheck, TrendingUp, Users, Home } from 'lucide-react';
import { LoanGrantApplication } from '../types';
import { loanService } from '../api/loanService';

interface BusinessSurveyModalProps {
  loan: LoanGrantApplication;
  milestone: 6 | 12;
  onClose: () => void;
  onSuccess: () => void;
}

const N = (v: string) => parseInt(v) || 0;

export const BusinessSurveyModal: React.FC<BusinessSurveyModalProps> = ({ loan, milestone, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    businessStatus: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'RESTRUCTURED',
    revenueGrowth: '0',
    householdIncomeImproved: false,
    performanceNotes: '',
    // FR-LOAN-006: by gender
    female: '0',
    male: '0',
    // by age group
    youth: '0',
    adult: '0',
    // by disability
    pwd: '0',
    nonPwd: '0',
    // by employment type
    fullTime: '0',
    partTime: '0',
    seasonal: '0',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const totalJobs = N(form.fullTime) + N(form.partTime) + N(form.seasonal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loanService.addMonitoring({
      beneficiaryId: loan.beneficiaryId,
      loanId: loan.id,
      checkDate: new Date().toISOString(),
      status: form.businessStatus === 'ACTIVE' ? 'ACTIVE' : 'CLOSED',
      businessStatus: form.businessStatus,
      revenueGrowth: N(form.revenueGrowth),
      jobsCreated: totalJobs,
      jobsBreakdown: {
        female: N(form.female),
        male: N(form.male),
        youth: N(form.youth),
        adult: N(form.adult),
        pwd: N(form.pwd),
        nonPwd: N(form.nonPwd),
        fullTime: N(form.fullTime),
        partTime: N(form.partTime),
        seasonal: N(form.seasonal),
        total: totalJobs,
      },
      householdIncomeImproved: form.householdIncomeImproved,
      survivalMonths: milestone,
      performanceNotes: form.performanceNotes,
      monitoredBy: 'Field Officer',
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl overflow-y-auto max-h-[90vh]">

        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">{milestone}-Month Follow-up Survey</h2>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{loan.businessName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border">

          {/* Business status */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> FR-LOAN-005: Business Status
                </label>
                <select className="input-field" value={form.businessStatus} onChange={set('businessStatus')}>
                  <option value="ACTIVE">Active</option>
                  <option value="RESTRUCTURED">Restructured</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue Growth (%)</label>
                <input type="number" className="input-field" value={form.revenueGrowth} onChange={set('revenueGrowth')} />
              </div>
              <div className="flex items-center gap-2 h-10">
                <input type="checkbox" id="income" className="w-4 h-4 accent-primary"
                  checked={form.householdIncomeImproved}
                  onChange={e => setForm(f => ({ ...f, householdIncomeImproved: e.target.checked }))} />
                <label htmlFor="income" className="text-[11px] font-bold uppercase text-foreground flex items-center gap-1 cursor-pointer">
                  <Home className="w-3 h-3" /> SDG 1: Household income improved
                </label>
              </div>
            </div>
          </div>

          {/* FR-LOAN-006: Jobs disaggregation */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">FR-LOAN-006: Jobs Created</h3>
              <span className="ml-auto text-sm font-bold font-mono text-primary">{totalJobs} total</span>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">By Employment Type</p>
              <div className="grid grid-cols-3 gap-3">
                {([['fullTime', 'Full-time'], ['partTime', 'Part-time'], ['seasonal', 'Seasonal']] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">{l}</span>
                    <input type="number" min={0} className="input-field py-1.5 text-center font-mono"
                      value={form[k]} onChange={set(k)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">By Gender</p>
              <div className="grid grid-cols-2 gap-3">
                {([['female', 'Female'], ['male', 'Male']] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">{l}</span>
                    <input type="number" min={0} className="input-field py-1.5 text-center font-mono"
                      value={form[k]} onChange={set(k)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">By Age Group</p>
              <div className="grid grid-cols-2 gap-3">
                {([['youth', 'Youth (15–35)'], ['adult', 'Adult (36+)']] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">{l}</span>
                    <input type="number" min={0} className="input-field py-1.5 text-center font-mono"
                      value={form[k]} onChange={set(k)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">By Disability Status</p>
              <div className="grid grid-cols-2 gap-3">
                {([['pwd', 'PWD'], ['nonPwd', 'Non-PWD']] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">{l}</span>
                    <input type="number" min={0} className="input-field py-1.5 text-center font-mono"
                      value={form[k]} onChange={set(k)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes & actions */}
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Performance Notes</label>
              <textarea rows={3} className="input-field resize-none" placeholder="Observations from the monitoring visit…"
                value={form.performanceNotes} onChange={set('performanceNotes')} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save Survey</button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
