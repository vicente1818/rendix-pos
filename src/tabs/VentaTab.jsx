import { useState } from "react";
import { CANALES, METODOS, K, fmt, genId } from "../utils/constants.js";
import { save, load } from "../utils/storage.js";
import { postToSheets, getSheetsUrl } from "../utils/sheets.js";
import { Button, SectionCard, SearchInput, StockBadge } from "../components/UI.jsx";

export function VentaTab({ products, onSaleDone, vendedor }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState("productos"); // productos | datos | confirmar
  const [descPct, setDescPct] = useState(0);
  const [canal, setCanal] = useState("Instagram");
  const [metodo, setMetodo] = useState("Transferencia");
  const [cli, setCli] = useState({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [presup, setPresup] = useState(false);

  const filtered = products.filter(p => p.activo && p.stock > 0 &&
    (p.nombre.toLowerCase().includes(q.toLowerCase()) ||
     p.sku.toLowerCase().includes(q.toLowerCase()) ||
     p.cat.toLowerCase().includes(q.toLowerCase()))
  );

  const addP = p => setCart(prev => {
    const ex = prev.find(x => x.sku === p.sku);
    if (ex) return prev.map(x => x.sku === p.sku ? { ...x, qty: x.qty + 1 } : x);
    return [...prev, { sku: p.sku, nombre: p.nombre, precio: p.precio, cat: p.cat, qty: 1 }];
  });

  const delP = sku => setCart(prev => prev.filter(x => x.sku !== sku));
  const updQ = (sku, d) => setCart(prev => prev.map(x => x.sku === sku ? { ...x, qty: Math.max(1, x.qty + d) } : x));
  const clear = () => { setCart([]); setQ(""); setDescPct(0); setCli({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" }); setStep("productos"); };

  const subtotal = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const descMonto = Math.round(subtotal * (descPct / 100));
  const total = subtotal - descMonto;

  const confirmar = async () => {
    setSaving(true);
    const existingSales = await load(K.sales) || [];
    const existingProds = await load(K.products) || products;
    const venta = {
      id: genId(), fecha: new Date().toISOString(),
      canal, metodo, vendedor, cli,
      items: cart.map(i => ({ ...i, subtotal: i.precio * i.qty })),
      subtotal, descPct, descMonto, total, estado: "Confirmado"
    };
    const updProds = existingProds.map(p => {
      const ci = cart.find(i => i.sku === p.sku);
      return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty) } : p;
    });
    await save(K.sales, [venta, ...existingSales]);
    await save(K.products, updProds);
    await postToSheets("venta", venta);
    onSaleDone(venta, updProds);
    setSaving(false);
    setDone(true);
    setTimeout(() => { clear(); setDone(false); }, 2500);
  };

  const presupText = () => {
    const lines = ["*Presupuesto RENDIX*", ""];
    cart.forEach(i => lines.push(`• ${i.nombre} ×${i.qty} — ${fmt(i.precio * i.qty)}`));
    lines.push("");
    if (descPct > 0) lines.push(`Descuento ${descPct}%: -${fmt(descMonto)}`);
    lines.push(`*Total: ${fmt(total)}*`, "", "Escribinos por privado para confirmar 💪");
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
    setPresup(true);
    setTimeout(() => setPresup(false), 2000);
  };

  if (done) return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }} className="animate-fade-in">
      <div style={{ fontSize: 64, marginBottom: 16, color: "var(--status-success)" }}>✓</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--status-success)", fontFamily: "var(--font-heading)" }}>
        Venta confirmada
      </div>
      <div style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 14 }}>{fmt(total)} · {canal}</div>
      {getSheetsUrl() && <div style={{ fontSize: 11, color: "var(--status-success)", marginTop: 8 }}>Sincronizado con Google Sheets</div>}
    </div>
  );

  if (step === "confirmar") return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setStep("datos")}>← Volver</Button>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>Resumen de venta</span>
      </div>

      <SectionCard title="Productos en orden">
        {cart.map(i => (
          <div key={i.sku} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "var(--text-secondary)" }}>{i.qty}× {i.nombre}</span>
            <span style={{ fontWeight: 600 }}>{fmt(i.precio * i.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed var(--border-subtle)", margin: "10px 0" }} />
        {descPct > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--status-success)", marginBottom: 6 }}>
            <span>Descuento {descPct}%</span>
            <span>-{fmt(descMonto)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>
          <span>TOTAL</span>
          <span style={{ color: "var(--accent-cyan)" }}>{fmt(total)}</span>
        </div>
      </SectionCard>

      <SectionCard title="Detalles del pedido">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
          {[["Canal", canal], ["Pago", metodo], ["Cliente", cli.nombre || "—"], ["Contacto", cli.tel || "—"], ["Ciudad", cli.ciudad || "—"], ["Vendedor", vendedor]].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Button variant="primary" fullWidth size="lg" onClick={confirmar} disabled={saving}>
        {saving ? "Guardando..." : "Confirmar y Descontar Stock 🚀"}
      </Button>
      <Button variant="ghost" fullWidth onClick={presupText}>
        {presup ? "¡Texto Copiado!" : "📋 Copiar Presupuesto para WhatsApp"}
      </Button>
    </div>
  );

  if (step === "datos") return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setStep("productos")}>← Volver</Button>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>Datos del cliente & Pago</span>
      </div>

      <SectionCard title="Condiciones de venta">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Canal</label>
            <select value={canal} onChange={e => setCanal(e.target.value)}>
              {CANALES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Método de pago</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)}>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Descuento global (%)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="range" min={0} max={50} value={descPct} onChange={e => setDescPct(+e.target.value)} step={5} style={{ flex: 1 }} />
            <span style={{ fontWeight: 700, minWidth: 44, textAlign: "right", color: "var(--accent-cyan)", fontSize: 15 }}>{descPct}%</span>
          </div>
          {descPct > 0 && (
            <div style={{ fontSize: 12, color: "var(--status-success)", marginTop: 6, fontWeight: 500 }}>
              Ahorro cliente: {fmt(descMonto)} → Total con descuento: {fmt(total)}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Información del cliente">
        {[["nombre", "Nombre completado *", "text"], ["tel", "Tel / WhatsApp *", "tel"], ["ig", "Instagram @handle", "text"], ["ciudad", "Ciudad", "text"], ["notas", "Notas adicionales", "text"]].map(([k, l, t]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
            <input type={t} value={cli[k]} onChange={e => setCli(p => ({ ...p, [k]: e.target.value }))} placeholder={l} />
          </div>
        ))}
      </SectionCard>

      <Button variant="primary" fullWidth size="lg" onClick={() => setStep("confirmar")}>
        Continuar al Resumen →
      </Button>
    </div>
  );

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <div style={{ display: "flex", gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por producto, SKU o categoría..." />
        {cart.length > 0 && (
          <Button variant="primary" size="md" onClick={() => setStep("datos")}>
            Carrito ({cart.reduce((n, i) => n + i.qty, 0)})
          </Button>
        )}
      </div>

      {cart.length > 0 && (
        <SectionCard style={{ borderColor: "rgba(0, 229, 255, 0.3)", background: "var(--bg-surface)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8, textTransform: "uppercase" }}>
            Items en el carrito ({cart.length})
          </div>
          {cart.map(i => (
            <div key={i.sku} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
              <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.nombre}</span>
              <Button variant="secondary" size="sm" onClick={() => updQ(i.sku, -1)}>−</Button>
              <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>{i.qty}</span>
              <Button variant="secondary" size="sm" onClick={() => updQ(i.sku, 1)}>+</Button>
              <span style={{ minWidth: 70, textAlign: "right", fontWeight: 700, color: "var(--accent-cyan)" }}>{fmt(i.precio * i.qty)}</span>
              <button onClick={() => delP(i.sku)} style={{ color: "var(--status-danger)", background: "none", border: "none", fontSize: 16, cursor:"pointer" }}>✕</button>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed var(--border-subtle)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
            <span>Subtotal</span>
            <span style={{ color: "var(--accent-cyan)" }}>{fmt(subtotal)}</span>
          </div>
        </SectionCard>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem 1rem", fontSize: 14 }}>
          No se encontraron productos disponibles
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(p => (
          <div
            key={p.sku}
            onClick={() => addP(p)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all 0.2s ease"
            }}
          >
            {p.imagen ? (
              <img src={p.imagen} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: "var(--bg-surface-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                📦
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.nombre}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sku} · {p.cat}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-cyan)", marginBottom: 2 }}>{fmt(p.precio)}</div>
              <StockBadge stock={p.stock} min={p.stockMin} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
