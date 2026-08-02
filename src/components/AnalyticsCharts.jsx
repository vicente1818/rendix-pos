import { memo, useMemo } from 'react';

export const Sparkline = memo(function Sparkline({ data = [12, 18, 15, 25, 22, 30, 28], color = "var(--accent-cyan)", width = 120, height = 36 }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const divisor = safeData.length > 1 ? safeData.length - 1 : 1;
  const gradId = useMemo(() => 'sparklineGrad-' + color.replace(/[^a-zA-Z0-9]/g, ''), [color]);
  const points = useMemo(() => safeData.map((val, i) => {
    const x = (i / divisor) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" "), [safeData, divisor, width, height, min, range]);
  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradId})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
});

export const ChannelDistributionBar = memo(function ChannelDistributionBar({ channels }) {
  const total = channels.reduce((acc, c) => acc + (c.total || 0), 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", background: "var(--bg-surface-elevated)" }}>
        {channels.map((c) => {
          const pct = Math.max(0, ((c.total / total) * 100)).toFixed(1);
          if (c.total <= 0) return null;
          return (
            <div
              key={c.name}
              style={{
                width: `${pct}%`,
                background: c.color,
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              title={`${c.name}: ${pct}% ($${c.total.toLocaleString()})`}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: "var(--text-secondary)" }}>
        {channels.map(c => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, display: "inline-block" }} />
            <span>{c.name}</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {((c.total / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * HourlyChart — 24-bar mini chart of revenue/count by hour of day.
 * `data` must be a 24-element array (index = hour 0–23, value = revenue or count).
 * The peak bar is highlighted with full color; others are at 40% opacity.
 */
export const HourlyChart = memo(function HourlyChart({ data = [], color = "var(--accent-cyan)" }) {
  if (!Array.isArray(data) || data.length !== 24) return null;

  const max      = Math.max(...data, 1);
  const peakHour = data.indexOf(Math.max(...data));
  const hasData  = data.some(v => v > 0);

  if (!hasData) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Bar chart */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        height: 56,
      }}>
        {data.map((val, h) => {
          const pct     = val / max;
          const isPeak  = h === peakHour && val > 0;
          const barH    = val > 0 ? Math.max(pct * 100, 8) : 2; // floor 2% for zero bars

          return (
            <div
              key={h}
              title={`${String(h).padStart(2, "0")}:00 — ${val > 0 ? "$" + Math.round(val).toLocaleString("es-AR") : "Sin ventas"}`}
              style={{
                flex: 1,
                height: `${barH}%`,
                background: isPeak ? color : `color-mix(in srgb, ${color} 40%, transparent)`,
                borderRadius: "2px 2px 0 0",
                transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "default",
                position: "relative",
              }}
            />
          );
        })}
      </div>

      {/* Hour axis labels */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        color: "var(--text-muted)",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "0 1px",
      }}>
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>

      {/* Peak annotation */}
      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
        Pico de ventas:&nbsp;
        <span style={{ color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {String(peakHour).padStart(2, "0")}:00 – {String(peakHour + 1).padStart(2, "0")}:00
        </span>
      </div>
    </div>
  );
});
