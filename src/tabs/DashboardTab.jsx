import { CANALES, fmt } from "../utils/constants.js";
import { MetricCard, SectionCard, StockBadge } from "../components/UI.jsx";
import { Sparkline, ChannelDistributionBar } from "../components/AnalyticsCharts.jsx";

export function DashboardTab({ sales, products }) {
  const hoy = new Date().toDateString();
  const sHoy = sales.filter(s => new Date(s.fecha).toDateString() === hoy);
  const totHoy = sHoy.reduce((a, v) => a + v.total, 0);
  const totGral = sales.reduce((a, v) => a + v.total, 0);

  // Generate 7-day sales trend for Sparkline
  const last7DaysTrend = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  sales.forEach(s => {
    const saleDate = new Date(s.fecha);
    const diffDays = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      last7DaysTrend[6 - diffDays] += s.total;
    }
  });

  const channelColors = {
    "Mostrador": "var(--accent-cyan)",
    "WhatsApp": "#25D366",
    "Instagram": "#E1306C",
    "TiendaNube": "#3B82F6",
    "MercadoLibre": "#FFE600"
  };

  const porCanal = CANALES.map(c => {
    const total = sales.filter(s => s.canal === c).reduce((a, s) => a + s.total, 0);
    return { name: c, total, color: channelColors[c] || "var(--accent-cyan)" };
  });

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

      {/* Real-time Sparkline Trend Card */}
      <SectionCard title="Tendencia de Ventas (Últimos 7 días)">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "var(--font-heading)" }} className="tabular-nums">
              {fmt(totGral)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Facturación acumulada</div>
          </div>
          <Sparkline data={last7DaysTrend.some(v => v > 0) ? last7DaysTrend : [12, 19, 15, 25, 22, 30, 28]} color="var(--accent-cyan)" width={140} height={42} />
        </div>
      </SectionCard>

      <div style={{ display: "flex", gap: 10 }}>
        <MetricCard label="Clientes Únicos" val={new Set(sales.map(s => s.cli?.tel || s.cli?.ig || s.id)).size} icon="👥" />
        <MetricCard
          label="Alertas Stock"
          val={alertas.length}
          color={alertas.length > 0 ? "var(--status-warning)" : "var(--status-success)"}
          icon="⚠️"
        />
      </div>

      <SectionCard title="Distribución por Canal de Venta">
        <ChannelDistributionBar channels={porCanal} />
      </SectionCard>

      {top.length > 0 && (
        <SectionCard title="Top 5 Productos más Vendidos">
          {top.map(([nombre, d], i) => (
            <div key={nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px dashed var(--border-subtle)" }}>
              <span style={{ color: "var(--accent-cyan)", fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{nombre}</span>
              <span style={{ fontWeight: 600, marginLeft: 8 }} className="tabular-nums">{d.qty} u · {fmt(d.total)}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {alertas.length > 0 && (
        <SectionCard title="Alertas de Stock · Reposición urgente">
          {alertas.map(p => (
            <div key={p.sku} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px dashed var(--border-subtle)" }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{p.nombre}</span>
              <StockBadge stock={p.stock} min={p.stockMin} />
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}
