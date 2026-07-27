export function Sparkline({ data = [12, 18, 15, 25, 22, 30, 28], color = "var(--accent-cyan)", width = 120, height = 36 }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sparklineGrad-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sparklineGrad-${color.replace(/[^a-zA-Z0-9]/g, "")})`} />
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
}

export function ChannelDistributionBar({ channels }) {
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
}
