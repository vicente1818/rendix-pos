import { useState, useEffect } from "react";
import { initDatabase, getDbProducts, saveDbProducts, updateDbProducts, getDbSales, saveDbSale, getDbConfig, setDbConfig } from "./utils/db.js";
import { setSheetsUrl, setSheetsSecret } from "./utils/sheets.js";
import { initSyncManager } from "./utils/syncManager.js";
import { autoFixProductImages } from "./utils/imageMatcher.js";
import { Header } from "./components/Header.jsx";
import { Navigation } from "./components/Navigation.jsx";
import { VentaTab } from "./tabs/VentaTab.jsx";
import { CatalogoTab } from "./tabs/CatalogoTab.jsx";
import { VentasTab } from "./tabs/VentasTab.jsx";
import { ClientesTab } from "./tabs/ClientesTab.jsx";
import { DashboardTab } from "./tabs/DashboardTab.jsx";
import { ConfigTab } from "./tabs/ConfigTab.jsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("venta");
  const [theme, setTheme] = useState("dark");
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [config, setConfig] = useState({ sheetsUrl: "", sheetsSecret: "", vendedor: "Principal", tnStoreId: "", tnToken: "" });
  const [loaded, setLoaded] = useState(false);
  const [initError, setInitError] = useState(null);

  // Global Cart State (Preserved across tab switches)
  const [cart, setCart] = useState([]);
  const [descPct, setDescPct] = useState(0);
  const [canal, setCanal] = useState("Instagram");
  const [metodo, setMetodo] = useState("Transferencia");
  const [cli, setCli] = useState({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        const cfg = await getDbConfig("appConfig") || { sheetsUrl: "", sheetsSecret: "", vendedor: "Principal", tnStoreId: "", tnToken: "" };
        const prods = await getDbProducts();
        const fixedProds = autoFixProductImages(prods);

        // Solo persiste si autoFixProductImages realmente cambió algo
        // (evita reescribir la tabla completa, y no pisa imágenes subidas por el usuario)
        const changed = fixedProds.filter((p, i) => p.imagen !== prods[i]?.imagen);
        if (changed.length > 0) {
          await updateDbProducts(changed.map(p => ({ sku: p.sku, changes: { imagen: p.imagen } })));
        }

        const sls = await getDbSales();

        setConfig(cfg);
        if (cfg.sheetsUrl) setSheetsUrl(cfg.sheetsUrl);
        if (cfg.sheetsSecret) setSheetsSecret(cfg.sheetsSecret);
        setProducts(fixedProds);
        setSales(sls);
        initSyncManager();
      } catch (err) {
        console.error("Error inicializando RENDIX POS:", err);
        setInitError(err.message || "Error desconocido al iniciar la base de datos local");
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSaleDone = async (newSale, stockPatches) => {
    setSales(prev => [newSale, ...prev]);
    setProducts(prev => prev.map(p => {
      const patch = stockPatches.find(x => x.sku === p.sku);
      return patch ? { ...p, ...patch.changes } : p;
    }));
    await saveDbSale(newSale);
    await updateDbProducts(stockPatches);
    // Clear global cart
    setCart([]);
    setDescPct(0);
    setCli({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });
  };

  const updateProductsState = async (newProducts) => {
    setProducts(newProducts);
    await saveDbProducts(newProducts);
  };

  const updateSingleProduct = async (sku, changes) => {
    setProducts(prev => prev.map(p => p.sku === sku ? { ...p, ...changes } : p));
    await updateDbProducts([{ sku, changes }]);
  };

  const updateConfigState = async (newConfig) => {
    setConfig(newConfig);
    await setDbConfig("appConfig", newConfig);
  };

  const stockAlertsCount = products.filter(p => p.stock <= p.stockMin).length;
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!loaded) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", color: "var(--accent-cyan)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>
        Cargando RENDIX POS (IndexedDB)...
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", color: "var(--status-danger)", fontFamily: "var(--font-heading)", fontWeight: 700, textAlign: "center", padding: 24, flexDirection: "column", gap: 8 }}>
        <div>No se pudo iniciar la base de datos local</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-body)" }}>{initError}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        vendedor={config.vendedor}
        sheetsConnected={Boolean(config.sheetsUrl)}
        tnConnected={Boolean(config.tnStoreId && config.tnToken)}
      />

      <main style={{ flex: 1, paddingBottom: 16 }}>
        {activeTab === "venta" && (
          <VentaTab
            products={products}
            onSaleDone={handleSaleDone}
            vendedor={config.vendedor}
            cart={cart}
            setCart={setCart}
            descPct={descPct}
            setDescPct={setDescPct}
            canal={canal}
            setCanal={setCanal}
            metodo={metodo}
            setMetodo={setMetodo}
            cli={cli}
            setCli={setCli}
          />
        )}
        {activeTab === "catalogo" && (
          <CatalogoTab products={products} onUpdateOne={updateSingleProduct} />
        )}
        {activeTab === "ventas" && (
          <VentasTab sales={sales} />
        )}
        {activeTab === "clientes" && (
          <ClientesTab sales={sales} />
        )}
        {activeTab === "dashboard" && (
          <DashboardTab sales={sales} products={products} />
        )}
        {activeTab === "config" && (
          <ConfigTab
            products={products}
            sales={sales}
            onUpdateProducts={updateProductsState}
            config={config}
            onUpdateConfig={updateConfigState}
          />
        )}
      </main>

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={cartItemCount}
        stockAlerts={stockAlertsCount}
      />
    </div>
  );
}
