import { useState } from "react";
import { fmt, fmtD } from "../utils/constants.js";
import { calculateCustomerTier } from "../utils/inventoryEngine.js";
import { SectionCard, SearchInput } from "../components/UI.jsx";

export function ClientesTab({ sales }) {
  const [q, setQ] = useState("");
  const [exp, setExp] = useState(null);

  const clMap = {};
  sales.forEach(s => {
    const key = s.cli?.tel || s.cli?.ig || s.cli?.nombre || "anon-" + s.id;
    if (!clMap[key]) clMap[key] = { key, nombre: s.cli?.nombre || "Cliente sin nombre", tel: s.cli?.tel || "", ig: s.cli?.ig || "", ciudad: s.cli?.ciudad || "", ventas: [], total: 0 };
    clMap[key].ventas.push(s);
    clMap[key].total += s.total;
  });

  const clientes = Object.values(clMap)
    .map(c => ({ ...c, tier: calculateCustomerTier(c.total) }))
    .sort((a, b) => b.total - a.total);
  const filtered = q ? clientes.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()) || c.tel.includes(q) || c.ig.includes(q)) : clientes;

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, WhatsApp o Instagram..." />

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem 1rem", fontSize: 14 }}>
          {q ? "Sin resultados para tu búsqueda" : "Aún no hay clientes registrados"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((c) => (
          <SectionCard key={c.key} onClick={() => setExp(exp === c.key ? null : c.key)} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-full)",
                  background: "var(--accent-cyan-glow)",
                  border: "1px solid var(--accent-cyan-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--accent-cyan)",
                  flexShrink: 0
                }}>
                  {(c.nombre || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{c.nombre}</div>
                    {c.tier.discountPct > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.tier.color, border: `1px solid ${c.tier.color}`, borderRadius: "var(--radius-full)", padding: "1px 6px" }}>
                        {c.tier.name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {c.tel || c.ig || "Sin contacto"} {c.ciudad ? `· ${c.ciudad}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--accent-cyan)" }}>{fmt(c.total)}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.ventas.length} compra{c.ventas.length !== 1 ? "s" : ""}</div>
              </div>
            </div>

            {exp === c.key && (
              <div style={{ marginTop: 10, borderTop: "1px dashed var(--border-subtle)", paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                  Historial de compras
                </div>
                {c.ventas.map(v => (
                  <div key={v.id} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{fmtD(v.fecha)} · {v.canal}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(v.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
