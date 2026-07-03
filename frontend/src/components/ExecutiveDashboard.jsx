import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  Calendar,
  Layers,
  ArrowRight,
  BellRing
} from 'lucide-react';

const getSeverityStyles = (severity) => {
  const sev = severity ? severity.toLowerCase() : '';
  switch (sev) {
    case 'critical':
      return 'bg-red-500/10 text-red-400 border-red-500/25';
    case 'high':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/25';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25';
    case 'low':
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
  }
};

export default function ExecutiveDashboard({ data, onSelectAsset }) {
  if (!data) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-lg font-medium text-xs">
        Loading Executive Dashboard metrics...
      </div>
    );
  }

  const { 
    avg_risk_score, 
    total_risk_assessed, 
    risk_distribution, 
    critical_assets, 
    compliance_summary, 
    compliance_violations,
    incident_trends,
    alert_feed
  } = data;

  // Gauge calculation (using a centered 30px radius to prevent container overflow/clipping)
  const radius = 30;
  const circumference = 2 * Math.PI * radius; // ~188.5
  const strokeDashoffset = circumference - (avg_risk_score / 100) * circumference;
  
  let gaugeColor = '#34d399'; // healthy green
  if (avg_risk_score > 75) gaugeColor = '#f87171'; // red
  else if (avg_risk_score > 55) gaugeColor = '#fb923c'; // orange
  else if (avg_risk_score > 25) gaugeColor = '#fbbf24'; // yellow

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2">
      
      {/* Metrics Row: Risk & Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Plant-Wide Average Risk */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex items-center justify-between gap-4 shadow-sm hover:border-[var(--border-hover)] transition duration-200 ease-in-out relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />
          
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <span>Average Plant Risk</span>
              <span className="opacity-45 font-mono text-[8px]">[SYS_avg_risk]</span>
            </div>
            <div className="text-[36px] font-black font-mono text-[var(--text-primary)] leading-tight">{avg_risk_score}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">
              Across {total_risk_assessed} twin assets
            </div>
          </div>
          
          <div className="relative h-20 w-20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full transform -rotate-90">
              {/* Outer Ticks Ring */}
              <circle cx="40" cy="40" r="35" fill="transparent" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="1, 4" className="opacity-35" />
              {/* Solid Background circular track */}
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth="3" />
              {/* Progress track */}
              <circle 
                cx="40" 
                cy="40" 
                r={radius} 
                fill="transparent" 
                stroke={gaugeColor} 
                strokeWidth="4.5" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Risk</div>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-3.5 shadow-sm hover:border-[var(--border-hover)] transition duration-200 ease-in-out relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />
          
          <div className="flex justify-between items-center">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Risk Level Profile</div>
            <span className="text-[8px] font-mono text-slate-600 font-bold">[SYS_risk_profile]</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md">
              <div className="text-base font-bold text-rose-400 font-mono">{risk_distribution.Critical || 0}</div>
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Critical</div>
            </div>
            <div className="p-1.5 bg-orange-500/10 border border-orange-500/20 rounded-md">
              <div className="text-base font-bold text-orange-400 font-mono">{risk_distribution.High || 0}</div>
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-0.5">High</div>
            </div>
            <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <div className="text-base font-bold text-yellow-400 font-mono">{risk_distribution.Medium || 0}</div>
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Med</div>
            </div>
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <div className="text-base font-bold text-emerald-400 font-mono">{risk_distribution.Low || 0}</div>
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Low</div>
            </div>
          </div>
        </div>

        {/* Compliance Safety Status */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex items-center justify-between gap-4 shadow-sm hover:border-[var(--border-hover)] transition duration-200 ease-in-out relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />
          
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <span>Compliance Rating</span>
              <span className="opacity-45 font-mono text-[8px]">[SYS_compliance]</span>
            </div>
            <div className="text-[36px] font-black font-mono text-emerald-400 leading-tight">
              {compliance_summary.total > 0 
                ? Math.round((compliance_summary.compliant / compliance_summary.total) * 100)
                : 100}%
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">
              {compliance_summary.non_compliant || 0} violations active
            </div>
          </div>
          
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/30 rounded-full text-emerald-400 flex-shrink-0">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>

      </div>

      {/* Grid: Trends & Alert feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incident Trends bar chart */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 lg:col-span-2 shadow-sm relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <span>Chronological Incident Trends</span>
              <span className="opacity-45 font-mono text-[8px]">[SYS_trends]</span>
            </div>
            <div className="flex gap-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-400 rounded-full"></span> Critical</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-orange-400 rounded-full"></span> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-yellow-400 rounded-full"></span> Med/Low</span>
            </div>
          </div>
 
          <div className="h-[180px] bg-slate-950/40 border border-[var(--border-color)] rounded-lg p-4 flex items-end justify-between relative overflow-hidden">
            {incident_trends.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs italic">
                No chronological incidents logged.
              </div>
            ) : (
              incident_trends.map((item, index) => {
                const maxCount = Math.max(...incident_trends.map(t => t.count), 1);
                const heightPercentage = (item.count / maxCount) * 80;
                
                const sev = item.severity ? item.severity.toLowerCase() : '';
                let barColor = '#f87171'; // Red
                if (sev === 'high') barColor = '#fb923c'; // Orange
                if (sev === 'low' || sev === 'medium') barColor = '#fbbf24'; // Yellow

                return (
                  <div key={index} className="flex flex-col items-center flex-1 group relative">
                    <div className="h-[110px] w-full flex items-end justify-center relative">
                      {/* Bar */}
                      <div 
                        style={{ height: `${heightPercentage}%`, backgroundColor: barColor }}
                        className="w-5 rounded-t-sm transition-all group-hover:brightness-110 relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 bg-slate-900 border border-[var(--border-color)] px-2 py-1 rounded text-[9px] text-slate-200 font-mono font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-md">
                          {item.severity.toUpperCase()}: {item.count}
                        </div>
                      </div>
                    </div>
                    {/* Date label */}
                    <span className="text-[8px] text-slate-500 font-mono mt-2 transform -rotate-12">
                      {new Date(item.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Alert Center Feed */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-3.5 shadow-sm flex flex-col h-[260px] relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-xs uppercase tracking-wider">
              <BellRing className="h-4 w-4 text-[var(--accent-primary)]" />
              Alert Center
            </h3>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[SYS_alerts]</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {alert_feed.length === 0 ? (
              <div className="text-center text-slate-600 text-xs italic py-8 border border-dashed border-[var(--border-color)]/60 rounded-md">
                No active critical alerts.
              </div>
            ) : (
              alert_feed.map((alert, index) => {
                const badgeClass = getSeverityStyles(alert.severity);
                return (
                  <div 
                    key={index} 
                    className="p-2.5 bg-slate-950/40 border border-[var(--border-color)] rounded-lg flex items-start gap-2 justify-between hover:border-[var(--border-hover)] cursor-pointer transition duration-150 relative"
                    onClick={() => onSelectAsset(alert.tag)}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span className="text-[var(--accent-primary)] font-mono">{alert.tag}</span>
                        <span>-</span>
                        <span className="truncate max-w-[120px] font-medium text-slate-300">{alert.title}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {new Date(alert.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                      {alert.severity}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Grid: Critical Assets & Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Critical Assets Register */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 lg:col-span-2 shadow-sm relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />

          <div className="flex justify-between items-center">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Critical Action Register (Risk Score &ge; 75)</div>
            <span className="text-[8px] font-mono text-slate-500">[SYS_register]</span>
          </div>
          
          <div className="bg-slate-950/40 border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-[var(--border-color)] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Tag</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Risk Rating</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {critical_assets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                      No assets currently exceeding critical risk thresholds.
                    </td>
                  </tr>
                ) : (
                  critical_assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-800/10 transition duration-150">
                      <td className="p-3 font-mono font-extrabold text-[var(--accent-primary)]">{asset.tag_number}</td>
                      <td className="p-3 font-medium text-slate-300">{asset.name}</td>
                      <td className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{asset.category}</td>
                      <td className="p-3 font-extrabold font-mono text-rose-400">{asset.risk_score}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => onSelectAsset(asset.tag_number)}
                          className="p-1.5 bg-slate-900 border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] text-slate-400 rounded-md transition duration-150"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Regulation Violations */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 shadow-sm relative overflow-hidden card-premium">
          <div className="cad-corner-tl" />
          <div className="cad-corner-tr" />
          <div className="cad-corner-bl" />
          <div className="cad-corner-br" />

          <div className="flex justify-between items-center">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Compliance Violations</div>
            <span className="text-[8px] font-mono text-slate-500">[SYS_violations]</span>
          </div>
          
          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {compliance_violations.length === 0 ? (
              <div className="p-8 text-center text-slate-600 text-xs italic border border-dashed border-[var(--border-color)]/60 rounded-md">
                No active regulatory compliance violations.
              </div>
            ) : (
              compliance_violations.map((violation, index) => (
                <div 
                  key={index}
                  className="p-2.5 bg-slate-950/40 border border-[var(--border-color)] rounded-lg hover:border-rose-500/30 transition duration-150 cursor-pointer"
                  onClick={() => onSelectAsset(violation.tag_number)}
                >
                  <div className="flex justify-between items-center w-full mb-1 flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400">{violation.tag_number}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{violation.regulation_name}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed font-medium">
                    {violation.findings || 'Compliance checks failed.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
