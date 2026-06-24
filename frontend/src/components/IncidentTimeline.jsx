import React from 'react';
import { AlertOctagon, Calendar, HelpCircle } from 'lucide-react';

const getSeverityBadge = (severity) => {
  let colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  
  if (severity === 'Medium') {
    colorClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  } else if (severity === 'High') {
    colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  } else if (severity === 'Critical') {
    colorClass = 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
      {severity}
    </span>
  );
};

export default function IncidentTimeline({ incidents }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500">
        No failures or incident reports logged for this asset.
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-800 ml-4 space-y-6">
      {incidents.map((incident) => (
        <div key={incident.id} className="relative pl-8 group">
          {/* Dot */}
          <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full border border-slate-950 bg-rose-500/20 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-rose-500 group-hover:scale-125 transition"></span>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-500" />
                {incident.title}
              </h4>
              {getSeverityBadge(incident.severity)}
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">{incident.description}</p>

            {incident.root_cause && (
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
                <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <HelpCircle className="h-3 w-3" />
                  RCA Root Cause Identified
                </div>
                <div className="text-xs text-slate-300 font-medium leading-normal">
                  {incident.root_cause}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <Calendar className="h-3.5 w-3.5" />
              Event Logged: {new Date(incident.incident_date).toLocaleDateString()} at {new Date(incident.incident_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
