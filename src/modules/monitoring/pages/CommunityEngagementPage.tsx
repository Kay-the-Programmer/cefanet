import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, MapPin, Calendar, MessageSquare, BookOpen, FileText,
  Star, X, Upload, Users2, AlertCircle, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import { efficiencyService } from '../api/efficiencyService';
import { CommunitySession } from '../types';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { StatCard } from '../../../shared/components/ui/StatCard';

const SESSION_TYPE_META: Record<CommunitySession['sessionType'], { label: string; color: string; icon: React.ReactNode }> = {
  DIALOGUE: { label: 'Dialogue', color: 'bg-blue-500/10 text-blue-500', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  WORKSHOP: { label: 'Workshop', color: 'bg-amber-500/10 text-amber-500', icon: <BookOpen className="w-3.5 h-3.5" /> },
  SCORECARD_DISTRIBUTION: { label: 'Scorecard', color: 'bg-purple-500/10 text-purple-500', icon: <Star className="w-3.5 h-3.5" /> },
  OTHER: { label: 'Other', color: 'bg-muted text-muted-foreground', icon: <FileText className="w-3.5 h-3.5" /> },
};

// ── Add Session Modal ─────────────────────────────────────────────────────────

interface SessionModalProps {
  onClose: () => void;
  onSave: (s: Omit<CommunitySession, 'id' | 'createdAt'>) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ onClose, onSave }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    sessionType: 'DIALOGUE' as CommunitySession['sessionType'],
    title: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    constituencyId: MOCK_CONSTITUENCIES[0]?.id || '',
    femaleAttendees: '0',
    maleAttendees: '0',
    issuesRaised: '',
    actionsCommitted: '',
    keyOutcomes: '',
    feedbackIncorporated: 'NO' as 'YES' | 'NO' | 'PARTIAL',
    organizerId: 'u1',
  });
  const [attendanceFile, setAttendanceFile] = useState<{ name: string; size: number } | undefined>();
  const [fileError, setFileError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const total = parseInt(form.femaleAttendees || '0') + parseInt(form.maleAttendees || '0');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setFileError('File exceeds 10 MB limit.'); return; }
    setFileError('');
    setAttendanceFile({ name: file.name, size: file.size });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      sessionType: form.sessionType,
      title: form.title,
      date: new Date(form.date).toISOString(),
      location: form.location,
      constituencyId: form.constituencyId,
      attendeesCount: total,
      femaleAttendees: parseInt(form.femaleAttendees) || 0,
      maleAttendees: parseInt(form.maleAttendees) || 0,
      issuesRaised: form.issuesRaised,
      actionsCommitted: form.actionsCommitted,
      keyOutcomes: form.keyOutcomes,
      feedbackIncorporated: form.feedbackIncorporated,
      organizerId: form.organizerId,
      attendanceSheetFile: attendanceFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl overflow-y-auto max-h-[92vh]">

        <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 flex items-center justify-center">
              <Users2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">New Community Session</h2>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">FR-OPS-006</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Session Type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-primary"></span>
              <h3 className="label-caps !text-foreground">1. Session Type</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(SESSION_TYPE_META) as CommunitySession['sessionType'][]).map(t => {
                const meta = SESSION_TYPE_META[t];
                const isActive = form.sessionType === t;
                return (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, sessionType: t }))}
                    className={`p-4 border transition-all flex flex-col items-center justify-center gap-2 group ${
                      isActive 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50'
                    }`}>
                    <div className={`p-2 rounded-none transition-colors ${isActive ? 'bg-primary text-white' : 'bg-background group-hover:bg-primary/5'}`}>
                      {meta.icon}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Session Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-primary"></span>
              <h3 className="label-caps !text-foreground">2. Session Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 border border-border">
              <div className="space-y-1.5 md:col-span-2">
                <label className="label-caps">Session Title <span className="text-destructive">*</span></label>
                <input required className="input-field" placeholder="e.g. Q2 Community Budget Dialogue" value={form.title} onChange={set('title')} />
              </div>
              <div className="space-y-1.5">
                <label className="label-caps">Date & Time <span className="text-destructive">*</span></label>
                <input required type="datetime-local" className="input-field" value={form.date} onChange={set('date')} />
              </div>
              <div className="space-y-1.5">
                <label className="label-caps">Constituency</label>
                <select className="input-field" value={form.constituencyId} onChange={set('constituencyId')}>
                  {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="label-caps">Meeting Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input className="input-field !pl-10" placeholder="e.g. Chilenje Community Hall" value={form.location} onChange={set('location')} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Attendance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-primary"></span>
              <h3 className="label-caps !text-foreground">3. Attendance Tracking</h3>
            </div>
            <div className="bg-muted/20 p-4 border border-border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-caps">Female Attendees</label>
                  <input type="number" min={0} className="input-field text-center font-mono" value={form.femaleAttendees} onChange={set('femaleAttendees')} />
                </div>
                <div className="space-y-1.5">
                  <label className="label-caps">Male Attendees</label>
                  <input type="number" min={0} className="input-field text-center font-mono" value={form.maleAttendees} onChange={set('maleAttendees')} />
                </div>
              </div>
              
              {total > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-foreground">Gender Distribution</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{total} Total Participants</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-primary font-mono">{Math.round((parseInt(form.femaleAttendees) / total) * 100)}% Female</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted flex overflow-hidden">
                    <div className="h-2 bg-pink-500 transition-all duration-500" style={{ width: `${(parseInt(form.femaleAttendees) / total) * 100}%` }} />
                    <div className="h-2 bg-blue-500 transition-all duration-500" style={{ width: `${(parseInt(form.maleAttendees) / total) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Outcomes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-primary"></span>
              <h3 className="label-caps !text-foreground">4. Issues & Outcomes</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="label-caps">Issues Raised</label>
                <textarea rows={3} className="input-field resize-none" placeholder="Issues and concerns raised by community members…"
                  value={form.issuesRaised} onChange={set('issuesRaised')} />
              </div>
              <div className="space-y-1.5">
                <label className="label-caps">Actions Committed</label>
                <textarea rows={3} className="input-field resize-none" placeholder="Actions committed by officers or councillors…"
                  value={form.actionsCommitted} onChange={set('actionsCommitted')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-caps">Key Outcomes</label>
                  <textarea rows={2} className="input-field resize-none" placeholder="Overall outcomes of the session…"
                    value={form.keyOutcomes} onChange={set('keyOutcomes')} />
                </div>
                <div className="space-y-1.5">
                  <label className="label-caps">Feedback Incorporation Status</label>
                  <select className="input-field h-[68px]" value={form.feedbackIncorporated} onChange={set('feedbackIncorporated')}>
                    <option value="NO">No (Not yet acted upon)</option>
                    <option value="PARTIAL">Partial (Some actions taken)</option>
                    <option value="YES">Yes (Fully incorporated)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Documentation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-primary"></span>
              <h3 className="label-caps !text-foreground">5. Documentation</h3>
            </div>
            <div className="p-6 border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-3">
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx" className="hidden" onChange={handleFile} />
              {attendanceFile ? (
                <div className="w-full flex items-center justify-between bg-card border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-none text-emerald-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">{attendanceFile.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{(attendanceFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setAttendanceFile(undefined)} className="p-2 hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground/30" />
                  <div className="text-center">
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                      Upload Attendance Sheet
                    </button>
                    <p className="text-[9px] text-muted-foreground uppercase mt-1">PDF, JPG, PNG or Excel (Max 10MB)</p>
                  </div>
                </>
              )}
              {fileError && <p className="text-[9px] text-destructive font-bold uppercase">{fileError}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-4">Cancel</button>
            <button type="submit" className="btn-primary flex-1 py-4">Save Community Session</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Session Card (expandable) ─────────────────────────────────────────────────

const SessionCard: React.FC<{ session: CommunitySession }> = ({ session }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = SESSION_TYPE_META[session.sessionType];
  const constituency = MOCK_CONSTITUENCIES.find(c => c.id === session.constituencyId);
  const femalePct = session.attendeesCount > 0 ? Math.round((session.femaleAttendees / session.attendeesCount) * 100) : 0;

  return (
    <div className="bg-card border border-border hover:border-primary/40 transition-colors">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-muted flex flex-col items-center justify-center border border-border shrink-0">
            <span className="text-[10px] font-bold text-primary leading-none">{format(new Date(session.date), 'MMM')}</span>
            <span className="text-sm font-bold text-foreground leading-none">{format(new Date(session.date), 'dd')}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 flex items-center gap-1 ${meta.color}`}>
                {meta.icon}{meta.label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">{session.title}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-muted-foreground font-bold uppercase">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location || constituency?.name}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.attendeesCount} participants</span>
              <span className="text-pink-500">{session.femaleAttendees}F</span>
              <span className="text-blue-500">{session.maleAttendees}M</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {session.attendanceSheetFile && (
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5">Sheet ✓</span>
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
            <div className="p-5 space-y-5">
              {/* Gender bar */}
              <div>
                <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground mb-1.5">
                  <span>Female — {session.femaleAttendees} ({femalePct}%)</span>
                  <span>Male — {session.maleAttendees} ({100 - femalePct}%)</span>
                </div>
                <div className="h-2 bg-muted flex">
                  <div className="h-2 bg-pink-500 transition-all" style={{ width: `${femalePct}%` }} />
                  <div className="h-2 bg-blue-500 transition-all" style={{ width: `${100 - femalePct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.issuesRaised && (
                  <div>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Issues Raised</p>
                    <p className="text-[11px] leading-relaxed">{session.issuesRaised}</p>
                  </div>
                )}
                {session.actionsCommitted && (
                  <div>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Actions Committed</p>
                    <p className="text-[11px] leading-relaxed">{session.actionsCommitted}</p>
                  </div>
                )}
                {session.keyOutcomes && (
                  <div className="md:col-span-2">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Key Outcomes</p>
                    <p className="text-[11px] leading-relaxed italic">{session.keyOutcomes}</p>
                  </div>
                )}
                {session.issuesRaised && (
                  <div className="md:col-span-2 border-t border-border pt-3 mt-1">
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="text-[9px] font-bold uppercase text-muted-foreground">Feedback Incorporation Status:</span>
                       <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                         session.feedbackIncorporated === 'YES' ? 'bg-emerald-500/10 text-emerald-600' :
                         session.feedbackIncorporated === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600' :
                         'bg-red-500/10 text-red-500'
                       }`}>
                         {session.feedbackIncorporated || 'NO'}
                       </span>
                    </div>
                  </div>
                )}
              </div>

              {session.attendanceSheetFile && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-2">
                  <Upload className="w-3.5 h-3.5" />
                  Attendance sheet: {session.attendanceSheetFile.name} ({(session.attendanceSheetFile.size / 1024).toFixed(0)} KB)
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

export const CommunityEngagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<CommunitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CommunitySession['sessionType'] | 'ALL'>('ALL');
  const [cFilter, setCFilter] = useState('');

  useEffect(() => {
    efficiencyService.getCommunitySessions().then(data => {
      setSessions(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (s: Omit<CommunitySession, 'id' | 'createdAt'>) => {
    const saved = await efficiencyService.addCommunitySession(s);
    setSessions(prev => [saved, ...prev]);
    setShowModal(false);
  };

  const filtered = sessions.filter(s =>
    (typeFilter === 'ALL' || s.sessionType === typeFilter) &&
    (!cFilter || s.constituencyId === cFilter)
  );

  const totalAttendees = sessions.reduce((s, m) => s + m.attendeesCount, 0);
  const totalFemale = sessions.reduce((s, m) => s + m.femaleAttendees, 0);
  const femalePct = totalAttendees > 0 ? Math.round((totalFemale / totalAttendees) * 100) : 0;

  const sessionsWithIssues = sessions.filter(s => !!s.issuesRaised).length;
  const sessionsIncorporated = sessions.filter(s => !!s.issuesRaised && (s.feedbackIncorporated === 'YES' || s.feedbackIncorporated === 'PARTIAL')).length;
  const feedbackKpi = sessionsWithIssues > 0 ? Math.round((sessionsIncorporated / sessionsWithIssues) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Community Engagement</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            FR-OPS-006 — Dialogue, workshops, scorecard sessions and community participation
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard title="Total Participants" value={totalAttendees.toString()} icon={Users2}
          subValue={`${totalFemale} female (${femalePct}%)`} colorClass="border-primary" />
        <StatCard title="Feedback Incorpor." value={`${feedbackKpi}%`} icon={CheckCircle2} 
          subValue={`${sessionsIncorporated}/${sessionsWithIssues} sessions`} colorClass="border-emerald-500" />
        <StatCard title="Dialogues" value={sessions.filter(s => s.sessionType === 'DIALOGUE').length.toString()} icon={MessageSquare} colorClass="border-blue-500" />
        <StatCard title="Workshops" value={sessions.filter(s => s.sessionType === 'WORKSHOP').length.toString()} icon={BookOpen} colorClass="border-amber-500" />
        <StatCard title="Scorecard Sessions" value={sessions.filter(s => s.sessionType === 'SCORECARD_DISTRIBUTION').length.toString()} icon={Star} colorClass="border-purple-500" />
      </div>

      {/* Gender summary bar */}
      {totalAttendees > 0 && (
        <div className="bg-card border border-border p-5">
          <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
            <span>Overall Gender Balance</span>
            <span className="text-muted-foreground">{totalAttendees} total participants</span>
          </div>
          <div className="h-3 bg-muted flex">
            <div className="h-3 bg-pink-500" style={{ width: `${femalePct}%` }} />
            <div className="h-3 bg-blue-500" style={{ width: `${100 - femalePct}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground mt-1.5">
            <span className="text-pink-500">Female {femalePct}% ({totalFemale})</span>
            <span className="text-blue-500">Male {100 - femalePct}% ({totalAttendees - totalFemale})</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-0">
          {(['ALL', 'DIALOGUE', 'WORKSHOP', 'SCORECARD_DISTRIBUTION', 'OTHER'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${
                typeFilter === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'ALL' ? 'All' : t === 'SCORECARD_DISTRIBUTION' ? 'Scorecard' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <select className="input-field py-1.5 text-[10px]" value={cFilter} onChange={e => setCFilter(e.target.value)}>
            <option value="">All Constituencies</option>
            {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-[10px] uppercase border border-dashed border-border">
            No sessions found for the selected filters
          </div>
        ) : (
          filtered.map(s => <SessionCard key={s.id} session={s} />)
        )}
      </div>

      <AnimatePresence>
        {showModal && <SessionModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
};
