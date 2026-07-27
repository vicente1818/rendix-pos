import { CANALES, fmt } from "../utils/constants.js";
import { MetricCard, SectionCard, StockBadge } from "../components/UI.jsx";

export function DashboardTab({ sales, products }) {
  const hoy = new Date().toDateString();
  const sHoy = sales.filter(s => new Date(s.fecha).toDateString() === hoy);
  const totHoy = sHoy.reduce((a, v) => a + v.total, 0);
  const totGral = sales.reduce((a, v) => a + v.total, 0);

  const porCanal = {};
  CANALES.forEach(c => { porCanal[c] = { qty: 0, total: 0 }; });
  sales.forEach(s => { if (porCanal[s.canal]) { porCanal[s.canal].qty++; porCanal[s.canal].total += s.total; } });

  const porProd = {};
  sales.forEach(s => s.items?.forEach(i => {
    if (!porProd[i.nombre]) porProd[i.nombre] = { qty: 0, total: 0 };
    porProd[i.nombre].qty += i.qty;
    porProd[i.nombre].total += i.subtotal;
  }));

  const top = Object.entries(porProd).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  const alertas = products.filter(p => p.stock <= p.stockMin);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
      <div style={{ display: "flex", gap: 10 }}>
        <MetricCard label="Ventas Hoy" val={sHoy.length} sub={fmt(totHoy)} icon="☀️" />
        <MetricCard label="Total Histórico" val={fmt(totGral)} color="var(--accent-cyan)" icon="📈" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <MetricCard label="Clientes Únicos" val={new Set(sales.map(s => s.cli?.tel || s.cli?.ig || s.id)).size} icon="👥" />
        <MetricCard
          label="Alertas Stock"
          val={alertas.length}
          color={alertas.length > 0 ? "var(--status-warning)" : "var(--status-success)"}
          icon="⚠️"
        />
      </div>

      <SectionCard title="Ventas por Canal de Distribución">
        {CANALES.map(c => {
          const d = porCanal[c];
          const pct = totGral > 0 ? Math.round((d.total / totGral) * 100) : 0;
          return (
            <div key={c} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{c}</span>
                <span style={{ color: "var(--text-secondary)" }}>{fmt(d.total)} · {d.qty} vtas ({pct}%)</span>
              </div>
              <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-full)", height: 6, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(90deg, #00E5FF 0%, #3B82F6 100%)", height: "100%", width: `${pct}%`, transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        })}
      </SectionCard>

      {top.length > 0 && (
        <SectionCard title="Top 5 Productos más Vendidos">
          {top.map(([nombre, d], i) => (
            <div key={nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px dashed var(--border-subtle)" }}>
              <span style={{ color: "var(--accent-cyan)", fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{nombre}</span>
              <span style={{ fontWeight: 600, marginLeft: 8 }}>{d.qty} u · {fmt(d.total)}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {alertas.length > 0 && (
        <SectionCard title="Alertas de Stock Reposición urgente">
          {alertas.map(p => (
            <div key={p.sku} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px dashed var(--border-subtle)" }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{p.nombre}</span>
              <StockBadge stock={p.stock} min={p.stockMin} />
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}
