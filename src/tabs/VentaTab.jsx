import { useState } from "react";
import { CANALES, METODOS, fmt, genId } from "../utils/constants.js";
import { postToSheets, getSheetsUrl } from "../utils/sheets.js";
import { generateWhatsAppReceiptLink, generateWhatsAppQuoteLink } from "../utils/whatsapp.js";
import { Button, SectionCard, SearchInput, StockBadge } from "../components/UI.jsx";
import { MercadoPagoQRModal } from "../components/MercadoPagoQRModal.jsx";
import { useHaptic } from "../hooks/useHaptic.js";
import { scanAudio } from "../utils/audio.js";
import { getProductImage } from "../utils/imageMatcher.js";

export function VentaTab({
  products, onSaleDone, vendedor,
  cart, setCart, descPct, setDescPct,
  canal, setCanal, metodo, setMetodo,
  cli, setCli
}) {
  const [q, setQ] = useState("");
  const [step, setStep] = useState("productos"); // productos | datos | confirmar | exito
  const [saving, setSaving] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [showMpQrModal, setShowMpQrModal] = useState(false);

  const { hapticAdd, hapticRemove, hapticClear, hapticSuccess } = useHaptic();

  const filtered = products.filter(p => p.activo && p.stock > 0 &&
    (p.nombre.toLowerCase().includes(q.toLowerCase()) ||
     p.sku.toLowerCase().includes(q.toLowerCase()) ||
     p.cat.toLowerCase().includes(q.toLowerCase()))
  );

  const addP = p => {
    scanAudio.playSuccessBeep();
    hapticAdd();
    setCart(prev => {
      const ex = prev.find(x => x.sku === p.sku);
      if (ex) return prev.map(x => x.sku === p.sku ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { sku: p.sku, nombre: p.nombre, precio: p.precio, cat: p.cat, qty: 1 }];
    });
  };

  const delP = sku => {
    hapticRemove();
    setCart(prev => prev.filter(x => x.sku !== sku));
  };

  const updQ = (sku, d) => {
    hapticAdd();
    setCart(prev => prev.map(x => x.sku === sku ? { ...x, qty: Math.max(1, x.qty + d) } : x));
  };

  const clear = () => {
    hapticClear();
    setCart([]);
    setQ("");
    setDescPct(0);
    setCli({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });
    setStep("productos");
  };

  const subtotal = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const descMonto = Math.round(subtotal * (descPct / 100));
  const total = subtotal - descMonto;

  const confirmar = async () => {
    setSaving(true);
    const venta = {
      id: genId(), fecha: new Date().toISOString(),
      canal, metodo, vendedor, cli,
      items: cart.map(i => ({ ...i, subtotal: i.precio * i.qty })),
      subtotal, descPct, descMonto, total, estado: "Confirmado"
    };

    const updProds = products.map(p => {
      const ci = cart.find(i => i.sku === p.sku);
      return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty) } : p;
    });

    await postToSheets("venta", venta);
    setLastCompletedSale(venta);
    await onSaleDone(venta, updProds);
    hapticSuccess();
    setSaving(false);
    setStep("exito");
  };

  const handleShareWhatsAppQuote = () => {
    const link = generateWhatsAppQuoteLink(cart, descPct, total, cli);
    window.open(link, "_blank");
  };

  const handleShareWhatsAppReceipt = () => {
    if (!lastCompletedSale) return;
    const link = generateWhatsAppReceiptLink(lastCompletedSale);
    window.open(link, "_blank");
  };

  if (step === "exito" && lastCompletedSale) return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: 64, marginBottom: 12, color: "var(--status-success)" }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--status-success)", fontFamily: "var(--font-heading)" }}>
          ¡Venta Confirmada!
        </div>
        <div style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 15, fontWeight: 600 }} className="tabular-nums">
          {fmt(lastCompletedSale.total)} · {lastCompletedSale.canal}
        </div>
        {getSheetsUrl() && <div style={{ fontSize: 11, color: "var(--status-success)", marginTop: 8 }}>✓ Sincronizado con Google Sheets</div>}
      </div>

      <SectionCard title="Acciones de comprobante">
        <Button variant="primary" fullWidth size="lg" onClick={handleShareWhatsAppReceipt} style={{ marginBottom: 8 }}>
          📲 Enviar Ticket por WhatsApp
        </Button>
        <Button variant="secondary" fullWidth size="md" onClick={() => { setStep("productos"); setLastCompletedSale(null); clear(); }}>
          ➕ Nueva Venta
        </Button>
      </SectionCard>
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
            <span style={{ fontWeight: 600 }} className="tabular-nums">{fmt(i.precio * i.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed var(--border-subtle)", margin: "10px 0" }} />
        {descPct > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--status-success)", marginBottom: 6 }} className="tabular-nums">
            <span>Descuento {descPct}%</span>
            <span>-{fmt(descMonto)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }} className="tabular-nums">
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

      {metodo === "MercadoPago QR" ? (
        <Button variant="primary" fullWidth size="lg" onClick={() => setShowMpQrModal(true)}>
          Generar QR Mercado Pago 📱
        </Button>
      ) : (
        <Button variant="primary" fullWidth size="lg" onClick={confirmar} disabled={saving}>
          {saving ? "Guardando..." : "Confirmar y Descontar Stock 🚀"}
        </Button>
      )}

      <Button variant="secondary" fullWidth onClick={handleShareWhatsAppQuote}>
        📋 Enviar Presupuesto por WhatsApp
      </Button>

      {showMpQrModal && (
        <MercadoPagoQRModal
          posOrderId={genId().slice(0, 8)}
          totalAmount={total}
          items={cart}
          onClose={() => setShowMpQrModal(false)}
          onPaymentSuccess={() => {
            setShowMpQrModal(false);
            confirmar();
          }}
        />
      )}
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
            <span style={{ fontWeight: 700, minWidth: 44, textAlign: "right", color: "var(--accent-cyan)", fontSize: 15 }} className="tabular-nums">{descPct}%</span>
          </div>
          {descPct > 0 && (
            <div style={{ fontSize: 12, color: "var(--status-success)", marginTop: 6, fontWeight: 500 }} className="tabular-nums">
              Ahorro cliente: {fmt(descMonto)} → Total con descuento: {fmt(total)}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Información del cliente">
        {[["nombre", "Nombre completo", "text"], ["tel", "Tel / WhatsApp (con código área)", "tel"], ["ig", "Instagram @handle", "text"], ["ciudad", "Ciudad", "text"], ["notas", "Notas adicionales", "text"]].map(([k, l, t]) => (
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
          <Button variant="primary" size="md" onClick={() => setStep("datos")} className="touch-target-48">
            Carrito ({cart.reduce((n, i) => n + i.qty, 0)})
          </Button>
        )}
      </div>

      {cart.length > 0 && (
        <SectionCard style={{ borderColor: "rgba(0, 229, 255, 0.3)", background: "var(--bg-surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase" }}>
              Items en el carrito ({cart.length})
            </span>
            <button onClick={clear} style={{ background: "none", border: "none", color: "var(--status-danger)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 12px" }} className="touch-target-48">
              Vaciar
            </button>
          </div>
          {cart.map(i => (
            <div key={i.sku} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
              <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.nombre}</span>
              <button onClick={() => updQ(i.sku, -1)} style={{ background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }} className="touch-target-48 tactile-btn">−</button>
              <span style={{ fontWeight: 700, minWidth: 28, textAlign: "center" }} className="tabular-nums">{i.qty}</span>
              <button onClick={() => updQ(i.sku, 1)} style={{ background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }} className="touch-target-48 tactile-btn">+</button>
              <span style={{ minWidth: 70, textAlign: "right", fontWeight: 700, color: "var(--accent-cyan)" }} className="tabular-nums">{fmt(i.precio * i.qty)}</span>
              <button onClick={() => delP(i.sku)} style={{ color: "var(--status-danger)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }} className="touch-target-48">✕</button>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed var(--border-subtle)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }} className="tabular-nums">
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
            className="tactile-btn"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              minHeight: 58
            }}
          >
            <img
              src={getProductImage(p)}
              alt={p.nombre}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/farma/landerlan-drostanolona.jpg";
              }}
              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.nombre}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sku} · {p.cat}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-cyan)", marginBottom: 2 }} className="tabular-nums">{fmt(p.precio)}</div>
              <StockBadge stock={p.stock} min={p.stockMin} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
