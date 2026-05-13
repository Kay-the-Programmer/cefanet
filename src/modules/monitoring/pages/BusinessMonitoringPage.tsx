import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { loanService } from '../../loans/api/loanService';
import { 
  BusinessMonitoring, 
} from '../types';
import {
  LoanGrantApplication,
  LoanApplicationStatus
} from '../../loans/types';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export const BusinessMonitoringPage: React.FC = () => {
  const [monitoringRecords, setMonitoringRecords] = useState<BusinessMonitoring[]>([]);
  const [activePortfolios, setActivePortfolios] = useState<LoanGrantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<LoanGrantApplication | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [monData, apps] = await Promise.all([
      loanService.getMonitoring(),
      loanService.getApplications()
    ]);
    setMonitoringRecords(monData);
    setActivePortfolios(apps.filter(app => app.status === LoanApplicationStatus.FULLY_DISBURSED || app.status === LoanApplicationStatus.ACTIVE || app.status === LoanApplicationStatus.COMPLETED));
    setLoading(false);
  };

  const filteredPortfolios = activePortfolios.filter(app =>
    app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    avgSurvival: monitoringRecords.length > 0 
      ? (monitoringRecords.reduce((sum, m) => sum + m.survivalMonths, 0) / monitoringRecords.length).toFixed(1)
      : '0',
    totalJobs: monitoringRecords.reduce((sum, m) => sum + m.jobsCreated, 0),
    avgGrowth: monitoringRecords.length > 0
      ? (monitoringRecords.reduce((sum, m) => sum + m.revenueGrowth, 0) / monitoringRecords.length).toFixed(1)
      : '0',
    survivalRate: activePortfolios.length > 0
      ? ((monitoringRecords.filter(m => m.status === 'ACTIVE' || m.status === 'STRUGGLING').length / activePortfolios.length) * 100).toFixed(0)
      : '0'
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Business Monitoring Hub</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            Tracking economic impact and enterprise sustainability in constituencies
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-4 h-4" />
          <span>REAL-TIME PERFORMANCE MONITORING ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Survival Rate (12M)" 
          value={`${stats.survivalRate}%`} 
          icon={CheckCircle2}
          trend={{ value: 4, isPositive: true }}
          color="bg-primary/10 text-primary"
        />
        <StatCard 
          title="Total Jobs Created" 
          value={stats.totalJobs.toString()} 
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard 
          title="Avg Revenue Growth" 
          value={`${stats.avgGrowth}%`} 
          icon={TrendingUp}
          trend={{ value: 1.5, isPositive: true }}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard 
          title="Avg Sustainability" 
          value={`${stats.avgSurvival} Mo`} 
          icon={Clock}
          color="bg-orange-500/10 text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active Portfolios List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border border-border">
            <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xs font-bold uppercase tracking-widest">Funded Beneficiaries</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search enterprises..." 
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Enterprise</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Funding</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Check</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-muted rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : filteredPortfolios.map((app) => {
                    const lastCheck = monitoringRecords.filter(m => m.beneficiaryId === app.beneficiaryId).sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())[0];
                    
                    return (
                      <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{app.businessName}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{app.purpose}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {app.businessSector.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">K{app.amountApproved}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{app.fundingType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lastCheck ? (
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(lastCheck.checkDate), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter bg-orange-500/5 px-2 py-0.5 rounded">Pending Initial Check</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedPortfolio(app);
                              setIsModalOpen(true);
                            }}
                            className="btn-outline py-1 px-3 text-[10px]"
                          >
                            Add Visit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Impact Feed */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Recent Performance Updates</h2>
            </div>
            
            <div className="space-y-6">
              {monitoringRecords.slice(0, 5).map((record) => {
                const app = activePortfolios.find(a => a.beneficiaryId === record.beneficiaryId);
                return (
                  <div key={record.id} className="relative pl-6 pb-6 border-l border-border last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">{app?.beneficiaryName}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(record.checkDate), 'MMM dd')}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{record.performanceNotes}"</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-[10px] font-bold text-green-500">+{record.revenueGrowth}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] font-bold text-blue-500">{record.jobsCreated} Jobs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 border border-zinc-800 rounded-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
                 <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                 <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">M&E Directive</h3>
                 <p className="text-[10px] text-zinc-500 uppercase font-medium">Policy Requirement</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-tight font-medium">
              ALL BENEFICIARIES MUST BE VISITED AT LEAST ONCE PER QUARTER. 
              FAILURE TO MONITOR ENTERPRISE PERFORMANCE MAY RESULT IN SUSPENSION OF FUTURE DISBURSEMENTS.
            </p>
          </div>
        </div>
      </div>

      {/* Add Monitoring Record Modal Placeholder */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-bold uppercase tracking-widest">Record Monitoring Visit</h2>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">Beneficiary: {selectedPortfolio?.beneficiaryName}</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Visit Date</label>
                    <input type="date" className="input-field py-2" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Business Status</label>
                    <select className="input-field py-2">
                       <option value="ACTIVE">ACTIVE & TRADING</option>
                       <option value="STRUGGLING">STRUGGLING</option>
                       <option value="CLOSED">CLOSED / SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Revenue Growth (%)</label>
                    <input type="number" placeholder="e.g. 15" className="input-field py-2" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">New Jobs Created</label>
                    <input type="number" placeholder="0" className="input-field py-2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Monitoring Notes / Observations</label>
                  <textarea 
                    rows={4} 
                    placeholder="Describe enterprise state, challenges, and support needed..." 
                    className="input-field py-3 resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="btn-outline flex-1">DISCARD</button>
                  <button onClick={() => setIsModalOpen(false)} className="btn-primary flex-1">SUBMIT RECORD</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
