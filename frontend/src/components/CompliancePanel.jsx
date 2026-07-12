import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'COMPLIANT':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-healthy-light)] text-[var(--color-healthy)] border border-[var(--color-healthy-border)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Compliant
        </span>
      );
    case 'NON_COMPLIANT':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-critical-light)] text-[var(--color-critical)] border border-[var(--color-critical-border)]">
          <ShieldAlert className="h-3.5 w-3.5" />
          Non-Compliant
        </span>
      );
    case 'UNDER_REVIEW':
    default:
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning-border)]">
          <Clock className="h-3.5 w-3.5" />
          Under Review
        </span>
      );
  }
};

export default function CompliancePanel({ complianceRecords }) {
  if (!complianceRecords || complianceRecords.length === 0) {
    return (
      <div className="p-6 bg-[var(--bg-card-tinted)] border border-[var(--border-color)] rounded-xl text-center text-[var(--text-muted)] font-medium">
        No active compliance safety records logged for this asset.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {complianceRecords.map((record) => (
        <div 
          key={record.id} 
          className="p-5 bg-[var(--bg-card-tinted)] border border-[var(--border-color)] rounded-xl flex items-start justify-between gap-4"
        >
          <div className="space-y-1">
            <h4 className="font-bold text-[var(--text-primary)]">{record.regulation_name}</h4>
            <p className="text-sm text-[var(--text-secondary)] font-medium">{record.findings || 'Checked with no outstanding issues.'}</p>
            <div className="text-xs text-[var(--text-muted)] pt-1">
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
