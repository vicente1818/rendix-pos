// ─── Header Component ─────────────────────────────────────────────────────────
// Props:
//   theme, onToggleTheme   — light/dark toggle
//   vendedor               — cashier / operator name
//   sheetsConnected        — Google Sheets integration status
//   tnConnected            — Tienda Nube integration status
//   usdRate                — live USD/ARS exchange rate
//   dailyTotal             — accumulated sales total for today (number, ARS)
//   onCerrarDia            — callback fired when "Cerrar día" is pressed
export function Header({
  theme,
  onToggleTheme,
  vendedor,
  sheetsConnected,
  tnConnected,
  usdRate,
  dailyTotal,
  onCerrarDia,
}) {
  const formattedTotal = dailyTotal != null
    ? `$${Math.round(dailyTotal).toLocaleString("es-AR")}`
    : null;

  return (
    <header style={{
      background: "var(--bg-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border-accent)",
      padding: "var(--spacing-md) var(--spacing-lg)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      {/* Circuit Noir corner accents — replaced hardcoded rgba with token */}
      <div style={{position:"absolute",top:6,left:6,width:10,height:10,borderTop:"1px solid var(--border-accent)",borderLeft:"1px solid var(--border-accent)",pointerEvents:"none"}} />
      <div style={{position:"absolute",top:6,right:6,width:10,height:10,borderTop:"1px solid var(--border-accent)",borderRight:"1px solid var(--border-accent)",pointerEvents:"none"}} />

      {/* Keyboard shortcut hint — centered, unobtrusive */}
      <div style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 10,
        opacity: 0.4,
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono, monospace)",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        F2 Venta · F3 Historial · F4 Dashboard
      </div>

      {/* Brand mark + operator info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="cn-glow-pulse" style={{
          width: 34, height: 34,
          borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, color: "var(--bg-app)", fontSize: 16,
        }}>
          R
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, letterSpacing: "0.5px" }}>
              RENDIX <span style={{ color: "var(--accent-cyan)", fontWeight: 400, fontSize: 13 }}>POS</span>
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono, monospace)" }}>
            <span style={{letterSpacing:"0.05em"}}>◆ {vendedor || "Principal"}</span>
            {sheetsConnected && <span style={{ color: "var(--status-success)" }}>● Sheets</span>}
            {tnConnected && <span style={{ color: "var(--accent-cyan)" }}>● TN</span>}
            {usdRate && (
              <span style={{ color: "var(--accent-green)", fontWeight: 700, letterSpacing: "0.02em" }}>
                $ {Math.round(usdRate).toLocaleString("es-AR")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right-side actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
        {/* Cerrar día — end-of-day quick action */}
        {onCerrarDia && (
          <button
            onClick={onCerrarDia}
            title="Cerrar día y ver resumen"
            aria-label={formattedTotal
              ? `Cerrar día — total ${formattedTotal}`
              : "Cerrar día"}
            className="tactile-btn"
            style={{
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-medium)",
              color: "var(--text-secondary)",
              borderRadius: "var(--radius-sm)",
              padding: "0 var(--spacing-md)",
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <polyline points="9 16 11 18 15 14"/>
            </svg>
            Cerrar día
            {formattedTotal && (
              <span style={{
                background: "var(--status-success-bg)",
                color: "var(--status-success)",
                border: "1px solid var(--status-success)",
                borderRadius: "var(--radius-sm)",
                padding: "1px 6px",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}>
                {formattedTotal}
              </span>
            )}
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title="Cambiar tema"
          aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          className="tactile-btn"
          style={{
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-sm)",
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, cursor: "pointer",
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
