import { useMercadoPagoQR } from "../hooks/useMercadoPagoQR.js";
import { Button, SectionCard } from "./UI.jsx";
import { fmt } from "../utils/constants.js";

export function MercadoPagoQRModal({ posOrderId, totalAmount, items, onClose, onPaymentSuccess }) {
  const {
    status,
    qrData,
    errorMsg,
    timeLeftSec,
    initiateQR,
    cancelPayment,
    simulateSuccess
  } = useMercadoPagoQR({
    posOrderId,
    totalAmount,
    items,
    onSuccess: onPaymentSuccess
  });

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = String(timeLeftSec % 60).padStart(2, '0');

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
      padding: 16
    }} className="animate-fade-in">
      <SectionCard style={{ maxWidth: 400, width: "100%", textAlign: "center", background: "var(--bg-surface-elevated)" }}>
        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--text-primary)", marginBottom: 4 }}>
          Mercado Pago QR Dinámico
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          Orden #{posOrderId} · Total: <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{fmt(totalAmount)}</span>
        </div>

        {status === 'IDLE' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="primary" fullWidth size="lg" onClick={initiateQR}>
              Generar Código QR en Pantalla 📱
            </Button>
            <Button variant="ghost" fullWidth size="md" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        )}

        {status === 'CREATING' && (
          <div style={{ padding: "2rem 1rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
            Conectando con Mercado Pago...
          </div>
        )}

        {status === 'AWAITING_PAYMENT' && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              background: "#FFFFFF",
              padding: 16,
              borderRadius: "var(--radius-md)",
              display: "inline-block",
              border: "1px solid var(--border-medium)"
            }}>
              {/* SVG QR Code representation */}
              <svg width="180" height="180" viewBox="0 0 100 100" style={{ display: "block" }}>
                <path d="M0,0 h30 v30 h-30 z M40,0 h20 v20 h-20 z M70,0 h30 v30 h-30 z M0,40 h20 v20 h-20 z M30,40 h40 v20 h-40 z M80,40 h20 v20 h-20 z M0,70 h30 v30 h-30 z M40,70 h30 v30 h-30 z M80,70 h20 v20 h-20 z" fill="#090D14"/>
              </svg>
            </div>

            <div style={{
              background: "var(--accent-cyan-glow)",
              color: "var(--accent-cyan)",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}>
              <span>● Esperando escaneo</span>
              <span>({minutes}:{seconds})</span>
            </div>

            <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 8 }}>
              <Button variant="primary" fullWidth size="sm" onClick={simulateSuccess}>
                Simular Pago Aprobado ✓
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { cancelPayment(); onClose(); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {status === 'PAID' && (
          <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: 52, color: "var(--status-success)", marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--status-success)" }}>¡Pago Aprobado!</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Cerrando venta...</div>
          </div>
        )}

        {status === 'ERROR' && (
          <div style={{ padding: "1rem" }}>
            <div style={{ color: "var(--status-danger)", fontSize: 13, marginBottom: 12 }}>{errorMsg}</div>
            <Button variant="secondary" fullWidth onClick={initiateQR}>Reintentar</Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
