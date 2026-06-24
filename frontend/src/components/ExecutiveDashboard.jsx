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
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
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

  // Gauge calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avg_risk_score / 100) * circumference;
  
  let gaugeColor = '#10b981'; // Green
  if (avg_risk_score > 75) gaugeColor = '#ef4444'; // Red
  else if (avg_risk_score > 55) gaugeColor = '#f97316'; // Orange
  else if (avg_risk_score > 25) gaugeColor = '#eab308'; // Yellow

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Metrics Row: Risk & Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Plant-Wide Average Risk */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2">
            <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Average Plant Risk</div>
            <div className="text-4xl font-black font-mono text-slate-100">{avg_risk_score}</div>
            <div className="text-xs text-slate-400">
              Across {total_risk_assessed} assessed twins
            </div>
          </div>
          
          <div className="relative h-24 w-24 flex items-center justify-center">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="48" cy="48" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="8" />
              <circle 
                cx="48" 
                cy="48" 
                r={radius} 
                fill="transparent" 
                stroke={gaugeColor} 
                strokeWidth="8" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk</div>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
          <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Risk Level Profile</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <div className="text-xl font-bold text-rose-400 font-mono">{risk_distribution.Critical || 0}</div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-1">Critical</div>
            </div>
            <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="text-xl font-bold text-orange-400 font-mono">{risk_distribution.High || 0}</div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-1">High</div>
            </div>
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="text-xl font-bold text-yellow-400 font-mono">{risk_distribution.Medium || 0}</div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-1">Med</div>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="text-xl font-bold text-emerald-400 font-mono">{risk_distribution.Low || 0}</div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-1">Low</div>
            </div>
          </div>
        </div>

        {/* Compliance Safety Status */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2">
            <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Regulatory Compliance</div>
            <div className="text-4xl font-black font-mono text-emerald-400">
              {compliance_summary.total > 0 
                ? Math.round((compliance_summary.compliant / compliance_summary.total) * 100)
                : 100}%
            </div>
            <div className="text-xs text-slate-400">
              {compliance_summary.non_compliant || 0} violations active
            </div>
          </div>
          
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-full text-emerald-400">
            <ShieldCheck className="h-10 w-10" />
          </div>
        </div>

      </div>

      {/* Grid: Trends & Alert feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Incident Trends bar chart */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 lg:col-span-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Historical Incident Trends</div>
            <div className="flex gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-red-500 rounded"></span> Critical</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-orange-400 rounded"></span> High</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-yellow-400 rounded"></span> Med/Low</span>
            </div>
          </div>

          <div className="h-[220px] bg-slate-950 border border-slate-800 rounded-lg p-4 flex items-end justify-between relative">
            {incident_trends.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                No chronological trends logged.
              </div>
            ) : (
              incident_trends.map((item, index) => {
                const maxCount = Math.max(...incident_trends.map(t => t.count), 1);
                const heightPercentage = (item.count / maxCount) * 80;
                
                const sev = item.severity ? item.severity.toLowerCase() : '';
                let barColor = '#ef4444'; // Red
                if (sev === 'high') barColor = '#fb923c'; // Orange
                if (sev === 'low' || sev === 'medium') barColor = '#eab308'; // Yellow

                return (
                  <div key={index} className="flex flex-col items-center flex-1 group relative">
                    {/* Bar Container */}
                    <div className="h-[140px] w-full flex items-end justify-center relative">
                      {/* Bar */}
                      <div 
                        style={{ height: `${heightPercentage}%`, backgroundColor: barColor }}
                        className="w-4 rounded-t-sm transition-all group-hover:brightness-110 relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-200 font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          {item.severity}: {item.count}
                        </div>
                      </div>
                    </div>
                    {/* Date label */}
                    <span className="text-[9px] text-slate-500 font-mono mt-2 transform -rotate-12">
                      {new Date(item.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Alert Center Feed */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg flex flex-col h-[320px]">
          <h3 className="font-extrabold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
            <BellRing className="h-4.5 w-4.5 text-cyan-400" />
            Alert Center
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {alert_feed.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">
                No active critical alerts.
              </div>
            ) : (
              alert_feed.map((alert, index) => {
                const badgeClass = getSeverityStyles(alert.severity);
                return (
                  <div 
                    key={index} 
                    className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-start gap-3 justify-between hover:bg-slate-900/40 cursor-pointer"
                    onClick={() => onSelectAsset(alert.tag)}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="text-cyan-400 font-mono">{alert.tag}</span>
                        <span>-</span>
                        <span className="truncate max-w-[140px]">{alert.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Critical Assets Register */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 lg:col-span-2 shadow-lg">
          <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Critical Action Register (Score &ge; 75)</div>
          
          <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Tag</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Risk Rating</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {critical_assets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">
                      No assets currently exceeding critical risk thresholds.
                    </td>
                  </tr>
                ) : (
                  critical_assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-900/30">
                      <td className="p-4 font-mono font-extrabold text-cyan-400">{asset.tag_number}</td>
                      <td className="p-4 font-medium text-slate-300">{asset.name}</td>
                      <td className="p-4 text-xs font-semibold text-slate-400">{asset.category}</td>
                      <td className="p-4 font-extrabold font-mono text-rose-400">{asset.risk_score}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => onSelectAsset(asset.tag_number)}
                          className="p-1.5 bg-slate-900 hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-400 rounded-lg transition"
                        >
                          <ArrowRight className="h-4.5 w-4.5" />
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
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
          <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Compliance Violations</div>
          
          <div className="space-y-3 overflow-y-auto max-h-[250px] pr-1">
            {compliance_violations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-lg">
                No active regulatory compliance violations.
              </div>
            ) : (
              compliance_violations.map((violation, index) => (
                <div 
                  key={index}
                  className="p-3 bg-slate-950 border border-slate-850 rounded-lg hover:border-rose-500/30 transition cursor-pointer"
                  onClick={() => onSelectAsset(violation.tag_number)}
                >
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400">{violation.tag_number}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{violation.regulation_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
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
