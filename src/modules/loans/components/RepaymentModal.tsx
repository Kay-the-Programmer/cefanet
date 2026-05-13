import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HandCoins, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { LoanGrantApplication } from '../types';
import { PaymentMethod } from '../../../shared/types/common';
import { loanService } from '../api/loanService';

interface RepaymentModalProps {
  loan: LoanGrantApplication;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({ loan, isOpen, onClose, onSuccess }) => {
  const [summary, setSummary] = useState<ReturnType<typeof loanService.getRepaymentSummary>>(null);
  const [schedule, setSchedule] = useState<ReturnType<typeof loanService.getSchedule>>([]);
  const [form, setForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: PaymentMethod.MOBILE_MONEY,
    reference: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSummary(loanService.getRepaymentSummary(loan.id));
    setSchedule(loanService.getSchedule(loan.id));
  }, [loan.id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loanService.addRepayment({
        loanId: loan.id,
        amount: parseFloat(form.amount),
        paymentDate: new Date(form.paymentDate).toISOString(),
        paymentMethod: form.paymentMethod as PaymentMethod,
        reference: form.reference,
        receivedBy: 'Finance Officer',
        notes: form.notes || undefined,
      });
      onSuccess();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const fmt = (n: number) => `ZMW ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-card border border-border shadow-2xl overflow-hidden">

            <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center">
                  <HandCoins className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest">Record Repayment</h2>
                  <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{loan.businessName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* FR-LOAN-004: Balance summary */}
              {summary && (
                <div className="bg-muted/50 border border-border p-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-muted-foreground">Approved Amount</span>
                    <span>{fmt(loan.amountApproved ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-muted-foreground">Total Repaid</span>
                    <span className="text-emerald-600">{fmt(summary.totalRepaid)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase border-t border-border pt-2 mt-1">
                    <span className="text-muted-foreground">Outstanding Balance</span>
                    <span className="text-foreground font-mono">{fmt(summary.outstanding)}</span>
                  </div>
                  {summary.overdueAmount > 0 && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 border border-red-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase text-red-500">
                        Overdue: {fmt(summary.overdueAmount)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                      <span className="text-muted-foreground">Repayment Rate</span>
                      <span>{summary.repaymentRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted">
                      <div className="h-1.5 bg-emerald-500 transition-all" style={{ width: `${Math.min(100, summary.repaymentRate)}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {loan.monthlyInstallment && (
                <p className="text-[10px] text-muted-foreground font-bold uppercase">
                  Monthly instalment: {fmt(loan.monthlyInstallment)} · {loan.repaymentPeriod} months · {loan.interestRate}% p.a.
                </p>
              )}

              {/* Per-installment schedule */}
              {schedule.length > 0 && (
                <div className="border border-border max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-5 px-2 py-1 bg-muted/50 text-[9px] font-bold uppercase text-muted-foreground sticky top-0">
                    <span>#</span><span>Due</span><span>Amount</span><span>Paid</span><span>Status</span>
                  </div>
                  {schedule.map(s => {
                    const color = s.status === 'PAID' ? 'text-emerald-600'
                      : s.status === 'OVERDUE' ? 'text-red-500'
                      : s.status === 'PARTIALLY_PAID' ? 'text-amber-500'
                      : 'text-muted-foreground';
                    return (
                      <div key={s.id} className="grid grid-cols-5 px-2 py-1 text-[9px] font-mono border-t border-border">
                        <span>{s.installmentNumber}</span>
                        <span>{new Date(s.installmentDueDate).toLocaleDateString()}</span>
                        <span>{fmt(s.amountDue)}</span>
                        <span>{fmt(s.amountPaid)}</span>
                        <span className={`font-bold uppercase ${color}`}>{s.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Repayment Amount (ZMW)<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input required type="number" min={1} placeholder="Amount paid"
                    className="input-field pl-10" value={form.amount} onChange={set('amount')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Date<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required type="date" className="input-field pl-10" value={form.paymentDate} onChange={set('paymentDate')} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Method</label>
                  <select className="input-field" value={form.paymentMethod} onChange={set('paymentMethod')}>
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reference Number<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input required className="input-field" placeholder="e.g. TXN-92834" value={form.reference} onChange={set('reference')} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
                <input className="input-field" placeholder="Optional" value={form.notes} onChange={set('notes')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Record Repayment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
