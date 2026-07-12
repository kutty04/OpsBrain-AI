import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

const getRiskColor = (level) => {
  const lvl = level ? level.toLowerCase() : '';
  switch (lvl) {
    case 'critical':
      return { text: 'text-[var(--color-critical)]', border: 'border-[var(--color-critical-border)]', bg: 'bg-[var(--color-critical-light)]', stroke: 'var(--color-critical)', icon: ShieldAlert };
    case 'high':
      return { text: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning-border)]', bg: 'bg-[var(--color-warning-light)]', stroke: 'var(--color-warning)', icon: AlertTriangle };
    case 'medium':
      return { text: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning-border)]', bg: 'bg-[var(--color-warning-light)]', stroke: 'var(--color-warning)', icon: AlertTriangle };
    case 'low':
    default:
      return { text: 'text-[var(--color-healthy)]', border: 'border-[var(--color-healthy-border)]', bg: 'bg-[var(--color-healthy-light)]', stroke: 'var(--color-healthy)', icon: ShieldCheck };
  }
};

export default function RiskScorePanel({ latestRisk }) {
  if (!latestRisk) {
    return (
      <div className="p-6 bg-[var(--bg-card-tinted)] border border-[var(--border-color)] rounded-xl text-center text-[var(--text-muted)] font-medium">
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
    <div className="p-6 bg-[var(--bg-card-tinted)] border border-[var(--border-color)] rounded-xl space-y-6">
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
              stroke="var(--border-color)"
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
            <div className="text-3xl font-extrabold font-mono text-[var(--text-primary)]">{risk_score}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-bold tracking-wider uppercase">Score</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${config.bg} ${config.border} ${config.text}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Risk Level</div>
              <div className={`text-lg font-extrabold ${config.text}`}>{risk_level}</div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium">
            Assessed: {new Date(calculated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-2">
        <h5 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assessment Details</h5>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">{explanation}</p>
      </div>
    </div>
  );
}
