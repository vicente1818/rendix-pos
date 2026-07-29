import { useState, useMemo, useCallback, memo } from "react";
import { save } from "../utils/storage.js";
import { postToSheets } from "../utils/sheets.js";
import { fileToDataURL } from "../utils/tiendanube.js";
import { K, fmt } from "../utils/constants.js";
import { Button, SectionCard, SearchInput, StockBadge, Badge, EmptyState } from "../components/UI.jsx";
import { getProductImage } from "../utils/imageMatcher.js";

// ---------------------------------------------------------------------------
// Per-product row extracted into its own memoised component.
// This prevents the parent's state changes (e.g. typing in search) from
// recreating a closure for every product on every render.
// ---------------------------------------------------------------------------
const ProductRow = memo(function ProductRow({
  p,
  editing,
  setEditing,
  newStock,
  setNewStock,
  editingImg,
  setEditingImg,
  imgUrlInput,
  setImgUrlInput,
  busy,
  onUpdateStock,
  onToggleActive,
  onSaveImg,
}) {
  const isInactive = p.activo === false;
  const isEditingThisImg = editingImg === p.sku;
  const isEditingStock = editing === p.sku;

  // PERF: stable callbacks — recreated only when the relevant identifiers change
  const handleImgToggle = useCallback(() => {
    setEditingImg(isEditingThisImg ? null : p.sku);
    setImgUrlInput(p.imagen || "");
  }, [isEditingThisImg, p.sku, p.imagen, setEditingImg, setImgUrlInput]);

  const handleImgKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleImgToggle(); }
  }, [handleImgToggle]);

  // BUG fix (line 132): convert p.stock to string to keep controlled-input type consistent
  const handleStockEdit = useCallback(() => {
    setEditing(p.sku);
    setNewStock(String(p.stock ?? ""));
  }, [p.sku, p.stock, setEditing, setNewStock]);

  const handleCancelEdit = useCallback(() => setEditing(null), [setEditing]);

  const handleToggle = useCallback(() => onToggleActive(p.sku), [p.sku, onToggleActive]);

  const handleSaveImgUrl = useCallback(
    () => onSaveImg(p.sku, imgUrlInput),
    [p.sku, imgUrlInput, onSaveImg]
  );

  const handleRemoveImg = useCallback(() => onSaveImg(p.sku, ""), [p.sku, onSaveImg]);

  // BUG fix (line 100): derive fallback from getProductImage(null) so it stays in
  // sync with DEFAULT_FALLBACK inside imageMatcher.js — no hardcoded path here.
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

  return (
    <SectionCard
      style={{
        // DESIGN: glassmorphism surface
        background: "rgba(14,20,32,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* ── Top row: image + name + badges ─────────────────────────────── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
          {/* DESIGN: image thumbnail — cyan glow when in edit mode */}
          {/* UX: role=button, aria-label, title give discoverability */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Cambiar imagen del producto"
            title="Cambiar imagen"
            onClick={handleImgToggle}
            onKeyDown={handleImgKeyDown}
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
              cursor: "pointer",
              overflow: "visible",   // let the image clip but keep the overlay readable
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: isEditingThisImg
                ? "1px solid var(--accent-cyan)"
                : "1px dashed var(--border-medium)",
              // DESIGN: neon glow on active edit state
              boxShadow: isEditingThisImg
                ? "0 0 10px rgba(0,229,255,0.4), 0 0 2px rgba(0,229,255,0.8)"
                : "none",
              borderRadius: "var(--radius-sm)",
              transition: "all 0.2s ease",
            }}
          >
            <img
              src={getProductImage(p)}
              alt=""
              onError={handleImgError}
              style={{
                width: 52,
                height: 52,
                objectFit: "cover",
                borderRadius: "var(--radius-sm)",
                display: "block",
              }}
            />
            {/* UX: camera icon overlay — signals tap target */}
            <div style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "rgba(0,0,0,0.65)",
              borderTopLeftRadius: "var(--radius-sm)",
              padding: "2px 4px",
              fontSize: 10,
              lineHeight: 1,
              pointerEvents: "none",
              color: "var(--accent-cyan)",
            }}>
              📷
            </div>
          </div>

          {/* Product name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              fontSize: 13,
              // DESIGN: inactive → muted text only, not whole-card opacity
              color: isInactive ? "var(--text-muted)" : "var(--text-primary)",
              transition: "color 0.2s ease",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {p.nombre}
            </div>
            <div style={{
              fontSize: 11,
              color: "var(--text-muted)",
              // DESIGN: monospace for identifiers/metadata
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {p.sku} · {p.marca} · {p.pres}
            </div>
          </div>
        </div>

        {/* DESIGN + UX: badge cluster with flexWrap to prevent overflow on narrow screens */}
        <div style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexShrink: 0,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          maxWidth: 130,
          marginLeft: 8,
        }}>
          {isInactive && <Badge color="danger">Inactivo</Badge>}
          <StockBadge stock={p.stock} min={p.stockMin} />
        </div>
      </div>

      {/* ── Bottom row: price + actions ─────────────────────────────────── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        gap: 8,
        flexWrap: "wrap",
      }}>
        {/* DESIGN: neon glow on price figure + monospace font */}
        <span style={{
          fontWeight: 700,
          color: "var(--accent-cyan)",
          fontSize: 15,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: "0 0 8px rgba(0,229,255,0.5), 0 0 2px rgba(0,229,255,0.8)",
          flexShrink: 0,
        }}>
          {fmt(p.precio)}
        </span>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isEditingStock ? (
            <>
              {/* UX: wider input (≥90px), styled with dark theme tokens */}
              <input
                type="number"
                value={newStock}
                onChange={e => setNewStock(e.target.value)}
                placeholder="Cant."
                min={0}
                style={{
                  width: 96,
                  minWidth: 96,
                  fontSize: 13,
                  height: 40,
                  background: "rgba(9,13,20,0.95)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--accent-cyan)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0 10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: "0 0 6px rgba(0,229,255,0.2)",
                  outline: "none",
                }}
              />
              {/* UX: 'Guardar' is unambiguous; primary glow on confirm */}
              <Button
                variant="primary"
                size="sm"
                onClick={onUpdateStock}
                disabled={busy}
                style={{ boxShadow: "0 0 16px rgba(0,229,255,0.4)" }}
              >
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={busy}>
                ✕
              </Button>
            </>
          ) : (
            // UX: 'Ajustar Stock' clarifies absolute-set intent
            <Button variant="secondary" size="sm" disabled={busy} onClick={handleStockEdit}>
              Ajustar Stock
            </Button>
          )}
          <Button
            variant={isInactive ? "secondary" : "ghost"}
            size="sm"
            disabled={busy}
            onClick={handleToggle}
            style={{ color: isInactive ? "var(--status-success)" : "var(--status-danger)" }}
          >
            {isInactive ? "Activar" : "Desactivar"}
          </Button>
        </div>
      </div>

      {/* ── Image editor panel ──────────────────────────────────────────── */}
      {isEditingThisImg && (
        <div style={{
          background: "rgba(14,20,32,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--accent-cyan)",
          boxShadow: "0 0 12px rgba(0,229,255,0.15)",
          padding: 12,
          borderRadius: "var(--radius-sm)",
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          <label style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Subir foto de producto (máx 1.5 MB)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ fontSize: 11, color: "var(--text-primary)" }}
          />
          <label style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            O pegar URL de imagen
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {/* DESIGN: URL input styled with design tokens */}
            <input
              value={imgUrlInput}
              onChange={e => setImgUrlInput(e.target.value)}
              placeholder="https://..."
              style={{
                flex: 1,
                fontSize: 12,
                height: 40,
                background: "rgba(9,13,20,0.95)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                padding: "0 10px",
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveImgUrl}
              style={{ boxShadow: "0 0 8px rgba(0,229,255,0.2)" }}
            >
              OK
            </Button>
          </div>
          {p.imagen && (
            <Button variant="danger" size="sm" onClick={handleRemoveImg}>
              Quitar imagen
            </Button>
          )}
        </div>
      )}
    </SectionCard>
  );
});

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------
export function CatalogoTab({ products, onUpdate }) {
  const [cat, setCat] = useState("Todos");
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [search, setSearch] = useState("");
  const [editingImg, setEditingImg] = useState(null);
  const [imgUrlInput, setImgUrlInput] = useState("");
  // UX: global busy flag prevents double-submits on async operations
  const [busy, setBusy] = useState(false);

  // PERF + BUG fix (line 17): memoised; undefined/null categories filtered out
  const cats = useMemo(
    () => ["Todos", ...new Set(products.map(p => p.cat).filter(Boolean))],
    [products]
  );

  // PERF + BUG fix (line 20): memoised; null-safe toLowerCase guards
  const filtered = useMemo(
    () => products.filter(p =>
      (cat === "Todos" || p.cat === cat) &&
      (!search ||
        (p.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase())
      )
    ),
    [products, cat, search]
  );

  // BUG fix (lines 26 + 29): cache target once → avoids double find + race condition
  // UX: busy flag blocks re-entry
  const updateStock = useCallback(async () => {
    const n = parseInt(newStock, 10);
    if (isNaN(n) || n < 0) return;
    const target = products.find(p => p.sku === editing);
    if (!target) return;
    const prev = target.stock ?? 0;
    setBusy(true);
    try {
      const updated = products.map(p => p.sku === editing ? { ...p, stock: n } : p);
      await save(K.products, updated);
      await postToSheets("stock_update", {
        sku: editing,
        nombre: target.nombre || "",
        stockAnterior: prev,
        stockNuevo: n,
        fecha: new Date().toISOString(),
      });
      onUpdate(updated);
      setEditing(null);
    } finally {
      setBusy(false);
    }
  }, [newStock, editing, products, onUpdate]);

  // UX: busy guard prevents double-submit
  const toggleActive = useCallback(async (sku) => {
    const p = products.find(x => x.sku === sku);
    if (!p) return;
    setBusy(true);
    try {
      const updated = products.map(x => x.sku === sku ? { ...x, activo: !x.activo } : x);
      await save(K.products, updated);
      onUpdate(updated);
    } finally {
      setBusy(false);
    }
  }, [products, onUpdate]);

  const saveImg = useCallback(async (sku, url) => {
    const updated = products.map(p => p.sku === sku ? { ...p, imagen: url || "" } : p);
    await save(K.products, updated);
    onUpdate(updated);
    setEditingImg(null);
  }, [products, onUpdate]);

  return (
    <div
      style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}
      className="animate-fade-in"
    >
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por producto o SKU..." />

      {/* ── Category tabs ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              whiteSpace: "nowrap",
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: cat === c ? 700 : 500,
              borderRadius: "var(--radius-sm)",
              // DESIGN: glassmorphism on category pills
              border: cat === c
                ? "1px solid var(--accent-cyan)"
                : "1px solid var(--border-subtle)",
              background: cat === c
                ? "rgba(0,229,255,0.12)"
                : "rgba(14,20,32,0.75)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: cat === c ? "var(--accent-cyan)" : "var(--text-secondary)",
              // DESIGN: neon glow on selected tab
              boxShadow: cat === c ? "0 0 10px rgba(0,229,255,0.35)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: 36,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.02em",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Product list ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* UX: EmptyState when no results instead of a silent blank area */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            description={
              search
                ? `No se encontraron productos para "${search}"`
                : "No hay productos en esta categoría."
            }
          />
        ) : (
          filtered.map(p => (
            <ProductRow
              key={p.sku}
              p={p}
              editing={editing}
              setEditing={setEditing}
              newStock={newStock}
              setNewStock={setNewStock}
              editingImg={editingImg}
              setEditingImg={setEditingImg}
              imgUrlInput={imgUrlInput}
              setImgUrlInput={setImgUrlInput}
              busy={busy}
              onUpdateStock={updateStock}
              onToggleActive={toggleActive}
              onSaveImg={saveImg}
            />
          ))
        )}
      </div>
    </div>
  );
}
