import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  History,
  ShieldCheck,
  Download,
  Mail,
  UserCheck
} from 'lucide-react';
import { MOCK_BENEFICIARIES, MOCK_LOAN_APPLICATIONS, MOCK_REPAYMENTS, MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { formatCurrency, formatDate, cn } from '../../../shared/utils/cn';
import { LoanApplicationStatus } from '../../loans/types';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { motion } from 'motion/react';

export const BeneficiaryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const beneficiary = MOCK_BENEFICIARIES.find(b => b.id === id);
  const constituency = MOCK_CONSTITUENCIES.find(c => c.id === beneficiary?.constituencyId);
  
  const beneficiaryLoans = MOCK_LOAN_APPLICATIONS.filter(l => l.beneficiaryId === id);
  const repaymentLog = MOCK_REPAYMENTS.filter(r => beneficiaryLoans.some(l => l.id === r.loanId));

  const totalReceived = beneficiaryLoans
    .filter(l => l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED)
    .reduce((sum, l) => sum + (l.amountApproved || 0), 0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [id]);

  if (!beneficiary && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-widest">RECORD NOT FOUND</h2>
        <p className="text-sm text-muted-foreground mt-2">The requested constituent record does not exist or has been archived.</p>
        <button onClick={() => navigate('/beneficiaries')} className="btn-primary mt-8">Return to Registry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/beneficiaries')}
            className="p-2 bg-muted border border-border hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest">Constituent Dossier</h1>
            <p className="text-[11px] text-muted-foreground mt-1 uppercase font-semibold">Official Record: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline">
            <Download className="w-4 h-4" />
            Download Records
          </button>
          <button className="btn-primary">
            <CreditCard className="w-4 h-4" />
            New Disbursement
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Identity Card */}
          <div className="lg:col-span-1">
            <div className="dashboard-card sticky top-8">
              <div className="flex flex-col items-center text-center pb-8 border-b border-border">
                <div className="w-24 h-24 bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
                  <UserCheck className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 uppercase tracking-tight">{beneficiary?.name}</h3>
                <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase tracking-widest mb-4">
                  VERIFIED
                </span>
                <div className="w-full grid grid-cols-2 gap-4 mt-6">
                   <div className="p-4 bg-muted border border-border">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Type</p>
                      <p className="text-[11px] font-black uppercase text-foreground">{beneficiary?.type}</p>
                   </div>
                   <div className="p-4 bg-muted border border-border">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">ID Number</p>
                      <p className="text-[11px] font-black uppercase text-foreground">{beneficiary?.registrationNumber || beneficiary?.nrc}</p>
                   </div>
                </div>
              </div>

              <div className="py-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="label-caps opacity-60">Field Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">{constituency?.name || 'Unknown'} Region</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">{beneficiary?.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">{beneficiary?.email || `contact@${beneficiary?.id}.gov.zm`}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">Enrolled: {beneficiary?.createdAt ? formatDate(beneficiary.createdAt) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="label-caps opacity-60 mb-4">Verification Status</h4>
                  <div className="bg-muted p-4 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">KyC Verification</span>
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Address Confirmed</span>
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Background Check</span>
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="dashboard-card bg-primary text-white border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <CreditCard className="w-24 h-24" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Total Disbursements Received</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-bold">{formatCurrency(totalReceived)}</span>
                  <span className="text-sm font-mono opacity-60">ZMW</span>
                </div>
              </div>
              <div className="dashboard-card bg-muted border border-border flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">Financial Capacity Rating</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-border relative">
                    <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-sm font-mono font-bold">75/100</span>
                </div>
              </div>
            </div>

            {/* Loan/Grant History */}
            <div className="dashboard-card p-0 overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Loan & Grant History</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Submitted</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Type</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Purpose</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {beneficiaryLoans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[10px] uppercase text-muted-foreground">No loan or grant records.</td>
                      </tr>
                    )}
                    {beneficiaryLoans.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-mono font-bold">{formatDate(l.submissionDate)}</td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase text-primary">{l.fundingType}</td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground">{l.purpose}</td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase">{l.status}</td>
                        <td className="px-6 py-4 text-[10px] font-mono font-bold text-right">{formatCurrency(l.amountApproved || l.amountRequested).replace('ZMW', '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {repaymentLog.length > 0 && (
              <div className="dashboard-card p-0 overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Repayment Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Reference</th>
                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Method</th>
                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {repaymentLog.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-[10px] font-mono font-bold">{formatDate(r.paymentDate)}</td>
                          <td className="px-6 py-4 text-[10px] font-mono font-bold text-primary">{r.reference}</td>
                          <td className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground">{r.paymentMethod}</td>
                          <td className="px-6 py-4 text-[10px] font-mono font-bold text-right">{formatCurrency(r.amount).replace('ZMW', '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
