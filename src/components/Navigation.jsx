import { useHaptic } from "../hooks/useHaptic.js";

// Clean SVG Icon Helpers for Professional POS UI
function IconVenta({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function IconCatalogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function IconVentas({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconClientes({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconDashboard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function IconConfig({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function Navigation({ activeTab, onTabChange, cartCount, stockAlerts }) {
  const { hapticTab } = useHaptic();

  const tabs = [
    { id: "venta", label: "Venta", icon: <IconVenta />, badge: cartCount > 0 ? cartCount : null },
    { id: "catalogo", label: "Catálogo", icon: <IconCatalogo /> },
    { id: "ventas", label: "Ventas", icon: <IconVentas /> },
    { id: "clientes", label: "Clientes", icon: <IconClientes /> },
    { id: "dashboard", label: "Métricas", icon: <IconDashboard />, badge: stockAlerts > 0 ? "!" : null, badgeColor: "var(--status-warning)" },
    { id: "config", label: "Config", icon: <IconConfig /> },
  ];

  const handleTabClick = (id) => {
    if (typeof hapticTab === "function") hapticTab();
    onTabChange(id);
  };

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        position: "sticky",
        bottom: 0,
        zIndex: 100,
        display: "grid",
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        padding: "6px 2px calc(6px + var(--safe-area-bottom, 0px)) 2px"
      }}
    >
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id)}
            aria-selected={isActive}
            aria-label={t.label}
            role="tab"
            className="tactile-btn"
            style={{
              background: isActive ? "var(--accent-cyan-glow)" : "transparent",
              color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
              border: isActive ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              borderRadius: "var(--radius-sm)",
              padding: "6px 2px",
              minHeight: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              position: "relative",
              cursor: "pointer"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: "0.2px" }}>{t.label}</span>
            {t.badge !== null && t.badge !== undefined && (
              <span style={{
                position: "absolute",
                top: 2,
                right: 4,
                background: t.badgeColor || "var(--accent-cyan)",
                color: "#090D14",
                fontWeight: 800,
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: "var(--radius-full)",
                minWidth: 16,
                textAlign: "center"
              }}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
