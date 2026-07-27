import { useState } from "react";
import { CANALES, fmt, fmtD } from "../utils/constants.js";
import { SectionCard, MetricCard, Badge } from "../components/UI.jsx";

export function VentasTab({ sales }) {
  const [canal, setCanal] = useState("Todos");
  const [exp, setExp] = useState(null);
  const filtered = canal === "Todos" ? sales : sales.filter(s => s.canal === canal);
  const tot = filtered.reduce((s, v) => s + v.total, 0);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {["Todos", ...CANALES].map(c => (
          <button
            key={c}
            onClick={() => setCanal(c)}
            style={{
              whiteSpace: "nowrap",
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: "var(--radius-sm)",
              border: canal === c ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
              background: canal === c ? "var(--accent-cyan-glow)" : "var(--bg-card)",
              color: canal === c ? "var(--accent-cyan)" : "var(--text-secondary)",
              fontWeight: canal === c ? 700 : 500
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <MetricCard label="Ventas Realizadas" val={filtered.length} icon="📄" />
        <MetricCard label="Total Recaudado" val={fmt(tot)} color="var(--accent-cyan)" icon="💰" />
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem 1rem", fontSize: 14 }}>
          Sin ventas registradas en este canal
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(v => (
          <SectionCard
            key={v.id}
            onClick={() => setExp(exp === v.id ? null : v.id)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{v.id}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtD(v.fecha)} · Vendedor: {v.vendedor}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: 15 }}>{fmt(v.total)}</div>
                <Badge color="info">{v.canal}</Badge>
              </div>
            </div>

            {exp === v.id && (
              <div style={{ borderTop: "1px dashed var(--border-subtle)", marginTop: 10, paddingTop: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 500 }}>
                  👤 {v.cli?.nombre || "Sin nombre"} · 📱 {v.cli?.tel || "Sin tel"} {v.cli?.ig ? `· @${v.cli.ig}` : ""}{v.cli?.ciudad ? ` · ${v.cli.ciudad}` : ""}
                </div>

                {v.items?.map(i => (
                  <div key={i.sku} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{i.qty}× {i.nombre}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(i.subtotal)}</span>
                  </div>
                ))}

                {v.descPct > 0 && (
                  <div style={{ color: "var(--status-success)", fontSize: 12, marginTop: 4 }}>Descuento {v.descPct}%: -{fmt(v.descMonto)}</div>
                )}
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Método de pago: {v.metodo}</div>
                {v.cli?.notas && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>Notas: {v.cli.notas}</div>}
              </div>
            )}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
