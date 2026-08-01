import { useMemo, useState } from "react";
import { CANALES, fmt } from "../utils/constants.js";
import { StockBadge } from "../components/UI.jsx";
import { Sparkline, ChannelDistributionBar, HourlyChart } from "../components/AnalyticsCharts.jsx";

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
  { key: "today", label: "Hoy"         },
  { key: "week",  label: "Esta semana" },
  { key: "month", label: "Este mes"    },
  { key: "year",  label: "Este año"    },
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
  const [range, setRange]       = useState("today");
  const [exportMsg, setExportMsg] = useState("");

  // Midnight today in local tz — bucket key shared across all date math
  const todayMs = localMs(new Date());

  // ── Range start timestamp ─────────────────────────────────────────────────
  const rangeStart = useMemo(() => {
    const d = new Date();
    if (range === "today") return todayMs;
    if (range === "week") {
      // ISO week: Monday = day 0
      const daysFromMon = (d.getDay() + 6) % 7;
      return todayMs - daysFromMon * DAY_MS;
    }
    if (range === "month") return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (range === "year")  return new Date(d.getFullYear(), 0, 1).getTime();
    return todayMs;
  }, [range, todayMs]);

  // ── Memoised derivations ─────────────────────────────────────────────────

  const sRange = useMemo(
    () => sales.filter(s => localMs(s.fecha) >= rangeStart),
    [sales, rangeStart],
  );

  const totGral = useMemo(
    () => sales.reduce((a, v) => a + (v.total || 0), 0),
    [sales],
  );

  const totRange = useMemo(
    () => sRange.reduce((a, v) => a + (v.total || 0), 0),
    [sRange],
  );

  // Ticket promedio — average sale value in the selected period
  const ticketPromedio = sRange.length > 0 ? totRange / sRange.length : 0;

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
  // Sum of the actual 7-day window — replaces all-time totGral in the hero card
  const tot7d = last7DaysTrend.reduce((a, v) => a + v, 0);

  // Channel distribution filtered to selected range
  const porCanal = useMemo(
    () => CANALES.map(c => ({
      name:  c,
      total: sRange.filter(s => s.canal === c).reduce((a, s) => a + (s.total || 0), 0),
      color: CHANNEL_COLORS[c] ?? "var(--accent-cyan)",
    })),
    [sRange],
  );

  // Top 5 products — dual metric (units sold + revenue), range-filtered
  const top = useMemo(() => {
    const map = {};
    sRange.forEach(s =>
      s.items?.forEach(i => {
        if (!map[i.nombre]) map[i.nombre] = { qty: 0, total: 0 };
        map[i.nombre].qty   += i.qty      || 0;
        map[i.nombre].total += i.subtotal || 0;
      }),
    );
    return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  }, [sRange]);

  const alertas = useMemo(
    () => products.filter(p => p.stock <= p.stockMin),
    [products],
  );

  // Only identified customers (tel or ig) — anonymous sales excluded
  const clientesId = useMemo(
    () =>
      new Set(
        sales
          .filter(s => s.cli?.tel || s.cli?.ig)
          .map(s => s.cli?.tel || s.cli?.ig),
      ).size,
    [sales],
  );

  // ── Margen bruto estimado (conditional: only shown when products have costo) ──
  const hasCosto = useMemo(
    () => products.some(p => (p.costo || 0) > 0),
    [products],
  );

  const margenBruto = useMemo(() => {
    if (!hasCosto) return null;
    // Build lookup maps by SKU and by nombre for fast access
    const bySku    = {};
    const byNombre = {};
    products.forEach(p => {
      if (!p.costo) return;
      if (p.sku)    bySku[p.sku]       = p.costo;
      if (p.nombre) byNombre[p.nombre] = p.costo;
    });
    let margen = 0;
    sRange.forEach(s =>
      s.items?.forEach(i => {
        const costo = bySku[i.sku] ?? byNombre[i.nombre];
        if (costo) margen += ((i.precio || 0) - costo) * (i.qty || 1);
      }),
    );
    return margen;
  }, [sRange, products, hasCosto]);

  // ── Cliente más frecuente (all-time purchase count) ──────────────────────
  const topCliente = useMemo(() => {
    const counts = {};
    sales.forEach(s => {
      const id = s.cli?.nombre || s.cli?.tel || s.cli?.ig;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { nombre: sorted[0][0], count: sorted[0][1] } : null;
  }, [sales]);

  // ── Productos sin movimiento in selected period ──────────────────────────
  const productosConVentas = useMemo(() => {
    const set = new Set();
    sRange.forEach(s =>
      s.items?.forEach(i => {
        if (i.nombre) set.add(i.nombre);
        if (i.sku)    set.add(i.sku);
      }),
    );
    return set;
  }, [sRange]);

  const sinMovimiento = useMemo(
    () => products
      .filter(p => p.activo)
      .filter(p => !productosConVentas.has(p.nombre) && !productosConVentas.has(p.sku)),
    [products, productosConVentas],
  );

  // ── Ventas por hora del día (range-filtered) ─────────────────────────────
  const salesByHour = useMemo(() => {
    const hours = new Array(24).fill(0);
    sRange.forEach(s => {
      const h = new Date(s.fecha).getHours();
      hours[h] += s.total || 0;
    });
    return hours;
  }, [sRange]);

  const hasSalesByHour = salesByHour.some(v => v > 0);

  // ── Export: WhatsApp-ready plain-text summary ────────────────────────────
  const handleExport = () => {
    const label = RANGE_OPTS.find(o => o.key === range)?.label ?? "Hoy";
    const lines = [
      `*RENDIX POS · Resumen ${label}*`,
      ``,
      `Ventas: ${sRange.length}`,
      `Facturacion: ${fmt(totRange)}`,
      sRange.length > 0 ? `Ticket promedio: ${fmt(ticketPromedio)}` : null,
      margenBruto !== null ? `Margen bruto est.: ${fmt(margenBruto)}` : null,
      topCliente ? `Cliente frecuente: ${topCliente.nombre} (${topCliente.count} compras)` : null,
      top.length > 0
        ? `\nTop productos:\n${top.map(([n, d], i) => `${i + 1}. ${n} - ${d.qty} unid. - ${fmt(d.total)}`).join("\n")}`
        : null,
      alertas.length > 0 ? `\nAlertas de stock: ${alertas.length} productos` : null,
    ].filter(Boolean).join("\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(lines)
        .then(() => { setExportMsg("Copiado al portapapeles"); setTimeout(() => setExportMsg(""), 2500); })
        .catch(() => { setExportMsg("Error al copiar"); setTimeout(() => setExportMsg(""), 2500); });
    } else {
      setExportMsg("Sin soporte de clipboard");
      setTimeout(() => setExportMsg(""), 2500);
    }
  };

  // ── Shared style helpers ─────────────────────────────────────────────────

  // Fixed: use var(--bg-card) so light-theme override in index.css takes effect
  const glass = {
    background: "var(--bg-card)",
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

  // Monospace numeric value with optional neon glow
  const mono = (color = "var(--text-primary)", glow) => ({
    fontSize: 22,
    fontWeight: 800,
    color,
    fontFamily: "'JetBrains Mono', monospace",
    ...(glow ? { textShadow: `0 0 12px ${glow}` } : {}),
  });

  // Stagger offset for cascade animation
  const fade = i => ({
    animation: "dashFadeIn 0.35s ease both",
    animationDelay: `${i * 60}ms`,
  });

  // Section heading — danger variant for stock alerts
  const sHead = (danger = false) => ({
    fontSize: 13,
    fontWeight: 700,
    color: danger ? "var(--status-danger)" : "var(--text-primary)",
    fontFamily: "var(--font-heading)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 12,
  });

  const rangeLabel = RANGE_OPTS.find(o => o.key === range)?.label ?? "Hoy";

  return (
    <>
      {/* ── Keyframes + utility classes ── */}
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

      {/* ── Dashboard container ─────────────────────────────────────────── */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Date range toggles + Export button ──────────────────────── */}
        <div style={{
          display: "flex", gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          ...fade(0),
        }}>
          {/* Quick filters: Hoy / Esta semana / Este mes / Este año */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

          {/* WhatsApp-ready export */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {exportMsg && (
              <span style={{
                fontSize: 11,
                color: "var(--accent-cyan)",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {exportMsg}
              </span>
            )}
            <button
              className="rng-btn"
              onClick={handleExport}
              title="Copiar resumen listo para WhatsApp"
            >
              Exportar
            </button>
          </div>
        </div>

        {/* ── Primary KPI row ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...fade(1) }}>

          {/* Ventas del período — cyan accent */}
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

        {/* ── Secondary KPI row ───────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...fade(2) }}>

          {/* Clientes identificados */}
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

          {/* Alertas de stock */}
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

        {/* ── Tertiary KPI row: ticket promedio + margen bruto + cliente ── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...fade(3) }}>

          {/* Ticket promedio */}
          <div className="kpi-card" style={{
            ...glass,
            flex: 1, minWidth: 120,
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 4,
            boxShadow: "var(--shadow-sm)",
          }}>
            <span style={labelCss}>Ticket promedio</span>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: "var(--accent-cyan)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {sRange.length > 0 ? fmt(ticketPromedio) : "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{rangeLabel}</div>
          </div>

          {/* Margen bruto estimado — only rendered when products carry a costo field */}
          {hasCosto && margenBruto !== null && (
            <div className="kpi-card" style={{
              ...glass,
              flex: 1, minWidth: 120,
              border: "1px solid rgba(139,92,246,0.4)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 4,
              boxShadow: "0 0 10px rgba(139,92,246,0.12)",
            }}>
              <span style={labelCss}>Margen bruto est.</span>
              <div style={{
                fontSize: 18, fontWeight: 800,
                color: "var(--accent-purple,#8B5CF6)",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {fmt(margenBruto)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {rangeLabel} · sobre costo
              </div>
            </div>
          )}

          {/* Cliente más frecuente */}
          {topCliente && (
            <div className="kpi-card" style={{
              ...glass,
              flex: 1, minWidth: 160,
              border: "1px solid rgba(245,158,11,0.35)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 4,
              boxShadow: "0 0 10px rgba(245,158,11,0.1)",
            }}>
              <span style={labelCss}>Cliente frecuente</span>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: "var(--status-warning)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {topCliente.nombre}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {topCliente.count} compras registradas
              </div>
            </div>
          )}
        </div>

        {/* ── Sparkline trend hero — now shows real 7-day sum (tot7d) ─── */}
        <div style={{
          ...glass,
          border: "1px solid var(--accent-cyan)",
          borderLeft: "3px solid var(--accent-cyan)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          boxShadow: "0 0 16px rgba(0,229,255,0.12)",
          ...fade(4),
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
                  {fmt(tot7d)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Últimos 7 días
                </div>
              </div>
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

        {/* ── Mejor hora de ventas (rendered only when there is hourly data) ── */}
        {hasSalesByHour && (
          <div style={{
            ...glass,
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            boxShadow: "var(--shadow-sm)",
            ...fade(5),
          }}>
            <div style={sHead()}>Mejor hora de ventas · {rangeLabel}</div>
            <HourlyChart data={salesByHour} color="var(--accent-cyan)" />
          </div>
        )}

        {/* ── Channel distribution (range-filtered) ───────────────────── */}
        <div style={{
          ...glass,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          boxShadow: "var(--shadow-sm)",
          ...fade(6),
        }}>
          <div style={sHead()}>Distribución por Canal · {rangeLabel}</div>
          <ChannelDistributionBar channels={porCanal} />
        </div>

        {/* ── Top 5 products — units sold + revenue (dual metric) ─────── */}
        <div style={{
          ...glass,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          ...fade(7),
        }}>
          <div style={sHead()}>Top 5 Productos · {rangeLabel}</div>

          {top.length > 0 ? top.map(([nombre, d], i) => {
            const maxQty = top[0]?.[1]?.qty || 1;
            return (
              <div key={nombre} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                padding: "8px 0",
                borderBottom: i < top.length - 1 ? "1px dashed var(--border-subtle)" : "none",
                minHeight: 44,
                gap: 8,
              }}>
                {/* Rank */}
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

                {/* Name + progress bar (units relative to #1) */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
                  <span style={{
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {nombre}
                  </span>
                  <div style={{ height: 3, borderRadius: 99, background: "var(--border-subtle)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(d.qty / maxQty) * 100}%`,
                      background: "var(--accent-cyan)",
                      opacity: 0.55,
                      borderRadius: 99,
                    }} />
                  </div>
                </div>

                {/* Dual metric: units + revenue */}
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
            );
          }) : (
            <div style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "16px 0",
            }}>
              Sin ventas en el período seleccionado
            </div>
          )}
        </div>

        {/* ── Productos sin movimiento in selected period ──────────────── */}
        {sinMovimiento.length > 0 && (
          <div style={{
            ...glass,
            border: "1px solid rgba(245,158,11,0.3)",
            borderLeft: "3px solid var(--status-warning)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            boxShadow: "0 0 10px rgba(245,158,11,0.08)",
            ...fade(8),
          }}>
            <div style={sHead()}>
              Sin movimiento · {rangeLabel} ({sinMovimiento.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 192, overflowY: "auto" }}>
              {sinMovimiento.map((p, i) => (
                <div key={p.sku} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  padding: "7px 0",
                  borderBottom: i < sinMovimiento.length - 1 ? "1px dashed var(--border-subtle)" : "none",
                  gap: 8,
                }}>
                  <span style={{
                    flex: 1,
                    color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.nombre}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                  }}>
                    {p.sku} · stock {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stock alerts — danger accent ─────────────────────────────── */}
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
          ...fade(9),
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
              borderBottom: i < alertas.length - 1 ? "1px dashed var(--border-subtle)" : "none",
              minHeight: 44,
              gap: 8,
            }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {p.nombre}
                </span>
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
