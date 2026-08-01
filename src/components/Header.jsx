export function Header({ theme, onToggleTheme, vendedor, sheetsConnected, tnConnected }) {
  return (
    <header style={{
      background: "var(--bg-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "12px 16px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          color: "#090D14",
          fontSize: 16,
          boxShadow: "var(--shadow-glow)"
        }}>
          R
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, letterSpacing: "0.5px" }}>
              RENDIX <span style={{ color: "var(--accent-cyan)", fontWeight: 400, fontSize: 13 }}>POS</span>
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {vendedor || "Principal"}
            </span>
            {sheetsConnected && (
              <span style={{ color: "var(--status-success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 8 }}>●</span> Sheets
              </span>
            )}
            {tnConnected && (
              <span style={{ color: "var(--accent-cyan)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 8 }}>●</span> TiendaNube
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onToggleTheme}
        title="Cambiar tema"
        aria-label="Cambiar tema de la interfaz"
        className="tactile-btn touch-target-48"
        style={{
          background: "var(--bg-surface-elevated)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-sm)",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer"
        }}
      >
        {theme === "dark" || theme === "cyberpunk" || theme === "pharmacy" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </header>
  );
}
