import { useMemo, useState } from "react";
import { CANALES, fmt } from "../utils/constants.js";
import { StockBadge } from "../components/UI.jsx";
import { Sparkline, ChannelDistributionBar } from "../components/AnalyticsCharts.jsx";

// ── Module-level constants (created once at module load, never on render) ────
const CHANNEL_COLORS = {
  "Instagram":         "#E1306C",
  "WhatsApp":          "#25D366",
  "MercadoLibre":      "#FFE600",
  "Tienda Nube":       "#3B82F6",
  "Local / Mostrador": "var(--accent-cyan)",
};

const DAY_MS = 86_400_000; // 24 h in ms

const RANGE_OPTS = [
  { key: "today", label: "Hoy"    },
  { key: "week",  label: "7 días" },
  { key: "month", label: "Mes"    },
];

/**
 * Returns midnight of the given value in **local** timezone as a ms timestamp.
 * Using local date components avoids UTC-vs-local mismatches on ISO fecha strings.
 */
const localMs = (v) => {
  const d = new Date(v);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

// ────────────────────────────────────────────────────────────────────────────
export function DashboardTab({ sales = [], products = [] }) {
  const [range, setRange] = useState("today");

  // Midnight today in local tz — same bucket key used for sHoy AND trend
  const todayMs = localMs(new Date());

  // ── Memoised derivations (recalculate only when deps change) ─────────────

  const sHoy = useMemo(
    () => sales.filter(s => localMs(s.fecha) === todayMs),
    [sales, todayMs],
  );

  const sRange = useMemo(() => {
    if (range === "today") return sHoy;
    const days = range === "week" ? 7 : 30;
    return sales.filter(s => localMs(s.fecha) >= todayMs - days * DAY_MS);
  }, [sales, range, sHoy, todayMs]);

  const totGral = useMemo(
    () => sales.reduce((a, v) => a + (v.total || 0), 0),
    [sales],
  );

  const totRange = useMemo(
    () => sRange.reduce((a, v) => a + (v.total || 0), 0),
    [sRange],
  );

  // Consistent bucketing: both sHoy and trend use localMs calendar-day diff
  const last7DaysTrend = useMemo(() => {
    const trend = [0, 0, 0, 0, 0, 0, 0];
    sales.forEach(s => {
      const diff = Math.round((todayMs - localMs(s.fecha)) / DAY_MS);
      if (diff >= 0 && diff < 7) trend[6 - diff] += s.total || 0;
    });
    return trend;
  }, [sales, todayMs]);

  const hasTrend = last7DaysTrend.some(v => v > 0);

  // Channel colors now match CANALES keys exactly ("Tienda Nube", "Local / Mostrador")
  const porCanal = useMemo(
    () => CANALES.map(c => ({
      name:  c,
      total: sales.filter(s => s.canal === c).reduce((a, s) => a + (s.total || 0), 0),
      color: CHANNEL_COLORS[c] ?? "var(--accent-cyan)",
    })),
    [sales],
  );

  // i.subtotal fallback prevents NaN accumulation
  const top = useMemo(() => {
    const map = {};
    sales.forEach(s =>
      s.items?.forEach(i => {
        if (!map[i.nombre]) map[i.nombre] = { qty: 0, total: 0 };
        map[i.nombre].qty   += i.qty      || 0;
        map[i.nombre].total += i.subtotal || 0; // fallback: 0 if undefined
      }),
    );
    return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  }, [sales]);

  const alertas = useMemo(
    () => products.filter(p => p.stock <= p.stockMin),
    [products],
  );

  // Only identified customers (tel or ig) — anonymous sales (s.id only) excluded
  const clientesId = useMemo(
    () =>
      new Set(
        sales
          .filter(s => s.cli?.tel || s.cli?.ig)
          .map(s => s.cli?.tel || s.cli?.ig),
      ).size,
    [sales],
  );

  // ── Shared style helpers (closures, no state dep) ────────────────────────

  const glass = {
    background: "rgba(14,20,32,0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  };

  const labelCss = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  // Monospace numeric value style with optional neon glow
  const mono = (color = "var(--text-primary)", glow) => ({
    fontSize: 22,
    fontWeight: 800,
    color,
    fontFamily: "'JetBrains Mono', monospace",
    ...(glow ? { textShadow: `0 0 12px ${glow}` } : {}),
  });

  // Stagger offset for booting-up cascade animation
  const fade = i => ({
    animation: "dashFadeIn 0.35s ease both",
    animationDelay: `${i * 60}ms`,
  });

  // Section heading style — danger variant for stock alerts
  const sHead = (danger = false) => ({
    fontSize: 13,
    fontWeight: 700,
    color: danger ? "var(--status-danger)" : "var(--text-primary)",
    fontFamily: "var(--font-heading)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 12,
    margin: 0,
    marginBottom: 12,
  });

  const rangeLabel = RANGE_OPTS.find(o => o.key === range)?.label ?? "Hoy";

  return (
    <>
      {/* ── Keyframes + utility classes (inlined, no external deps) ── */}
      <style>{`
        @keyframes dashFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .rng-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 14px;
          min-height: 32px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
                      background 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rng-btn:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }
        .rng-btn[aria-pressed="true"] {
          background: rgba(0,229,255,0.1);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          box-shadow: 0 0 8px rgba(0,229,255,0.25);
        }
        .kpi-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .kpi-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* ── Dashboard container — 8-pt grid spacing ────────────────── */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Date range toggle ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", ...fade(0) }}>
          {RANGE_OPTS.map(({ key, label }) => (
            <button
              key={key}
              className="rng-btn"
              aria-pressed={range === key}
              onClick={() => setRange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Primary KPI row ────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...fade(1) }}>

          {/* Ventas del período seleccionado — cyan accent, glowing */}
          <div className="kpi-card" style={{
            ...glass,
            flex: 1, minWidth: 120,
            border: "1px solid var(--accent-cyan)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 4,
            boxShadow: "0 0 16px rgba(0,229,255,0.2), inset 0 0 0 1px rgba(0,229,255,0.06)",
          }}>
            <span style={labelCss}>{rangeLabel} · Ventas</span>
            <div style={mono("var(--accent-cyan)", "rgba(0,229,255,0.6)")}>{sRange.length}</div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--accent-cyan)",
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: "0 0 10px rgba(0,229,255,0.4)",
            }}>
              {fmt(totRange)}
            </div>
          </div>

          {/* Total histórico — green accent */}
          <div className="kpi-card" style={{
            ...glass,
            flex: 1, minWidth: 120,
            border: "1px solid rgba(0,255,136,0.35)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 4,
            boxShadow: "0 0 16px rgba(0,255,136,0.1), inset 0 0 0 1px rgba(0,255,136,0.06)",
          }}>
            <span style={labelCss}>Total Histórico</span>
            <div style={mono("var(--accent-green,#00FF88)", "rgba(0,255,136,0.5)")}>
              {fmt(totGral)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {sales.length} ventas registradas
            </div>
          </div>
        </div>

        {/* ── Secondary KPI row ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...fade(2) }}>

          {/* Clientes identificados (only those with tel/ig — no anonymous inflation) */}
          <div className="kpi-card" style={{
            ...glass,
            flex: 1, minWidth: 120,
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 4,
            boxShadow: "var(--shadow-sm)",
          }}>
            <span style={labelCss}>Clientes ID.</span>
            <div style={mono()}>{clientesId}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Con tel / IG registrado</div>
          </div>

          {/* Stock alerts KPI — warm glow when issues exist */}
          <div className="kpi-card" style={{
            ...glass,
            flex: 1, minWidth: 120,
            border: `1px solid ${alertas.length > 0 ? "var(--status-warning)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 4,
            boxShadow: alertas.length > 0
              ? "0 0 12px rgba(255,170,0,0.2)"
              : "var(--shadow-sm)",
          }}>
            <span style={labelCss}>Alertas Stock</span>
            <div style={mono(
              alertas.length > 0 ? "var(--status-warning)" : "var(--status-success)",
              alertas.length > 0 ? "rgba(255,170,0,0.5)" : undefined,
            )}>
              {alertas.length}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {alertas.length > 0 ? "Requieren reposición" : "Stock OK"}
            </div>
          </div>
        </div>

        {/* ── Sparkline trend — hero card with cyan left-border ─────── */}
        <div style={{
          ...glass,
          border: "1px solid var(--accent-cyan)",
          borderLeft: "3px solid var(--accent-cyan)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          boxShadow: "0 0 16px rgba(0,229,255,0.12)",
          ...fade(3),
        }}>
          <div style={sHead()}>Tendencia · Últimos 7 días</div>
          {hasTrend ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--accent-cyan)",
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: "0 0 12px rgba(0,229,255,0.6)",
                }}>
                  {fmt(totGral)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Facturación acumulada
                </div>
              </div>
              {/* Real data only — no fake demo data fallback */}
              <Sparkline data={last7DaysTrend} color="var(--accent-cyan)" width={140} height={42} />
            </div>
          ) : (
            <div style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "12px 0",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Sin ventas en los últimos 7 días
            </div>
          )}
        </div>

        {/* ── Channel distribution ───────────────────────────────────── */}
        <div style={{
          ...glass,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          boxShadow: "var(--shadow-sm)",
          ...fade(4),
        }}>
          <div style={sHead()}>Distribución por Canal de Venta</div>
          <ChannelDistributionBar channels={porCanal} />
        </div>

        {/* ── Top 5 products ─────────────────────────────────────────── */}
        <div style={{
          ...glass,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          ...fade(5),
        }}>
          <div style={sHead()}>Top 5 Productos más Vendidos</div>

          {top.length > 0 ? top.map(([nombre, d], i) => (
            <div key={nombre} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              padding: "8px 0",
              // No trailing border on last item
              borderBottom: i < top.length - 1 ? "1px dashed var(--border-subtle)" : "none",
              minHeight: 44,
              gap: 8,
            }}>
              {/* Rank — monospace, neon glow */}
              <span style={{
                color: "var(--accent-cyan)",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                minWidth: 24,
                textShadow: "0 0 8px rgba(0,229,255,0.4)",
              }}>
                #{i + 1}
              </span>
              <span style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
                color: "var(--text-primary)",
              }}>
                {nombre}
              </span>
              {/* 'unid.' is standard Argentine abbreviation; · separator distinguishes from $ decimal */}
              <span style={{
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}>
                {d.qty} unid. &middot; {fmt(d.total)}
              </span>
            </div>
          )) : (
            <div style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "16px 0",
            }}>
              Sin ventas registradas todavía
            </div>
          )}
        </div>

        {/* ── Stock alerts — danger accent border + red glow ─────────── */}
        <div style={{
          ...glass,
          border: alertas.length > 0
            ? "1px solid var(--status-danger)"
            : "1px solid var(--border-subtle)",
          borderLeft: alertas.length > 0
            ? "3px solid var(--status-danger)"
            : "3px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          boxShadow: alertas.length > 0
            ? "0 0 12px rgba(255,0,80,0.15)"
            : "var(--shadow-sm)",
          ...fade(6),
        }}>
          <div style={sHead(alertas.length > 0)}>
            {alertas.length > 0
              ? "Alertas de Stock · Reposición Urgente"
              : "Alertas de Stock"}
          </div>

          {alertas.length > 0 ? alertas.map((p, i) => (
            <div key={p.sku} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              padding: "8px 0",
              // No trailing border on last item
              borderBottom: i < alertas.length - 1 ? "1px dashed var(--border-subtle)" : "none",
              minHeight: 44,
              gap: 8,
            }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {p.nombre}
                </span>
                {/* SKU in monospace as data identifier */}
                <span style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {p.sku}
                </span>
              </div>
              <StockBadge stock={p.stock} min={p.stockMin} />
            </div>
          )) : (
            <div style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "16px 0",
            }}>
              Todos los productos tienen stock suficiente
            </div>
          )}
        </div>

      </div>
    </>
  );
}
