import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { loanService } from '../../loans/api/loanService';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { 
  HandCoins, 
  TrendingUp, 
  Users, 
  Briefcase,
  FileText,
  Download,
  Calendar
} from 'lucide-react';

export const LoansGrantsReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    const data = await loanService.getReportData();
    setReportData(data);
    setLoading(false);
  };

  const getDemographicsData = () => {
    if (!reportData) return [];
    return Object.entries(reportData.demographics).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  };

  const COLORS = ['#F27D26', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'];

  const quarterlyImpactData = [
    { quarter: 'Q1 2025', disbursements: 450000, jobs: 42 },
    { quarter: 'Q2 2025', disbursements: 620000, jobs: 58 },
    { quarter: 'Q3 2025', disbursements: 380000, jobs: 35 },
    { quarter: 'Q4 2025', disbursements: 890000, jobs: 94 },
    { quarter: 'Q1 2026', disbursements: 1200000, jobs: 128 },
  ];

  if (loading) return <div className="p-8 text-center uppercase tracking-widest text-xs animate-pulse">Aggregating Ministry Data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Impact & Disbursement Analytics</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            Visualizing the socio-economic footprint of constituency developmental funds
          </p>
        </div>
        <div className="flex gap-2">
           <button className="btn-outline flex items-center gap-2 text-[10px] py-1.5">
             <Download className="w-3.5 h-3.5" />
             PDF REPORT
           </button>
           <button className="btn-primary flex items-center gap-2 text-[10px] py-1.5">
             <Calendar className="w-3.5 h-3.5" />
             CHANGE PERIOD
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Disbursed" value={`K${(reportData.totalDisbursed / 1000000).toFixed(2)}M`} icon={HandCoins} trend={{value: 14, isPositive: true}} />
        <StatCard title="Employment Impact" value={`${reportData.jobsCreated} JOBS`} icon={Users} trend={{value: 22, isPositive: true}} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Portfolio Efficiency" value={`${reportData.disbursementRate.toFixed(1)}%`} icon={TrendingUp} trend={{value: 3, isPositive: true}} color="bg-emerald-500/10 text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Disbursement Trends */}
        <div className="bg-card border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-primary" />
               Quarterly Deployment Growth
            </h2>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quarterlyImpactData}>
                  <defs>
                    <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0px', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="disbursements" stroke="#F27D26" fillOpacity={1} fill="url(#colorDis)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Demographic Distribution */}
        <div className="bg-card border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <Briefcase className="w-4 h-4 text-primary" />
               Beneficiary Demographics (By Allocation)
            </h2>
          </div>
          <div className="h-[300px] flex flex-col md:flex-row items-center gap-4">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getDemographicsData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getDemographicsData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0px', fontSize: '10px' }}
                    formatter={(value: any) => `K${(value / 1000).toFixed(0)}k`}
                  />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex flex-col gap-3 min-w-[150px]">
                {getDemographicsData().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Jobs Created vs Funding */}
        <div className="bg-card border border-border p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <Users className="w-4 h-4 text-primary" />
               Employment Impact Correlation
            </h2>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyImpactData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0px', fontSize: '10px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="square" formatter={(v) => <span className="text-[10px] font-bold uppercase tracking-widest">{v}</span>} />
                  <Bar dataKey="jobs" fill="#F27D26" name="New Jobs Created" barSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
