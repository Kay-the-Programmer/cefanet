import React from 'react';
import { SdgEvaluation } from '../types';

const LIGHT_META = {
  GREEN: { bg: 'bg-emerald-500', label: 'On track', ring: 'ring-emerald-500/30' },
  AMBER: { bg: 'bg-amber-500', label: 'At risk', ring: 'ring-amber-500/30' },
  RED:   { bg: 'bg-red-500',    label: 'Off track', ring: 'ring-red-500/30' },
  UNSET: { bg: 'bg-muted-foreground/40', label: 'No target', ring: 'ring-muted-foreground/20' },
} as const;

export const TrafficLight: React.FC<{ light: SdgEvaluation['light']; size?: 'sm' | 'md' }> = ({ light, size = 'md' }) => {
  const meta = LIGHT_META[light];
  const dim = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dim} rounded-full ${meta.bg} ring-2 ${meta.ring}`} />
      <span className="text-[9px] font-bold uppercase tracking-wide">{meta.label}</span>
    </span>
  );
};

export const TrafficLightCard: React.FC<{ evaluation: SdgEvaluation }> = ({ evaluation }) => {
  const meta = LIGHT_META[evaluation.light];
  const tgt = evaluation.target;
  return (
    <div className={`bg-card border border-border p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${meta.bg}`} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">{evaluation.indicator.sdg.replace('_', ' ')}</p>
          <h3 className="text-xs font-bold uppercase tracking-tight mt-1">{evaluation.indicator.label}</h3>
        </div>
        <TrafficLight light={evaluation.light} />
      </div>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-2xl font-bold font-mono">{evaluation.current.toFixed(evaluation.indicator.unit === 'jobs' ? 0 : 1)}</span>
        <span className="text-[10px] text-muted-foreground font-bold uppercase">{evaluation.indicator.unit}</span>
        {tgt && (
          <span className="ml-auto text-[10px] text-muted-foreground font-bold uppercase">
            target {tgt.target}{evaluation.indicator.unit === '%' ? '%' : ''}
          </span>
        )}
      </div>
      {tgt && (
        <>
          <div className="mt-3 h-1.5 bg-muted">
            <div className={`h-1.5 ${meta.bg} transition-all`} style={{ width: `${Math.min(100, evaluation.progressPct)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground mt-1">
            <span>baseline {tgt.baseline}</span>
            <span>{evaluation.progressPct.toFixed(0)}% of target</span>
          </div>
        </>
      )}
    </div>
  );
};
