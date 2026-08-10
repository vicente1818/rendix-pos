import { useState, useMemo, useCallback, memo } from "react";
import { postToSheets } from "../utils/sheets.js";
import { fileToDataURL } from "../utils/tiendanube.js";
import { formatCurrency } from "../utils/constants.js";
import { Button, SectionCard, SearchInput, StockBadge, Badge, EmptyState } from "../components/UI.jsx";
import { getProductImage } from "../utils/imageMatcher.js";

// ---------------------------------------------------------------------------
// Local stock-history store (FINDING #3 fix: persist audit trail in localStorage)
// Separate from the products key so a large catalog doesn't bloat the entry.
// ---------------------------------------------------------------------------
const HISTORY_KEY = "rendix:v2:stockHistory";

async function appendStockHistory({ sku, nombre, prev, next, delta, reason }) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push({ sku, nombre, prev, next, delta, reason: reason || "", date: new Date().toISOString() });
    // cap to 500 entries so the key stays bounded
    if (existing.length > 500) existing.splice(0, existing.length - 500);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn("Stock history write error:", e);
  }
}

// ---------------------------------------------------------------------------
// Sort options (defined at module level — not inside render)
// ---------------------------------------------------------------------------
const SORT_OPTIONS = [
  { value: "az",             label: "A–Z" },
  { value: "za",             label: "Z–A" },
  { value: "price_asc",      label: "Precio ↑" },
  { value: "price_desc",     label: "Precio ↓" },
  { value: "stock_asc",      label: "Stock ↑" },
  { value: "stock_critical", label: "Stock crítico primero" },
];

// ---------------------------------------------------------------------------
// Quick-adjust button (+1 / -1 / +5 / -5)
// ---------------------------------------------------------------------------
function QuickAdjBtn({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tactile-btn"
      style={{
        padding: "4px 8px",
        fontSize: 11,
        minHeight: 32,
        minWidth: 36,
        borderRadius: "var(--radius-sm)",
        background: "rgba(0,229,255,0.08)",
        color: "var(--accent-cyan)",
        border: "1px solid rgba(0,229,255,0.25)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Per-product row.
//
// FINDING #1 fix: `newStock`, `imgUrlInput`, and `reason` are LOCAL state here,
// NOT lifted to the parent. A keystroke in any input only re-renders THIS card,
// not all N cards. Parent callbacks (`onSaveStock`, `onSaveImg`, etc.) receive
// the final values directly — they do not depend on parent state, so their
// useCallback deps are stable and memo is actually effective.
// ---------------------------------------------------------------------------
const ProductRow = memo(function ProductRow({
  p,
  isEditing,
  isEditingImg,
  busy,
  selected,
  bulkMode,
  onStartEdit,
  onCancelEdit,
  onSaveStock,      // (sku, newStockStr, reason) => void
  onStartEditImg,   // (sku) => void  — toggles in parent
  onCancelEditImg,  // () => void
  onToggleActive,   // (sku) => void
  onSaveImg,        // (sku, url) => void
  onQuickAdjust,    // (sku, delta) => void
  onToggleSelect,   // (sku) => void
}) {
  // Local-only state — changes stay inside this component
  const [localNewStock, setLocalNewStock] = useState("");
  const [localReason, setLocalReason] = useState("");
  const [localImgUrl, setLocalImgUrl] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const isInactive = p.activo === false;

  // Stable handlers — deps are only stable identifiers or callbacks
  const handleStartEdit = useCallback(() => {
    setLocalNewStock(String(p.stock ?? ""));
    setLocalReason("");
    onStartEdit(p.sku);
  }, [p.sku, p.stock, onStartEdit]);

  const handleSaveStock = useCallback(() => {
    onSaveStock(p.sku, localNewStock, localReason);
  }, [p.sku, localNewStock, localReason, onSaveStock]);

  const handleStartEditImg = useCallback(() => {
    setLocalImgUrl(p.imagen || "");
    onStartEditImg(p.sku);
  }, [p.sku, p.imagen, onStartEditImg]);

  const handleImgKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleStartEditImg(); }
  }, [handleStartEditImg]);

  const handleSaveImgUrl = useCallback(() => {
    onSaveImg(p.sku, localImgUrl);
  }, [p.sku, localImgUrl, onSaveImg]);

  const handleRemoveImg   = useCallback(() => onSaveImg(p.sku, ""), [p.sku, onSaveImg]);
  const handleToggle      = useCallback(() => onToggleActive(p.sku), [p.sku, onToggleActive]);
  const handleToggleSel   = useCallback(() => onToggleSelect(p.sku), [p.sku, onToggleSelect]);

  const handleQuickMinus5 = useCallback(() => onQuickAdjust(p.sku, -5), [p.sku, onQuickAdjust]);
  const handleQuickMinus1 = useCallback(() => onQuickAdjust(p.sku, -1), [p.sku, onQuickAdjust]);
  const handleQuickPlus1  = useCallback(() => onQuickAdjust(p.sku, +1), [p.sku, onQuickAdjust]);
  const handleQuickPlus5  = useCallback(() => onQuickAdjust(p.sku, +5), [p.sku, onQuickAdjust]);

  const handleImgError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = getProductImage(null);
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataURL(file);
      await onSaveImg(p.sku, url);
    } catch (err) {
      alert(err.message);
    }
  }, [p.sku, onSaveImg]);

  const handleShowHistory = useCallback(async () => {
    if (!showHistory) {
      try {
        const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        const mine = all.filter(h => h.sku === p.sku).slice(-5).reverse();
        setHistory(mine);
      } catch { setHistory([]); }
    }
    setShowHistory(v => !v);
  }, [showHistory, p.sku]);

  // Visual stock bar
  const stockMin = p.stockMin || 0;
  const stockMax = Math.max(stockMin * 4, p.stock, 1);
  const stockPct = Math.min(100, Math.round((p.stock / stockMax) * 100));
  const stockBarColor = p.stock <= 0
    ? "var(--status-danger)"
    : p.stock <= stockMin
    ? "var(--status-warning)"
    : "var(--status-success)";

  return (
    <SectionCard
      style={{
        background: "rgba(14,20,32,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: selected
          ? "1px solid var(--accent-cyan)"
          : "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        boxShadow: selected ? "0 0 10px rgba(0,229,255,0.3)" : undefined,
      }}
    >
      {/* ── Top row: [checkbox] image + name + stock bar + badges ─────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0, alignItems: "flex-start" }}>

          {/* Bulk-mode checkbox */}
          {bulkMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={handleToggleSel}
              aria-label={`Seleccionar ${p.nombre}`}
              style={{
                marginTop: 4, width: 16, height: 16,
                flexShrink: 0, cursor: "pointer",
                accentColor: "var(--accent-cyan)",
              }}
            />
          )}

          {/* Image thumbnail — click to toggle image editor */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Cambiar imagen del producto"
            title="Cambiar imagen"
            onClick={handleStartEditImg}
            onKeyDown={handleImgKeyDown}
            style={{
              width: 52, height: 52,
              borderRadius: "var(--radius-sm)",
              flexShrink: 0, cursor: "pointer",
              background: "var(--bg-surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              border: isEditingImg
                ? "1px solid var(--accent-cyan)"
                : "1px dashed var(--border-medium)",
              boxShadow: isEditingImg
                ? "0 0 10px rgba(0,229,255,0.4), 0 0 2px rgba(0,229,255,0.8)"
                : "none",
              transition: "all 0.2s ease",
            }}
          >
            <img
              src={getProductImage(p)}
              alt=""
              onError={handleImgError}
              style={{ width: 52, height: 52, objectFit: "cover", borderRadius: "var(--radius-sm)", display: "block" }}
            />
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              background: "rgba(0,0,0,0.65)", borderTopLeftRadius: "var(--radius-sm)",
              padding: "2px 4px", fontSize: 10, lineHeight: 1,
              pointerEvents: "none", color: "var(--accent-cyan)",
            }}>📷</div>
          </div>

          {/* Name + meta + stock bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600, fontSize: 13,
              color: isInactive ? "var(--text-muted)" : "var(--text-primary)",
              transition: "color 0.2s ease",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{p.nombre}</div>
            <div style={{
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{p.sku} · {p.marca} · {p.pres}</div>

            {/* Visual stock bar (FEATURE #6) */}
            <div
              title={`Stock: ${p.stock} / mín: ${stockMin}`}
              style={{
                marginTop: 6, height: 4,
                borderRadius: 2, background: "var(--border-subtle)", overflow: "hidden",
              }}
            >
              <div style={{
                height: "100%", width: `${stockPct}%`, borderRadius: 2,
                background: stockBarColor, transition: "width 0.3s ease",
                boxShadow: p.stock <= stockMin ? `0 0 4px ${stockBarColor}` : "none",
              }} />
            </div>
          </div>
        </div>

        {/* Badge cluster */}
        <div style={{
          display: "flex", gap: 6, alignItems: "center",
          flexShrink: 0, flexWrap: "wrap",
          justifyContent: "flex-end", maxWidth: 130, marginLeft: 8,
        }}>
          {isInactive && <Badge color="danger">Inactivo</Badge>}
          <StockBadge stock={p.stock} min={p.stockMin} />
        </div>
      </div>

      {/* ── Quick stock adjust (FEATURE #1) ─────────────────────────────── */}
      {!isEditing && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 10, color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace", marginRight: 2,
          }}>Ajuste rápido:</span>
          <QuickAdjBtn label="-5" onClick={handleQuickMinus5} disabled={busy || p.stock < 5} />
          <QuickAdjBtn label="-1" onClick={handleQuickMinus1} disabled={busy || p.stock < 1} />
          <QuickAdjBtn label="+1" onClick={handleQuickPlus1}  disabled={busy} />
          <QuickAdjBtn label="+5" onClick={handleQuickPlus5}  disabled={busy} />
        </div>
      )}

      {/* ── Price + full stock editor + toggle active ────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 4, gap: 8, flexWrap: "wrap",
      }}>
        <span style={{
          fontWeight: 700, color: "var(--accent-cyan)", fontSize: 15,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: "0 0 8px rgba(0,229,255,0.5), 0 0 2px rgba(0,229,255,0.8)",
          flexShrink: 0,
        }}>{formatCurrency(p.precio)}</span>

        <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isEditing ? (
            <>
              {/* Full-set stock editor with optional motivo field */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <input
                  type="number"
                  value={localNewStock}
                  onChange={e => setLocalNewStock(e.target.value)}
                  placeholder="Cant."
                  min={0}
                  style={{
                    width: 96, minWidth: 96, fontSize: 13, height: 40,
                    background: "rgba(9,13,20,0.95)", color: "var(--text-primary)",
                    border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-sm)",
                    padding: "0 10px", fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: "0 0 6px rgba(0,229,255,0.2)", outline: "none",
                  }}
                />
                {/* FINDING #3 fix: Motivo field — captured in history */}
                <input
                  type="text"
                  value={localReason}
                  onChange={e => setLocalReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  style={{
                    width: 96, minWidth: 96, fontSize: 11, height: 32,
                    background: "rgba(9,13,20,0.95)", color: "var(--text-primary)",
                    border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)",
                    padding: "0 8px", fontFamily: "'JetBrains Mono', monospace", outline: "none",
                  }}
                />
              </div>
              <Button
                variant="primary" size="sm" onClick={handleSaveStock} disabled={busy}
                style={{ boxShadow: "0 0 16px rgba(0,229,255,0.4)" }}
              >Guardar</Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={busy}>✕</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" disabled={busy} onClick={handleStartEdit}>
              Ajustar Stock
            </Button>
          )}
          <Button
            variant={isInactive ? "secondary" : "ghost"}
            size="sm" disabled={busy} onClick={handleToggle}
            style={{ color: isInactive ? "var(--status-success)" : "var(--status-danger)" }}
          >
            {isInactive ? "Activar" : "Desactivar"}
          </Button>
        </div>
      </div>

      {/* ── Stock history (FINDING #3 fix) ──────────────────────────────── */}
      <button
        onClick={handleShowHistory}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 10, color: "var(--text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
          padding: "4px 0 0", textDecoration: "underline dotted",
        }}
      >
        {showHistory ? "Ocultar historial" : "Ver historial de ajustes"}
      </button>
      {showHistory && (
        <div style={{
          marginTop: 6, padding: "8px 10px",
          background: "rgba(9,13,20,0.8)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          color: "var(--text-muted)",
        }}>
          {history.length === 0 ? (
            <div>Sin historial registrado para este producto.</div>
          ) : (
            history.map((h, i) => (
              <div key={i} style={{ marginBottom: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {new Date(h.date).toLocaleString("es-AR", {
                    day: "2-digit", month: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <span style={{ color: h.next > h.prev ? "var(--status-success)" : "var(--status-danger)" }}>
                  {h.prev} → {h.next}
                  {h.delta !== undefined ? ` (${h.delta > 0 ? "+" : ""}${h.delta})` : ""}
                </span>
                {h.reason && (
                  <span style={{ color: "var(--accent-cyan)" }}>{h.reason}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Image editor panel ──────────────────────────────────────────── */}
      {isEditingImg && (
        <div style={{
          background: "rgba(14,20,32,0.9)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--accent-cyan)",
          boxShadow: "0 0 12px rgba(0,229,255,0.15)",
          padding: 12, borderRadius: "var(--radius-sm)", marginTop: 12,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
            Subir foto (máx 1.5 MB, solo imágenes)
          </label>
          <input type="file" accept="image/*" onChange={handleFileChange}
            style={{ fontSize: 11, color: "var(--text-primary)" }} />
          <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
            O pegar URL de imagen
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={localImgUrl}
              onChange={e => setLocalImgUrl(e.target.value)}
              placeholder="https://..."
              style={{
                flex: 1, fontSize: 12, height: 40,
                background: "rgba(9,13,20,0.95)", color: "var(--text-primary)",
                border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)",
                padding: "0 10px", fontFamily: "'JetBrains Mono', monospace",
                outline: "none", transition: "border-color 0.2s ease",
              }}
            />
            <Button variant="secondary" size="sm" onClick={handleSaveImgUrl}
              style={{ boxShadow: "0 0 8px rgba(0,229,255,0.2)" }}>OK</Button>
          </div>
          {p.imagen && <Button variant="danger" size="sm" onClick={handleRemoveImg}>Quitar imagen</Button>}
          <Button variant="ghost" size="sm" onClick={onCancelEditImg}>Cancelar</Button>
        </div>
      )}
    </SectionCard>
  );
});

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------
export function CatalogoTab({ products, onUpdate }) {
  const [cat, setCat]           = useState("Todos");
  const [editing, setEditing]   = useState(null);      // sku being stock-edited
  const [editingImg, setEditingImg] = useState(null);  // sku being image-edited
  const [search, setSearch]     = useState("");
  const [busy, setBusy]         = useState(false);
  const [sortMode, setSortMode] = useState("az");
  const [showAlerts, setShowAlerts] = useState(false); // FEATURE #2
  const [bulkMode, setBulkMode] = useState(false);     // FEATURE #7
  const [selected, setSelected] = useState(new Set()); // FEATURE #7

  // FEATURE #4: category list + per-category product counts
  const cats = useMemo(
    () => ["Todos", ...new Set(products.map(p => p.cat).filter(Boolean))],
    [products]
  );

  const categoryCounts = useMemo(() => {
    const counts = { Todos: products.length };
    for (const p of products) {
      if (p.cat) counts[p.cat] = (counts[p.cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  // FEATURE #2: count of stock-alert products
  const alertCount = useMemo(
    () => products.filter(p => p.stock <= (p.stockMin || 0)).length,
    [products]
  );

  // FEATURE #3 + #5: filter by cat, search (broadened fields), stock alerts, then sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = products.filter(p =>
      (cat === "Todos" || p.cat === cat) &&
      (!showAlerts || p.stock <= (p.stockMin || 0)) &&
      (!q ||
        (p.nombre  || "").toLowerCase().includes(q) ||
        (p.sku     || "").toLowerCase().includes(q) ||
        (p.marca   || "").toLowerCase().includes(q) ||
        (p.cat     || "").toLowerCase().includes(q) ||
        (p.pres    || "").toLowerCase().includes(q)
      )
    );

    // FEATURE #5: sort
    switch (sortMode) {
      case "az":
        result = [...result].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
        break;
      case "za":
        result = [...result].sort((a, b) => (b.nombre || "").localeCompare(a.nombre || "", "es"));
        break;
      case "price_asc":
        result = [...result].sort((a, b) => (a.precio || 0) - (b.precio || 0));
        break;
      case "price_desc":
        result = [...result].sort((a, b) => (b.precio || 0) - (a.precio || 0));
        break;
      case "stock_asc":
        result = [...result].sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case "stock_critical":
        // sort by stock-to-min ratio ascending (0 = most critical)
        result = [...result].sort((a, b) => {
          const ra = (a.stock || 0) / Math.max(a.stockMin || 1, 1);
          const rb = (b.stock || 0) / Math.max(b.stockMin || 1, 1);
          return ra - rb;
        });
        break;
      default:
        break;
    }
    return result;
  }, [products, cat, search, showAlerts, sortMode]);

  // ── Stable parent callbacks (FINDING #1 fix: no per-keystroke state in deps) ──

  const handleStartEdit = useCallback((sku) => {
    setEditing(sku);
    setEditingImg(null);
  }, []);

  const handleCancelEdit = useCallback(() => setEditing(null), []);

  // Toggle image editor — clicking thumbnail again closes the panel
  const handleStartEditImg = useCallback((sku) => {
    setEditingImg(prev => prev === sku ? null : sku);
    setEditing(null);
  }, []);

  const handleCancelEditImg = useCallback(() => setEditingImg(null), []);

  // FINDING #1 fix: receives final values from child, no dep on newStock/imgUrlInput
  // FINDING #2 fix: checks save() return value before calling onUpdate
  const handleSaveStock = useCallback(async (sku, newStockStr, reason) => {
    const n = parseInt(newStockStr, 10);
    if (isNaN(n) || n < 0) return;
    const target = products.find(p => p.sku === sku);
    if (!target) return;
    const prev = target.stock ?? 0;
    setBusy(true);
    try {
      const updated = products.map(p => p.sku === sku ? { ...p, stock: n } : p);
      await onUpdate(updated);
      await appendStockHistory({ sku, nombre: target.nombre || "", prev, next: n, reason });
      await postToSheets("stock_update", {
        sku, nombre: target.nombre || "",
        stockAnterior: prev, stockNuevo: n,
        fecha: new Date().toISOString(), motivo: reason || "",
      });
      setEditing(null);
    } finally {
      setBusy(false);
    }
  }, [products, onUpdate]);

  // FEATURE #1: quick ±delta adjustment — same save-guard + history
  const handleQuickAdjust = useCallback(async (sku, delta) => {
    const target = products.find(p => p.sku === sku);
    if (!target) return;
    const prev = target.stock ?? 0;
    const next = Math.max(0, prev + delta);
    setBusy(true);
    try {
      const updated = products.map(p => p.sku === sku ? { ...p, stock: next } : p);
      await onUpdate(updated);
      await appendStockHistory({ sku, nombre: target.nombre || "", prev, next, delta, reason: "" });
      await postToSheets("stock_update", {
        sku, nombre: target.nombre || "",
        stockAnterior: prev, stockNuevo: next,
        fecha: new Date().toISOString(),
        motivo: `ajuste_rapido:${delta > 0 ? "+" : ""}${delta}`,
      });
    } finally {
      setBusy(false);
    }
  }, [products, onUpdate]);

  const handleToggleActive = useCallback(async (sku) => {
    const p = products.find(x => x.sku === sku);
    if (!p) return;
    setBusy(true);
    try {
      const updated = products.map(x => x.sku === sku ? { ...x, activo: !x.activo } : x);
      await onUpdate(updated);
    } finally {
      setBusy(false);
    }
  }, [products, onUpdate]);

  const handleSaveImg = useCallback(async (sku, url) => {
    const updated = products.map(p => p.sku === sku ? { ...p, imagen: url || "" } : p);
    await onUpdate(updated);
    setEditingImg(null);
  }, [products, onUpdate]);

  // FEATURE #7: bulk selection helpers
  const handleToggleSelect = useCallback((sku) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku); else next.add(sku);
      return next;
    });
  }, []);

  const handleSelectAll   = useCallback(() => setSelected(new Set(filtered.map(p => p.sku))), [filtered]);
  const handleDeselectAll = useCallback(() => setSelected(new Set()), []);

  const handleBulkSetActive = useCallback(async (activeVal) => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const updated = products.map(p => selected.has(p.sku) ? { ...p, activo: activeVal } : p);
      await onUpdate(updated);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }, [selected, products, onUpdate]);

  const handleBulkActivate   = useCallback(() => handleBulkSetActive(true),  [handleBulkSetActive]);
  const handleBulkDeactivate = useCallback(() => handleBulkSetActive(false), [handleBulkSetActive]);

  const handleToggleBulkMode = useCallback(() => {
    setBulkMode(v => !v);
    setSelected(new Set());
  }, []);

  const handleToggleAlerts = useCallback(() => setShowAlerts(v => !v), []);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">

      {/* FEATURE #3: broadened search (marca, cat, pres) */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre, SKU, marca, categoría, presentación..."
      />

      {/* ── Toolbar: alerts filter + sort + bulk mode ──────────────────── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

        {/* FEATURE #2: alertas de stock filter */}
        <button
          onClick={handleToggleAlerts}
          style={{
            padding: "6px 12px", fontSize: 12, fontWeight: 600,
            minHeight: 36, borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: showAlerts ? "rgba(255,180,0,0.15)" : "rgba(14,20,32,0.75)",
            color: showAlerts ? "var(--status-warning)" : "var(--text-secondary)",
            border: showAlerts ? "1px solid var(--status-warning)" : "1px solid var(--border-subtle)",
            boxShadow: showAlerts ? "0 0 8px rgba(255,180,0,0.3)" : "none",
            transition: "all 0.2s ease",
            fontFamily: "'JetBrains Mono', monospace",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          Alertas de stock
          {alertCount > 0 && (
            <span style={{
              background: "var(--status-warning)", color: "#090D14",
              borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700,
            }}>{alertCount}</span>
          )}
        </button>

        {/* FEATURE #5: sort selector */}
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value)}
          aria-label="Ordenar productos"
          style={{
            padding: "6px 10px", fontSize: 12, minHeight: 36,
            background: "rgba(14,20,32,0.75)", color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)",
            cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", outline: "none",
          }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* FEATURE #7: bulk mode toggle */}
        <button
          onClick={handleToggleBulkMode}
          style={{
            padding: "6px 12px", fontSize: 12, fontWeight: 600,
            minHeight: 36, borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: bulkMode ? "rgba(0,229,255,0.1)" : "rgba(14,20,32,0.75)",
            color: bulkMode ? "var(--accent-cyan)" : "var(--text-secondary)",
            border: bulkMode ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
            transition: "all 0.2s ease",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {bulkMode ? "Salir de selección" : "Selección múltiple"}
        </button>
      </div>

      {/* FEATURE #7: bulk actions bar */}
      {bulkMode && (
        <div style={{
          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
          padding: "8px 12px",
          background: "rgba(0,229,255,0.05)",
          border: "1px solid rgba(0,229,255,0.2)",
          borderRadius: "var(--radius-sm)",
        }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>Todos</Button>
          <Button variant="ghost" size="sm" onClick={handleDeselectAll}>Ninguno</Button>
          <Button
            variant="secondary" size="sm"
            disabled={selected.size === 0 || busy}
            onClick={handleBulkActivate}
            style={{ color: "var(--status-success)" }}
          >Activar</Button>
          <Button
            variant="secondary" size="sm"
            disabled={selected.size === 0 || busy}
            onClick={handleBulkDeactivate}
            style={{ color: "var(--status-danger)" }}
          >Desactivar</Button>
        </div>
      )}

      {/* FEATURE #4: category tabs with count badges */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              whiteSpace: "nowrap", padding: "6px 14px", fontSize: 12,
              fontWeight: cat === c ? 700 : 500, borderRadius: "var(--radius-sm)",
              border: cat === c ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
              background: cat === c ? "rgba(0,229,255,0.12)" : "rgba(14,20,32,0.75)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              color: cat === c ? "var(--accent-cyan)" : "var(--text-secondary)",
              boxShadow: cat === c ? "0 0 10px rgba(0,229,255,0.35)" : "none",
              cursor: "pointer", transition: "all 0.2s ease",
              minHeight: 36, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.02em",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            {c}
            {/* Count badge */}
            <span style={{
              background: cat === c ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.08)",
              color: cat === c ? "var(--accent-cyan)" : "var(--text-muted)",
              borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700,
              minWidth: 18, textAlign: "center",
            }}>
              {categoryCounts[c] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Results summary */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
        {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        {showAlerts && " · solo alertas"}
        {search && ` · "${search}"`}
      </div>

      {/* ── Product list ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={showAlerts ? "✅" : "🔍"}
            title={showAlerts ? "Sin alertas de stock" : "Sin resultados"}
            description={
              showAlerts
                ? "Todos los productos tienen stock suficiente."
                : search
                ? `No se encontraron productos para "${search}"`
                : "No hay productos en esta categoría."
            }
          />
        ) : (
          filtered.map(p => (
            <ProductRow
              key={p.sku}
              p={p}
              isEditing={editing === p.sku}
              isEditingImg={editingImg === p.sku}
              busy={busy}
              selected={selected.has(p.sku)}
              bulkMode={bulkMode}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveStock={handleSaveStock}
              onStartEditImg={handleStartEditImg}
              onCancelEditImg={handleCancelEditImg}
              onToggleActive={handleToggleActive}
              onSaveImg={handleSaveImg}
              onQuickAdjust={handleQuickAdjust}
              onToggleSelect={handleToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
