import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

const getRiskColor = (level) => {
  const lvl = level ? level.toLowerCase() : '';
  switch (lvl) {
    case 'critical':
      return { text: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10', stroke: '#ef4444', icon: ShieldAlert };
    case 'high':
      return { text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/10', stroke: '#f97316', icon: AlertTriangle };
    case 'medium':
      return { text: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/10', stroke: '#eab308', icon: AlertTriangle };
    case 'low':
    default:
      return { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', stroke: '#10b981', icon: ShieldCheck };
  }
};

export default function RiskScorePanel({ latestRisk }) {
  if (!latestRisk) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500">
        Risk assessment pending for this asset.
      </div>
    );
  }

  const { risk_score, risk_level, explanation, calculated_at } = latestRisk;
  const config = getRiskColor(risk_level);
  const Icon = config.icon;

  // Circular gauge math
  const strokeWidth = 8;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (risk_score / 100) * circumference;

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
      <div className="flex items-center gap-6">
        {/* Gauge dial */}
        <div className="relative h-28 w-28 flex items-center justify-center flex-shrink-0">
          <svg className="h-full w-full transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />
            {/* Value fill */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke={config.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {/* Centered text */}
          <div className="absolute text-center">
            <div className="text-3xl font-extrabold font-mono text-slate-100">{risk_score}</div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Score</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${config.bg} ${config.border} ${config.text}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Level</div>
              <div className={`text-lg font-extrabold ${config.text}`}>{risk_level}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Assessed: {new Date(calculated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Details</h5>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">{explanation}</p>
      </div>
    </div>
  );
}
