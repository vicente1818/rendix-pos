export function Navigation({ activeTab, onTabChange, cartCount, stockAlerts }) {
  const tabs = [
    { id: "venta", label: "Venta", icon: "🛒", badge: cartCount > 0 ? cartCount : null },
    { id: "catalogo", label: "Catálogo", icon: "📦" },
    { id: "ventas", label: "Ventas", icon: "📄" },
    { id: "clientes", label: "Clientes", icon: "👥" },
    { id: "dashboard", label: "Métricas", icon: "📊", badge: stockAlerts > 0 ? "!" : null, badgeColor: "var(--status-warning)" },
    { id: "config", label: "Config", icon: "⚙️" },
  ];

  return (
    <nav style={{
      background: "var(--bg-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: "1px solid var(--border-subtle)",
      position: "sticky",
      bottom: 0,
      zIndex: 100,
      display: "grid",
      gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
      padding: "6px 4px 8px 4px"
    }}>
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              background: isActive ? "var(--accent-cyan-glow)" : "transparent",
              color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
              border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
              borderRadius: "var(--radius-sm)",
              padding: "6px 2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              position: "relative",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
            {t.badge !== null && t.badge !== undefined && (
              <span style={{
                position: "absolute",
                top: 2,
                right: 6,
                background: t.badgeColor || "var(--accent-cyan)",
                color: "#090D14",
                fontWeight: 800,
                fontSize: 9,
                padding: "1px 4px",
                borderRadius: "var(--radius-full)",
                minWidth: 14,
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
