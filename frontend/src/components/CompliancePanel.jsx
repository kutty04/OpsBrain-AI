import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'COMPLIANT':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <ShieldCheck className="h-3.5 w-3.5" />
          Compliant
        </span>
      );
    case 'NON_COMPLIANT':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
          <ShieldAlert className="h-3.5 w-3.5" />
          Non-Compliant
        </span>
      );
    case 'UNDER_REVIEW':
    default:
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <Clock className="h-3.5 w-3.5" />
          Under Review
        </span>
      );
  }
};

export default function CompliancePanel({ complianceRecords }) {
  if (!complianceRecords || complianceRecords.length === 0) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500">
        No active compliance safety records logged for this asset.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {complianceRecords.map((record) => (
        <div 
          key={record.id} 
          className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-start justify-between gap-4"
        >
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200">{record.regulation_name}</h4>
            <p className="text-sm text-slate-400">{record.findings || 'Checked with no outstanding issues.'}</p>
            <div className="text-xs text-slate-500 pt-1">
              Last Audited: {new Date(record.last_checked).toLocaleDateString()}
            </div>
          </div>
          <div>
            {getStatusBadge(record.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
