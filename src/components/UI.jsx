export function Badge({ children, color = "default" }) {
  const m = {
    default: { bg: "var(--bg-surface-elevated)", t: "var(--text-secondary)", border: "var(--border-subtle)" },
    success: { bg: "var(--status-success-bg)", t: "var(--status-success)", border: "rgba(16, 185, 129, 0.3)" },
    warning: { bg: "var(--status-warning-bg)", t: "var(--status-warning)", border: "rgba(245, 158, 11, 0.3)" },
    danger:  { bg: "var(--status-danger-bg)",  t: "var(--status-danger)",  border: "rgba(239, 68, 68, 0.3)" },
    info:    { bg: "var(--status-info-bg)",    t: "var(--status-info)",    border: "rgba(59, 130, 246, 0.3)" },
    cyan:    { bg: "var(--accent-cyan-glow)",   t: "var(--accent-cyan)",    border: "rgba(0, 229, 255, 0.3)" }
  };
  const c = m[color] || m.default;
  return (
    <span style={{
      background: c.bg,
      color: c.t,
      border: `1px solid ${c.border}`,
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 8px",
      borderRadius: "var(--radius-sm)",
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }}>
      {children}
    </span>
  );
}

export function StockBadge({ stock, min }) {
  if (stock <= 0) return <Badge color="danger">Sin stock</Badge>;
  if (stock <= min) return <Badge color="warning">Bajo ({stock})</Badge>;
  return <Badge color="success">OK · {stock}</Badge>;
}

export function MetricCard({ label, val, sub, color, icon }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
        {val}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function SectionCard({ children, title, action, style = {} }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "14px 16px",
      boxShadow: "var(--shadow-sm)",
      ...style
    }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", onClick, disabled, fullWidth = false, size = "md", style = {} }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #00E5FF 0%, #00B4D8 100%)",
      color: "#090D14",
      fontWeight: 700,
      boxShadow: "0 4px 14px rgba(0, 229, 255, 0.25)"
    },
    secondary: {
      background: "var(--bg-surface-elevated)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-medium)",
      fontWeight: 600
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-subtle)",
      fontWeight: 500
    },
    danger: {
      background: "var(--status-danger-bg)",
      color: "var(--status-danger)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      fontWeight: 600
    }
  };

  const sizes = {
    sm: { padding: "6px 10px", fontSize: 11, borderRadius: "var(--radius-sm)" },
    md: { padding: "10px 16px", fontSize: 13, borderRadius: "var(--radius-sm)" },
    lg: { padding: "14px 20px", fontSize: 14, borderRadius: "var(--radius-md)" }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        ...sizes[size],
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style
      }}
    >
      {children}
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: 34,
          paddingRight: value ? 32 : 12,
          height: 40,
          borderRadius: "var(--radius-md)",
          fontSize: 13
        }}
      />
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5, pointerEvents: "none" }}>
        🔍
      </span>
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 14,
            padding: "2px 6px",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
