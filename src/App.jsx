import { useState, useEffect } from "react";
import { K, DEMO_PRODUCTS } from "./utils/constants.js";
import { load, save } from "./utils/storage.js";
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

  useEffect(() => {
    async function init() {
      const cfg = await load(K.config) || { sheetsUrl: "", vendedor: "Principal", tnStoreId: "", tnToken: "" };
      const prods = await load(K.products);
      const sls = await load(K.sales) || [];

      setConfig(cfg);
      if (cfg.sheetsUrl) setSheetsUrl(cfg.sheetsUrl);

      if (prods && Array.isArray(prods) && prods.length > 0) {
        setProducts(prods);
      } else {
        setProducts(DEMO_PRODUCTS);
        await save(K.products, DEMO_PRODUCTS);
      }

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

  const handleSaleDone = (newSale, updatedProducts) => {
    setSales(prev => [newSale, ...prev]);
    setProducts(updatedProducts);
  };

  const stockAlertsCount = products.filter(p => p.stock <= p.stockMin).length;

  if (!loaded) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", color: "var(--accent-cyan)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>
        Cargando RENDIX POS...
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
          <VentaTab products={products} onSaleDone={handleSaleDone} vendedor={config.vendedor} />
        )}
        {activeTab === "catalogo" && (
          <CatalogoTab products={products} onUpdate={setProducts} />
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
            onUpdateProducts={setProducts}
            config={config}
            onUpdateConfig={setConfig}
          />
        )}
      </main>

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={0}
        stockAlerts={stockAlertsCount}
      />
    </div>
  );
}
