export function Badge({ children, color = "default" }) {
  const m = {
    default: { bg: "var(--bg-surface-elevated)", t: "var(--text-secondary)", border: "var(--border-subtle)" },
    success: { bg: "var(--status-success-bg)", t: "var(--status-success)", border: "var(--status-success)" },
    warning: { bg: "var(--status-warning-bg)", t: "var(--status-warning)", border: "var(--status-warning)" },
    danger:  { bg: "var(--status-danger-bg)",  t: "var(--status-danger)",  border: "var(--status-danger)" },
    info:    { bg: "var(--status-info-bg)",    t: "var(--status-info)",    border: "var(--status-info)" },
    cyan:    { bg: "var(--accent-cyan-glow)",   t: "var(--accent-cyan)",    border: "var(--accent-cyan)" }
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
        {icon && <span style={{ fontSize: 16 }} aria-hidden="true">{icon}</span>}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--text-primary)", fontFamily: "var(--font-heading)" }} className="tabular-nums">
        {val}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function SectionCard({ children, title, action, style = {}, onClick }) {
  const isInteractive = Boolean(onClick);
  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined}
      className={isInteractive ? "tactile-btn" : undefined}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        boxShadow: "var(--shadow-sm)",
        cursor: isInteractive ? "pointer" : "default",
        ...style
      }}
    >
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

export function Button({ children, variant = "primary", onClick, disabled, fullWidth = false, size = "md", style = {}, ariaLabel }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, var(--accent-cyan) 0%, #00B4D8 100%)",
      color: "#090D14",
      fontWeight: 700,
      boxShadow: "var(--shadow-glow)",
      border: "none"
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
      border: "1px solid var(--status-danger)",
      fontWeight: 600
    }
  };

  const sizes = {
    sm: { padding: "8px 12px", fontSize: 12, minHeight: 40, borderRadius: "var(--radius-sm)" },
    md: { padding: "12px 18px", fontSize: 13, minHeight: 48, borderRadius: "var(--radius-sm)" },
    lg: { padding: "14px 22px", fontSize: 14, minHeight: 52, borderRadius: "var(--radius-md)" }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="tactile-btn"
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
        aria-label={placeholder}
        style={{
          width: "100%",
          paddingLeft: 38,
          paddingRight: value ? 44 : 12,
          height: 48,
          borderRadius: "var(--radius-md)",
          fontSize: 13,
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)"
        }}
      />
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", display: "flex" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="touch-target-48 tactile-btn"
          style={{
            position: "absolute",
            right: 2,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 16,
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "No hay datos disponibles", description, icon }) {
  return (
    <div style={{
      padding: "36px 20px",
      textAlign: "center",
      background: "var(--bg-card)",
      border: "1px dashed var(--border-medium)",
      borderRadius: "var(--radius-md)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8
    }}>
      {icon && <div style={{ fontSize: 32, marginBottom: 4 }} aria-hidden="true">{icon}</div>}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 320 }}>
          {description}
        </div>
      )}
    </div>
  );
}
