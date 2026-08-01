import { useState, useMemo, useCallback, memo } from "react";
import { CANALES, fmt, fmtD } from "../utils/constants.js";
import { SectionCard, MetricCard, Badge, EmptyState, SearchInput } from "../components/UI.jsx";

// ─── Pre-defined button style constants (avoid per-render object creation) ───
const BTN_BASE = {
  whiteSpace: "nowrap",
  padding: "10px 16px",
  fontSize: 12,
  minHeight: 44,
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
  fontWeight: 600,
  transition: "all 0.2s ease",
  letterSpacing: "0.04em",
  border: "none",
  outline: "none",
};

const BTN_ACTIVE = {
  ...BTN_BASE,
  border: "1px solid var(--accent-cyan)",
  background: "rgba(0,229,255,0.08)",
  color: "var(--accent-cyan)",
  boxShadow: "0 0 8px rgba(0,229,255,0.25)",
};

const BTN_INACTIVE = {
  ...BTN_BASE,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-card)",
  color: "var(--text-muted)",
  boxShadow: "none",
};

const BTN_QUICK = {
  ...BTN_BASE,
  padding: "6px 10px",
  fontSize: 11,
  minHeight: 32,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-surface)",
  color: "var(--text-muted)",
};

const BTN_ACTION_BASE = {
  padding: "6px 12px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  minHeight: 32,
  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
  border: "none",
  transition: "all 0.15s ease",
};

// ─── Mono font shorthand ──────────────────────────────────────────────────────
const MONO = 'var(--font-mono, "JetBrains Mono", monospace)';

// ─── Payment method icon lookup ───────────────────────────────────────────────
function metodoIcon(metodo) {
  if (!metodo) return "";
  const m = metodo.toLowerCase();
  if (m.includes("tarjeta")) return "💳";
  if (m.includes("mercado") || m.includes("mp")) return "📱";
  if (m.includes("efectivo")) return "💵";
  if (m.includes("transfer")) return "🏦";
  return "💳";
}

// ─── Records per page ─────────────────────────────────────────────────────────
const PAGE = 50;

// ─── Chevron expand indicator ─────────────────────────────────────────────────
function ChevronIcon({ expanded }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        color: "var(--text-muted)",
        flexShrink: 0,
      }}
    >
      <path
        d="M2.5 5L7 9.5L11.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Skeleton placeholder card ────────────────────────────────────────────────
function SkeletonCard({ delay = 0 }) {
  const pulse = {
    animation: `cn-pulse 1.5s ease-in-out ${delay}s infinite`,
    borderRadius: 4,
  };
  return (
    <div
      style={{
        background: "rgba(14,20,32,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ ...pulse, width: 144, height: 14, marginBottom: 8, background: "rgba(248,250,252,0.07)" }} />
          <div style={{ ...pulse, width: 96, height: 10, background: "rgba(248,250,252,0.04)" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...pulse, width: 72, height: 16, marginBottom: 6, background: "rgba(0,229,255,0.08)" }} />
          <div style={{ ...pulse, width: 56, height: 12, background: "rgba(248,250,252,0.04)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Estado badge colour mapping ──────────────────────────────────────────────
function estadoBadgeColor(estado) {
  if (!estado || estado === "Confirmado") return "success";
  if (estado === "Devuelto") return "danger";
  if (estado === "Cancelado") return "warning";
  return "default";
}

// ─── Memoised individual sale card ───────────────────────────────────────────
const SaleCard = memo(function SaleCard({ v, isExpanded, onToggle, onUpdateSale }) {
  // Stable click handler per card — onToggle itself is stable from parent useCallback
  const handleClick = useCallback(() => onToggle(v.id), [onToggle, v.id]);

  // Compute discount amount safely: prefer stored value, fall back to derivation
  const discountMonto =
    v.descMonto > 0
      ? v.descMonto
      : v.descPct > 0 && v.total > 0
      ? Math.round((v.total * v.descPct) / (100 - v.descPct))
      : 0;

  const estado = v.estado || "Confirmado";

  return (
    <SectionCard
      onClick={handleClick}
      style={{
        cursor: "pointer",
        background: "rgba(14,20,32,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: isExpanded
          ? "1px solid rgba(0,229,255,0.35)"
          : "1px solid var(--border-subtle)",
        boxShadow: isExpanded
          ? "0 0 0 1px rgba(0,229,255,0.08), 0 4px 24px rgba(0,0,0,0.4)"
          : "none",
        transition: "all 0.2s ease",
      }}
    >
      {/* ── Collapsed header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Customer name — primary headline */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {v.cli?.nombre || "Sin cliente"}
          </div>
          {/* Sale ID + date + vendor + payment method icon — secondary monospace label */}
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              fontFamily: MONO,
              letterSpacing: "0.05em",
              marginTop: 2,
            }}
          >
            {v.id} · {fmtD(v.fecha)} · {v.vendedor || "Sin vendedor"}
            {v.metodo ? (
              <>
                {" · "}
                <span title={v.metodo} aria-label={v.metodo}>
                  {metodoIcon(v.metodo)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            {/* Accent cyan total with required glow */}
            <div
              style={{
                fontWeight: 700,
                color: "var(--accent-cyan)",
                fontSize: 15,
                fontFamily: MONO,
                fontVariantNumeric: "tabular-nums",
                textShadow: "0 0 8px rgba(0,229,255,0.6)",
              }}
            >
              {fmt(v.total)}
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
              <Badge color="info">{v.canal}</Badge>
              {/* Status badge — only shown when not default Confirmado, or always */}
              <Badge color={estadoBadgeColor(estado)}>{estado}</Badge>
            </div>
          </div>
          {/* Expand/collapse chevron */}
          <ChevronIcon expanded={isExpanded} />
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 10, paddingTop: 10 }}>
          {/* Client row — compact uppercase abbreviations instead of emoji */}
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 8,
              fontFamily: MONO,
              letterSpacing: "0.02em",
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>CLI</span>{" "}
            {v.cli?.nombre || "Sin nombre"}
            {v.cli?.tel ? (
              <>
                {" · "}
                <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>TEL</span>{" "}
                {v.cli.tel}
              </>
            ) : null}
            {v.cli?.ig ? (
              <>
                {" · "}
                <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>IG</span>{" "}
                @{v.cli.ig}
              </>
            ) : null}
            {v.cli?.ciudad ? <> · {v.cli.ciudad}</> : null}
          </div>

          {/* Line items — composite key guards against undefined SKU and duplicate SKUs */}
          {v.items?.map((i, idx) => (
            <div
              key={`${i.sku ?? "item"}-${idx}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
                gap: 8,
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontFamily: MONO, minWidth: 0 }}>
                <span style={{ color: "var(--text-muted)", marginRight: 4 }}>{i.qty}×</span>
                {i.nombre}
                {i.sku ? (
                  <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 10 }}>
                    [{i.sku}]
                  </span>
                ) : null}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontFamily: MONO,
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}
              >
                {fmt(i.subtotal)}
              </span>
            </div>
          ))}

          {/* Discount row — shown only when BOTH descPct and a real descMonto exist */}
          {v.descPct > 0 && discountMonto > 0 && (
            <div
              style={{
                color: "var(--status-success)",
                fontSize: 12,
                marginTop: 4,
                fontFamily: MONO,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              DESC {v.descPct}%: -{fmt(discountMonto)}
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: MONO }}>
            PAGO: {metodoIcon(v.metodo)} {v.metodo}
          </div>
          {v.cli?.notas && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
              NOTA: {v.cli.notas}
            </div>
          )}

          {/* Return / cancel action row — only shown when onUpdateSale is wired */}
          {onUpdateSale && (
            <div
              style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
              onClick={e => e.stopPropagation()} // prevent card collapse on action clicks
            >
              {estado !== "Devuelto" && (
                <button
                  style={{
                    ...BTN_ACTION_BASE,
                    background: "rgba(239,68,68,0.1)",
                    color: "var(--status-danger)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                  onClick={() => onUpdateSale(v.id, { estado: "Devuelto" })}
                >
                  Marcar como devuelta
                </button>
              )}
              {estado !== "Cancelado" && estado !== "Devuelto" && (
                <button
                  style={{
                    ...BTN_ACTION_BASE,
                    background: "rgba(251,191,36,0.08)",
                    color: "var(--status-warning)",
                    border: "1px solid rgba(251,191,36,0.3)",
                  }}
                  onClick={() => onUpdateSale(v.id, { estado: "Cancelado" })}
                >
                  Cancelar venta
                </button>
              )}
              {(estado === "Devuelto" || estado === "Cancelado") && (
                <button
                  style={{
                    ...BTN_ACTION_BASE,
                    background: "rgba(0,255,136,0.08)",
                    color: "var(--status-success)",
                    border: "1px solid rgba(0,255,136,0.2)",
                  }}
                  onClick={() => onUpdateSale(v.id, { estado: "Confirmado" })}
                >
                  Restaurar a Confirmado
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────
export function VentasTab({ sales = [], loading = false, onUpdateSale }) {
  const [canal, setCanal] = useState("Todos");
  const [exp, setExp] = useState(null);
  // Text search
  const [q, setQ] = useState("");
  // Date range filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Pagination
  const [page, setPage] = useState(0);

  // Quick date range helpers
  const setToday = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setDateFrom(today); setDateTo(today); setPage(0);
  }, []);

  const setThisWeek = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    setDateFrom(monday.toISOString().split("T")[0]);
    setDateTo(now.toISOString().split("T")[0]);
    setPage(0);
  }, []);

  const setThisMonth = useCallback(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(first.toISOString().split("T")[0]);
    setDateTo(now.toISOString().split("T")[0]);
    setPage(0);
  }, []);

  const clearDates = useCallback(() => {
    setDateFrom(""); setDateTo(""); setPage(0);
  }, []);

  // Memoised filtering + newest-first sort
  // Includes: canal, full-text search on name/ID/vendor, date range
  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return (canal === "Todos" ? sales : sales.filter(s => s.canal === canal))
      .filter(s => {
        // Text search — client name, sale ID, vendor, and all product names in items
        if (lq) {
          const productNames = (s.items || []).map(i => i.nombre || "").join(" ");
          const haystack = [s.cli?.nombre || "", s.id || "", s.vendedor || "", productNames]
            .join(" ").toLowerCase();
          if (!haystack.includes(lq)) return false;
        }
        // Date range
        if (dateFrom || dateTo) {
          const d = new Date(s.fecha);
          if (dateFrom && d < new Date(dateFrom)) return false;
          if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [sales, canal, q, dateFrom, dateTo]);

  // Memoised total — depends only on filtered
  const tot = useMemo(() => filtered.reduce((s, v) => s + (v.total || 0), 0), [filtered]);

  // Pagination
  const pageCount = Math.ceil(filtered.length / PAGE);
  const paginated = useMemo(
    () => filtered.slice(page * PAGE, (page + 1) * PAGE),
    [filtered, page]
  );

  // Stable toggle handler — functional updater avoids closing over `exp`
  const toggleCard = useCallback((id) => {
    setExp(prev => (prev === id ? null : id));
  }, []);

  // Reset to page 0 whenever filter changes (canal/q/dates already call setPage(0) inline)
  // Canal change also resets page
  const handleCanalChange = useCallback((c) => {
    setCanal(c); setPage(0);
  }, []);
  const handleQChange = useCallback((val) => {
    setQ(val); setPage(0);
  }, []);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  return (
    <>
      {/* Keyframes for skeleton pulse animation — injected once */}
      <style>{`@keyframes cn-pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      <div
        style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
        className="animate-fade-in"
      >
        {/* ── Text search ── */}
        <SearchInput
          value={q}
          onChange={handleQChange}
          placeholder="Buscar por cliente, producto, ID de venta, vendedor..."
        />

        {/* ── Date range filter ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Quick date shortcuts */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={setToday} style={{ ...BTN_QUICK, color: hasDateFilter ? "var(--text-muted)" : undefined }}>Hoy</button>
            <button onClick={setThisWeek} style={BTN_QUICK}>Esta semana</button>
            <button onClick={setThisMonth} style={BTN_QUICK}>Este mes</button>
            {hasDateFilter && (
              <button
                onClick={clearDates}
                style={{ ...BTN_QUICK, color: "var(--status-danger)", borderColor: "rgba(239,68,68,0.3)" }}
              >
                Limpiar fechas ✕
              </button>
            )}
          </div>
          {/* Date pickers */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0); }}
              aria-label="Desde"
              style={{
                flex: 1, padding: "6px 10px", fontSize: 12, minHeight: 36,
                background: "var(--bg-surface)", color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)",
                outline: "none",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0); }}
              aria-label="Hasta"
              style={{
                flex: 1, padding: "6px 10px", fontSize: 12, minHeight: 36,
                background: "var(--bg-surface)", color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* ── Channel filter strip ── */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {["Todos", ...CANALES].map(c => (
            <button key={c} onClick={() => handleCanalChange(c)} style={canal === c ? BTN_ACTIVE : BTN_INACTIVE}>
              {c}
            </button>
          ))}
        </div>

        {/* ── Metric cards ── */}
        <div style={{ display: "flex", gap: 10 }}>
          <MetricCard label="Ventas" val={filtered.length} />
          {/*
            Wrap the accent MetricCard in a glow-border shell.
            MetricCard does not expose a style prop, so the glow lives
            on the outer div. border-radius matches --radius-md.
          */}
          <div
            style={{
              flex: 1,
              borderRadius: "var(--radius-md)",
              boxShadow:
                "0 0 0 1px var(--accent-cyan), 0 0 12px rgba(0,229,255,0.15)",
            }}
          >
            <MetricCard
              label="Total Recaudado"
              val={fmt(tot)}
              color="var(--accent-cyan)"
            />
          </div>
        </div>

        {/* ── Loading skeletons ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 0.15, 0.3, 0.45].map((delay, i) => (
              <SkeletonCard key={i} delay={delay} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            title="Sin ventas"
            description={q || hasDateFilter ? "Ninguna venta coincide con los filtros activos." : "Seleccioná otro canal o registrá una venta."}
            icon="📭"
          />
        )}

        {/* ── Sale card list (paginated) ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paginated.map(v => (
                <SaleCard
                  key={v.id}
                  v={v}
                  isExpanded={exp === v.id}
                  onToggle={toggleCard}
                  onUpdateSale={onUpdateSale}
                />
              ))}
            </div>

            {/* ── Pagination controls ── */}
            {pageCount > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, paddingTop: 8,
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    ...BTN_BASE,
                    padding: "8px 16px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface)",
                    color: page === 0 ? "var(--text-muted)" : "var(--text-primary)",
                    opacity: page === 0 ? 0.4 : 1,
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Anterior
                </button>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: MONO, minWidth: 64, textAlign: "center" }}>
                  {page + 1} / {pageCount}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  style={{
                    ...BTN_BASE,
                    padding: "8px 16px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface)",
                    color: page >= pageCount - 1 ? "var(--text-muted)" : "var(--text-primary)",
                    opacity: page >= pageCount - 1 ? 0.4 : 1,
                    cursor: page >= pageCount - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: MONO }}>
              {filtered.length} {filtered.length === 1 ? "venta" : "ventas"} · mostrando {paginated.length}
            </div>
          </>
        )}
      </div>
    </>
  );
}
