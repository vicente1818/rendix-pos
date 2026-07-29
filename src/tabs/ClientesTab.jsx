import { useState, useMemo, useCallback } from "react";
import { fmt, fmtD } from "../utils/constants.js";
import { SectionCard, SearchInput, Badge, EmptyState } from "../components/UI.jsx";

const MONO = "'JetBrains Mono', 'Space Mono', monospace";

// ── Static style constants ────────────────────────────────────────────────────
// Defined outside the component so React never re-creates these object literals
// on re-renders.

const S = {
  container: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sortBar: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  // near-square per Matrix/Mono spec — NOT circular
  avatar: {
    width: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 2,
    background: "rgba(0,229,255,0.08)",
    border: "1px solid rgba(0,229,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    color: "var(--accent-cyan)",
    flexShrink: 0,
    fontFamily: MONO,
    transition: "all 0.2s ease",
  },
  clientName: {
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  contactLine: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontFamily: MONO,
    marginTop: 2,
    display: "block",
  },
  contactPrefix: {
    color: "var(--accent-cyan)",
    marginRight: 2,
  },
  rightPanel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  rightText: {
    textAlign: "right",
  },
  // green for revenue values — cyan is interactive/info per Circuit Noir language
  totalAmount: {
    fontWeight: 700,
    fontSize: 15,
    color: "var(--status-success)",
    fontFamily: MONO,
  },
  purchaseCount: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontFamily: MONO,
  },
  rankLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "var(--text-muted)",
    fontFamily: MONO,
    letterSpacing: "0.5px",
    flexShrink: 0,
    minWidth: 28,
  },
  historySection: {
    marginTop: 10,
    borderTop: "1px dashed var(--border-subtle)",
    paddingTop: 10,
  },
  historyHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginBottom: 6,
    fontFamily: MONO,
    letterSpacing: "0.5px",
  },
  historyRow: {
    fontSize: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
    flexWrap: "wrap",
  },
  historyDate: {
    color: "var(--text-secondary)",
    fontFamily: MONO,
  },
  historyTotal: {
    fontWeight: 600,
    fontFamily: MONO,
    color: "var(--status-success)",
    marginLeft: "auto",
  },
};

// Collapsed card — glassmorphism surface
const CARD_COLLAPSED = {
  background: "rgba(14,20,32,0.75)",
  backdropFilter: "blur(16px)",
  transition: "all 0.2s ease",
};

// Expanded/active card — Matrix glow border signals selection
const CARD_EXPANDED = {
  background: "rgba(14,20,32,0.75)",
  backdropFilter: "blur(16px)",
  border: "1px solid var(--accent-cyan)",
  boxShadow: "0 0 16px rgba(0,229,255,0.15)",
  transition: "all 0.2s ease",
};

// Sort button style factory — 4 calls per render, negligible cost
function sortBtnStyle(active) {
  return {
    fontSize: 11,
    fontWeight: 600,
    fontFamily: MONO,
    padding: "6px 10px",
    borderRadius: 2,
    border: `1px solid ${active ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
    background: active ? "rgba(0,229,255,0.10)" : "transparent",
    color: active ? "var(--accent-cyan)" : "var(--text-muted)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minHeight: 44, // touch target
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a stable string key from a sale's client data.
 * Known limitation: clients with neither tel nor ig are merged by name;
 * clients who appear in some sales with a phone and others without are split.
 * This is a data-model constraint — the key strategy here is unchanged from
 * the original to preserve existing deduplication behavior.
 */
function clientKey(s) {
  return s.cli?.tel || s.cli?.ig || s.cli?.nombre || "anon-" + s.id;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Contact info with an explicit WA:/@ label so staff can distinguish them. */
function ContactBadge({ tel, ig }) {
  if (tel) {
    return (
      <span style={S.contactLine}>
        <span style={S.contactPrefix}>WA:</span>
        {tel}
      </span>
    );
  }
  if (ig) {
    return (
      <span style={S.contactLine}>
        <span style={S.contactPrefix}>@</span>
        {ig}
      </span>
    );
  }
  return <span style={S.contactLine}>Sin contacto</span>;
}

/** Animated chevron — signals expand/collapse affordance. */
function ChevronIcon({ expanded }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        color: "var(--text-muted)",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const SORT_OPTIONS = [
  { key: "total",    label: "$ Gasto" },
  { key: "compras",  label: "# Visitas" },
  { key: "nombre",   label: "A–Z" },
  { key: "reciente", label: "Reciente" },
];

// ── Main component ────────────────────────────────────────────────────────────

export function ClientesTab({ sales = [] }) {
  // BUG FIX: default parameter guards against undefined/null sales prop
  const [q,       setQ]       = useState("");
  const [exp,     setExp]     = useState(null); // stores stable client key string
  const [sortKey, setSortKey] = useState("total");

  // PERF: aggregate + sort inside useMemo — only recomputes when sales or sortKey change.
  // A keystroke in the search box no longer re-runs the full forEach + sort pass.
  const clientes = useMemo(() => {
    const clMap = {};
    sales.forEach(s => {
      const key = clientKey(s);
      if (!clMap[key]) {
        clMap[key] = {
          key,
          nombre:  s.cli?.nombre  || "Cliente sin nombre",
          tel:     s.cli?.tel     || "",
          ig:      s.cli?.ig      || "",
          ciudad:  s.cli?.ciudad  || "",
          ventas:  [],
          total:   0,
        };
      }
      clMap[key].ventas.push(s);
      clMap[key].total += s.total;
    });

    const all = Object.values(clMap);

    switch (sortKey) {
      case "compras":
        all.sort((a, b) => b.ventas.length - a.ventas.length);
        break;
      case "nombre":
        all.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        break;
      case "reciente": {
        const lastTs = c =>
          Math.max(0, ...c.ventas.map(v => (v.fecha ? new Date(v.fecha).getTime() : 0)));
        all.sort((a, b) => lastTs(b) - lastTs(a));
        break;
      }
      default: // "total" — highest spend first
        all.sort((a, b) => b.total - a.total);
    }

    // Attach rank after sort so each card can read it in O(1)
    all.forEach((c, i) => { c.rank = i + 1; });
    return all;
  }, [sales, sortKey]);

  // PERF: filter in useMemo — only recomputes when client list or query changes
  const filtered = useMemo(() => {
    if (!q) return clientes;
    const lower = q.toLowerCase();
    return clientes.filter(
      c =>
        c.nombre.toLowerCase().includes(lower) ||
        c.tel.includes(q) ||
        c.ig.toLowerCase().includes(lower)
    );
  }, [clientes, q]);

  // PERF: stable handler — no anonymous function re-created per list item
  // BUG FIX: uses client key string, not filtered-array index, so toggling survives
  // search query changes without collapsing the open card or opening the wrong one
  const handleToggle = useCallback(key => {
    setExp(prev => (prev === key ? null : key));
  }, []);

  return (
    <div style={S.container} className="animate-fade-in">
      <SearchInput
        value={q}
        onChange={setQ}
        placeholder="Buscar por nombre, WhatsApp o Instagram..."
      />

      {/* Sort controls — let staff re-sort by name, visits, recency, or spend */}
      <div style={S.sortBar} role="group" aria-label="Ordenar clientes">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            style={sortBtnStyle(sortKey === opt.key)}
            aria-pressed={sortKey === opt.key}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Empty / no-results state uses the shared EmptyState component */}
      {filtered.length === 0 && (
        <EmptyState
          icon="👤"
          title={q ? "Sin resultados" : "Sin clientes registrados"}
          description={
            q
              ? `No se encontraron clientes para "${q}".`
              : "Las ventas con datos de cliente aparecerán aquí."
          }
        />
      )}

      {/* Client card list */}
      <div style={S.list}>
        {filtered.map(c => {
          const isExpanded = exp === c.key;

          return (
            // BUG FIX: key={c.key} is a stable client identifier string,
            // not a filtered-array index — survives search reordering
            <SectionCard
              key={c.key}
              onClick={() => handleToggle(c.key)}
              style={isExpanded ? CARD_EXPANDED : CARD_COLLAPSED}
            >
              {/* ── Header row ─────────────────────────────────────────── */}
              <div style={S.cardRow}>
                {/* Rank ordinal + avatar + client info */}
                <div style={S.avatarRow}>
                  <span style={S.rankLabel} aria-label={`Posición ${c.rank}`}>
                    #{String(c.rank).padStart(2, "0")}
                  </span>

                  <div style={S.avatar} aria-hidden="true">
                    {(c.nombre || "?")[0].toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={S.clientName}>{c.nombre}</div>
                    {/* Contact line with explicit WA:/@ label */}
                    <ContactBadge tel={c.tel} ig={c.ig} />
                    {c.ciudad && (
                      <span style={{ ...S.contactLine, marginTop: 0 }}>
                        {" · "}{c.ciudad}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spend total + purchase count + expand chevron */}
                <div style={S.rightPanel}>
                  <div style={S.rightText}>
                    {/* tabular-nums prevents digit-width jitter as amounts vary */}
                    <div style={S.totalAmount} className="tabular-nums">
                      {fmt(c.total)}
                    </div>
                    <div style={S.purchaseCount}>
                      {c.ventas.length} compra{c.ventas.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {/* Chevron gives first-time users a clear interactive affordance */}
                  <ChevronIcon expanded={isExpanded} />
                </div>
              </div>

              {/* ── Expanded: purchase history, most recent first ────── */}
              {isExpanded && (
                <div style={S.historySection}>
                  <div style={S.historyHeader}>Historial de compras</div>
                  {/* BUG FIX: [...].reverse() shows most recent purchase first */}
                  {[...c.ventas].reverse().map(v => (
                    <div key={v.id} style={S.historyRow}>
                      {/* BUG FIX: null-guard on v.fecha */}
                      <span style={S.historyDate}>
                        {v.fecha ? fmtD(v.fecha) : "--"}
                      </span>
                      {/* BUG FIX: fallback for missing canal; Badge for visual scannability */}
                      <Badge color="cyan">{v.canal || "Sin canal"}</Badge>
                      <span style={S.historyTotal} className="tabular-nums">
                        {fmt(v.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
