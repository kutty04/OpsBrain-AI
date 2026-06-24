import React from 'react';
import { Wrench, User, DollarSign, Calendar } from 'lucide-react';

export default function MaintenanceLogs({ maintenanceLogs }) {
  if (!maintenanceLogs || maintenanceLogs.length === 0) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500">
        No maintenance logs recorded for this asset.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {maintenanceLogs.map((log) => (
        <div 
          key={log.id} 
          className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-950 border border-cyan-800/50 rounded-lg text-cyan-400">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200">WO-{log.work_order_number}</h4>
                <div className="text-xs text-slate-500">
                  Maintenance Date: {new Date(log.maintenance_date).toLocaleDateString()}
                </div>
              </div>
            </div>
            {log.cost !== undefined && log.cost !== null && (
              <div className="flex items-center gap-0.5 text-emerald-400 font-bold font-mono">
                <DollarSign className="h-4 w-4" />
                {parseFloat(log.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">
            {log.description}
          </p>

          {log.performed_by && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="h-3.5 w-3.5" />
              Technician: <span className="text-slate-400 font-medium">{log.performed_by}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
