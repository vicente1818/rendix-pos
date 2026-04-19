import { useState, useEffect, useCallback } from "react";

// ── Storage (localStorage — funciona en Vercel y cualquier browser) ─────────
const K = {
  products: "rendix:v2:products",
  sales:    "rendix:v2:sales",
  config:   "rendix:v2:config",
};
async function load(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}
async function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch { return false; }
}

// ── Google Sheets hub ────────────────────────────────────────────────────────
let _sheetsUrl = "";

async function postToSheets(type, payload) {
  if (!_sheetsUrl) return;
  try {
    await fetch(_sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
  } catch (e) { console.warn("Sheets POST:", e); }
}

async function fetchCatalogFromSheets() {
  if (!_sheetsUrl) return null;
  try {
    const url = _sheetsUrl + "?action=catalog";
    const r = await fetch(url, { method: "GET", mode: "cors" });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.status === "ok" && data.products?.length > 0) return data.products;
    return null;
  } catch (e) { console.warn("Sheets GET:", e); return null; }
}

// ── CSV export ────────────────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  const csv = "\ufeff" + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

function exportVentas(sales) {
  const header = ["ID","Fecha","Canal","Vendedor","Cliente","Tel","Instagram","Ciudad","Método","Productos","Subtotal","Desc%","Total","Estado"];
  const rows = sales.map(v => [
    v.id, v.fecha, v.canal, v.vendedor,
    v.cli?.nombre||"", v.cli?.tel||"", v.cli?.ig||"", v.cli?.ciudad||"",
    v.metodo,
    (v.items||[]).map(i=>`${i.qty}x ${i.nombre}`).join(" | "),
    v.subtotal, v.descPct+"%", v.total, v.estado,
  ]);
  downloadCSV([header, ...rows], `rendix-ventas-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportProductos(products) {
  const header = ["SKU","Nombre","Categoría","Marca","Presentación","Precio","Stock","StockMínimo"];
  const rows = products.map(p => [p.sku, p.nombre, p.cat, p.marca, p.pres, p.precio, p.stock, p.stockMin]);
  downloadCSV([header, ...rows], `rendix-productos-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportClientes(sales) {
  const map = {};
  sales.forEach(s => {
    const k = s.cli?.tel || s.cli?.ig || s.id;
    if (!map[k]) map[k] = { nombre: s.cli?.nombre||"", tel: s.cli?.tel||"", ig: s.cli?.ig||"", ciudad: s.cli?.ciudad||"", compras: 0, total: 0, primera: s.fecha };
    map[k].compras++; map[k].total += s.total; map[k].ultima = s.fecha;
  });
  const header = ["Nombre","Tel/WhatsApp","Instagram","Ciudad","Nro Compras","Total Gastado","Primera Compra","Última Compra"];
  const rows = Object.values(map).map(c => [c.nombre, c.tel, c.ig, c.ciudad, c.compras, c.total, c.primera, c.ultima]);
  downloadCSV([header, ...rows], `rendix-clientes-${new Date().toISOString().slice(0,10)}.csv`);
}

// ── CSV import (catálogo desde Excel) ─────────────────────────────────────────
function parseCSVLine(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function importCatalogFromCSV(text, existingProducts) {
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
  if (lines.length < 2) return { ok: false, msg: "El archivo está vacío o no tiene datos." };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-záéíóúñ0-9]/gi,''));
  const findCol = (...keys) => { for (const k of keys) { const i = headers.findIndex(h=>h.includes(k)); if(i>=0) return i; } return -1; };

  const iSku   = findCol('sku','codigo','cod');
  const iNom   = findCol('nombre','producto','name');
  const iPre   = findCol('precio','price','venta','pvp');
  const iCat   = findCol('categ','categoria');
  const iMar   = findCol('marca','brand');
  const iPres  = findCol('presentac','pres','format');
  const iStk   = findCol('stock','cantidad','cant','qty');
  const iMin   = findCol('minimo','min','stockmin','stockm');

  if (iSku < 0 || iNom < 0 || iPre < 0) {
    return { ok: false, msg: `No encontré las columnas necesarias.\nEl CSV debe tener al menos: SKU, Nombre/Producto y Precio.\nColumnas detectadas: ${headers.join(', ')}` };
  }

  const imported = []; const updated = []; const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const sku = cols[iSku]?.trim().toUpperCase();
    if (!sku) continue;
    const nombre = cols[iNom]?.trim() || "";
    const precio = parseFloat((cols[iPre]||"0").replace(/[$,.\s]/g, c => c==='.'?'.':c===','?'.':'')) || 0;
    const stock  = iStk >= 0 ? (parseInt(cols[iStk]) || 0) : null;
    const stockMin = iMin >= 0 ? (parseInt(cols[iMin]) || 3) : 3;
    const cat    = iCat  >= 0 ? cols[iCat]?.trim()  || "Suplementos" : "Suplementos";
    const marca  = iMar  >= 0 ? cols[iMar]?.trim()  || ""            : "";
    const pres   = iPres >= 0 ? cols[iPres]?.trim()  || ""           : "";

    if (!nombre || precio <= 0) { errors.push(`Fila ${i+1}: SKU ${sku} sin nombre o precio`); continue; }

    const exists = existingProducts.find(p => p.sku === sku);
    if (exists) {
      updated.push({ ...exists, nombre, precio, cat, marca, pres,
        stock: stock !== null ? stock : exists.stock,
        stockMin, activo: true });
    } else {
      imported.push({ sku, nombre, cat, marca, pres, precio,
        stock: stock !== null ? stock : 0, stockMin, activo: true });
    }
  }

  const kept = existingProducts.filter(p => !updated.find(u => u.sku === p.sku));
  const final = [...imported, ...updated, ...kept];
  return { ok: true, products: final, imported: imported.length, updated: updated.length, errors };
}

// ── Constantes y demo ────────────────────────────────────────────────────────
const CANALES = ["Instagram","WhatsApp","MercadoLibre","Tienda Nube","Local / Mostrador"];
const METODOS = ["Transferencia","Mercado Pago","Efectivo","Tarjeta débito","Tarjeta crédito"];
const CATS = ["Esteroides / AAS","Péptidos","Fármacos PCT/AI","Suplementos","Vitaminas","Accesorios","Combos"];

const DEMO = [
  {sku:"EST-001",nombre:"Testosterona Enantato 250",cat:"Esteroides / AAS",marca:"Cooper Pharma",pres:"Vial 10ml",precio:95000,stock:20,stockMin:5,activo:true},
  {sku:"EST-002",nombre:"Testosterona Cipionato 200",cat:"Esteroides / AAS",marca:"Cooper Pharma",pres:"Vial 10ml",precio:95000,stock:15,stockMin:3,activo:true},
  {sku:"EST-003",nombre:"Trembolona Acetato 100",cat:"Esteroides / AAS",marca:"Alfa Pharma",pres:"Vial 10ml",precio:115000,stock:10,stockMin:3,activo:true},
  {sku:"PEP-001",nombre:"BPC-157 5mg",cat:"Péptidos",marca:"BioQ Pharma",pres:"Vial 5ml",precio:120000,stock:15,stockMin:3,activo:true},
  {sku:"PEP-002",nombre:"TB-500 5mg",cat:"Péptidos",marca:"BioQ Pharma",pres:"Vial 5ml",precio:130000,stock:10,stockMin:2,activo:true},
  {sku:"PEP-003",nombre:"MK-677 25mg",cat:"Péptidos",marca:"Genérico",pres:"Cáps. 90u",precio:135000,stock:12,stockMin:3,activo:true},
  {sku:"FAR-001",nombre:"Anastrozol 1mg",cat:"Fármacos PCT/AI",marca:"Alfa Pharma",pres:"Comp. 100u",precio:28000,stock:20,stockMin:5,activo:true},
  {sku:"FAR-002",nombre:"Tamoxifeno 20mg",cat:"Fármacos PCT/AI",marca:"Genérico",pres:"Comp. 50u",precio:22000,stock:20,stockMin:5,activo:true},
  {sku:"FAR-003",nombre:"HCG 5000 UI",cat:"Fármacos PCT/AI",marca:"Cooper Pharma",pres:"Kit",precio:45000,stock:10,stockMin:2,activo:true},
  {sku:"SUP-001",nombre:"Whey 1kg Chocolate",cat:"Suplementos",marca:"ENA Sport",pres:"Polvo 1kg",precio:45000,stock:30,stockMin:8,activo:true},
  {sku:"SUP-002",nombre:"Whey 1kg Vainilla",cat:"Suplementos",marca:"ENA Sport",pres:"Polvo 1kg",precio:45000,stock:25,stockMin:8,activo:true},
  {sku:"SUP-003",nombre:"Creatina + Electrolitos 300g",cat:"Suplementos",marca:"ENA Sport",pres:"Polvo 300g",precio:18000,stock:40,stockMin:10,activo:true},
  {sku:"SUP-004",nombre:"C4 Original Sandía",cat:"Suplementos",marca:"Cellucor",pres:"Polvo 250g",precio:52000,stock:20,stockMin:5,activo:true},
  {sku:"VIT-001",nombre:"Omega-3 90 caps",cat:"Vitaminas",marca:"Landerfit",pres:"Cáps. 90u",precio:16000,stock:35,stockMin:8,activo:true},
  {sku:"VIT-002",nombre:"Vitamina D3 5000 UI",cat:"Vitaminas",marca:"Now Foods",pres:"Cáps. 90u",precio:14000,stock:30,stockMin:8,activo:true},
  {sku:"ACC-001",nombre:"Jeringa 1ml 25G",cat:"Accesorios",marca:"Genérico",pres:"Unidad",precio:1200,stock:200,stockMin:30,activo:true},
  {sku:"CMB-001",nombre:"Kit PCT Completo",cat:"Combos",marca:"Genérico",pres:"Kit",precio:68000,stock:8,stockMin:2,activo:true},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => "$\u200b" + Math.round(n).toLocaleString("es-AR");
const fmtD = d => new Date(d).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const genId = () => "VTA-" + Date.now().toString(36).toUpperCase();

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  card:    { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"12px 14px" },
  surface: { background:"var(--color-background-secondary)", borderRadius:10, padding:"10px 12px" },
  input:   { width:"100%", fontSize:13, boxSizing:"border-box", marginTop:4 },
  label:   { fontSize:11, color:"var(--color-text-secondary)", display:"block", marginBottom:2 },
  btnCyan: { background:"#00BFFF", border:"none", borderRadius:10, color:"#0A0A0A", fontWeight:500, fontSize:14, padding:"13px", cursor:"pointer", width:"100%" },
  btnGhost:{ background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, fontSize:12, padding:"7px 12px", cursor:"pointer", color:"var(--color-text-primary)" },
  btnExport:{ background:"transparent", border:"0.5px solid var(--color-border-info)", borderRadius:8, fontSize:12, padding:"10px 12px", cursor:"pointer", color:"var(--color-text-info)", width:"100%" },
  divider: { borderTop:"0.5px solid var(--color-border-tertiary)", margin:"10px 0" },
};

// ── Micro-components ─────────────────────────────────────────────────────────
function Badge({children,color="default"}) {
  const m = { default:{bg:"var(--color-background-secondary)",t:"var(--color-text-secondary)"},
    success:{bg:"var(--color-background-success)",t:"var(--color-text-success)"},
    warning:{bg:"var(--color-background-warning)",t:"var(--color-text-warning)"},
    danger: {bg:"var(--color-background-danger)", t:"var(--color-text-danger)"},
    info:   {bg:"var(--color-background-info)",   t:"var(--color-text-info)"} };
  const c = m[color]||m.default;
  return <span style={{background:c.bg,color:c.t,fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap"}}>{children}</span>;
}
function StockBadge({stock,min}) {
  if(stock<=0) return <Badge color="danger">Sin stock</Badge>;
  if(stock<=min) return <Badge color="warning">Bajo ({stock})</Badge>;
  return <Badge color="success">OK · {stock}</Badge>;
}
function Metric({label,val,sub,color}) {
  return (
    <div style={{...s.surface,flex:1}}>
      <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}}>{label}</div>
      <div style={{fontSize:18,fontWeight:500,color:color||"var(--color-text-primary)",lineHeight:1}}>{val}</div>
      {sub&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:3}}>{sub}</div>}
    </div>
  );
}
function Sec({children,title,color}) {
  return (
    <div style={{...s.card,padding:"10px 14px"}}>
      {title&&<div style={{fontWeight:500,fontSize:12,marginBottom:10,color:color||"var(--color-text-primary)"}}>{title}</div>}
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB VENTA
// ════════════════════════════════════════════════════════════════════════════
function VentaTab({products,onSaleDone,vendedor}) {
  const [q,setQ]=useState("");
  const [cart,setCart]=useState([]);
  const [step,setStep]=useState("productos");
  const [descPct,setDescPct]=useState(0);
  const [canal,setCanal]=useState("Instagram");
  const [metodo,setMetodo]=useState("Transferencia");
  const [cli,setCli]=useState({nombre:"",tel:"",ig:"",ciudad:"",notas:""});
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const [presup,setPresup]=useState(false);

  const filtered = products.filter(p=>p.activo&&p.stock>0&&
    (p.nombre.toLowerCase().includes(q.toLowerCase())||p.sku.toLowerCase().includes(q.toLowerCase())||p.cat.toLowerCase().includes(q.toLowerCase())));

  const addP = p => setCart(prev=>{
    const ex=prev.find(x=>x.sku===p.sku);
    if(ex) return prev.map(x=>x.sku===p.sku?{...x,qty:x.qty+1}:x);
    return [...prev,{sku:p.sku,nombre:p.nombre,precio:p.precio,cat:p.cat,qty:1}];
  });
  const delP = sku => setCart(prev=>prev.filter(x=>x.sku!==sku));
  const updQ = (sku,d) => setCart(prev=>prev.map(x=>x.sku===sku?{...x,qty:Math.max(1,x.qty+d)}:x));
  const clear = () => { setCart([]); setQ(""); setDescPct(0); setCli({nombre:"",tel:"",ig:"",ciudad:"",notas:""}); setStep("productos"); };

  const subtotal = cart.reduce((s,i)=>s+i.precio*i.qty,0);
  const descMonto = Math.round(subtotal*(descPct/100));
  const total = subtotal - descMonto;

  const confirmar = async () => {
    setSaving(true);
    const existingSales = await load(K.sales)||[];
    const existingProds = await load(K.products)||products;
    const venta = {
      id:genId(), fecha:new Date().toISOString(),
      canal, metodo, vendedor, cli,
      items:cart.map(i=>({...i,subtotal:i.precio*i.qty})),
      subtotal, descPct, descMonto, total, estado:"Confirmado"
    };
    const updProds = existingProds.map(p=>{
      const ci=cart.find(i=>i.sku===p.sku);
      return ci?{...p,stock:Math.max(0,p.stock-ci.qty)}:p;
    });
    await save(K.sales,[venta,...existingSales]);
    await save(K.products,updProds);
    await postToSheets("venta", venta);
    onSaleDone(venta,updProds);
    setSaving(false); setDone(true);
    setTimeout(()=>{ clear(); setDone(false); },2500);
  };

  const presupText = () => {
    const lines=["*Presupuesto RENDIX*",""];
    cart.forEach(i=>lines.push(`• ${i.nombre} ×${i.qty} — ${fmt(i.precio*i.qty)}`));
    lines.push("");
    if(descPct>0) lines.push(`Descuento ${descPct}%: -${fmt(descMonto)}`);
    lines.push(`*Total: ${fmt(total)}*`,"","Escribinos por privado para confirmar 💪");
    navigator.clipboard?.writeText(lines.join("\n")).catch(()=>{});
    setPresup(true); setTimeout(()=>setPresup(false),2000);
  };

  if(done) return (
    <div style={{textAlign:"center",padding:"4rem 2rem"}}>
      <div style={{fontSize:52,marginBottom:16,color:"var(--color-text-success)"}}>✓</div>
      <div style={{fontSize:18,fontWeight:500,color:"var(--color-text-success)"}}>Venta confirmada</div>
      <div style={{color:"var(--color-text-secondary)",marginTop:6}}>{fmt(total)} · {canal}</div>
      {_sheetsUrl&&<div style={{fontSize:11,color:"var(--color-text-success)",marginTop:8}}>Sincronizado con Google Sheets</div>}
    </div>
  );

  if(step==="confirmar") return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setStep("datos")} style={{...s.btnGhost,padding:"6px 10px",fontSize:16}}>←</button>
        <span style={{fontWeight:500}}>Confirmar venta</span>
      </div>
      <Sec title="Productos">
        {cart.map(i=>(
          <div key={i.sku} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
            <span style={{color:"var(--color-text-secondary)"}}>{i.qty}× {i.nombre}</span>
            <span style={{fontWeight:500}}>{fmt(i.precio*i.qty)}</span>
          </div>
        ))}
        <div style={s.divider}/>
        {descPct>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--color-text-success)",marginBottom:6}}>
          <span>Descuento {descPct}%</span><span>-{fmt(descMonto)}</span>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:500,fontSize:15}}>
          <span>TOTAL</span><span style={{color:"#00BFFF"}}>{fmt(total)}</span>
        </div>
      </Sec>
      <Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
          {[["Canal",canal],["Pago",metodo],["Cliente",cli.nombre||"—"],["Contacto",cli.tel||"—"],["Ciudad",cli.ciudad||"—"],["Vendedor",vendedor]].map(([l,v])=>(
            <div key={l}><div style={s.label}>{l}</div><div style={{fontWeight:500,fontSize:13}}>{v}</div></div>
          ))}
        </div>
      </Sec>
      <button onClick={confirmar} disabled={saving} style={{...s.btnCyan,opacity:saving?0.7:1}}>
        {saving?"Guardando...":"Confirmar y descontar stock"}
      </button>
      <button onClick={presupText} style={{...s.btnGhost,width:"100%",padding:"11px"}}>
        {presup?"¡Texto copiado!":"Generar presupuesto (copiar texto)"}
      </button>
    </div>
  );

  if(step==="datos") return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setStep("productos")} style={{...s.btnGhost,padding:"6px 10px",fontSize:16}}>←</button>
        <span style={{fontWeight:500}}>Condiciones y cliente</span>
      </div>
      <Sec title="Condiciones de venta">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={s.label}>Canal</label>
            <select value={canal} onChange={e=>setCanal(e.target.value)} style={s.input}>
              {CANALES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Método de pago</label>
            <select value={metodo} onChange={e=>setMetodo(e.target.value)} style={s.input}>
              {METODOS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <label style={s.label}>Descuento global (%)</label>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="range" min={0} max={50} value={descPct} onChange={e=>setDescPct(+e.target.value)} step={5} style={{flex:1}}/>
            <span style={{fontWeight:500,minWidth:40,textAlign:"right",color:"#00BFFF"}}>{descPct}%</span>
          </div>
          {descPct>0&&<div style={{fontSize:12,color:"var(--color-text-success)",marginTop:4}}>
            Ahorro cliente: {fmt(descMonto)} → Total: {fmt(total)}
          </div>}
        </div>
      </Sec>
      <Sec title="Datos del cliente (* = recomendado)">
        {[["nombre","Nombre *","text"],["tel","Tel / WhatsApp *","tel"],["ig","Instagram @handle","text"],["ciudad","Ciudad *","text"],["notas","Notas","text"]].map(([k,l,t])=>(
          <div key={k} style={{marginBottom:9}}>
            <label style={s.label}>{l}</label>
            <input type={t} value={cli[k]} onChange={e=>setCli(p=>({...p,[k]:e.target.value}))} placeholder={l} style={s.input}/>
          </div>
        ))}
        <div style={{...s.surface,marginTop:4,fontSize:11,color:"var(--color-text-secondary)"}}>
          Mínimo recomendado: nombre + WhatsApp. El resto es opcional.
        </div>
      </Sec>
      <button onClick={()=>setStep("confirmar")} style={s.btnCyan}>Revisar y confirmar →</button>
    </div>
  );

  return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:8}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto, SKU o categoría…" style={{...s.input,marginTop:0,flex:1}}/>
        {cart.length>0&&(
          <button onClick={()=>setStep("datos")} style={{...s.btnGhost,background:"#00BFFF",border:"none",color:"#0A0A0A",fontWeight:500,whiteSpace:"nowrap"}}>
            Cart ({cart.reduce((n,i)=>n+i.qty,0)})
          </button>
        )}
      </div>
      {cart.length>0&&(
        <div style={s.surface}>
          {cart.map(i=>(
            <div key={i.sku} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,fontSize:12}}>
              <span style={{flex:1}}>{i.nombre}</span>
              <button onClick={()=>updQ(i.sku,-1)} style={{...s.btnGhost,padding:"2px 8px"}}>−</button>
              <span style={{fontWeight:500,minWidth:20,textAlign:"center"}}>{i.qty}</span>
              <button onClick={()=>updQ(i.sku,+1)} style={{...s.btnGhost,padding:"2px 8px"}}>+</button>
              <span style={{minWidth:60,textAlign:"right",fontWeight:500}}>{fmt(i.precio*i.qty)}</span>
              <button onClick={()=>delP(i.sku)} style={{color:"var(--color-text-danger)",background:"none",border:"none",fontSize:14,cursor:"pointer",padding:"0 2px"}}>✕</button>
            </div>
          ))}
          <div style={s.divider}/>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:500,fontSize:13}}>
            <span>Subtotal</span><span style={{color:"#00BFFF"}}>{fmt(subtotal)}</span>
          </div>
        </div>
      )}
      {filtered.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"2rem",fontSize:13}}>Sin resultados</div>}
      {filtered.map(p=>(
        <div key={p.sku} onClick={()=>addP(p)} style={{...s.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:500,fontSize:13,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</div>
            <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{p.sku} · {p.cat}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:500,fontSize:13,color:"#00BFFF",marginBottom:3}}>{fmt(p.precio)}</div>
            <StockBadge stock={p.stock} min={p.stockMin}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB CATÁLOGO
// ════════════════════════════════════════════════════════════════════════════
function CatalogoTab({products,onUpdate}) {
  const [cat,setCat]=useState("Todos");
  const [editing,setEditing]=useState(null);
  const [newStock,setNewStock]=useState("");
  const [search,setSearch]=useState("");

  const cats=["Todos",...new Set(products.map(p=>p.cat))];
  const filtered=products.filter(p=>
    (cat==="Todos"||p.cat===cat)&&
    (!search||p.nombre.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const updateStock = async () => {
    const n=parseInt(newStock);
    if(isNaN(n)||n<0) return;
    const prev=products.find(p=>p.sku===editing)?.stock||0;
    const updated=products.map(p=>p.sku===editing?{...p,stock:n}:p);
    await save(K.products,updated);
    await postToSheets("stock_update",{sku:editing,nombre:products.find(p=>p.sku===editing)?.nombre||"",stockAnterior:prev,stockNuevo:n,fecha:new Date().toISOString()});
    onUpdate(updated);
    setEditing(null);
  };

  return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:10}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar…" style={{...s.input,marginTop:0}}/>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{whiteSpace:"nowrap",padding:"6px 11px",fontSize:11,borderRadius:8,cursor:"pointer",border:cat===c?"none":"0.5px solid var(--color-border-secondary)",background:cat===c?"#00BFFF":"transparent",color:cat===c?"#0A0A0A":"var(--color-text-primary)",fontWeight:cat===c?500:400}}>{c}</button>
        ))}
      </div>
      {filtered.map(p=>(
        <div key={p.sku} style={s.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,fontSize:13,marginBottom:2}}>{p.nombre}</div>
              <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{p.sku} · {p.marca} · {p.pres}</div>
            </div>
            <StockBadge stock={p.stock} min={p.stockMin}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:500,color:"#00BFFF",fontSize:13}}>{fmt(p.precio)}</span>
            {editing===p.sku?(
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="number" value={newStock} onChange={e=>setNewStock(e.target.value)} placeholder="Cant." style={{width:65,fontSize:12}}/>
                <button onClick={updateStock} style={{...s.btnGhost,background:"#00BFFF",border:"none",color:"#0A0A0A",fontWeight:500}}>OK</button>
                <button onClick={()=>setEditing(null)} style={s.btnGhost}>✕</button>
              </div>
            ):(
              <button onClick={()=>{setEditing(p.sku);setNewStock(p.stock);}} style={s.btnGhost}>Actualizar stock</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB VENTAS
// ════════════════════════════════════════════════════════════════════════════
function VentasTab({sales}) {
  const [canal,setCanal]=useState("Todos");
  const [exp,setExp]=useState(null);
  const filtered=canal==="Todos"?sales:sales.filter(s=>s.canal===canal);
  const tot=filtered.reduce((s,v)=>s+v.total,0);
  return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {["Todos",...CANALES].map(c=>(
          <button key={c} onClick={()=>setCanal(c)} style={{whiteSpace:"nowrap",padding:"6px 10px",fontSize:11,borderRadius:8,cursor:"pointer",border:canal===c?"none":"0.5px solid var(--color-border-secondary)",background:canal===c?"#00BFFF":"transparent",color:canal===c?"#0A0A0A":"var(--color-text-primary)",fontWeight:canal===c?500:400}}>{c}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <Metric label="Ventas" val={filtered.length}/>
        <Metric label="Total recaudado" val={fmt(tot)} color="#00BFFF"/>
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"2rem",fontSize:13}}>Sin ventas en este canal</div>}
      {filtered.map(v=>(
        <div key={v.id} onClick={()=>setExp(exp===v.id?null:v.id)} style={{...s.card,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:500,fontSize:13}}>{v.id}</div>
              <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{fmtD(v.fecha)} · {v.vendedor}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:500,color:"#00BFFF",fontSize:13}}>{fmt(v.total)}</div>
              <Badge color="info">{v.canal}</Badge>
            </div>
          </div>
          {exp===v.id&&(
            <div style={{...s.divider,marginTop:10}}>
              <div style={{marginTop:10}}>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>
                  {v.cli?.nombre||"Sin nombre"} · {v.cli?.tel||""} {v.cli?.ig||""}{v.cli?.ciudad?` · ${v.cli.ciudad}`:""}
                </div>
                {v.items?.map(i=>(
                  <div key={i.sku} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                    <span>{i.qty}× {i.nombre}</span><span style={{fontWeight:500}}>{fmt(i.subtotal)}</span>
                  </div>
                ))}
                {v.descPct>0&&<div style={{color:"var(--color-text-success)",fontSize:12,marginTop:4}}>Descuento {v.descPct}%: -{fmt(v.descMonto)}</div>}
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:6}}>Pago: {v.metodo}</div>
                {v.cli?.notas&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:3,fontStyle:"italic"}}>{v.cli.notas}</div>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB CLIENTES
// ════════════════════════════════════════════════════════════════════════════
function ClientesTab({sales}) {
  const [q,setQ]=useState("");
  const [exp,setExp]=useState(null);
  const clMap={};
  sales.forEach(s=>{
    const key=s.cli?.tel||s.cli?.ig||s.cli?.nombre||"anon-"+s.id;
    if(!clMap[key]) clMap[key]={nombre:s.cli?.nombre||"—",tel:s.cli?.tel||"",ig:s.cli?.ig||"",ciudad:s.cli?.ciudad||"",ventas:[],total:0};
    clMap[key].ventas.push(s); clMap[key].total+=s.total;
  });
  const clientes=Object.values(clMap).sort((a,b)=>b.total-a.total);
  const filtered=q?clientes.filter(c=>c.nombre.toLowerCase().includes(q.toLowerCase())||c.tel.includes(q)||c.ig.includes(q)):clientes;
  return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:10}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar nombre, tel o @handle…" style={{...s.input,marginTop:0}}/>
      {filtered.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"2rem",fontSize:13}}>{q?"Sin resultados":"Aún no hay clientes"}</div>}
      {filtered.map((c,i)=>(
        <div key={i} onClick={()=>setExp(exp===i?null:i)} style={{...s.card,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"var(--color-background-info)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"var(--color-text-info)",flexShrink:0}}>
                {(c.nombre||"?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:500,fontSize:13}}>{c.nombre}</div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{c.tel||c.ig||"Sin contacto"}{c.ciudad?` · ${c.ciudad}`:""}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:500,fontSize:13,color:"#00BFFF"}}>{fmt(c.total)}</div>
              <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{c.ventas.length} compra{c.ventas.length!==1?"s":""}</div>
            </div>
          </div>
          {exp===i&&(
            <div style={{marginTop:10,borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10}}>
              {c.ventas.map(v=>(
                <div key={v.id} style={{fontSize:12,display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:"var(--color-text-secondary)"}}>{fmtD(v.fecha)} · {v.canal}</span>
                  <span style={{fontWeight:500}}>{fmt(v.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function DashboardTab({sales,products}) {
  const hoy=new Date().toDateString();
  const sHoy=sales.filter(s=>new Date(s.fecha).toDateString()===hoy);
  const totHoy=sHoy.reduce((a,v)=>a+v.total,0);
  const totGral=sales.reduce((a,v)=>a+v.total,0);
  const porCanal={};
  CANALES.forEach(c=>{porCanal[c]={qty:0,total:0};});
  sales.forEach(s=>{if(porCanal[s.canal]){porCanal[s.canal].qty++;porCanal[s.canal].total+=s.total;}});
  const porProd={};
  sales.forEach(s=>s.items?.forEach(i=>{if(!porProd[i.nombre])porProd[i.nombre]={qty:0,total:0};porProd[i.nombre].qty+=i.qty;porProd[i.nombre].total+=i.subtotal;}));
  const top=Object.entries(porProd).sort((a,b)=>b[1].qty-a[1].qty).slice(0,5);
  const alertas=products.filter(p=>p.stock<=p.stockMin);
  return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8}}>
        <Metric label="Ventas hoy" val={sHoy.length} sub={fmt(totHoy)}/>
        <Metric label="Total histórico" val={fmt(totGral)} color="#00BFFF"/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Metric label="Clientes únicos" val={new Set(sales.map(s=>s.cli?.tel||s.cli?.ig||s.id)).size}/>
        <Metric label="Alertas stock" val={alertas.length} color={alertas.length>0?"var(--color-text-warning)":"var(--color-text-success)"}/>
      </div>
      <Sec title="Ventas por canal">
        {CANALES.map(c=>{const d=porCanal[c];const pct=totGral>0?Math.round(d.total/totGral*100):0;return(
          <div key={c} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span>{c}</span><span style={{fontWeight:500}}>{fmt(d.total)} · {d.qty} vtas · {pct}%</span>
            </div>
            <div style={{background:"var(--color-background-secondary)",borderRadius:4,height:5}}>
              <div style={{background:"#00BFFF",height:"100%",width:`${pct}%`,borderRadius:4}}/>
            </div>
          </div>
        );})}
      </Sec>
      {top.length>0&&(
        <Sec title="Top productos (unidades)">
          {top.map(([nombre,d],i)=>(
            <div key={nombre} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{color:"var(--color-text-secondary)",fontWeight:500,marginRight:8}}>#{i+1}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nombre}</span>
              <span style={{fontWeight:500,marginLeft:8}}>{d.qty}u · {fmt(d.total)}</span>
            </div>
          ))}
        </Sec>
      )}
      {alertas.length>0&&(
        <Sec title="Alertas de stock bajo">
          {alertas.map(p=>(
            <div key={p.sku} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{flex:1}}>{p.nombre}</span><StockBadge stock={p.stock} min={p.stockMin}/>
            </div>
          ))}
        </Sec>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB CONFIG — con Sheets sync + CSV export
// ════════════════════════════════════════════════════════════════════════════
function ConfigTab({products,sales,onUpdateProducts,config,onUpdateConfig}) {
  const [view,setView]=useState("main"); // main | add
  const [form,setForm]=useState({sku:"",nombre:"",cat:CATS[3],marca:"",pres:"",precio:"",stock:"",stockMin:"3"});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState(null);
  const [sheetsInput,setSheetsInput]=useState(config.sheetsUrl||"");
  const [vendedorInput,setVendedorInput]=useState(config.vendedor||"Principal");
  const [testing,setTesting]=useState(false);
  const [importMsg,setImportMsg]=useState(null);
  const [importResult,setImportResult]=useState(null);

  const showMsg=(t,ms=2500)=>{setMsg(t);setTimeout(()=>setMsg(null),ms);};

  const saveConfig = async () => {
    const updated={...config,sheetsUrl:sheetsInput,vendedor:vendedorInput};
    await save(K.config,updated);
    _sheetsUrl=sheetsInput;
    onUpdateConfig(updated);
    showMsg("✓ Configuración guardada");
  };

  const testSheets = async () => {
    if(!sheetsInput){showMsg("Ingresá la URL primero");return;}
    setTesting(true);
    try {
      const r=await fetch(sheetsInput+"?test=1",{method:"GET",mode:"cors"});
      if(r.ok){const d=await r.json();if(d.status==="connected")showMsg("✓ Conexión exitosa con Google Sheets");}
      else showMsg("URL guardada — verificá en tu Google Sheet que recibió el test");
    } catch {
      showMsg("URL guardada — abrí tu Sheet para verificar la conexión");
    }
    setTesting(false);
  };

  const addProduct = async () => {
    if(!form.sku||!form.nombre||!form.precio){showMsg("SKU, nombre y precio son obligatorios");return;}
    if(products.find(p=>p.sku===form.sku.toUpperCase())){showMsg("SKU ya existe");return;}
    setSaving(true);
    const np={sku:form.sku.toUpperCase(),nombre:form.nombre,cat:form.cat,marca:form.marca,pres:form.pres,precio:parseFloat(form.precio)||0,stock:parseInt(form.stock)||0,stockMin:parseInt(form.stockMin)||3,activo:true};
    const updated=[np,...products];
    await save(K.products,updated);
    onUpdateProducts(updated);
    setForm({sku:"",nombre:"",cat:CATS[3],marca:"",pres:"",precio:"",stock:"",stockMin:"3"});
    setView("main");setSaving(false);showMsg("✓ Producto agregado");
  };

  if(view==="add") return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setView("main")} style={{...s.btnGhost,padding:"6px 10px",fontSize:16}}>←</button>
        <span style={{fontWeight:500}}>Nuevo producto</span>
      </div>
      {msg&&<div style={{...s.surface,color:"var(--color-text-success)",fontSize:13,textAlign:"center"}}>{msg}</div>}
      <Sec>
        {[["sku","SKU *","text"],["nombre","Nombre completo *","text"],["marca","Marca","text"],["pres","Presentación","text"],["precio","Precio venta ($ARS) *","number"],["stock","Stock inicial","number"],["stockMin","Stock mínimo","number"]].map(([k,l,t])=>(
          <div key={k} style={{marginBottom:10}}>
            <label style={s.label}>{l}</label>
            <input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={l} style={s.input}/>
          </div>
        ))}
        <div style={{marginBottom:10}}>
          <label style={s.label}>Categoría</label>
          <select value={form.cat} onChange={e=>setForm(p=>({...p,cat:e.target.value}))} style={s.input}>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </Sec>
      <button onClick={addProduct} disabled={saving} style={{...s.btnCyan,opacity:saving?0.7:1}}>
        {saving?"Guardando...":"Agregar producto"}
      </button>
    </div>
  );

  return (
    <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:14}}>
      {msg&&<div style={{...s.surface,fontSize:13,textAlign:"center",color:"var(--color-text-success)"}}>{msg}</div>}

      {/* Google Sheets */}
      <Sec title="Google Sheets · Sincronización en tiempo real">
        <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:10,lineHeight:1.6}}>
          Cada venta y actualización de stock se envía automáticamente a tu Google Sheet. Seguí la guía incluida para configurarlo (5 minutos).
        </div>
        <div style={{marginBottom:10}}>
          <label style={s.label}>URL del Web App (de tu Google Apps Script)</label>
          <input value={sheetsInput} onChange={e=>setSheetsInput(e.target.value)} placeholder="https://script.google.com/macros/s/..." style={s.input}/>
        </div>
        <div style={{marginBottom:10}}>
          <label style={s.label}>Nombre del vendedor</label>
          <input value={vendedorInput} onChange={e=>setVendedorInput(e.target.value)} placeholder="Principal" style={s.input}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
          <button onClick={saveConfig} style={{...s.btnCyan,fontSize:12,padding:"10px"}}>Guardar config</button>
          <button onClick={testSheets} disabled={testing} style={{...s.btnGhost,padding:"10px",fontSize:12}}>
            {testing?"Probando...":"Probar conexión"}
          </button>
        </div>
        {config.sheetsUrl&&<div style={{marginTop:8,fontSize:11,color:"var(--color-text-success)"}}>
          Sheets activo · {config.sheetsUrl.slice(0,40)}...
        </div>}
      </Sec>

      {/* CSV Export */}
      <Sec title="Importar catálogo desde Excel / CSV">
        <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:10,lineHeight:1.6}}>
          Exportá el catálogo del Excel como CSV → subilo acá → los precios y productos se actualizan solos en la app.
        </div>
        <div style={{...s.surface,marginBottom:10,fontSize:11,lineHeight:1.6}}>
          <strong style={{color:"var(--color-text-primary)"}}>Cómo exportar desde Excel:</strong><br/>
          1. Abrí el archivo Excel de RENDIX<br/>
          2. Ir a la hoja <strong style={{color:"var(--color-text-primary)"}}>Catálogo Maestro</strong><br/>
          3. Archivo → Guardar como → CSV UTF-8<br/>
          4. Subí ese archivo acá abajo
        </div>
        <input type="file" accept=".csv,.txt" onChange={async e => {
          const file = e.target.files?.[0]; if(!file) return;
          setImportMsg(null); setImportResult(null);
          const text = await file.text();
          const result = importCatalogFromCSV(text, products);
          if (!result.ok) { setImportMsg({type:"error", text: result.msg}); return; }
          setImportResult(result);
        }} style={{...s.input,marginBottom:8,fontSize:12}}/>
        {importResult && (
          <div style={{...s.surface,marginBottom:8}}>
            <div style={{fontSize:12,color:"var(--color-text-success)",fontWeight:500,marginBottom:4}}>
              Listo para importar: {importResult.imported} productos nuevos · {importResult.updated} actualizados
            </div>
            {importResult.errors.length>0&&<div style={{fontSize:11,color:"var(--color-text-warning)",marginBottom:6}}>
              {importResult.errors.length} filas con error (se omiten)
            </div>}
            <button onClick={async()=>{
              await save(K.products, importResult.products);
              onUpdateProducts(importResult.products);
              setImportResult(null);
              showMsg(`✓ Catálogo actualizado · ${importResult.imported+importResult.updated} productos`);
            }} style={{...s.btnCyan,fontSize:12,padding:"10px"}}>
              Confirmar importación
            </button>
          </div>
        )}
        {importMsg&&<div style={{...s.surface,color:importMsg.type==="error"?"var(--color-text-danger)":"var(--color-text-success)",fontSize:12,whiteSpace:"pre-line"}}>{importMsg.text}</div>}
      </Sec>

      <Sec title="Exportar a Excel / CSV">
        <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:10,lineHeight:1.6}}>
          Descargá los datos como CSV y abrí en Excel. Compatible con el archivo Excel que ya tenés.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>exportVentas(sales)} style={s.btnExport}>
            Exportar historial de ventas ({sales.length} registros)
          </button>
          <button onClick={()=>exportProductos(products)} style={s.btnExport}>
            Exportar catálogo y stock ({products.length} productos)
          </button>
          <button onClick={()=>exportClientes(sales)} style={s.btnExport}>
            Exportar base de clientes
          </button>
        </div>
      </Sec>

      {/* Agregar producto */}
      <button onClick={()=>setView("add")} style={s.btnCyan}>+ Agregar producto nuevo</button>

      {/* Catálogo list */}
      <Sec title={`Catálogo (${products.length} productos)`}>
        {products.map(p=>(
          <div key={p.sku} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)",alignItems:"center"}}>
            <div style={{flex:1,minWidth:0}}>
              <span style={{fontWeight:500}}>{p.sku}</span>
              <span style={{color:"var(--color-text-secondary)",marginLeft:8}}>{p.nombre}</span>
            </div>
            <StockBadge stock={p.stock} min={p.stockMin}/>
          </div>
        ))}
      </Sec>

      <button onClick={async()=>{await save(K.products,DEMO);await save(K.sales,[]);onUpdateProducts(DEMO);showMsg("✓ Datos reseteados");}}
        style={{...s.btnGhost,width:"100%",padding:"11px",color:"var(--color-text-danger)",borderColor:"var(--color-border-danger)"}}>
        Reiniciar datos (volver a demo)
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ════════════════════════════════════════════════════════════════════════════
const TABS=[
  {id:"venta",    label:"Venta",    icon:"＋"},
  {id:"catalogo", label:"Catálogo", icon:"◫"},
  {id:"ventas",   label:"Ventas",   icon:"≡"},
  {id:"clientes", label:"Clientes", icon:"◎"},
  {id:"dashboard",label:"Dash",    icon:"▦"},
  {id:"config",   label:"Config",   icon:"⚙"},
];

export default function App() {
  const [tab,setTab]=useState("venta");
  const [products,setProducts]=useState([]);
  const [sales,setSales]=useState([]);
  const [config,setConfig]=useState({sheetsUrl:"",vendedor:"Principal"});
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);

  const reload=useCallback(async()=>{
    const [p,s,c]=await Promise.all([load(K.products),load(K.sales),load(K.config)]);
    setSales(s||[]);
    if(c){setConfig(c);_sheetsUrl=c.sheetsUrl||"";}
    // Si Sheets está configurado, intenta leer el catálogo de ahí
    if(c?.sheetsUrl){
      const sheetProds = await fetchCatalogFromSheets();
      if(sheetProds && sheetProds.length>0){
        setProducts(sheetProds);
        await save(K.products, sheetProds); // cache local para offline
      } else {
        setProducts(p||DEMO);
      }
    } else {
      setProducts(p||DEMO);
    }
    setLastSync(new Date());
    setLoading(false);
  },[]);

  useEffect(()=>{reload();const t=setInterval(reload,15000);return()=>clearInterval(t);},[reload]);

  const onSaleDone=(sale,updProds)=>{setSales(prev=>[sale,...prev]);setProducts(updProds);};
  const alerts=products.filter(p=>p.stock<=p.stockMin).length;

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:200,color:"var(--color-text-secondary)",fontSize:13}}>
      Cargando RENDIX...
    </div>
  );

  return (
    <div style={{fontFamily:"var(--font-sans)",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#0A0A0A",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"baseline",gap:4}}>
          <span style={{color:"#fff",fontWeight:500,fontSize:16}}>RENDI</span>
          <span style={{color:"#00BFFF",fontWeight:500,fontSize:16}}>X</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginLeft:6}}>POS</span>
          {_sheetsUrl&&<span style={{fontSize:9,color:"#00BFFF",marginLeft:6,opacity:0.8}}>● Sheets</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {alerts>0&&<Badge color="warning">{alerts} alertas</Badge>}
          {lastSync&&<span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>sync {lastSync.getHours()}:{String(lastSync.getMinutes()).padStart(2,"0")}</span>}
        </div>
      </div>
      <div style={{display:"flex",overflowX:"auto",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"0 0 auto",padding:"9px 12px",fontSize:10,fontWeight:tab===t.id?500:400,color:tab===t.id?"#00BFFF":"var(--color-text-secondary)",background:"transparent",border:"none",cursor:"pointer",borderBottom:tab===t.id?"2px solid #00BFFF":"2px solid transparent",whiteSpace:"nowrap",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:15}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{flex:1}}>
        {tab==="venta"    &&<VentaTab    products={products} onSaleDone={onSaleDone} vendedor={config.vendedor||"Principal"}/>}
        {tab==="catalogo" &&<CatalogoTab products={products} onUpdate={setProducts}/>}
        {tab==="ventas"   &&<VentasTab   sales={sales}/>}
        {tab==="clientes" &&<ClientesTab sales={sales}/>}
        {tab==="dashboard"&&<DashboardTab sales={sales} products={products}/>}
        {tab==="config"   &&<ConfigTab   products={products} sales={sales} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig}/>}
      </div>
    </div>
  );
}
