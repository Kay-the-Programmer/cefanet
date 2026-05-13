import React, { useState, useEffect } from 'react';
import { Folder, CheckCircle2, Plus, X } from 'lucide-react';
import { communityService } from '../api/communityService';
import { CommunityProject, FeedbackIncorporation } from '../types';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { useAuth } from '../../auth/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { StatCard } from '../../../shared/components/ui/StatCard';

const STATUS_META: Record<FeedbackIncorporation, { label: string; color: string }> = {
  YES:           { label: 'Incorporated',       color: 'bg-emerald-500/10 text-emerald-600' },
  PARTIAL:       { label: 'Partially',          color: 'bg-amber-500/10 text-amber-500' },
  NO:            { label: 'Not incorporated',   color: 'bg-red-500/10 text-red-500' },
  NOT_REVIEWED:  { label: 'Not reviewed',       color: 'bg-muted text-muted-foreground' },
};

export const CommunityProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<FeedbackIncorporation>('YES');
  const [editNotes, setEditNotes] = useState('');

  const load = () => setProjects(communityService.getProjects());
  useEffect(load, []);

  const stats = communityService.feedbackIncorporationRate();

  const startEdit = (p: CommunityProject) => {
    setEditingId(p.id);
    setEditStatus(p.feedbackIncorporated === 'NOT_REVIEWED' ? 'YES' : p.feedbackIncorporated);
    setEditNotes(p.feedbackNotes || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await communityService.setFeedbackIncorporation(editingId, editStatus, editNotes, user?.id ?? 'system');
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Community Projects &amp; Feedback</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
            FR-CE-003 — Feedback incorporation tracking per project
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Total Projects" value={projects.length} icon={Folder} colorClass="border-primary" />
        <StatCard title="Reviewed" value={`${stats.reviewed} / ${projects.length}`}
          icon={CheckCircle2} colorClass="border-blue-500" />
        <StatCard title="Feedback Incorporation Rate" value={`${stats.rate.toFixed(1)}%`}
          subValue={`${stats.incorporated} of ${stats.reviewed} reviewed projects`}
          icon={CheckCircle2}
          colorClass={stats.rate >= 70 ? 'border-emerald-500' : 'border-amber-500'} />
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {projects.map(p => {
          const meta = STATUS_META[p.feedbackIncorporated];
          const constituency = MOCK_CONSTITUENCIES.find(c => c.id === p.constituencyId);
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} className="bg-card border border-border">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${meta.color}`}>{meta.label}</span>
                    <span className="text-[9px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5">
                      {p.programmeArea}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">{constituency?.name}</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">{p.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{p.description}</p>
                  {p.feedbackNotes && (
                    <div className="mt-2 p-2 bg-muted/40 text-[10px] italic">
                      "{p.feedbackNotes}"
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <button onClick={() => startEdit(p)} className="btn-outline text-[10px] py-1.5 px-3 shrink-0">
                    {p.feedbackIncorporated === 'NOT_REVIEWED' ? 'Record Review' : 'Update'}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isEditing && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border">
                    <div className="p-5 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Was community feedback incorporated?
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['YES', 'PARTIAL', 'NO'] as const).map(v => (
                          <button key={v} type="button"
                            onClick={() => setEditStatus(v)}
                            className={`py-2 text-[10px] font-bold uppercase border ${
                              editStatus === v ? 'bg-primary text-white border-primary' : 'bg-muted border-border text-muted-foreground'
                            }`}>
                            {STATUS_META[v].label}
                          </button>
                        ))}
                      </div>
                      <textarea rows={2} className="input-field resize-none" placeholder="Notes on how feedback was/was not incorporated…"
                        value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="btn-outline flex-1">Cancel</button>
                        <button onClick={saveEdit} className="btn-primary flex-1">Save Review</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* New project modal */}
      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
    </div>
  );
};

const NewProjectModal: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: '',
    constituencyId: MOCK_CONSTITUENCIES[0]?.id ?? '',
    programmeArea: 'BURSARY' as CommunityProject['programmeArea'],
    description: '',
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await communityService.createProject(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <form onSubmit={submit} className="relative w-full max-w-lg bg-card border border-border shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest">New Community Project</h2>
          <button type="button" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input required className="input-field" placeholder="Project title" value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={form.constituencyId} onChange={e => setForm(p => ({ ...p, constituencyId: e.target.value }))}>
              {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input-field" value={form.programmeArea} onChange={e => setForm(p => ({ ...p, programmeArea: e.target.value as CommunityProject['programmeArea'] }))}>
              {(['BURSARY', 'LOAN', 'GRANT', 'INFRASTRUCTURE', 'OTHER'] as const).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <textarea rows={3} required className="input-field resize-none" placeholder="Project description…"
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="p-5 flex gap-2 border-t border-border">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1">Create</button>
        </div>
      </form>
    </div>
  );
};
