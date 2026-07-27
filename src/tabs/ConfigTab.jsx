import { useState } from "react";
import { CATS, K } from "../utils/constants.js";
import { save } from "../utils/storage.js";
import { setSheetsUrl, fetchCatalogFromSheets } from "../utils/sheets.js";
import { fetchFromTiendaNube, mergeTNProducts } from "../utils/tiendanube.js";
import { exportVentas, exportProductos, exportClientes, importCatalogFromCSV } from "../utils/csv.js";
import { Button, SectionCard } from "../components/UI.jsx";
import { FARMA_CATALOG, mergeFarmaIntoExistingCatalog } from "../data/farma-catalog.js";

export function ConfigTab({ products, sales, onUpdateProducts, config, onUpdateConfig }) {
  const [view, setView] = useState("main"); // main | add
  const [form, setForm] = useState({ sku: "", nombre: "", cat: CATS[3], marca: "", pres: "", precio: "", stock: "", stockMin: "3", imagen: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [sheetsInput, setSheetsInput] = useState(config.sheetsUrl || "");
  const [vendedorInput, setVendedorInput] = useState(config.vendedor || "Principal");
  const [testing, setTesting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [tnStoreId, setTnStoreId] = useState(config.tnStoreId || "");
  const [tnToken, setTnToken] = useState(config.tnToken || "");
  const [testingTN, setTestingTN] = useState(false);
  const [farmaPreview, setFarmaPreview] = useState(false);
  const [farmaImporting, setFarmaImporting] = useState(false);

  const showMsg = (t, ms = 2500) => { setMsg(t); setTimeout(() => setMsg(null), ms); };

  const saveConfig = async () => {
    const updated = { ...config, sheetsUrl: sheetsInput, vendedor: vendedorInput, tnStoreId, tnToken };
    await save(K.config, updated);
    setSheetsUrl(sheetsInput);
    onUpdateConfig(updated);
    showMsg("✓ Configuración guardada correctamente");
  };

  const syncSheetsCatalog = async () => {
    if (!sheetsInput) return;
    setTesting(true);
    setSheetsUrl(sheetsInput);
    const catalog = await fetchCatalogFromSheets();
    setTesting(false);
    if (catalog) {
      await save(K.products, catalog);
      onUpdateProducts(catalog);
      showMsg(`✓ Catálogo importado de Sheets (${catalog.length} productos)`);
    } else {
      showMsg("⚠️ No se pudo obtener el catálogo desde Sheets");
    }
  };

  const syncTiendaNube = async () => {
    if (!tnStoreId || !tnToken) return;
    setTestingTN(true);
    const tnProds = await fetchFromTiendaNube(tnStoreId, tnToken);
    setTestingTN(false);
    if (tnProds) {
      const merged = mergeTNProducts(products, tnProds);
      await save(K.products, merged);
      onUpdateProducts(merged);
      showMsg(`✓ Sincronizados ${tnProds.length} productos de TiendaNube`);
    } else {
      showMsg("⚠️ Error al conectar con Tienda Nube");
    }
  };

  const handleCSVImport = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportMsg("Procesando archivo CSV...");
    try {
      const text = await file.text();
      const res = importCatalogFromCSV(text, products);
      if (!res.ok) {
        setImportMsg(`⚠️ Error: ${res.msg}`);
        return;
      }
      await save(K.products, res.products);
      onUpdateProducts(res.products);
      setImportResult(res);
      setImportMsg(null);
    } catch (err) {
      setImportMsg(`⚠️ Error al leer el archivo: ${err.message}`);
    }
  };

  const saveNewProduct = async () => {
    if (!form.sku || !form.nombre || !form.precio) { alert("Ingresá al menos SKU, Nombre y Precio"); return; }
    setSaving(true);
    const newProd = {
      sku: form.sku.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      cat: form.cat, marca: form.marca.trim(), pres: form.pres.trim(),
      precio: parseFloat(form.precio) || 0,
      stock: parseInt(form.stock) || 0,
      stockMin: parseInt(form.stockMin) || 3,
      activo: true,
      imagen: form.imagen || ""
    };
    const updated = [newProd, ...products.filter(p => p.sku !== newProd.sku)];
    await save(K.products, updated);
    onUpdateProducts(updated);
    setSaving(false);
    setForm({ sku: "", nombre: "", cat: CATS[3], marca: "", pres: "", precio: "", stock: "", stockMin: "3", imagen: "" });
    setView("main");
    showMsg("✓ Producto guardado correctamente");
  };

  if (view === "add") return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setView("main")}>← Volver</Button>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>Agregar Nuevo Producto</span>
      </div>

      <SectionCard title="Datos de producto">
        {[["sku", "SKU *", "text"], ["nombre", "Nombre *", "text"], ["marca", "Marca", "text"], ["pres", "Presentación", "text"], ["precio", "Precio $ *", "number"], ["stock", "Stock inicial", "number"], ["stockMin", "Stock mínimo alerta", "number"]].map(([k, l, t]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
            <input type={t} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={l} />
          </div>
        ))}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Categoría</label>
          <select value={form.cat} onChange={e => setForm(p => ({ ...p, cat: e.target.value }))}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </SectionCard>

      <Button variant="primary" fullWidth size="lg" onClick={saveNewProduct} disabled={saving}>
        {saving ? "Guardando..." : "Guardar Producto 📦"}
      </Button>
    </div>
  );

  const importFarmaCatalog = async () => {
    setFarmaImporting(true);
    const merged = mergeFarmaIntoExistingCatalog(products);
    await save(K.products, merged);
    onUpdateProducts(merged);
    setFarmaImporting(false);
    setFarmaPreview(false);
    const added = merged.length - products.length;
    showMsg(`✓ Catálogo FARMA importado: ${added} productos nuevos con imágenes y precios`);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
      {msg && (
        <div style={{ padding: 10, background: "var(--status-success-bg)", border: "1px solid var(--status-success)", color: "var(--status-success)", borderRadius: "var(--radius-sm)", fontSize: 13, textAlign: "center", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <Button variant="primary" fullWidth size="lg" onClick={() => setView("add")}>
        ➕ Agregar Producto al Catálogo
      </Button>

      {/* ── FARMA EL NEGRO CATALOG IMPORT ──────────────────── */}
      <SectionCard title="🏥 Importar Catálogo FARMA EL NEGRO">
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
          Importa <strong style={{ color: "var(--accent-cyan)" }}>{FARMA_CATALOG.length} productos farmacéuticos</strong> de
          <strong> El Negro Suplementos</strong> con imágenes reales, precios en ₲ y marcas <em>Fapasa</em> y <em>Eticos</em>.
        </div>
        {!farmaPreview ? (
          <Button variant="secondary" fullWidth size="sm" onClick={() => setFarmaPreview(true)}>
            👁 Previsualizar Catálogo Farma
          </Button>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10, maxHeight: 260, overflowY: "auto" }}>
              {FARMA_CATALOG.map(p => (
                <div key={p.sku} style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  <img
                    src={p.imagenThumb}
                    alt={p.nombre}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 2 }}>{p.nombre.replace("Fapasa – ", "").replace("Eticos – ", "")}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.marca}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-cyan)" }}>₲ {p.precio.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" size="sm" style={{ flex: 1 }} onClick={importFarmaCatalog} disabled={farmaImporting}>
                {farmaImporting ? "Importando..." : "✓ Importar Ahora"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setFarmaPreview(false)}>Cancelar</Button>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="Sincronización Google Sheets Hub">
        <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>URL del Web App de Apps Script</label>
        <input value={sheetsInput} onChange={e => setSheetsInput(e.target.value)} placeholder="https://script.google.com/macros/s/..." style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={saveConfig} style={{ flex: 1 }}>Guardar Config</Button>
          <Button variant="ghost" size="sm" onClick={syncSheetsCatalog} disabled={testing} style={{ flex: 1 }}>
            {testing ? "Probando..." : "Sync Catálogo"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Integración Tienda Nube">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Store ID</label>
            <input value={tnStoreId} onChange={e => setTnStoreId(e.target.value)} placeholder="123456" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Bearer Token</label>
            <input value={tnToken} onChange={e => setTnToken(e.target.value)} placeholder="Token API" />
          </div>
        </div>
        <Button variant="ghost" fullWidth size="sm" onClick={syncTiendaNube} disabled={testingTN}>
          {testingTN ? "Sincronizando..." : "Sincronizar Stock Tienda Nube"}
        </Button>
      </SectionCard>

      <SectionCard title="Importar / Exportar Datos (CSV/Excel)">
        <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Importar catálogo desde CSV/Excel</label>
        <input type="file" accept=".csv" onChange={handleCSVImport} style={{ fontSize: 12, marginBottom: 10 }} />
        {importMsg && <div style={{ fontSize: 12, color: "var(--status-warning)", marginBottom: 10 }}>{importMsg}</div>}
        {importResult && (
          <div style={{ fontSize: 11, color: "var(--status-success)", marginBottom: 10, background: "var(--bg-surface)", padding: 8, borderRadius: "var(--radius-sm)" }}>
            Importados: {importResult.imported} · Actualizados: {importResult.updated}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="secondary" fullWidth size="sm" onClick={() => exportVentas(sales)}>📥 Exportar Ventas (CSV)</Button>
          <Button variant="secondary" fullWidth size="sm" onClick={() => exportProductos(products)}>📥 Exportar Productos (CSV)</Button>
          <Button variant="secondary" fullWidth size="sm" onClick={() => exportClientes(sales)}>📥 Exportar Clientes (CSV)</Button>
        </div>
      </SectionCard>

      <SectionCard title="Configuración de Vendedor">
        <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Nombre del vendedor actual</label>
        <input value={vendedorInput} onChange={e => setVendedorInput(e.target.value)} placeholder="Ej. Vicente" style={{ marginBottom: 10 }} />
        <Button variant="primary" fullWidth size="sm" onClick={saveConfig}>Guardar Nombre</Button>
      </SectionCard>
    </div>
  );
}
