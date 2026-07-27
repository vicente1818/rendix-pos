import { useState, useEffect } from "react";
import { initDatabase, getDbProducts, saveDbProducts, getDbSales, saveDbSale, getDbConfig, setDbConfig } from "./utils/db.js";
import { setSheetsUrl } from "./utils/sheets.js";
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
  const [config, setConfig] = useState({ sheetsUrl: "", vendedor: "Principal", tnStoreId: "", tnToken: "" });
  const [loaded, setLoaded] = useState(false);

  // Global Cart State (Preserved across tab switches)
  const [cart, setCart] = useState([]);
  const [descPct, setDescPct] = useState(0);
  const [canal, setCanal] = useState("Instagram");
  const [metodo, setMetodo] = useState("Transferencia");
  const [cli, setCli] = useState({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });

  useEffect(() => {
    async function init() {
      await initDatabase();
      const cfg = await getDbConfig("appConfig") || { sheetsUrl: "", vendedor: "Principal", tnStoreId: "", tnToken: "" };
      const prods = await getDbProducts();
      const sls = await getDbSales();

      setConfig(cfg);
      if (cfg.sheetsUrl) setSheetsUrl(cfg.sheetsUrl);
      setProducts(prods);
      setSales(sls);
      setLoaded(true);
    }
    init();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSaleDone = async (newSale, updatedProducts) => {
    setSales(prev => [newSale, ...prev]);
    setProducts(updatedProducts);
    await saveDbSale(newSale);
    await saveDbProducts(updatedProducts);
    // Clear global cart
    setCart([]);
    setDescPct(0);
    setCli({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });
  };

  const updateProductsState = async (newProducts) => {
    setProducts(newProducts);
    await saveDbProducts(newProducts);
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
          <CatalogoTab products={products} onUpdate={updateProductsState} />
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
