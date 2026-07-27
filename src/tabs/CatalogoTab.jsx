import { useState } from "react";
import { save } from "../utils/storage.js";
import { postToSheets } from "../utils/sheets.js";
import { fileToDataURL } from "../utils/tiendanube.js";
import { K, fmt } from "../utils/constants.js";
import { Button, SectionCard, SearchInput, StockBadge, Badge } from "../components/UI.jsx";

export function CatalogoTab({ products, onUpdate }) {
  const [cat, setCat] = useState("Todos");
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [search, setSearch] = useState("");
  const [editingImg, setEditingImg] = useState(null);
  const [imgUrlInput, setImgUrlInput] = useState("");

  const cats = ["Todos", ...new Set(products.map(p => p.cat))];
  const filtered = products.filter(p =>
    (cat === "Todos" || p.cat === cat) &&
    (!search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const updateStock = async () => {
    const n = parseInt(newStock);
    if (isNaN(n) || n < 0) return;
    const prev = products.find(p => p.sku === editing)?.stock || 0;
    const updated = products.map(p => p.sku === editing ? { ...p, stock: n } : p);
    await save(K.products, updated);
    await postToSheets("stock_update", { sku: editing, nombre: products.find(p => p.sku === editing)?.nombre || "", stockAnterior: prev, stockNuevo: n, fecha: new Date().toISOString() });
    onUpdate(updated);
    setEditing(null);
  };

  const toggleActive = async (sku) => {
    const p = products.find(x => x.sku === sku);
    if (!p) return;
    const updated = products.map(x => x.sku === sku ? { ...x, activo: !x.activo } : x);
    await save(K.products, updated);
    onUpdate(updated);
  };

  const saveImg = async (sku, url) => {
    const updated = products.map(p => p.sku === sku ? { ...p, imagen: url || "" } : p);
    await save(K.products, updated);
    onUpdate(updated);
    setEditingImg(null);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por producto o SKU..." />

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              whiteSpace: "nowrap",
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: "var(--radius-sm)",
              border: cat === c ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
              background: cat === c ? "var(--accent-cyan-glow)" : "var(--bg-card)",
              color: cat === c ? "var(--accent-cyan)" : "var(--text-secondary)",
              fontWeight: cat === c ? 700 : 500
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(p => (
          <SectionCard key={p.sku} style={{ opacity: p.activo === false ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                <div
                  onClick={() => { setEditingImg(editingImg === p.sku ? null : p.sku); setImgUrlInput(p.imagen || ""); }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-sm)",
                    flexShrink: 0,
                    cursor: "pointer",
                    overflow: "hidden",
                    background: "var(--bg-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed var(--border-medium)"
                  }}
                >
                  {p.imagen ? <img src={p.imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18 }}>📷</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sku} · {p.marca} · {p.pres}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {p.activo === false && <Badge color="danger">Inactivo</Badge>}
                <StockBadge stock={p.stock} min={p.stockMin} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: 15 }}>{fmt(p.precio)}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {editing === p.sku ? (
                  <>
                    <input
                      type="number"
                      value={newStock}
                      onChange={e => setNewStock(e.target.value)}
                      placeholder="Cant."
                      style={{ width: 70, fontSize: 12, height: 32 }}
                    />
                    <Button variant="primary" size="sm" onClick={updateStock}>OK</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>✕</Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => { setEditing(p.sku); setNewStock(p.stock); }}>
                    Editar Stock
                  </Button>
                )}
                <Button
                  variant={p.activo === false ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => toggleActive(p.sku)}
                  style={{ color: p.activo === false ? "var(--status-success)" : "var(--status-danger)" }}
                >
                  {p.activo === false ? "Activar" : "Desactivar"}
                </Button>
              </div>
            </div>

            {editingImg === p.sku && (
              <div style={{ background: "var(--bg-surface)", padding: 10, borderRadius: "var(--radius-sm)", marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Subir foto de producto (máx 1.5 MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try { const url = await fileToDataURL(file); await saveImg(p.sku, url); } catch (err) { alert(err.message); }
                  }}
                  style={{ fontSize: 11 }}
                />
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>O pegar URL de imagen</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={imgUrlInput} onChange={e => setImgUrlInput(e.target.value)} placeholder="https://..." style={{ flex: 1, fontSize: 11 }} />
                  <Button variant="secondary" size="sm" onClick={() => saveImg(p.sku, imgUrlInput)}>OK</Button>
                </div>
                {p.imagen && (
                  <Button variant="danger" size="sm" onClick={() => saveImg(p.sku, "")}>
                    Quitar imagen
                  </Button>
                )}
              </div>
            )}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
