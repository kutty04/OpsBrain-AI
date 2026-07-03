import React from 'react';
import { AlertOctagon, Calendar, HelpCircle } from 'lucide-react';

const getSeverityBadge = (severity) => {
  let colorClass = 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/25';
  
  if (severity === 'Medium' || severity === 'High') {
    colorClass = 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25';
  } else if (severity === 'Critical') {
    colorClass = 'bg-[var(--color-critical)]/10 text-[var(--color-critical)] border-[var(--color-critical)]/25 animate-pulse';
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${colorClass}`}>
      {severity}
    </span>
  );
};

export default function IncidentTimeline({ incidents }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
        <AlertOctagon className="h-8 w-8 text-[var(--color-healthy)]/80 mb-1" />
        <span className="text-sm font-semibold text-slate-300">Facility anomaly feed healthy</span>
        <span className="text-xs text-slate-500">Zero active incidents or sensor violations logged.</span>
      </div>
    );
  }

  return (
    <div className="relative border-l border-[var(--border-color)] ml-3 space-y-5">
      {incidents.map((incident) => (
        <div key={incident.id} className="relative pl-7 group">
          {/* Dot */}
          <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full border border-[var(--bg-app)] bg-rose-500/20 flex items-center justify-center z-10">
            <span className="h-2 w-2 rounded-full bg-[var(--color-critical)] group-hover:scale-125 transition duration-150"></span>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:border-[var(--border-hover)] transition duration-200 ease-in-out space-y-2.5 shadow-sm relative overflow-hidden">
            <div className="cad-corner-tl" />
            <div className="cad-corner-tr" />
            <div className="cad-corner-bl" />
            <div className="cad-corner-br" />

            <div className="flex items-center justify-between gap-4">
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-xs uppercase tracking-wider">
                <AlertOctagon className="h-3.5 w-3.5 text-[var(--color-critical)]" />
                {incident.title}
              </h4>
              {getSeverityBadge(incident.severity)}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">{incident.description}</p>

            {incident.root_cause && (
              <div className="p-2.5 bg-slate-950/40 border border-[var(--border-color)] rounded-lg space-y-0.5">
                <div className="text-[10px] font-bold text-[var(--accent-ai)] flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  RCA ROOT CAUSE IDENTIFIED (AI)
                </div>
                <div className="text-xs text-[var(--text-primary)] font-medium leading-normal">
                  {incident.root_cause}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold pt-1 uppercase">
              <Calendar className="h-3 w-3" />
              <span>Logged:</span>
              <span className="text-slate-400 font-mono font-normal normal-case">
                {new Date(incident.incident_date).toLocaleDateString()} {new Date(incident.incident_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
