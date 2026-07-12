import React from 'react';
import { Wrench, User, DollarSign, Calendar } from 'lucide-react';

export default function MaintenanceLogs({ maintenanceLogs }) {
  if (!maintenanceLogs || maintenanceLogs.length === 0) {
    return (
      <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
        <Wrench className="h-8 w-8 text-[var(--text-muted)] mb-1" />
        <span className="text-sm font-semibold text-[var(--text-secondary)]">No active work orders</span>
        <span className="text-xs text-[var(--text-muted)]">Asset operating under normal maintenance cycle.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {maintenanceLogs.map((log) => (
        <div 
          key={log.id} 
          className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:border-[var(--border-hover)] transition duration-200 ease-in-out space-y-2.5 shadow-sm relative overflow-hidden"
        >
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[var(--bg-card-tinted)] border border-[var(--border-color)] rounded text-[var(--accent-primary)]">
                <Wrench className="h-3.5 w-3.5" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-xs text-[var(--text-primary)]">WO-{log.work_order_number}</h4>
                <div className="text-[10px] text-[var(--text-muted)] font-semibold">
                  {new Date(log.maintenance_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
            {log.cost !== undefined && log.cost !== null && (
              <div className="flex items-center gap-0.5 text-[var(--color-healthy)] font-bold font-mono text-xs">
                <DollarSign className="h-3.5 w-3.5" />
                {parseFloat(log.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          
          <div className="divider-cad" />

          <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
            {log.description}
          </p>

          {log.performed_by && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
              <User className="h-3 w-3 text-[var(--text-muted)]" />
              <span>Technician:</span> 
              <span className="text-[var(--text-primary)] font-mono font-normal normal-case">{log.performed_by}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
