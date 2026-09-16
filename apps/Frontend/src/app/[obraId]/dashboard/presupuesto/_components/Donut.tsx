"use client";

interface DonutProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sub?: string;
  labelColor?: string;
  subColor?: string;
}

export function Donut({
  value,
  size = 140,
  stroke = 14,
  color = "#0F4395",
  track = "#E2E8F0",
  label,
  sub,
  labelColor = "#0F172A",
  subColor = "#64748B",
}: DonutProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 100) / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center flex-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {(label || sub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {label && (
            <span
              className="text-[26px] font-extrabold display-tight tnum leading-none"
              style={{ color: labelColor }}
            >
              {label}
            </span>
          )}
          {sub && (
            <span
              className="text-[10px] font-bold tracking-[0.04em] uppercase mt-1"
              style={{ color: subColor }}
            >
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
