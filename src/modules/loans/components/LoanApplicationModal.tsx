import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, HandCoins, User, Briefcase, AlertCircle } from 'lucide-react';
import { FundingType, DemographicGroup, BusinessSector } from '../types';
import { loanService } from '../api/loanService';
import { useAuth } from '../../auth/AuthContext';

interface LoanApplicationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const LoanApplicationModal: React.FC<LoanApplicationModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const constituencies = loanService.getConstituencies();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    applicantName: '',
    applicantNrc: '',
    applicantPhone: '',
    businessName: '',
    businessSector: BusinessSector.TRADE,
    fundingType: FundingType.LOAN,
    demographicGroup: DemographicGroup.YOUTH,
    constituencyId: user?.constituencyId || constituencies[0]?.id || '',
    amountRequested: '',
    interestRate: '5',
    repaymentPeriod: '12',
    purpose: '',
    submissionDate: new Date().toISOString().slice(0, 10),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loanService.createApplication({
        applicantName: form.applicantName,
        applicantNrc: form.applicantNrc,
        applicantPhone: form.applicantPhone,
        businessName: form.businessName,
        businessSector: form.businessSector,
        beneficiaryId: user?.id ?? 'anon',
        fundingType: form.fundingType,
        demographicGroup: form.demographicGroup,
        constituencyId: form.constituencyId,
        amountRequested: parseFloat(form.amountRequested),
        ...(form.fundingType === FundingType.LOAN && {
          interestRate: parseFloat(form.interestRate),
          repaymentPeriod: parseInt(form.repaymentPeriod),
        }),
        purpose: form.purpose,
        submissionDate: new Date(form.submissionDate).toISOString(),
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">New Loan / Grant Application</h2>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">SDG 1 & 8 — Economic Empowerment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border">

          {/* Section 1 – Applicant */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Applicant Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input required className="input-field" value={form.applicantName} onChange={set('applicantName')} />
              </Field>
              <Field label="NRC Number" required>
                <input required className="input-field" placeholder="e.g. 123456/78/1" value={form.applicantNrc} onChange={set('applicantNrc')} />
              </Field>
              <Field label="Phone / Contact" required>
                <input required type="tel" className="input-field" placeholder="+260 97 000 0000" value={form.applicantPhone} onChange={set('applicantPhone')} />
              </Field>
              <Field label="Constituency" required>
                <select required className="input-field" value={form.constituencyId} onChange={set('constituencyId')}>
                  {constituencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Category (Demographics)" required>
                <select required className="input-field" value={form.demographicGroup} onChange={set('demographicGroup')}>
                  {Object.values(DemographicGroup).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Application Date" required>
                <input required type="date" className="input-field" value={form.submissionDate} onChange={set('submissionDate')} />
              </Field>
            </div>
          </div>

          {/* Section 2 – Business */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Business Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business Name" required>
                <input required className="input-field" placeholder="Registered business / group name" value={form.businessName} onChange={set('businessName')} />
              </Field>
              <Field label="Business Sector" required>
                <select required className="input-field" value={form.businessSector} onChange={set('businessSector')}>
                  {Object.values(BusinessSector).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Section 3 – Funding */}
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest">Funding Details</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(FundingType).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, fundingType: t }))}
                  className={`py-2.5 text-[10px] font-bold uppercase border transition-colors ${
                    form.fundingType === t ? 'bg-primary text-white border-primary' : 'bg-muted border-border text-muted-foreground hover:border-foreground'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Requested Amount (ZMW)" required>
                <input required type="number" min={1} className="input-field" value={form.amountRequested} onChange={set('amountRequested')} />
              </Field>
              {form.fundingType === FundingType.LOAN && (
                <>
                  <Field label="Interest Rate (%)">
                    <input type="number" min={0} className="input-field" value={form.interestRate} onChange={set('interestRate')} />
                  </Field>
                  <Field label="Repayment Period (months)">
                    <input type="number" min={1} className="input-field" value={form.repaymentPeriod} onChange={set('repaymentPeriod')} />
                  </Field>
                </>
              )}
            </div>
            <Field label="Purpose / Business Plan" required>
              <textarea required rows={3} className="input-field resize-none" placeholder="Describe how funds will be used…"
                value={form.purpose} onChange={set('purpose')} />
            </Field>
          </div>

          {/* Actions */}
          <div className="p-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tight max-w-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Application will be queued for committee review. Ensure supporting documents are ready.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Submit Application
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
