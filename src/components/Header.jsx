export function Header({ theme, onToggleTheme, vendedor, sheetsConnected, tnConnected }) {
  return (
    <header style={{
      background: "var(--bg-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(0,229,255,0.12)",
      padding: "12px 16px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{position:"absolute",top:6,left:6,width:10,height:10,borderTop:"1px solid rgba(0,229,255,0.4)",borderLeft:"1px solid rgba(0,229,255,0.4)",pointerEvents:"none"}} />
      <div style={{position:"absolute",top:6,right:6,width:10,height:10,borderTop:"1px solid rgba(0,229,255,0.4)",borderRight:"1px solid rgba(0,229,255,0.4)",pointerEvents:"none"}} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="cn-glow-pulse" style={{
          width: 34, height: 34,
          borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, color: "#090D14", fontSize: 16,
        }}>
          R
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, letterSpacing: "0.5px" }}>
              RENDIX <span style={{ color: "var(--accent-cyan)", fontWeight: 400, fontSize: 13 }}>POS</span>
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{letterSpacing:"0.05em"}}>◆ {vendedor || "Principal"}</span>
            {sheetsConnected && <span style={{ color: "var(--status-success)" }}>● Sheets</span>}
            {tnConnected && <span style={{ color: "var(--accent-cyan)" }}>● TN</span>}
          </div>
        </div>
      </div>

      <button
        onClick={onToggleTheme}
        title="Cambiar tema"
        style={{
          background: "var(--bg-surface-elevated)",
          border: "1px solid rgba(0,229,255,0.15)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-sm)",
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, cursor: "pointer",
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
