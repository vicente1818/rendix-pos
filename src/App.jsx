import { useState, useEffect } from "react";
import { initDatabase, getDbProducts, saveDbProducts, getDbSales, saveDbSale, getDbConfig, setDbConfig } from "./utils/db.js";
import { setSheetsUrl } from "./utils/sheets.js";
import { autoFixProductImages } from "./utils/imageMatcher.js";
import { setApiLayerKeys, getUsdToArs } from "./utils/apilayer.js";
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
  const [config, setConfig] = useState({ sheetsUrl: "", vendedor: "Principal", tnStoreId: "", tnToken: "", exchangeKey: "", numverifyKey: "", mailboxKey: "", vatKey: "" });
  const [loaded, setLoaded] = useState(false);
  const [usdRate, setUsdRate] = useState(null);

  // Global Cart State (Preserved across tab switches)
  const [cart, setCart] = useState([]);
  const [descPct, setDescPct] = useState(0);
  const [canal, setCanal] = useState("Instagram");
  const [metodo, setMetodo] = useState("Transferencia");
  const [cli, setCli] = useState({ nombre: "", tel: "", ig: "", ciudad: "", notas: "" });

  useEffect(() => {
    async function init() {
      await initDatabase();
      const cfg = await getDbConfig("appConfig") || { sheetsUrl: "", vendedor: "Principal", tnStoreId: "", tnToken: "", exchangeKey: "", numverifyKey: "", mailboxKey: "", vatKey: "" };
      const prods = await getDbProducts();
      const fixedProds = autoFixProductImages(prods);
      
      // Auto-save repaired image paths to IndexedDB
      await saveDbProducts(fixedProds);

      const sls = await getDbSales();

      setConfig(cfg);
      if (cfg.sheetsUrl) setSheetsUrl(cfg.sheetsUrl);
      setApiLayerKeys({ exchangeKey: cfg.exchangeKey, numverifyKey: cfg.numverifyKey, mailboxKey: cfg.mailboxKey, vatKey: cfg.vatKey });
      setProducts(fixedProds);
      setSales(sls);
      setLoaded(true);
      // Fetch USD/ARS rate in background if key configured
      if (cfg.exchangeKey) {
        getUsdToArs().then(setUsdRate).catch(() => {});
      }
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
    setApiLayerKeys({ exchangeKey: newConfig.exchangeKey, numverifyKey: newConfig.numverifyKey, mailboxKey: newConfig.mailboxKey, vatKey: newConfig.vatKey });
    if (newConfig.exchangeKey) {
      getUsdToArs().then(setUsdRate).catch(() => {});
    }
  };

  const stockAlertsCount = products.filter(p => p.stock <= p.stockMin).length;
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!loaded) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", height: "100vh",
        alignItems: "center", justifyContent: "center",
        background: "#090D14",
        backgroundImage: [
          "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
          "linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "216px 216px, 216px 216px, 54px 54px, 54px 54px",
        position: "relative", overflow: "hidden",
      }}>
        {[{t:"12px",b:"auto",l:"12px",r:"auto",bw:"1px 0 0 1px"},
          {t:"auto",b:"12px",l:"12px",r:"auto",bw:"0 0 1px 1px"},
          {t:"12px",b:"auto",l:"auto",r:"12px",bw:"1px 1px 0 0"},
          {t:"auto",b:"12px",l:"auto",r:"12px",bw:"0 1px 1px 0"}].map((c,i) => (
          <div key={i} style={{position:"absolute",top:c.t,bottom:c.b,left:c.l,right:c.r,width:24,height:24,border:`solid rgba(0,229,255,0.5)`,borderWidth:c.bw}} />
        ))}
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(180deg,transparent,rgba(0,229,255,0.2),transparent)",animation:"scanline 4s linear infinite"}} />
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"var(--font-heading)",fontWeight:800,fontSize:"clamp(48px,12vw,80px)",color:"#D2E4F2",letterSpacing:"0.12em",animation:"splashReveal 0.9s cubic-bezier(0.16,1,0.3,1) forwards",textShadow:"0 0 40px rgba(0,229,255,0.25)"}}>
            RENDIX
          </div>
          <div style={{fontFamily:"var(--font-body)",fontWeight:300,fontSize:22,color:"#00E5FF",letterSpacing:"0.4em",marginTop:4,opacity:0.9}}>
            POS
          </div>
        </div>
        <div style={{marginTop:40,width:180,height:1,background:"rgba(0,229,255,0.15)",borderRadius:1,overflow:"hidden"}}>
          <div style={{height:"100%",background:"#00E5FF",boxShadow:"0 0 8px #00E5FF",animation:"splashBar 1.2s cubic-bezier(0.4,0,0.2,1) forwards"}} />
        </div>
        <div style={{marginTop:16,fontSize:11,letterSpacing:"0.2em",color:"rgba(56,80,110,1)",fontFamily:"monospace"}}>
          INICIANDO SISTEMA
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {theme === "dark" && <div className="cn-scanline" />}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        vendedor={config.vendedor}
        sheetsConnected={Boolean(config.sheetsUrl)}
        tnConnected={Boolean(config.tnStoreId && config.tnToken)}
        usdRate={usdRate}
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
