export const K = {
  products: "rendix:v2:products",
  sales:    "rendix:v2:sales",
  config:   "rendix:v2:config",
};

export const CANALES = ["Instagram", "WhatsApp", "MercadoLibre", "Tienda Nube", "Local / Mostrador"];
export const METODOS = ["Transferencia", "Mercado Pago", "Efectivo", "Tarjeta débito", "Tarjeta crédito"];
export const CATS = ["Esteroides / AAS", "Péptidos", "Fármacos PCT/AI", "Suplementos", "Vitaminas", "Accesorios", "Combos"];

export const DEMO_PRODUCTS = [
  {sku:"EST-001",nombre:"Testosterona Enantato 250",cat:"Esteroides / AAS",marca:"Cooper Pharma",pres:"Vial 10ml",precio:95000,stock:20,stockMin:5,activo:true,imagen:"/farma/landerlan-durateston.jpg"},
  {sku:"EST-002",nombre:"Testosterona Cipionato 200",cat:"Esteroides / AAS",marca:"Cooper Pharma",pres:"Vial 10ml",precio:95000,stock:15,stockMin:3,activo:true,imagen:"/farma/landerlan-durateston.jpg"},
  {sku:"EST-003",nombre:"Trembolona Acetato 100",cat:"Esteroides / AAS",marca:"Alfa Pharma",pres:"Vial 10ml",precio:115000,stock:10,stockMin:3,activo:true,imagen:"/farma/landerlan-drostanolona.jpg"},
  {sku:"PEP-001",nombre:"BPC-157 5mg",cat:"Péptidos",marca:"BioQ Pharma",pres:"Vial 5ml",precio:120000,stock:15,stockMin:3,activo:true,imagen:"/farma/landerlan-landertropin.jpg"},
  {sku:"PEP-002",nombre:"TB-500 5mg",cat:"Péptidos",marca:"BioQ Pharma",pres:"Vial 5ml",precio:130000,stock:10,stockMin:2,activo:true,imagen:"/farma/landerlan-landertropin.jpg"},
  {sku:"PEP-003",nombre:"MK-677 25mg",cat:"Péptidos",marca:"Genérico",pres:"Cáps. 90u",precio:135000,stock:12,stockMin:3,activo:true,imagen:"/farma/landerlan-landertropin.jpg"},
  {sku:"FAR-001",nombre:"Anastrozol 1mg",cat:"Fármacos PCT/AI",marca:"Alfa Pharma",pres:"Comp. 100u",precio:28000,stock:20,stockMin:5,activo:true,imagen:"/farma/fapasa-emadian.png"},
  {sku:"FAR-002",nombre:"Tamoxifeno 20mg",cat:"Fármacos PCT/AI",marca:"Genérico",pres:"Comp. 50u",precio:22000,stock:20,stockMin:5,activo:true,imagen:"/farma/fapasa-emadian.png"},
  {sku:"FAR-003",nombre:"HCG 5000 UI",cat:"Fármacos PCT/AI",marca:"Cooper Pharma",pres:"Kit",precio:45000,stock:10,stockMin:2,activo:true,imagen:"/farma/landerlan-hcg.jpg"},
  {sku:"SUP-001",nombre:"Whey 1kg Chocolate",cat:"Suplementos",marca:"ENA Sport",pres:"Polvo 1kg",precio:45000,stock:30,stockMin:8,activo:true,imagen:"/farma/ec-androt-v2.png"},
  {sku:"SUP-002",nombre:"Whey 1kg Vainilla",cat:"Suplementos",marca:"ENA Sport",pres:"Polvo 1kg",precio:45000,stock:25,stockMin:8,activo:true,imagen:"/farma/ec-androt-v2.png"},
  {sku:"SUP-003",nombre:"Creatina + Electrolitos 300g",cat:"Suplementos",marca:"ENA Sport",pres:"Polvo 300g",precio:18000,stock:40,stockMin:10,activo:true,imagen:"/farma/ec-7keto-25-v2.png"},
  {sku:"SUP-004",nombre:"C4 Original Sandía",cat:"Suplementos",marca:"Cellucor",pres:"Polvo 250g",precio:52000,stock:20,stockMin:5,activo:true,imagen:"/farma/cafeina-v2.png"},
  {sku:"VIT-001",nombre:"Omega-3 90 caps",cat:"Vitaminas",marca:"Landerfit",pres:"Cáps. 90u",precio:16000,stock:35,stockMin:8,activo:true,imagen:"/farma/evodia-omega-v2.png"},
  {sku:"VIT-002",nombre:"Vitamina D3 5000 UI",cat:"Vitaminas",marca:"Now Foods",pres:"Cáps. 90u",precio:14000,stock:30,stockMin:8,activo:true,imagen:"/farma/ec-b12-v2.png"},
  {sku:"ACC-001",nombre:"Jeringa 1ml 25G",cat:"Accesorios",marca:"Genérico",pres:"Unidad",precio:1200,stock:200,stockMin:30,activo:true,imagen:"/farma/eticos-lipoless-15-jeringas.png"},
  {sku:"CMB-001",nombre:"Kit PCT Completo",cat:"Combos",marca:"Genérico",pres:"Kit",precio:68000,stock:8,stockMin:2,activo:true,imagen:"/farma/landerlan-drostanolona.jpg"},
];

export const formatCurrency = n => "$\u200b" + Math.round(n || 0).toLocaleString("es-AR");
export const formatDateTime = d => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export const generateSaleId = () => "VTA-" + Date.now().toString(36).toUpperCase();
