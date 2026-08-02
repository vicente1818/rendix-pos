import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { setApiLayerKeys, getUsdToArs, validatePhone, clearRateCache } from "../utils/apilayer.js";
import { CATS, K } from "../utils/constants.js";
import { save } from "../utils/storage.js";
import { setSheetsUrl, fetchCatalogFromSheets } from "../utils/sheets.js";
import { fetchFromTiendaNube, mergeTNProducts } from "../utils/tiendanube.js";
import { exportVentas, exportProductos, exportClientes, importCatalogFromCSV } from "../utils/csv.js";
import { Button, SectionCard } from "../components/UI.jsx";
import { FARMA_CATALOG, mergeFarmaIntoExistingCatalog } from "../data/farma-catalog.js";

// ── Module-level constants — allocated once, never on re-render ──────────────
const ADD_PRODUCT_FIELDS = [
  ["sku",      "SKU *",                  "text"],
  ["nombre",   "Nombre *",               "text"],
  ["marca",    "Marca",                  "text"],
  ["pres",     "Presentación",           "text"],
  ["precio",   "Precio $ *",             "number"],
  ["stock",    "Stock inicial",          "number"],
  ["stockMin", "Stock mínimo alerta",    "number"],
];

// Pre-compute display names from static catalog data once at module load
const FARMA_DISPLAY = FARMA_CATALOG.map(p => ({
  ...p,
  displayName: p.nombre.replace("Fapasa – ", "").replace("Eticos – ", ""),
}));

const FARMA_PAGE_SIZE = 20;

// ── Glassmorphism + Circuit Noir design tokens ───────────────────────────────
const GLASS_CARD = {
  background: "rgba(14,20,32,0.75)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(0,229,255,0.15)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

const GLASS_CARD_HOVER = {
  border: "1px solid rgba(0,229,255,0.3)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 16px rgba(0,229,255,0.08)",
};

const SUCCESS_GLOW = {
  background: "rgba(0,255,136,0.08)",
  border: "1px solid var(--status-success)",
  boxShadow: "0 0 12px rgba(0,255,136,0.25), inset 0 0 8px rgba(0,255,136,0.08)",
  color: "var(--status-success)",
};

// Injected CSS — focus glow, spinner, scroll-fade, transition helpers
const COMPONENT_CSS = `
  @keyframes cn-spin {
    to { transform: rotate(360deg); }
  }
  .cn-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0,229,255,0.2);
    border-top-color: #00E5FF;
    border-radius: 50%;
    animation: cn-spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 6px;
    flex-shrink: 0;
  }
  .config-tab input:focus-visible,
  .config-tab select:focus-visible,
  .config-tab textarea:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,229,255,0.5) !important;
    border-color: rgba(0,229,255,0.4) !important;
  }
  .config-tab input,
  .config-tab select {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .config-glass-btn {
    transition: all 0.2s ease;
  }
  .config-glass-btn:hover:not(:disabled) {
    box-shadow: 0 0 16px rgba(0,229,255,0.4);
    transform: translateY(-1px);
  }
  .farma-scroll-container {
    mask-image: linear-gradient(to bottom, black 82%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 82%, transparent 100%);
  }
  .farma-card {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .farma-card:hover {
    border-color: rgba(0,229,255,0.4);
    box-shadow: 0 0 12px rgba(0,229,255,0.12);
    transform: translateY(-1px);
  }
`;

const FORM_INITIAL = {
  sku: "", nombre: "", cat: CATS[3], marca: "",
  pres: "", precio: "", stock: "", stockMin: "3", imagen: "",
};

export function ConfigTab({ products, sales, onUpdateProducts, config, onUpdateConfig, onUsdRateUpdate }) {
  // ── Null-guard config before any destructure ────────────────────────────
  const cfg = config || {};

  const [view, setView] = useState("main");
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [sheetsInput, setSheetsInput] = useState(cfg.sheetsUrl || "");
  const [vendedorInput, setVendedorInput] = useState(cfg.vendedor || "Principal");
  const [testing, setTesting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [importMsgIsInfo, setImportMsgIsInfo] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [tnStoreId, setTnStoreId] = useState(cfg.tnStoreId || "");
  const [tnToken, setTnToken] = useState(cfg.tnToken || "");
  const [exchangeKey, setExchangeKey] = useState(cfg.exchangeKey || "");
  const [numverifyKey, setNumverifyKey] = useState(cfg.numverifyKey || "");
  const [mailboxKey, setMailboxKey] = useState(cfg.mailboxKey || "");
  const [vatKey, setVatKey] = useState(cfg.vatKey || "");
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTesting, setApiTesting] = useState(false);
  const [testingTN, setTestingTN] = useState(false);
  const [farmaPreview, setFarmaPreview] = useState(false);
  const [farmaImporting, setFarmaImporting] = useState(false);
  const [farmaPage, setFarmaPage] = useState(0);
  const [brokenImages, setBrokenImages] = useState({});

  // ── Timer ref — prevents state updates on unmounted component ───────────
  const msgTimerRef = useRef(null);

  useEffect(() => {
    // Cleanup: clear any pending timer when this component unmounts
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const showMsg = useCallback((t, ms = 2500) => {
    setMsg(t);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => {
      setMsg(null);
      msgTimerRef.current = null;
    }, ms);
  }, []);

  // ── Save functions — each saves only its own section's fields ────────────
  const saveSheetsConfig = useCallback(async () => {
    const updated = { ...cfg, sheetsUrl: sheetsInput };
    await save(K.config, updated);
    setSheetsUrl(sheetsInput);
    onUpdateConfig(updated);
    if (updated.exchangeKey) getUsdToArs().then(onUsdRateUpdate).catch(() => {});
    showMsg("✓ URL de Sheets guardada");
  }, [cfg, sheetsInput, onUpdateConfig, onUsdRateUpdate, showMsg]);

  const saveVendedorConfig = useCallback(async () => {
    const updated = { ...cfg, vendedor: vendedorInput };
    await save(K.config, updated);
    onUpdateConfig(updated);
    if (updated.exchangeKey) getUsdToArs().then(onUsdRateUpdate).catch(() => {});
    showMsg("✓ Nombre de vendedor guardado");
  }, [cfg, vendedorInput, onUpdateConfig, onUsdRateUpdate, showMsg]);

  const saveTNConfig = useCallback(async () => {
    const updated = { ...cfg, tnStoreId, tnToken };
    await save(K.config, updated);
    onUpdateConfig(updated);
    if (updated.exchangeKey) getUsdToArs().then(onUsdRateUpdate).catch(() => {});
    showMsg("✓ Credenciales de Tienda Nube guardadas");
  }, [cfg, tnStoreId, tnToken, onUpdateConfig, onUsdRateUpdate, showMsg]);

  const saveApiLayerConfig = useCallback(async () => {
    const updated = { ...cfg, exchangeKey, numverifyKey, mailboxKey, vatKey };
    await save(K.config, updated);
    setApiLayerKeys({ exchangeKey, numverifyKey, mailboxKey, vatKey });
    clearRateCache();
    onUpdateConfig(updated);
    if (updated.exchangeKey) getUsdToArs().then(onUsdRateUpdate).catch(() => {});
    showMsg("✓ Claves APILayer guardadas");
  }, [cfg, exchangeKey, numverifyKey, mailboxKey, vatKey, onUpdateConfig, onUsdRateUpdate, showMsg]);

  const testApiLayerRate = useCallback(async () => {
    setApiTesting(true);
    setApiTestResult(null);
    try {
      setApiLayerKeys({ exchangeKey, numverifyKey, mailboxKey, vatKey });
      clearRateCache();
      const rate = await getUsdToArs();
      setApiTestResult({ ok: true, msg: `✓ 1 USD = $ ${Math.round(rate).toLocaleString("es-AR")} ARS` });
    } catch (err) {
      setApiTestResult({ ok: false, msg: `⚠️ ${err.message}` });
    } finally {
      setApiTesting(false);
    }
  }, [exchangeKey, numverifyKey, mailboxKey, vatKey]);

  // ── Sync handlers ────────────────────────────────────────────────────────
  const syncSheetsCatalog = useCallback(async () => {
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
  }, [sheetsInput, onUpdateProducts, showMsg]);

  const syncTiendaNube = useCallback(async () => {
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
  }, [tnStoreId, tnToken, products, onUpdateProducts, showMsg]);

  const handleCSVImport = useCallback(async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsgIsInfo(true);
    setImportMsg("Procesando archivo CSV...");
    try {
      const text = await file.text();
      const res = importCatalogFromCSV(text, products);
      // Reset value so the same filename triggers onChange next time
      e.target.value = "";
      if (!res.ok) {
        setImportMsgIsInfo(false);
        setImportMsg(`⚠️ Error: ${res.msg}`);
        return;
      }
      await save(K.products, res.products);
      onUpdateProducts(res.products);
      setImportResult(res);
      setImportMsg(null);
    } catch (err) {
      e.target.value = "";
      setImportMsgIsInfo(false);
      setImportMsg(`⚠️ Error al leer el archivo: ${err.message}`);
    }
  }, [products, onUpdateProducts]);

  const saveNewProduct = useCallback(async () => {
    // Use in-app toast instead of native alert()
    if (!form.sku || !form.nombre || !form.precio) {
      showMsg("⚠️ Ingresá al menos SKU, Nombre y Precio");
      return;
    }
    setSaving(true);
    const newProd = {
      sku: form.sku.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      cat: form.cat,
      marca: form.marca.trim(),
      pres: form.pres.trim(),
      precio: parseFloat(form.precio) || 0,
      stock: parseInt(form.stock) || 0,
      stockMin: parseInt(form.stockMin) || 3,
      activo: true,
      imagen: form.imagen || "",
    };
    const updated = [newProd, ...products.filter(p => p.sku !== newProd.sku)];
    await save(K.products, updated);
    onUpdateProducts(updated);
    setSaving(false);
    setForm(FORM_INITIAL);
    setView("main");
    showMsg("✓ Producto guardado correctamente");
  }, [form, products, onUpdateProducts, showMsg]);

  const importFarmaCatalog = useCallback(async () => {
    setFarmaImporting(true);
    const merged = mergeFarmaIntoExistingCatalog(products);
    await save(K.products, merged);
    onUpdateProducts(merged);
    setFarmaImporting(false);
    setFarmaPreview(false);
    const added = merged.length - products.length;
    showMsg(`✓ Catálogo FARMA importado: ${added} productos nuevos con imágenes y precios`);
  }, [products, onUpdateProducts, showMsg]);

  // React-idiomatic image error: track broken SKUs in state, never mutate DOM
  const handleImageError = useCallback(sku => {
    setBrokenImages(prev => ({ ...prev, [sku]: true }));
  }, []);

  // Paginated FARMA slice — avoids rendering the full list into the DOM
  const farmaVisible = useMemo(
    () => FARMA_DISPLAY.slice(0, (farmaPage + 1) * FARMA_PAGE_SIZE),
    [farmaPage]
  );

  // ── "Add product" view ──────────────────────────────────────────────────
  if (view === "add") return (
    <div className="config-tab animate-fade-in" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{COMPONENT_CSS}</style>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, textAlign: "center", fontWeight: 600, ...SUCCESS_GLOW }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setView("main")}>← Volver</Button>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-heading)" }}>Agregar Nuevo Producto</span>
      </div>

      <SectionCard title="Datos de producto" style={GLASS_CARD}>
        {ADD_PRODUCT_FIELDS.map(([k, l, t]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label
              htmlFor={`add-field-${k}`}
              style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
            >
              {l}
            </label>
            <input
              id={`add-field-${k}`}
              type={t}
              value={form[k]}
              onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
              placeholder={l}
              style={{
                minHeight: 44,
                fontFamily: t === "number" ? "'JetBrains Mono', monospace" : undefined,
              }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 10 }}>
          <label
            htmlFor="add-field-cat"
            style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
          >
            Categoría
          </label>
          <select
            id="add-field-cat"
            value={form.cat}
            onChange={e => setForm(p => ({ ...p, cat: e.target.value }))}
            style={{ minHeight: 44 }}
          >
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </SectionCard>

      <Button
        variant="primary"
        fullWidth
        size="lg"
        onClick={saveNewProduct}
        disabled={saving}
        style={{ minHeight: 52, boxShadow: "0 0 16px rgba(0,229,255,0.4)" }}
      >
        {saving ? <><span className="cn-spinner" />Guardando...</> : "Guardar Producto 📦"}
      </Button>
    </div>
  );

  // ── Main config view ────────────────────────────────────────────────────
  return (
    <div className="config-tab animate-fade-in" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{COMPONENT_CSS}</style>

      {msg && (
        <div style={{
          padding: "10px 14px",
          borderRadius: "var(--radius-sm)",
          fontSize: 13,
          textAlign: "center",
          fontWeight: 600,
          ...SUCCESS_GLOW,
        }}>
          {msg}
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        size="lg"
        onClick={() => setView("add")}
        style={{ minHeight: 52, boxShadow: "0 0 16px rgba(0,229,255,0.4)" }}
      >
        ➕ Agregar Producto al Catálogo
      </Button>

      {/* ── FARMA EL NEGRO CATALOG IMPORT ────────────────────────────────── */}
      <SectionCard title="🏥 Importar Catálogo FARMA EL NEGRO" style={GLASS_CARD}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
          Importa{" "}
          <strong style={{ color: "var(--accent-cyan)" }}>{FARMA_CATALOG.length} productos farmacéuticos</strong>{" "}
          de <strong>El Negro Suplementos</strong> con imágenes reales, precios en ₲ y marcas <em>Fapasa</em> y <em>Eticos</em>.
        </div>

        {!farmaPreview ? (
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            onClick={() => setFarmaPreview(true)}
            style={{ minHeight: 44, transition: "all 0.2s ease" }}
          >
            👁 Previsualizar Catálogo Farma
          </Button>
        ) : (
          <>
            {/* Paginated grid with fade-gradient scroll hint */}
            <div
              className="farma-scroll-container"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 10,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {farmaVisible.map(p => (
                <div key={p.sku} className="farma-card">
                  {!brokenImages[p.sku] && (
                    <img
                      src={p.imagenThumb}
                      alt={p.displayName}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                      onError={() => handleImageError(p.sku)}
                    />
                  )}
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                      marginBottom: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {p.displayName}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.marca}</div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--accent-cyan)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      ₲ {p.precio.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination: load more until all displayed */}
            {farmaVisible.length < FARMA_DISPLAY.length && (
              <Button
                variant="ghost"
                fullWidth
                size="sm"
                onClick={() => setFarmaPage(p => p + 1)}
                style={{ marginBottom: 8, minHeight: 44 }}
              >
                Mostrar más ({FARMA_DISPLAY.length - farmaVisible.length} restantes)
              </Button>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="primary"
                size="sm"
                onClick={importFarmaCatalog}
                disabled={farmaImporting}
                style={{ flex: 1, minHeight: 44, boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}
              >
                {farmaImporting
                  ? <><span className="cn-spinner" />Importando...</>
                  : "✓ Importar Ahora"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFarmaPreview(false)}
                style={{ minHeight: 44 }}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </SectionCard>

      {/* ── GOOGLE SHEETS ─────────────────────────────────────────────────── */}
      <SectionCard title="Sincronización Google Sheets Hub" style={GLASS_CARD}>
        <label
          htmlFor="sheets-url-input"
          style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
        >
          URL del Web App de Apps Script
        </label>
        <input
          id="sheets-url-input"
          value={sheetsInput}
          onChange={e => setSheetsInput(e.target.value)}
          placeholder="https://script.google.com/macros/s/..."
          style={{ marginBottom: 10, minHeight: 44 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={saveSheetsConfig}
            style={{ flex: 1, minHeight: 44, transition: "all 0.2s ease" }}
          >
            Guardar URL Sheets
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncSheetsCatalog}
            disabled={testing}
            style={{ flex: 1, minHeight: 44, transition: "all 0.2s ease" }}
          >
            {testing
              ? <><span className="cn-spinner" />Probando...</>
              : "Sync Catálogo"}
          </Button>
        </div>
      </SectionCard>

      {/* ── TIENDA NUBE ───────────────────────────────────────────────────── */}
      <SectionCard title="Integración Tienda Nube" style={GLASS_CARD}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div>
            <label
              htmlFor="tn-store-id"
              style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
            >
              Store ID
            </label>
            <input
              id="tn-store-id"
              value={tnStoreId}
              onChange={e => setTnStoreId(e.target.value)}
              placeholder="123456"
              style={{ minHeight: 44, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div>
            <label
              htmlFor="tn-token"
              style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
            >
              Bearer Token
            </label>
            {/* type="password" — prevents shoulder-surfing of API credentials */}
            <input
              id="tn-token"
              type="password"
              value={tnToken}
              onChange={e => setTnToken(e.target.value)}
              placeholder="Token API"
              style={{ minHeight: 44 }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={saveTNConfig}
            style={{ flex: 1, minHeight: 44, transition: "all 0.2s ease" }}
          >
            Guardar Credenciales
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncTiendaNube}
            disabled={testingTN}
            style={{ flex: 1, minHeight: 44, transition: "all 0.2s ease" }}
          >
            {testingTN
              ? <><span className="cn-spinner" />Sincronizando...</>
              : "Sync Stock TN"}
          </Button>
        </div>
      </SectionCard>

      {/* ── APILAYER API KEYS ─────────────────────────────────────────────── */}
      <SectionCard title="🔑 APILayer — Cotizaciones & Validaciones" style={GLASS_CARD}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
          Conectá las APIs de{" "}
          <span style={{ color: "var(--accent-cyan)" }}>exchangerates_data</span>,{" "}
          <span style={{ color: "var(--accent-cyan)" }}>numverify</span>,{" "}
          <span style={{ color: "var(--accent-cyan)" }}>mailboxlayer</span> y{" "}
          <span style={{ color: "var(--accent-cyan)" }}>vatlayer</span> para validación en tiempo real y cotización USD/ARS.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          <div>
            <label htmlFor="api-exchange-key" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Exchange Rates (USD/ARS) — exchangerates_data
            </label>
            <input
              id="api-exchange-key"
              type="password"
              value={exchangeKey}
              onChange={e => setExchangeKey(e.target.value)}
              placeholder="Clave API exchangerates_data"
              style={{ minHeight: 44, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div>
            <label htmlFor="api-numverify-key" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Validación de Teléfono — numverify
            </label>
            <input
              id="api-numverify-key"
              type="password"
              value={numverifyKey}
              onChange={e => setNumverifyKey(e.target.value)}
              placeholder="Clave API numverify"
              style={{ minHeight: 44, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div>
            <label htmlFor="api-mailbox-key" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Validación de Email — mailboxlayer
            </label>
            <input
              id="api-mailbox-key"
              type="password"
              value={mailboxKey}
              onChange={e => setMailboxKey(e.target.value)}
              placeholder="Clave API mailboxlayer"
              style={{ minHeight: 44, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div>
            <label htmlFor="api-vat-key" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Tasas de IVA — vatlayer
            </label>
            <input
              id="api-vat-key"
              type="password"
              value={vatKey}
              onChange={e => setVatKey(e.target.value)}
              placeholder="Clave API vatlayer"
              style={{ minHeight: 44, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
        </div>

        {apiTestResult && (
          <div style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            marginBottom: 10,
            fontFamily: "'JetBrains Mono', monospace",
            ...(apiTestResult.ok
              ? { background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--status-success)" }
              : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--status-danger)" }),
          }}>
            {apiTestResult.msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={saveApiLayerConfig}
            style={{ flex: 1, minHeight: 44, boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}
          >
            Guardar Claves
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={testApiLayerRate}
            disabled={apiTesting || !exchangeKey}
            style={{ flex: 1, minHeight: 44 }}
          >
            {apiTesting ? <><span className="cn-spinner" />Probando...</> : "Probar USD/ARS"}
          </Button>
        </div>
      </SectionCard>

      {/* ── CSV IMPORT / EXPORT ───────────────────────────────────────────── */}
      <SectionCard title="Importar / Exportar Datos (CSV/Excel)" style={GLASS_CARD}>
        {/* Properly paired label + input (WCAG 1.3.1) */}
        <label
          htmlFor="csv-file-input"
          style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}
        >
          Importar catálogo desde CSV/Excel
        </label>
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={handleCSVImport}
          style={{ fontSize: 12, marginBottom: 10, minHeight: 44 }}
        />

        {importMsg && (
          <div style={{
            fontSize: 12,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            // Info messages (processing) use muted color; warnings/errors use warning amber
            color: importMsgIsInfo ? "var(--text-muted)" : "var(--status-warning)",
          }}>
            {importMsgIsInfo && <span className="cn-spinner" />}
            {importMsg}
          </div>
        )}

        {importResult && (
          <div style={{
            fontSize: 11,
            color: "var(--status-success)",
            marginBottom: 10,
            background: "rgba(0,255,136,0.06)",
            padding: 8,
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(0,255,136,0.2)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Importados: {importResult.imported} · Actualizados: {importResult.updated}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            style={{ minHeight: 44 }}
            onClick={() => exportVentas(sales)}
          >
            📥 Exportar Ventas (CSV)
          </Button>
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            style={{ minHeight: 44 }}
            onClick={() => exportProductos(products)}
          >
            📥 Exportar Productos (CSV)
          </Button>
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            style={{ minHeight: 44 }}
            onClick={() => exportClientes(sales)}
          >
            📥 Exportar Clientes (CSV)
          </Button>
        </div>
      </SectionCard>

      {/* ── VENDEDOR ──────────────────────────────────────────────────────── */}
      <SectionCard title="Configuración de Vendedor" style={GLASS_CARD}>
        <label
          htmlFor="vendedor-input"
          style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
        >
          Nombre del vendedor actual
        </label>
        <input
          id="vendedor-input"
          value={vendedorInput}
          onChange={e => setVendedorInput(e.target.value)}
          placeholder="Ej. Vicente"
          style={{ marginBottom: 10, minHeight: 44 }}
        />
        <Button
          variant="primary"
          fullWidth
          size="sm"
          onClick={saveVendedorConfig}
          style={{ minHeight: 44, boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}
        >
          Guardar Nombre Vendedor
        </Button>
      </SectionCard>
    </div>
  );
}
