import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, MapPin, ClipboardCheck, Users, Plus, CheckCircle2,
  Clock, AlertTriangle, X, Paperclip, ChevronDown, ChevronUp,
  MoreVertical, Trash2, Upload,
} from 'lucide-react';
import { efficiencyService } from '../api/efficiencyService';
import { MonitoringVisit, ActionItem, VisitAttachment } from '../types';
import { MOCK_CONSTITUENCIES, MOCK_BENEFICIARIES } from '../../../shared/api/mockData';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

const MAX_ATTACHMENTS = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const statusColor = (s: MonitoringVisit['status']) =>
  s === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' :
  s === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
  'bg-blue-500/10 text-blue-500';

const findingColor = (f?: MonitoringVisit['inspectionFindings']) =>
  f === 'SATISFACTORY' ? 'text-emerald-600 bg-emerald-500/10' :
  f === 'CONCERNING' ? 'text-amber-500 bg-amber-500/10' :
  f === 'FAILED' ? 'text-red-500 bg-red-500/10' : '';

// ── Log Visit Modal ──────────────────────────────────────────────────────────

interface VisitModalProps {
  constituencyId?: string;
  onClose: () => void;
  onSave: (v: Omit<MonitoringVisit, 'id' | 'createdAt'>) => void;
}

const VisitModal: React.FC<VisitModalProps> = ({ constituencyId, onClose, onSave }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'FIELD_INSPECTION' as MonitoringVisit['type'],
    scheduledDate: new Date().toISOString().slice(0, 16),
    visitDate: new Date().toISOString().slice(0, 16),
    status: 'COMPLETED' as MonitoringVisit['status'],
    officerConducting: '',
    team: '',
    constituencyId: constituencyId || MOCK_CONSTITUENCIES[0]?.id || '',
    beneficiariesVisited: [] as string[],
    findings: '',
    recommendations: '',
    inspectionFindings: '' as '' | MonitoringVisit['inspectionFindings'],
    reportSummary: '',
  });
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
  const [newAction, setNewAction] = useState({ description: '', dueDate: '', responsibleOfficer: '' });
  const [fileError, setFileError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleBeneficiary = (id: string) =>
    setForm(f => ({
      ...f,
      beneficiariesVisited: f.beneficiariesVisited.includes(id)
        ? f.beneficiariesVisited.filter(b => b !== id)
        : [...f.beneficiariesVisited, id],
    }));

  const addActionItem = () => {
    if (!newAction.description || !newAction.dueDate) return;
    setActionItems(prev => [...prev, { ...newAction, completed: false }]);
    setNewAction({ description: '', dueDate: '', responsibleOfficer: '' });
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const files: File[] = Array.from(e.target.files ?? []);
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setFileError(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`);
      return;
    }
    files.forEach(file => {
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(`"${file.name}" exceeds 10 MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        setAttachments(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: ev.target?.result as string | undefined,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: form.title,
      type: form.type,
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      visitDate: new Date(form.visitDate).toISOString(),
      status: form.status,
      officerConducting: form.officerConducting,
      team: form.team.split(',').map(s => s.trim()).filter(Boolean),
      constituencyId: form.constituencyId,
      beneficiariesVisited: form.beneficiariesVisited,
      findings: form.findings,
      recommendations: form.recommendations,
      inspectionFindings: form.inspectionFindings || undefined,
      reportSummary: form.reportSummary,
      actionItems,
      attachments,
    });
  };

  const constitBeneficiaries = MOCK_BENEFICIARIES.filter(b => b.constituencyId === form.constituencyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl overflow-y-auto max-h-[92vh]">

        <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">Log Monitoring Visit</h2>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">FR-OPS-004</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border">

          {/* Basic info */}
          <div className="p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visit Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Title <span className="text-red-500">*</span></label>
                <input required className="input-field" placeholder="e.g. Kabwata Tailoring Site Visit" value={form.title} onChange={set('title')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Visit Type</label>
                <select className="input-field" value={form.type} onChange={set('type')}>
                  <option value="FIELD_INSPECTION">Field Inspection</option>
                  <option value="VERIFICATION">Verification</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Constituency</label>
                <select className="input-field" value={form.constituencyId} onChange={set('constituencyId')}>
                  {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Scheduled Date <span className="text-red-500">*</span></label>
                <input required type="datetime-local" className="input-field" value={form.scheduledDate} onChange={set('scheduledDate')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Actual Visit Date</label>
                <input type="datetime-local" className="input-field" value={form.visitDate} onChange={set('visitDate')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Officer Conducting <span className="text-red-500">*</span></label>
                <input required className="input-field" placeholder="Full name" value={form.officerConducting} onChange={set('officerConducting')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Team Members (comma-separated)</label>
                <input className="input-field" placeholder="e.g. Jane Phiri, Paul Mwale" value={form.team} onChange={set('team')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                <select className="input-field" value={form.status} onChange={set('status')}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Inspection Findings</label>
                <select className="input-field" value={form.inspectionFindings} onChange={set('inspectionFindings')}>
                  <option value="">— Select —</option>
                  <option value="SATISFACTORY">Satisfactory</option>
                  <option value="CONCERNING">Concerning</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Beneficiaries visited */}
          {constitBeneficiaries.length > 0 && (
            <div className="p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Beneficiaries Visited</p>
              <div className="flex flex-wrap gap-2">
                {constitBeneficiaries.map(b => (
                  <button
                    key={b.id} type="button"
                    onClick={() => toggleBeneficiary(b.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase border transition-colors ${
                      form.beneficiariesVisited.includes(b.id)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-muted border-border text-muted-foreground hover:border-primary'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Findings & Recommendations */}
          <div className="p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Findings &amp; Recommendations</p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Findings</label>
              <textarea rows={3} className="input-field resize-none" placeholder="What was observed during the visit…"
                value={form.findings} onChange={set('findings')} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Recommendations</label>
              <textarea rows={2} className="input-field resize-none" placeholder="Actions recommended based on findings…"
                value={form.recommendations} onChange={set('recommendations')} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Report Summary</label>
              <textarea rows={2} className="input-field resize-none" placeholder="Short summary for dashboard display…"
                value={form.reportSummary} onChange={set('reportSummary')} />
            </div>
          </div>

          {/* Attachments */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Evidence Attachments (max {MAX_ATTACHMENTS} files, 10 MB each)
              </p>
              <span className="text-[10px] text-muted-foreground">{attachments.length}/{MAX_ATTACHMENTS}</span>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFiles} />
            <button
              type="button" onClick={() => fileRef.current?.click()}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className="btn-outline w-full flex items-center justify-center gap-2 text-[10px] py-2"
            >
              <Upload className="w-4 h-4" />
              Upload Photos / Documents
            </button>
            {fileError && <p className="text-[10px] text-red-500 font-bold">{fileError}</p>}
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-bold">{a.name}</span>
                      <span className="text-[9px] text-muted-foreground">({(a.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Items */}
          <div className="p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Follow-up Action Items</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="input-field md:col-span-1" placeholder="Description" value={newAction.description}
                onChange={e => setNewAction(p => ({ ...p, description: e.target.value }))} />
              <input type="date" className="input-field" placeholder="Due date" value={newAction.dueDate}
                onChange={e => setNewAction(p => ({ ...p, dueDate: e.target.value }))} />
              <div className="flex gap-2">
                <input className="input-field flex-1" placeholder="Responsible officer" value={newAction.responsibleOfficer}
                  onChange={e => setNewAction(p => ({ ...p, responsibleOfficer: e.target.value }))} />
                <button type="button" onClick={addActionItem}
                  className="px-3 bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {actionItems.length > 0 && (
              <div className="space-y-1">
                {actionItems.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-[10px] font-bold">{a.description}</p>
                      <p className="text-[9px] text-muted-foreground">Due: {a.dueDate} · {a.responsibleOfficer || 'Unassigned'}</p>
                    </div>
                    <button type="button" onClick={() => setActionItems(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-5 flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Visit Log</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Visit Card (expandable) ──────────────────────────────────────────────────

const VisitCard: React.FC<{ visit: MonitoringVisit }> = ({ visit }) => {
  const [expanded, setExpanded] = useState(false);
  const constituency = MOCK_CONSTITUENCIES.find(c => c.id === visit.constituencyId);

  return (
    <div className="bg-card border border-border hover:border-primary/40 transition-colors">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-11 h-11 flex items-center justify-center shrink-0 ${
            visit.status === 'COMPLETED' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
          }`}>
            {visit.type === 'FIELD_INSPECTION' ? (
              <MapPin className={`w-5 h-5 ${visit.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-500'}`} />
            ) : (
              <ClipboardCheck className={`w-5 h-5 ${visit.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-500'}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${statusColor(visit.status)}`}>{visit.status}</span>
              {visit.inspectionFindings && (
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${findingColor(visit.inspectionFindings)}`}>
                  {visit.inspectionFindings}
                </span>
              )}
              <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5">
                {visit.type.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">{visit.title}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-muted-foreground font-bold uppercase">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{constituency?.name || visit.constituencyId}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(visit.visitDate || visit.scheduledDate), 'dd MMM yyyy')}
              </span>
              {visit.officerConducting && (
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{visit.officerConducting}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {visit.attachments && visit.attachments.length > 0 && (
            <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
              <Paperclip className="w-3 h-3" />{visit.attachments.length}
            </span>
          )}
          {visit.actionItems && visit.actionItems.length > 0 && (
            <span className="text-[9px] font-bold text-primary">{visit.actionItems.filter(a => !a.completed).length} open</span>
          )}
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 hover:bg-muted rounded transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border">
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {visit.findings && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Findings</p>
                  <p className="text-[11px] text-foreground leading-relaxed">{visit.findings}</p>
                </div>
              )}
              {visit.recommendations && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Recommendations</p>
                  <p className="text-[11px] text-foreground leading-relaxed">{visit.recommendations}</p>
                </div>
              )}
              {visit.beneficiariesVisited && visit.beneficiariesVisited.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Beneficiaries Visited</p>
                  <div className="flex flex-wrap gap-1">
                    {visit.beneficiariesVisited.map(id => {
                      const b = MOCK_BENEFICIARIES.find(x => x.id === id);
                      return (
                        <span key={id} className="text-[9px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5">
                          {b?.name || id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {visit.actionItems && visit.actionItems.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground mb-2">Action Items</p>
                  <div className="space-y-1.5">
                    {visit.actionItems.map((a, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2 text-[10px] ${a.completed ? 'bg-emerald-500/5' : 'bg-muted/40'}`}>
                        <div className={`w-3.5 h-3.5 mt-0.5 rounded-full shrink-0 border-2 ${a.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground'}`} />
                        <div>
                          <p className="font-bold">{a.description}</p>
                          <p className="text-muted-foreground">Due: {a.dueDate} · {a.responsibleOfficer || 'Unassigned'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {visit.attachments && visit.attachments.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground mb-2">Attachments ({visit.attachments.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {visit.attachments.map((a, i) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] font-bold bg-muted px-2 py-1">
                        <Paperclip className="w-3 h-3" />{a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const MonitoringHubPage: React.FC = () => {
  const [visits, setVisits] = useState<MonitoringVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [selectedConstituency, setSelectedConstituency] = useState('');

  const coverage = efficiencyService.getVisitCoverageReport();
  const overdueList = coverage.filter(v => v.overdueFlag);

  useEffect(() => {
    efficiencyService.getMonitoringVisits().then(data => {
      setVisits(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (v: Omit<MonitoringVisit, 'id' | 'createdAt'>) => {
    const saved = await efficiencyService.addMonitoringVisit(v);
    setVisits(prev => [saved, ...prev]);
    setShowModal(false);
  };

  const filtered = visits.filter(v => {
    const tabOk = activeTab === 'ALL' || v.status === activeTab;
    const cOk = !selectedConstituency || v.constituencyId === selectedConstituency;
    return tabOk && cOk;
  });

  const tabs: Array<typeof activeTab> = ['ALL', 'SCHEDULED', 'COMPLETED'];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Field Monitoring Hub</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            FR-OPS-004 &amp; FR-OPS-005 — Monitoring visit log and constituency coverage
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Visit
        </button>
      </div>

      {/* FR-OPS-005: Overdue flag */}
      {overdueList.length > 0 && (
        <div className="border border-amber-400 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">
              FR-OPS-005 Alert: {overdueList.length} {overdueList.length === 1 ? 'constituency has' : 'constituencies have'} not been visited in over 90 days
            </p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {overdueList.map(c => (
                <button key={c.constituencyId}
                  onClick={() => setSelectedConstituency(c.constituencyId === selectedConstituency ? '' : c.constituencyId)}
                  className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600 px-2 py-0.5 hover:bg-amber-500/30 transition-colors">
                  {c.constituencyName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coverage strip — FR-OPS-005 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coverage.map(c => (
          <button key={c.constituencyId}
            onClick={() => setSelectedConstituency(c.constituencyId === selectedConstituency ? '' : c.constituencyId)}
            className={`text-left p-4 border transition-colors ${selectedConstituency === c.constituencyId ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide">{c.constituencyName}</span>
              {c.overdueFlag
                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
            <p className="text-xl font-bold font-mono">{c.totalVisits}</p>
            <p className="text-[9px] uppercase text-muted-foreground font-bold">
              {c.lastVisitDate ? `Last: ${new Date(c.lastVisitDate).toLocaleDateString()}` : 'No visits recorded'}
            </p>
          </button>
        ))}
      </div>

      {/* Tabs + filter */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-1">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {tab === 'ALL' ? `All (${visits.length})` : tab === 'SCHEDULED' ? `Scheduled (${visits.filter(v => v.status === 'SCHEDULED').length})` : `Completed (${visits.filter(v => v.status === 'COMPLETED').length})`}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <select className="input-field py-1.5 text-[10px]" value={selectedConstituency} onChange={e => setSelectedConstituency(e.target.value)}>
            <option value="">All Constituencies</option>
            {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Visit list */}
      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-[10px] uppercase border border-dashed border-border">
            No visits found for the selected filters
          </div>
        ) : (
          filtered.map(visit => <VisitCard key={visit.id} visit={visit} />)
        )}
      </div>

      <AnimatePresence>
        {showModal && <VisitModal constituencyId={selectedConstituency || undefined} onClose={() => setShowModal(false)} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
};
