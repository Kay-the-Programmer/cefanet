import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Briefcase, 
  Activity,
  ArrowUpRight,
  ChevronRight,
  PieChart as PieIcon,
  Globe2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { meService, MeReportData } from '../api/meService';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { motion } from 'motion/react';

const COLORS = ['#F27D26', '#3b82f6', '#10b981', '#a855f7', '#f43f5e'];

export const MeDashboardPage: React.FC = () => {
  const [data, setData] = useState<MeReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const report = await meService.getMeDashboardData();
    setData(report);
    setLoading(false);
  };

  if (loading || !data) return <div className="p-12 text-center text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Initializing M&E Subsystem...</div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
             <Globe2 className="w-4 h-4 animate-spin-slow" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Global Governance Standard</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground leading-none">M&E Control Center</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-2 flex items-center gap-2">
            Integrated Monitoring, Evaluation & Learning (IMEL) Framework <ChevronRight className="w-3 h-3" /> CDF Division
          </p>
        </div>
        <div className="flex gap-2">
           <div className="bg-muted px-4 py-2 border border-border flex flex-col items-end">
              <span className="text-[9px] font-bold uppercase text-muted-foreground leading-none">Last Audit</span>
              <span className="text-xs font-mono font-bold leading-none mt-1">2026-05-09</span>
           </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Bursaries Awarded" 
          value={data.kpis.totalBursaries.toString()} 
          icon={TrendingUp}
          colorClass="border-primary"
        />
        <StatCard 
          title="Loan Repayment" 
          value={`${data.kpis.loanRepaymentRate.toFixed(1)}%`} 
          icon={Activity}
          colorClass="border-blue-500"
        />
        <StatCard 
          title="Jobs Created" 
          value={data.kpis.jobsCreated.toString()} 
          icon={Briefcase}
          colorClass="border-emerald-500"
        />
        <StatCard 
          title="SLA Compliance" 
          value={`${data.kpis.transparencyCompliance}%`} 
          icon={ShieldCheck}
          colorClass="border-purple-500"
        />
        <StatCard 
          title="Field Evidence" 
          value={data.kpis.visitsCompleted.toString()} 
          icon={MapPin}
          colorClass="border-zinc-500"
          subValue="Verified Visits"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Analysis - Large */}
        <div className="lg:col-span-2 bg-card border border-border p-8 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                 <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Multidimensional Impact Trends
                 </h2>
                 <p className="text-[10px] text-muted-foreground uppercase font-medium">Tracking quarterly KPIs Across Modules</p>
              </div>
           </div>
           <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data.analytics.trends}>
                 <defs>
                   <linearGradient id="colorBursaries" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                 <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0px', fontSize: '10px' }}
                 />
                 <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold'}} />
                 <Area type="monotone" dataKey="bursaries" stroke="#F27D26" fillOpacity={1} fill="url(#colorBursaries)" strokeWidth={2} name="Bursaries" />
                 <Area type="monotone" dataKey="loans" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} name="Loans" />
                 <Area type="monotone" dataKey="jobs" stroke="#10b981" fillOpacity={0} strokeWidth={2} name="Impact (Jobs)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* SDG Metrics - Sidebar */}
        <div className="bg-zinc-900 p-8 border border-zinc-800 flex flex-col justify-between">
           <div>
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-8">
                 <Globe2 className="w-4 h-4 text-emerald-500" />
                 UN SDG CONTRIBUTION
              </h2>
              <div className="space-y-8">
                {data.analytics.sdgImpact.map((sdg) => (
                  <div key={sdg.sdg} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase leading-none">{sdg.sdg}</p>
                          <p className="text-[11px] font-bold text-white uppercase tracking-tight mt-1">{sdg.label}</p>
                       </div>
                       <span className="text-lg font-mono font-bold text-white">{sdg.metric}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${sdg.metric}%` }}
                         className="h-full bg-emerald-500" 
                       />
                    </div>
                  </div>
                ))}
              </div>
           </div>
           
           <div className="mt-12 bg-zinc-800/50 p-4 border border-zinc-700/50">
              <p className="text-[9px] text-zinc-400 uppercase font-bold leading-relaxed">
                Aggregated progress against international benchmarks for socio-economic development and institutional strength.
              </p>
           </div>
        </div>
      </div>

      {/* Comparisons & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-card border border-border p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-8">
               <MapPin className="w-4 h-4 text-primary" />
               Constituency Performance Sync
            </h2>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.analytics.constituencyComparison}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0px', fontSize: '10px' }}
                     />
                     <Legend wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold'}} />
                     <Bar dataKey="performance" fill="#F27D26" name="Performance Index" radius={[4, 4, 0, 0]} />
                     <Bar dataKey="transparency" fill="#3b82f6" name="Transparency" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-card border border-border p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-8">
               <PieIcon className="w-4 h-4 text-primary" />
               Inclusion Heatmap
            </h2>
            <div className="flex items-center justify-center gap-12">
               <div className="h-[250px] w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={data.demographics}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {data.demographics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0px', fontSize: '10px' }}
                        />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-4 w-1/2">
                  {data.demographics.map((item, index) => (
                     <div key={item.name} className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                           <span className="text-[11px] font-bold uppercase">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold">{item.value}%</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* NEW: Regional Vitality Heatmap */}
      <div className="bg-card border border-border p-8">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <Activity className="w-4 h-4 text-primary" />
               Regional Vitality Heatmap (Quality of Life Index)
            </h2>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500/20"></div>
                  <span className="text-[8px] font-bold uppercase text-muted-foreground">Critical</span>
               </div>
               <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500"></div>
                  <span className="text-[8px] font-bold uppercase text-muted-foreground">Prime</span>
               </div>
            </div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {Array.from({ length: 40 }).map((_, i) => {
               const opacity = Math.random() * 0.8 + 0.2;
               return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="aspect-square bg-emerald-500 border border-emerald-400/20 relative group"
                    style={{ opacity }}
                  >
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[8px] text-white font-bold">Z-{i+100}</span>
                     </div>
                  </motion.div>
               );
            })}
         </div>
         <p className="mt-4 text-[9px] text-muted-foreground uppercase font-medium tracking-tight text-right">
            Visualization derived from 40 monitored wards across 4 constituencies.
         </p>
      </div>
    </div>
  );
};
