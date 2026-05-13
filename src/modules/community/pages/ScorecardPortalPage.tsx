import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Star } from 'lucide-react';
import { communityService } from '../api/communityService';

const DIMENSIONS: Array<{ key: 'accessibility' | 'timeliness' | 'fairness' | 'communication' | 'impact'; label: string; help: string }> = [
  { key: 'accessibility', label: 'Accessibility', help: 'How easy was it to access information or services?' },
  { key: 'timeliness', label: 'Timeliness', help: 'Were applications and disbursements processed on time?' },
  { key: 'fairness', label: 'Fairness', help: 'Were decisions made fairly and transparently?' },
  { key: 'communication', label: 'Communication', help: 'Were officers responsive and clear?' },
  { key: 'impact', label: 'Impact', help: 'Have CDF programmes improved life in your community?' },
];

interface RatingRowProps {
  label: string;
  help: string;
  value: number;
  onChange: (v: number) => void;
}

const RatingRow: React.FC<RatingRowProps> = ({ label, help, value, onChange }) => (
  <div className="border border-border p-4 bg-card">
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs font-bold uppercase tracking-widest text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground font-bold">{value || '—'}/5</p>
    </div>
    <p className="text-[11px] text-muted-foreground mb-3">{help}</p>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${label} score ${n}`}
          className={`flex-1 py-2 border text-sm font-bold transition-colors ${
            value === n ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

export const ScorecardPortalPage: React.FC = () => {
  const constituencies = communityService.getConstituencies();
  const [constituencyId, setConstituencyId] = useState('');
  type ScoreMap = Record<'accessibility' | 'timeliness' | 'fairness' | 'communication' | 'impact', number>;
  const [scores, setScores] = useState<ScoreMap>({
    accessibility: 0,
    timeliness: 0,
    fairness: 0,
    communication: 0,
    impact: 0,
  });
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constituencyId) {
      setError('Please select your constituency.');
      return;
    }
    if (Object.values(scores).some((s: number) => s < 1)) {
      setError('Please rate every dimension before submitting.');
      return;
    }
    setError('');
    communityService.submitScorecard({
      constituencyId,
      accessibilityScore: scores.accessibility,
      timelinessScore: scores.timeliness,
      fairnessScore: scores.fairness,
      communicationScore: scores.communication,
      impactScore: scores.impact,
      feedbackText: feedback || undefined,
      submitterName: name || undefined,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border p-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-widest">Thank you</h1>
          <p className="text-sm text-muted-foreground">
            Your scorecard has been submitted. Constituency officers will use this feedback to improve service delivery.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => { setSubmitted(false); setScores({ accessibility: 0, timeliness: 0, fairness: 0, communication: 0, impact: 0 }); setFeedback(''); setName(''); setConstituencyId(''); }} className="btn-outline">
              Submit another response
            </button>
            <Link to="/public/disclosure" className="btn-primary">View public CDF reports</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Star className="w-5 h-5" />
            <p className="text-[10px] uppercase font-bold tracking-widest">Citizen Scorecard</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest">Rate CDF service delivery</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Your feedback is anonymous unless you choose to add your name. Submissions feed the constituency satisfaction index used by M&amp;E officers.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/public/disclosure" className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline">
              View public reports →
            </Link>
            <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:underline">
              Officer login
            </Link>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Constituency</label>
            <select
              required
              value={constituencyId}
              onChange={e => setConstituencyId(e.target.value)}
              className="w-full bg-muted border border-border p-3 text-sm focus:border-primary outline-none"
            >
              <option value="">Select your constituency…</option>
              {constituencies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {DIMENSIONS.map(d => {
              const k = d.key;
              return (
                <RatingRow
                  key={k}
                  label={d.label}
                  help={d.help}
                  value={scores[k]}
                  onChange={v => setScores(prev => ({ ...prev, [k]: v }))}
                />
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Comments (optional)</label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
              className="w-full bg-muted border border-border p-3 text-sm focus:border-primary outline-none resize-none"
              placeholder="Share suggestions or concerns…"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-muted border border-border p-3 text-sm focus:border-primary outline-none"
              placeholder="Leave blank to remain anonymous"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full py-3">
            Submit scorecard
          </button>
        </form>
      </div>
    </div>
  );
};
