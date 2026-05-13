import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  ShieldCheck,
  Eye,
  Database,
  Filter,
  Calendar
} from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '../../../shared/api/mockData';
import { formatDate } from '../../../shared/utils/cn';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getAuditLogs, enforceDataRetentionPolicies, verifyAuditChain } from '../api/auditService';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; brokenAt: number; total: number } | null>(null);

  useEffect(() => {
    enforceDataRetentionPolicies();
    setChainStatus(verifyAuditChain());

    const persistedLogs = getAuditLogs();
    setLogs([...persistedLogs, ...MOCK_AUDIT_LOGS]);
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const uniqueUsers = useMemo(() => Array.from(new Set(logs.map(l => l.userName || 'System'))), [logs]);
  const uniqueModules = useMemo(() => Array.from(new Set(logs.map(l => l.entityType))), [logs]);
  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs]);

  const filteredLogs = logs.filter(log => {
    const userName = log.userName || 'System';
    
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase()));
           
    const matchesUser = userFilter === '' || userName === userFilter;
    const matchesModule = moduleFilter === '' || log.entityType === moduleFilter;
    const matchesAction = actionFilter === '' || log.action === actionFilter;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const logDate = new Date(log.timestamp).getTime();
      if (startDate && logDate < new Date(startDate).getTime()) matchesDate = false;
      if (endDate && logDate > new Date(endDate).getTime() + 86400000) matchesDate = false; // Add 1 day to end date to include the whole day
    }

    return matchesSearch && matchesUser && matchesModule && matchesAction && matchesDate;
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest">Audit Trails</h1>
          <p className="text-[11px] text-muted-foreground mt-1 uppercase font-semibold">Cryptographically Verified System Logs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 border text-[9px] font-bold uppercase tracking-widest ${
            chainStatus?.valid
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {chainStatus?.valid
              ? `Hash chain verified (${chainStatus.total} entries)`
              : `Tampering detected at entry #${chainStatus?.brokenAt ?? '?'}`}
          </div>
        </div>
      </div>

      <div className="dashboard-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="SEARCH LOGS BY DESCRIPTION, ACTION OR REFERENCE..." 
              className="w-full pl-12 pr-4 py-3 bg-muted border border-border text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select 
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border text-[9px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary appearance-none"
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                >
                  <option value="">ALL OFFICERS</option>
                  {uniqueUsers.map(u => <option key={u} value={u}>{u as string}</option>)}
                </select>
             </div>
             <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select 
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border text-[9px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary appearance-none"
                  value={moduleFilter}
                  onChange={e => setModuleFilter(e.target.value)}
                >
                  <option value="">ALL MODULES</option>
                  {uniqueModules.map(m => <option key={m} value={m}>{m as string}</option>)}
                </select>
             </div>
             <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select 
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border text-[9px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary appearance-none"
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                >
                  <option value="">ALL ACTIONS</option>
                  {uniqueActions.map(a => <option key={a} value={a}>{a as string}</option>)}
                </select>
             </div>
             <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="date"
                    className="w-full pl-9 pr-2 py-2.5 bg-muted/50 border border-border text-[9px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="date"
                    className="w-full pl-9 pr-2 py-2.5 bg-muted/50 border border-border text-[9px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-4 py-4">Officer</th>
                <th className="px-4 py-4">Action Protocol</th>
                <th className="px-4 py-4">Details / Ledger Reference</th>
                <th className="px-8 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-8 py-5"><Skeleton className="h-3 w-32" /></td>
                    <td className="px-4 py-5"><Skeleton className="h-3 w-24" /></td>
                    <td className="px-4 py-5"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-5"><Skeleton className="h-3 w-64" /></td>
                    <td className="px-8 py-5 text-right"><Skeleton className="h-3 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filteredLogs.map((log) => {
                  const userName = log.userName || 'System';
                  return (
                  <tr key={log.id} className="border-b border-border/50 group hover:bg-muted/30 transition-colors">
                    <td className="px-8 py-6 font-mono text-[10px] text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                          {userName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-bold uppercase">{userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className="px-2 py-1 bg-secondary text-[9px] font-bold uppercase tracking-tighter border border-border">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-6 max-w-md">
                      <p className="text-[11px] text-foreground leading-relaxed italic">
                        {log.description || `Performed action on ${log.entityType}`}
                      </p>
                      {(log.fieldChanged || log.oldValue || log.newValue) && (
                        <div className="mt-2 space-y-1 p-2 bg-muted/30 border border-border text-[9px] font-mono">
                          {log.fieldChanged && <div className="text-muted-foreground"><span className="text-primary/70">FIELD:</span> {log.fieldChanged}</div>}
                          {log.oldValue && <div className="text-red-400/70"><span className="opacity-50">OLD:</span> {log.oldValue}</div>}
                          {log.newValue && <div className="text-green-400/70"><span className="opacity-50">NEW:</span> {log.newValue}</div>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[9px] font-bold text-muted-foreground uppercase opacity-40">
                         <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {log.entityType} ID: {log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="text-[10px] font-bold text-primary uppercase flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5" />
                          Validate
                       </button>
                    </td>
                  </tr>
                )})
              )}

              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-20 text-center opacity-40">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4" />
                    <p className="label-caps">No audit records found matching criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

