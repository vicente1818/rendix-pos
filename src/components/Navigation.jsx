import { useCallback, memo } from "react";
import { useHaptic } from "../hooks/useHaptic.js";

// ─── Icon Components ──────────────────────────────────────────────────────────
// Default size 21: larger than 18px for POS readability at arm's length (DESIGN)
function IconVenta({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function IconCatalogo({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function IconVentas({ size = 21 }) {
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

function IconClientes({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconDashboard({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function IconConfig({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

// ─── Module-Level Icon Nodes ──────────────────────────────────────────────────
// Hoisted so React never re-allocates these JSX elements on parent renders (PERF)
const ICON_VENTA     = <IconVenta />;
const ICON_CATALOGO  = <IconCatalogo />;
const ICON_VENTAS    = <IconVentas />;
const ICON_CLIENTES  = <IconClientes />;
const ICON_DASHBOARD = <IconDashboard />;
const ICON_CONFIG    = <IconConfig />;

// ─── Static Tab Metadata ──────────────────────────────────────────────────────
// No prop-derived data here; safe to hoist and never rebuilt (PERF)
const TABS_CONFIG = [
  { id: "venta",     label: "Venta",    icon: ICON_VENTA,     badgeType: "cart" },
  { id: "catalogo",  label: "Catálogo", icon: ICON_CATALOGO },
  { id: "ventas",    label: "Ventas",   icon: ICON_VENTAS },
  { id: "clientes",  label: "Clientes", icon: ICON_CLIENTES },
  { id: "dashboard", label: "Métricas", icon: ICON_DASHBOARD, badgeType: "stock" },
  { id: "config",    label: "Config",   icon: ICON_CONFIG },
];

// ─── Static Style Constants ───────────────────────────────────────────────────
// Extracted from render so React always receives the same object reference (PERF)

// Nav container: Circuit Noir upward glow horizon (DESIGN)
// THEMING FIX: var(--bg-glass) resolves to rgba(255,255,255,0.88) in light theme;
// a hardcoded RGBA would remain dark regardless of the data-theme toggle.
const NAV_STYLE = {
  background: "var(--bg-glass)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  // DESIGN: cyan separator + upward glow horizon (was: generic var(--border-subtle))
  borderTop: "1px solid rgba(0, 229, 255, 0.4)",
  boxShadow: "0 -2px 12px rgba(0, 229, 255, 0.15)",
  // BUG FIX: 'sticky' only holds within its scrollable ancestor — on iOS Safari the nav
  // scrolled off-screen. 'fixed' pins it to the viewport unconditionally.
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: "grid",
  // Hardcoded 6 columns — tab count is static, avoids dynamic template literal (PERF)
  gridTemplateColumns: "repeat(6, 1fr)",
  // UX: wider horizontal padding for pharmacy-glove touch targets (was: 2px)
  padding: "6px 8px calc(6px + var(--safe-area-bottom, 0px)) 8px",
};

// Shared base applied to both active and inactive buttons
const BTN_BASE = {
  minHeight: 48,
  // UX: 6px horizontal gives breathing room without crowding 6-column layout
  padding: "6px 6px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  position: "relative",
  cursor: "pointer",
  // DESIGN: futuristic rule — structural elements must not exceed 4px corner radius
  borderRadius: 4,
  // UX: smooth 150ms ease on all state changes (was: instantaneous hard cut)
  transition: "color 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  // DESIGN: Roboto for UI labels per futuristic skill
  fontFamily: "'Roboto', system-ui, sans-serif",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

// PERF: two pre-defined objects; selected by ternary in render — no new object per tab
// TOKEN FIX: replaced hardcoded hex/rgba with CSS custom properties so light-theme
// overrides in [data-theme="light"] take effect on these inline style values.
const BTN_STYLE_ACTIVE = {
  ...BTN_BASE,
  background: "var(--accent-cyan-glow)",
  color: "var(--accent-cyan)",
  border: "1px solid var(--border-accent)",
  // DESIGN: active accent must emit light, not merely tint background (Circuit Noir)
  boxShadow: "0 0 12px rgba(0, 229, 255, 0.35), inset 0 0 8px rgba(0, 229, 255, 0.1)",
};

const BTN_STYLE_INACTIVE = {
  ...BTN_BASE,
  background: "transparent",
  color: "var(--text-muted)",
  border: "1px solid transparent",
  boxShadow: "none",
};

// Label styles — pre-defined, selected by ternary (PERF + DESIGN)
const LABEL_BASE = {
  // UX: 11px minimum — WCAG 1.4.4 readability (was: 10px, below mobile minimum)
  fontSize: 11,
  letterSpacing: "0.3px",
  // DESIGN: Roboto for UI labels per futuristic skill
  fontFamily: "'Roboto', system-ui, sans-serif",
};
const LABEL_ACTIVE   = { ...LABEL_BASE, fontWeight: 700 };
const LABEL_INACTIVE = { ...LABEL_BASE, fontWeight: 500 };

// Badge base — monospace font for numeric data per mono skill
// TOKEN FIX: color was "#090D14" (hardcoded dark); var(--bg-app) resolves correctly
// in both themes (very dark in dark mode, very light in light mode is undesirable;
// both themes have a near-black --bg-app, so this is correct for dark text on bright badge)
const BADGE_BASE = {
  position: "absolute",
  top: 2,
  right: 4,
  fontWeight: 800,
  fontSize: 9,
  padding: "1px 5px",
  borderRadius: 9999,
  minWidth: 16,
  textAlign: "center",
  color: "var(--bg-app)",
  // DESIGN: monospace for all numeric/count data per mono skill
  fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
};

// Cyan cart badge with neon glow (DESIGN)
// TOKEN FIX: background was "#00E5FF" → var(--accent-cyan) resolves theme-correctly
const BADGE_CYAN = {
  ...BADGE_BASE,
  background: "var(--accent-cyan)",
  boxShadow: "0 0 6px rgba(0, 229, 255, 0.8)",
};

// Warning stock-alert badge with warning glow (DESIGN)
const BADGE_WARNING = {
  ...BADGE_BASE,
  background: "var(--status-warning)",
  boxShadow: "0 0 6px rgba(245, 158, 11, 0.8)",
};

// Critical stock badge — danger red with pulse-red animation applied via className
const BADGE_CRITICAL = {
  ...BADGE_BASE,
  background: "var(--status-danger)",
  boxShadow: "0 0 6px rgba(239, 68, 68, 0.85)",
};

// ─── Navigation Component ─────────────────────────────────────────────────────
// PERF: memo prevents re-renders when props are unchanged
export const Navigation = memo(function Navigation({
  activeTab,
  onTabChange,
  cartCount    = 0,     // BUG FIX: default 0 — undefined > 0 was silently false
  stockAlerts  = 0,     // BUG FIX: default 0 — same silent false issue
  criticalStock = false, // When true, stock badge turns red and pulses
}) {
  const { hapticTab } = useHaptic();

  // BUG FIX: null guard for onTabChange (was: uncaught TypeError when prop omitted)
  // PERF: useCallback keeps reference stable across renders
  const handleTabClick = useCallback((id) => {
    if (typeof hapticTab === "function") hapticTab();
    if (typeof onTabChange === "function") onTabChange(id);
  }, [hapticTab, onTabChange]);

  return (
    // BUG FIX: role="tablist" added — child role="tab" buttons require a tablist ancestor.
    // Without it, screen readers surface orphaned tabs with no group context.
    <nav
      role="tablist"
      aria-label="Navegación principal"
      style={NAV_STYLE}
    >
      {TABS_CONFIG.map((t) => {
        const isActive = activeTab === t.id;

        // Compute badge info from live props — only this part stays inside render
        let badge          = null;
        let badgeStyle     = null;
        let badgeClassName = undefined;
        let badgeAriaLabel = null;

        if (t.badgeType === "cart" && cartCount > 0) {
          // UX: cap display at "99+" for three-digit counts — badge stays legible
          badge          = cartCount >= 100 ? "99+" : cartCount;
          badgeStyle     = BADGE_CYAN;
          badgeAriaLabel = `${cartCount} artículo${cartCount !== 1 ? "s" : ""} en carrito`;
        } else if (t.badgeType === "stock" && stockAlerts > 0) {
          // UX FIX: show numeric count, not '!'; add meaningful aria-label
          badge          = stockAlerts;
          badgeStyle     = criticalStock ? BADGE_CRITICAL : BADGE_WARNING;
          // DESIGN: pulse-red class triggers the CSS animation for critical stock
          badgeClassName = criticalStock ? "pulse-red" : undefined;
          badgeAriaLabel = `${stockAlerts} alerta${stockAlerts !== 1 ? "s" : ""} de stock${criticalStock ? " crítico" : ""}`;
        }

        return (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id)}
            // BUG FIX: role="tab" is now valid — parent nav has role="tablist"
            role="tab"
            aria-selected={isActive}
            aria-label={t.label}
            className="tactile-btn"
            // PERF: ternary selects a pre-defined object — no new object allocated per tab
            style={isActive ? BTN_STYLE_ACTIVE : BTN_STYLE_INACTIVE}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t.icon}
            </span>
            <span style={isActive ? LABEL_ACTIVE : LABEL_INACTIVE}>
              {t.label}
            </span>
            {badge !== null && (
              <span
                style={badgeStyle}
                className={badgeClassName}
                aria-label={badgeAriaLabel}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
});
