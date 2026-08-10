import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CANALES, METODOS, formatCurrency, generateSaleId } from "../utils/constants.js";
import { postToSheets, getSheetsUrl } from "../utils/sheets.js";
import { generateWhatsAppReceiptLink, generateWhatsAppQuoteLink } from "../utils/whatsapp.js";
import { Button, SectionCard, SearchInput, StockBadge } from "../components/UI.jsx";
import { MercadoPagoQRModal } from "../components/MercadoPagoQRModal.jsx";
import { useHaptic } from "../hooks/useHaptic.js";
import { scanAudio } from "../utils/audio.js";
import { getProductImage } from "../utils/imageMatcher.js";

// ── Circuit Noir / Futuristic / Neon CSS injected once at module load ─────────
const VENTA_TAB_CSS = `
  .product-card-venta {
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  }
  .product-card-venta:hover {
    border-color: rgba(0,229,255,0.6) !important;
    box-shadow: 0 0 14px rgba(0,229,255,0.35);
    transform: translateY(-3px) scale(1.015);
  }
  .product-card-venta:active {
    transform: scale(0.98);
    box-shadow: 0 0 8px rgba(0,229,255,0.2);
  }
  .product-card-venta:focus-visible {
    outline: 2px solid var(--accent-cyan, #00E5FF);
    outline-offset: 2px;
  }
  .stepper-btn-venta {
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s cubic-bezier(0.34,1.56,0.64,1);
  }
  .stepper-btn-venta:hover:not([aria-disabled="true"]) {
    border-color: rgba(0,229,255,0.6) !important;
    box-shadow: 0 0 8px rgba(0,229,255,0.3);
  }
  .stepper-btn-venta:active:not([aria-disabled="true"]) {
    box-shadow: 0 0 12px var(--accent-cyan, #00E5FF);
    transform: scale(0.90);
  }
  .select-dark {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 16px;
    width: 100%;
    min-height: 44px;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .select-dark:focus {
    border-color: var(--accent-cyan, #00E5FF);
    box-shadow: 0 0 0 2px rgba(0,229,255,0.15), 0 0 8px rgba(0,229,255,0.2);
  }
  .input-dark {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 16px;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .input-dark:focus {
    border-color: var(--accent-cyan, #00E5FF);
    box-shadow: 0 0 0 2px rgba(0,229,255,0.15), 0 0 8px rgba(0,229,255,0.2);
  }
  .input-dark::placeholder {
    color: var(--text-muted, #64748B);
  }
  .success-check-glow {
    text-shadow: 0 0 24px var(--status-success, #00FF88), 0 0 48px rgba(0,255,136,0.4);
    animation: vt-check-pulse 2.5s ease-in-out infinite;
  }
  @keyframes vt-check-pulse {
    0%, 100% { text-shadow: 0 0 24px var(--status-success, #00FF88), 0 0 48px rgba(0,255,136,0.4); }
    50%       { text-shadow: 0 0 40px var(--status-success, #00FF88), 0 0 80px rgba(0,255,136,0.6); }
  }
  .exito-actions-enter {
    animation: exito-fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes exito-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .quick-disc-btn {
    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
  }
  .quick-disc-btn:hover {
    border-color: rgba(0,229,255,0.5) !important;
    color: var(--accent-cyan) !important;
  }
  .quick-disc-btn:active {
    transform: scale(0.94);
    opacity: 0.85;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("venta-tab-cn-styles")) {
  const el = document.createElement("style");
  el.id = "venta-tab-cn-styles";
  el.textContent = VENTA_TAB_CSS;
  document.head.appendChild(el);
}

// ── Shared design tokens ──────────────────────────────────────────────────────
const MONO = "'JetBrains Mono', 'Fira Mono', monospace";
const GLASS = {
  background: "var(--bg-card)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};
const GLOW_CYAN = "0 0 16px rgba(0,229,255,0.4)";

// Quick discount preset values
const DISC_PRESETS = [0, 5, 10, 15, 20];

export function VentaTab({
  products, onSaleDone, vendedor,
  cart, setCart, descPct, setDescPct,
  canal, setCanal, metodo, setMetodo,
  cli, setCli, usdRate = null
}) {
  const [q, setQ] = useState("");
  const [step, setStep] = useState("productos"); // productos | datos | confirmar | exito
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [showMpQrModal, setShowMpQrModal] = useState(false);
  // BUG FIX: stable QR order ID — generated once when the modal is opened,
  // not on every render via generateSaleId() in JSX.
  const [mpQrOrderId, setMpQrOrderId] = useState(null);
  // UX: Vaciar requires double-tap confirmation
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearConfirmTimer = useRef(null);
  const exitoTimer = useRef(null);
  // UX: animate success screen — actions revealed 1.5s after confirmar
  const [exitoActionsReady, setExitoActionsReady] = useState(false);

  useEffect(() => () => {
    if (clearConfirmTimer.current) clearTimeout(clearConfirmTimer.current);
    if (exitoTimer.current) clearTimeout(exitoTimer.current);
  }, []);

  const { hapticAdd, hapticRemove, hapticClear, hapticSuccess } = useHaptic();

  // PERF: memoized filter — one O(n) pass only when products or query changes.
  // BUG FIX: guard null/undefined sku and cat before calling toLowerCase().
  const filtered = useMemo(() => products.filter(p => {
    if (!p.activo || p.stock <= 0) return false;
    const lq = q.toLowerCase();
    if (!lq) return true;
    return (
      p.nombre.toLowerCase().includes(lq) ||
      (p.sku || "").toLowerCase().includes(lq) ||
      (p.cat || "").toLowerCase().includes(lq)
    );
  }), [products, q]);

  // PERF: resolve product images once per filtered change, not on every render.
  const filteredWithImages = useMemo(
    () => filtered.map(p => ({ ...p, _img: getProductImage(p) })),
    [filtered]
  );

  // PERF: memoized cart totals — derived values used across all render branches.
  const subtotal  = useMemo(() => cart.reduce((s, i) => s + i.precio * i.qty, 0), [cart]);
  const descMonto = useMemo(() => Math.round(subtotal * (descPct / 100)), [subtotal, descPct]);
  const total     = useMemo(() => subtotal - descMonto, [subtotal, descMonto]);
  const totalQty  = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);

  // PERF: stable callback references so product card onClick refs don't churn.
  // Stock cap: silent no-op when the item is already at max stock.
  const addP = useCallback(p => {
    const stockMax = p.stock ?? 1;
    setCart(prev => {
      const ex = prev.find(x => x.sku === p.sku);
      if (ex && ex.qty >= stockMax) return prev; // already at stock limit — silent no-op
      if (ex) return prev.map(x => x.sku === p.sku ? { ...x, qty: Math.min(stockMax, x.qty + 1) } : x);
      return [...prev, { sku: p.sku, nombre: p.nombre, precio: p.precio, cat: p.cat, qty: 1 }];
    });
    scanAudio.playSuccessBeep();
    hapticAdd();
  }, [hapticAdd, setCart]);

  const delP = useCallback(sku => {
    hapticRemove();
    setCart(prev => prev.filter(x => x.sku !== sku));
  }, [hapticRemove, setCart]);

  // Stock cap: clamp qty between 1 and the live stock ceiling.
  const updQ = useCallback((sku, d) => {
    hapticAdd();
    setCart(prev => prev.map(x => {
      if (x.sku !== sku) return x;
      const stockMax = products.find(p => p.sku === sku)?.stock ?? 1;
      return { ...x, qty: Math.max(1, Math.min(stockMax, x.qty + d)) };
    }));
  }, [hapticAdd, setCart, products]);

  const clear = () => {
    hapticClear();
    if (clearConfirmTimer.current) clearTimeout(clearConfirmTimer.current);
    if (exitoTimer.current) clearTimeout(exitoTimer.current);
    setClearConfirm(false);
    setCart([]);
    setQ("");
    setDescPct(0);
    setCli({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });
    setSyncError(null);
    setMpQrOrderId(null);
    setExitoActionsReady(false);
    setStep("productos");
  };

  // UX: first tap shows "¿Confirmar?"; second tap within 3s calls clear().
  const handleClearClick = () => {
    if (clearConfirm) {
      clearTimeout(clearConfirmTimer.current);
      setClearConfirm(false);
      clear();
    } else {
      setClearConfirm(true);
      clearConfirmTimer.current = setTimeout(() => setClearConfirm(false), 3000);
    }
  };

  // BUG FIX: generate a stable posOrderId once, stored in state, so the QR
  // modal and the venta record share the same ID.
  const openMpQrModal = () => {
    setMpQrOrderId(generateSaleId().slice(0, 8));
    setShowMpQrModal(true);
  };

  // BUG FIX: try/catch/finally so setSaving(false) always runs.
  // Sheets sync failure is non-fatal: sale is still recorded locally.
  // Accepts overrideId so the Mercado Pago QR venta.id matches posOrderId.
  // Stock guard: aborts if any cart item qty exceeds current product stock.
  const confirmar = async (overrideId = null) => {
    // Stock validation — abort before any side-effects if stock is insufficient
    const stockErrors = cart.filter(ci => {
      const p = products.find(pr => pr.sku === ci.sku);
      return p && ci.qty > p.stock;
    });
    if (stockErrors.length > 0) {
      setSyncError(
        `Stock insuficiente: ${stockErrors.map(e => e.nombre).join(", ")}. Reducí la cantidad antes de confirmar.`
      );
      return;
    }

    setSaving(true);
    setSyncError(null);
    try {
      const venta = {
        id: overrideId || generateSaleId(),
        fecha: new Date().toISOString(),
        canal, metodo, vendedor, cli,
        items: cart.map(i => ({ ...i, subtotal: i.precio * i.qty })),
        subtotal, descPct, descMonto, total, estado: "Confirmado",
      };

      const updProds = products.map(p => {
        const ci = cart.find(i => i.sku === p.sku);
        return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty) } : p;
      });

      try {
        await postToSheets("venta", venta);
      } catch (sheetsErr) {
        console.error("Sheets sync failed:", sheetsErr);
        setSyncError("No se pudo sincronizar con Google Sheets. Venta guardada localmente.");
      }

      setLastCompletedSale(venta);
      await onSaleDone(venta, updProds);
      hapticSuccess();
      setStep("exito");
      exitoTimer.current = setTimeout(() => setExitoActionsReady(true), 1500);
    } catch (err) {
      console.error("Error al confirmar venta:", err);
      setSyncError("Error al confirmar la venta. Por favor intente de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsAppQuote = () => {
    window.open(generateWhatsAppQuoteLink(cart, descPct, total, cli), "_blank");
  };

  const handleShareWhatsAppReceipt = () => {
    if (!lastCompletedSale) return;
    window.open(generateWhatsAppReceiptLink(lastCompletedSale), "_blank");
  };

  // ── EXITO ─────────────────────────────────────────────────────────────────────
  if (step === "exito" && lastCompletedSale) return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        {/* DESIGN: glowing, pulsing success checkmark via CSS animation */}
        <div className="success-check-glow" style={{ fontSize: 64, color: "var(--status-success)", lineHeight: 1, marginBottom: 16 }}>
          ✓
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--status-success)", fontFamily: "var(--font-heading)", letterSpacing: "0.5px" }}>
          ¡Venta Confirmada!
        </div>
        <div style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 15, fontWeight: 600, fontFamily: MONO }} className="tabular-nums">
          {formatCurrency(lastCompletedSale.total)} · {lastCompletedSale.canal}
        </div>
        {/* UX: sale reference ID for cashier reconciliation */}
        <div style={{
          display: "inline-block", marginTop: 8, padding: "4px 12px",
          background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)",
          borderRadius: 2, fontSize: 11, fontFamily: MONO,
          color: "var(--accent-cyan)", letterSpacing: "0.5px",
        }}>
          REF: {lastCompletedSale.id}
        </div>
        {/* UX: sync status with error path for when postToSheets fails */}
        <div style={{ marginTop: 12 }}>
          {syncError ? (
            <div style={{ fontSize: 12, color: "var(--status-warning)", fontWeight: 500 }}>⚠ {syncError}</div>
          ) : getSheetsUrl() ? (
            <div style={{ fontSize: 11, color: "var(--status-success)" }}>✓ Sincronizado con Google Sheets</div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ℹ Google Sheets no configurado</div>
          )}
        </div>
      </div>

      {/* UX: action buttons reveal after a 1.5s success animation window */}
      {exitoActionsReady ? (
        <div className="exito-actions-enter">
          <SectionCard title="Acciones de comprobante" style={{ ...GLASS }}>
            <Button variant="primary" fullWidth size="lg" onClick={handleShareWhatsAppReceipt}
              style={{ marginBottom: 8, boxShadow: GLOW_CYAN }}>
              📲 Enviar Ticket por WhatsApp
            </Button>
            <Button variant="secondary" fullWidth size="md" onClick={() => { setLastCompletedSale(null); clear(); }}>
              ➕ Nueva Venta
            </Button>
          </SectionCard>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 18, letterSpacing: "0.15em", fontFamily: MONO }}>
          · · ·
        </div>
      )}
    </div>
  );

  // ── CONFIRMAR ─────────────────────────────────────────────────────────────────
  if (step === "confirmar") return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setStep("datos")}>← Volver</Button>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>Resumen de venta</span>
      </div>

      <SectionCard title="Productos en orden" style={{ ...GLASS }}>
        {cart.map(i => (
          <div key={i.sku} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: "var(--text-secondary)" }}>{i.qty}× {i.nombre}</span>
            <span style={{ fontWeight: 600, fontFamily: MONO }} className="tabular-nums">{formatCurrency(i.precio * i.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed var(--border-subtle)", margin: "8px 0" }} />
        {descPct > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--status-success)", marginBottom: 8, fontFamily: MONO }} className="tabular-nums">
            <span>Descuento {descPct}%</span>
            <span>−{formatCurrency(descMonto)}</span>
          </div>
        )}
        {/* Dual-currency total: ARS primary, USD secondary when usdRate is available */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, fontFamily: MONO }} className="tabular-nums">
          <span>TOTAL</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--accent-cyan)", textShadow: "0 0 8px rgba(0,229,255,0.5)" }}>{formatCurrency(total)}</div>
            {usdRate && usdRate > 0 && (
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginTop: 2 }}>
                ≈ USD {(total / usdRate).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Detalles del pedido" style={{ ...GLASS }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
          {[
            ["Canal", canal], ["Pago", metodo],
            ["Cliente", cli.nombre || "—"], ["Contacto", cli.tel || "—"],
            ["Ciudad", cli.ciudad || "—"], ["Vendedor", vendedor],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{l}</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {syncError && (
        <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, fontSize: 12, color: "var(--status-danger)" }}>
          ⚠ {syncError}
        </div>
      )}

      {/* BUG FIX: compare against "Mercado Pago" which is the actual METODOS value.
          The previous "MercadoPago QR" never matched, making this entire branch dead. */}
      {metodo === "Mercado Pago" ? (
        <Button variant='primary' fullWidth size='lg'
          onClick={openMpQrModal}
          disabled={saving}
          style={{ boxShadow: saving ? 'none' : GLOW_CYAN }}>
          {saving ? 'Procesando...' : 'Generar QR Mercado Pago 📱'}
        </Button>
      ) : (
        <Button variant="primary" fullWidth size="lg" onClick={() => confirmar()} disabled={saving}
          style={{ boxShadow: saving ? "none" : GLOW_CYAN }}>
          {saving ? "Guardando..." : "Confirmar y Descontar Stock 🚀"}
        </Button>
      )}

      <Button variant="secondary" fullWidth onClick={handleShareWhatsAppQuote}>
        📋 Enviar Presupuesto por WhatsApp
      </Button>

      {/* BUG FIX: posOrderId comes from state (set once in openMpQrModal),
          not from generateSaleId() called directly in JSX on every render. */}
      {showMpQrModal && mpQrOrderId && (
        <MercadoPagoQRModal
          posOrderId={mpQrOrderId}
          totalAmount={total}
          items={cart}
          onClose={() => setShowMpQrModal(false)}
          onPaymentSuccess={() => {
            setShowMpQrModal(false);
            confirmar(mpQrOrderId);
          }}
        />
      )}
    </div>
  );

  // ── DATOS ─────────────────────────────────────────────────────────────────────
  if (step === "datos") return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setStep("productos")}>← Volver</Button>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>Datos del cliente & Pago</span>
      </div>

      <SectionCard title="Condiciones de venta" style={{ ...GLASS }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            {/* UX: label linked via htmlFor/id */}
            <label htmlFor="vt-canal" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Canal
            </label>
            {/* DESIGN: dark-themed select; no more bright-white OS default control */}
            <select id="vt-canal" value={canal} onChange={e => setCanal(e.target.value)} className="select-dark">
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="vt-metodo" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Método de pago
            </label>
            <select id="vt-metodo" value={metodo} onChange={e => setMetodo(e.target.value)} className="select-dark">
              {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {/* UX: label linked via htmlFor; slider has aria-label for screen readers */}
          <label htmlFor="vt-descuento" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Descuento rápido (%)
          </label>
          {/* Descuento rápido: one-tap preset buttons — no need to drag the slider */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {DISC_PRESETS.map(pct => (
              <button
                key={pct}
                onClick={() => setDescPct(pct)}
                className="quick-disc-btn"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontFamily: MONO,
                  fontWeight: 700,
                  borderRadius: 2,
                  cursor: "pointer",
                  minHeight: 36,
                  border: `1px solid ${descPct === pct ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                  background: descPct === pct ? "rgba(0,229,255,0.12)" : "var(--bg-surface)",
                  color: descPct === pct ? "var(--accent-cyan)" : "var(--text-muted)",
                }}
              >
                {pct === 0 ? "Sin dto" : `${pct}%`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input
              type="range"
              id="vt-descuento"
              aria-label="Descuento global en porcentaje"
              min={0} max={50} step={5}
              value={descPct}
              onChange={e => setDescPct(+e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 700, minWidth: 48, textAlign: "right", color: "var(--accent-cyan)", fontSize: 15, fontFamily: MONO }} className="tabular-nums">
              {descPct}%
            </span>
          </div>
          {descPct > 0 && (
            <div style={{ fontSize: 12, color: "var(--status-success)", marginTop: 8, fontWeight: 500, fontFamily: MONO }} className="tabular-nums">
              Ahorro: {formatCurrency(descMonto)} · Total: {formatCurrency(total)}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Información del cliente" style={{ ...GLASS }}>
        {[
          ["nombre", "Nombre completo",                      "text"],
          ["tel",    "WhatsApp Argentina: 549XXXXXXXXXX",    "tel"],
          ["ig",     "Instagram @handle",                    "text"],
          ["ciudad", "Ciudad",                               "text"],
          ["notas",  "Notas adicionales",                    "text"],
        ].map(([k, l, t]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <label htmlFor={`vt-cli-${k}`} style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {k === "tel" ? "Tel / WhatsApp" : l}
            </label>
            {/* DESIGN: dark-themed input with focus glow */}
            <input
              type={t}
              id={`vt-cli-${k}`}
              value={cli[k]}
              onChange={e => setCli(prev => ({ ...prev, [k]: e.target.value }))}
              placeholder={l}
              className="input-dark"
            />
          </div>
        ))}
      </SectionCard>

      <Button variant="primary" fullWidth size="lg" onClick={() => setStep("confirmar")}
        style={{ boxShadow: GLOW_CYAN }}>
        Continuar al Resumen →
      </Button>
    </div>
  );

  // ── PRODUCTOS (main screen) ───────────────────────────────────────────────────
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">
      <div style={{ display: "flex", gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por producto, SKU o categoría..." />
        {cart.length > 0 && (
          // UX: show running total so cashier can confirm amount before advancing
          <Button
            variant="primary"
            size="md"
            onClick={() => setStep("datos")}
            style={{ whiteSpace: "nowrap", boxShadow: GLOW_CYAN, fontFamily: MONO, fontSize: 12 }}
          >
            Carrito ({totalQty}) · {formatCurrency(total)}
          </Button>
        )}
      </div>

      {/* UX: empty cart CTA — visible prompt when no items yet and products are available */}
      {cart.length === 0 && filtered.length > 0 && (
        <div style={{
          textAlign: "center",
          padding: "12px 16px",
          background: "rgba(0,229,255,0.03)",
          border: "1px dashed rgba(0,229,255,0.18)",
          borderRadius: 4,
          fontSize: 13,
          color: "var(--text-muted)",
          letterSpacing: "0.01em",
        }}>
          Tocá un producto para agregarlo al carrito
        </div>
      )}

      {cart.length > 0 && (
        <SectionCard style={{
          ...GLASS,
          borderColor: "rgba(0,229,255,0.3)",
          boxShadow: "0 0 24px rgba(0,229,255,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Items en el carrito ({cart.length})
            </span>
            {/* UX: Vaciar uses Button component (not ad-hoc raw button) and requires
                double-tap — first tap shows "¿Confirmar?" with 3-second timeout. */}
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearClick}
              style={{
                fontSize: 12,
                minHeight: 44,
                padding: "8px 12px",
                boxShadow: clearConfirm ? "0 0 12px rgba(239,68,68,0.5)" : "none",
                transition: "box-shadow 0.2s ease",
              }}
            >
              {clearConfirm ? "¿Confirmar?" : "Vaciar"}
            </Button>
          </div>

          {cart.map(i => {
            const isMin = i.qty === 1;
            const stockMax = products.find(p => p.sku === i.sku)?.stock ?? Infinity;
            const isMax = isFinite(stockMax) && i.qty >= stockMax;
            return (
              <div key={i.sku} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
                <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {i.nombre}
                </span>
                {/* UX: − is visually disabled at qty=1 with tooltip explaining why */}
                <button
                  onClick={() => updQ(i.sku, -1)}
                  aria-disabled={isMin ? "true" : "false"}
                  aria-label={isMin ? 'Reducir cantidad de ' + i.nombre + ' (mínimo alcanzado)' : 'Reducir cantidad de ' + i.nombre}
                  title={isMin ? "Mínimo 1 — usa ✕ para eliminar el producto" : "Reducir cantidad"}
                  className="touch-target-48 tactile-btn stepper-btn-venta"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 2,
                    color: isMin ? "var(--text-muted)" : "var(--text-primary)",
                    fontWeight: 700, fontSize: 16,
                    minWidth: 32, minHeight: 44,
                    cursor: isMin ? "not-allowed" : "pointer",
                    opacity: isMin ? 0.4 : 1,
                  }}
                >−</button>
                <span style={{ fontWeight: 700, minWidth: 28, textAlign: "center", fontFamily: MONO }} className="tabular-nums">
                  {i.qty}
                </span>
                {/* UX: + is visually disabled and shows warning at stock ceiling */}
                <button
                  onClick={() => !isMax && updQ(i.sku, 1)}
                  aria-disabled={isMax ? "true" : "false"}
                  aria-label={isMax ? 'Aumentar cantidad de ' + i.nombre + ' (stock máximo alcanzado)' : 'Aumentar cantidad de ' + i.nombre}
                  title={isMax ? `Stock máximo alcanzado (${stockMax} unidades)` : "Aumentar cantidad"}
                  className="touch-target-48 tactile-btn stepper-btn-venta"
                  style={{
                    background: "var(--bg-surface)",
                    border: `1px solid ${isMax ? "rgba(251,191,36,0.5)" : "var(--border-subtle)"}`,
                    borderRadius: 2,
                    color: isMax ? "var(--status-warning)" : "var(--text-primary)",
                    fontWeight: 700, fontSize: 16,
                    minWidth: 32, minHeight: 44,
                    cursor: isMax ? "not-allowed" : "pointer",
                    opacity: isMax ? 0.5 : 1,
                  }}
                >+</button>
                {/* Visual MAX badge when at stock ceiling */}
                {isMax && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, fontFamily: MONO,
                    color: "var(--status-warning)",
                    background: "rgba(251,191,36,0.12)",
                    border: "1px solid rgba(251,191,36,0.3)",
                    borderRadius: 2, padding: "1px 4px",
                    letterSpacing: "0.04em",
                  }}>
                    MAX
                  </span>
                )}
                <span style={{ minWidth: 72, textAlign: "right", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: MONO }} className="tabular-nums">
                  {formatCurrency(i.precio * i.qty)}
                </span>
                <button
                  onClick={() => delP(i.sku)}
                  aria-label={'Quitar ' + i.nombre + ' del carrito'}
                  title="Quitar producto"
                  className="touch-target-48"
                  style={{ color: "var(--status-danger)", background: "none", border: "none", fontSize: 18, cursor: "pointer", minWidth: 32, minHeight: 44 }}
                >✕</button>
              </div>
            );
          })}

          <div style={{ borderTop: "1px dashed var(--border-subtle)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, fontFamily: MONO }} className="tabular-nums">
            <span>Subtotal</span>
            <span style={{ color: "var(--accent-cyan)", textShadow: "0 0 8px rgba(0,229,255,0.4)" }}>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <label htmlFor="vt-disc-pct-inline" style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Descuento %
            </label>
            <input
              type="number"
              id="vt-disc-pct-inline"
              min={0}
              max={100}
              value={descPct}
              onChange={e => setDescPct(Math.min(100, Math.max(0, +e.target.value || 0)))}
              className="input-dark"
              style={{ width: 80, padding: "6px 8px", fontSize: 14, textAlign: "right", minHeight: 36 }}
            />
          </div>
          {descPct > 0 && (
            <>
              <div style={{ fontSize: 13, color: "var(--color-accent-green, var(--status-success, #00FF88))", marginTop: 6, fontWeight: 600, fontFamily: MONO }} className="tabular-nums">
                Ahorro: {formatCurrency(descMonto)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, fontFamily: MONO, marginTop: 6 }} className="tabular-nums">
                <span>TOTAL</span>
                <span style={{ color: "var(--accent-cyan)", textShadow: "0 0 8px rgba(0,229,255,0.4)" }}>{formatCurrency(total)}</span>
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* UX: differentiated empty states — no products vs no search results */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 16px", fontSize: 14 }}>
          {q ? (
            <>
              <div style={{ marginBottom: 16 }}>
                Sin resultados para{" "}
                <em style={{ color: "var(--text-secondary)", fontStyle: "normal" }}>"{q}"</em>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setQ("")}>
                Limpiar búsqueda
              </Button>
            </>
          ) : (
            <div>No hay productos disponibles</div>
          )}
        </div>
      )}

      {/* DESIGN: glassmorphism cards, hover/active glow via CSS class,
          sharp 2px radius (futuristic spec), monospace SKU/price data.
          PERF: images pre-resolved in filteredWithImages (not per-render).
          A11Y: role=button + tabIndex + onKeyDown — fully keyboard navigable. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredWithImages.map(p => (
          <div
            key={p.sku}
            role="button"
            tabIndex={0}
            onClick={() => addP(p)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addP(p); } }}
            aria-label={`Agregar ${p.nombre} al carrito — ${formatCurrency(p.precio)}`}
            className="tactile-btn product-card-venta"
            style={{
              ...GLASS,
              border: "1px solid var(--border-subtle)",
              borderRadius: 4,
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 16,
              minHeight: 64,
            }}
          >
            <img
              src={p._img}
              alt={p.nombre}
              onError={e => { e.target.onerror = null; e.target.src = "/farma/landerlan-drostanolona.jpg"; }}
              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.nombre}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: MONO, marginTop: 2 }}>
                {p.sku || "—"} · {p.cat || "—"}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-cyan)", marginBottom: 4, fontFamily: MONO }} className="tabular-nums">
                {formatCurrency(p.precio)}
              </div>
              <StockBadge stock={p.stock} min={p.stockMin} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
