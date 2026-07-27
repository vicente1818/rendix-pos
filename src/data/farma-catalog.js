// ═══════════════════════════════════════════════════════════════════════════
// RENDIX POS · Catálogo FARMA EL NEGRO - COMPLETO
// Imágenes: 31 archivos locales en /public/farma/ (sin dependencia externa)
// Precios en Guaraníes (₲) con descuento aplicado
// 35 productos: Esteroides, Lipolíticos, Vitaminas, Diuréticos
// Fuente: elnegro.com.py — descargado Julio 2026
// ═══════════════════════════════════════════════════════════════════════════

// Ruta base local — las imágenes están en /public/farma/
const I = (f) => `/farma/${f}`;
// Placeholder para esteroides Landerlan sin imagen específica disponible
const LANDERLAN_PLACEHOLDER = I("landerlan-drostanolona.jpg");

export const FARMA_CATALOG = [

  // ══════════════════════════════════════════════════════════════════════════
  // FAPASA — Medicamentos farmacéuticos
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "FAP-TAMS-DUO-05-30",
    nombre: "Fapasa – Tamsulon Duo 0,5 Mg X 30 Caps",
    cat: "Farma", marca: "Fapasa", pres: "30 Cápsulas",
    precio: 243798, precioOriginal: 348283, stock: 10, stockMin: 3, activo: true,
    imagen: I("fapasa-tamsulon-duo.png"),
    url: "https://elnegro.com.py/producto/fapasa-tamsulon-duo-05-mg-x-30-caps/",
    descripcion: "Dutasterida 0,5mg + Tamsulosina 0,4mg. Hiperplasia prostática benigna.",
  },
  {
    sku: "FAP-TAMS-04-30",
    nombre: "Fapasa – Tamsulon 0,4 Mg X 30 Caps",
    cat: "Farma", marca: "Fapasa", pres: "30 Cápsulas",
    precio: 222361, precioOriginal: 317658, stock: 10, stockMin: 3, activo: true,
    imagen: I("fapasa-tamsulon-04.png"),
    url: "https://elnegro.com.py/producto/fapasa-tamsulon-04-mg-x-30-caps/",
    descripcion: "Tamsulosina 0,4mg. Síntomas urinarios por hiperplasia prostática.",
  },
  {
    sku: "FAP-EMAD-25-30",
    nombre: "Fapasa – Emadian 25 Mg X 30 Comprimidos",
    cat: "Farma", marca: "Fapasa", pres: "30 Comprimidos",
    precio: 225000, precioOriginal: 321428, stock: 10, stockMin: 3, activo: true,
    imagen: I("fapasa-emadian.png"),
    url: "https://elnegro.com.py/producto/fapasa-emadian-25-mg-x-30-comprimidos/",
    descripcion: "Antidepresivo. Depresión y trastornos de ansiedad.",
  },
  {
    sku: "FAP-DOMP-30",
    nombre: "Fapasa – Domper Digest X 30 Comprimidos",
    cat: "Farma", marca: "Fapasa", pres: "30 Comprimidos",
    precio: 74370, precioOriginal: 106243, stock: 15, stockMin: 5, activo: true,
    imagen: I("fapasa-domper.png"),
    url: "https://elnegro.com.py/producto/fapasa-domper-digest-x-30-comprimidos/",
    descripcion: "Domperidona. Náuseas, vómitos y trastornos digestivos.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ETICOS — Antihistamínico
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "ETC-CETR-10-10",
    nombre: "Eticos – Cetrizet 10 Mg Perlas X 10 Caps",
    cat: "Farma", marca: "Eticos", pres: "10 Cápsulas Perlas",
    precio: 56000, precioOriginal: 80000, stock: 20, stockMin: 5, activo: true,
    imagen: I("eticos-cetrizet.png"),
    url: "https://elnegro.com.py/producto/eticos-cetrizet-10-mg-perlas-x-10-caps/",
    descripcion: "Cetirizina 10mg. Antihistamínico para alergias y rinitis.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ETICOS — Lipolíticos Lipoless (inyectables)
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "ETC-MDLIP-15-1V",
    nombre: "Eticos – Md Lipoless 15 Mg X 1 Vial 2,4 Ml",
    cat: "Farma", marca: "Eticos", pres: "1 Vial 2,4ml",
    precio: 999000, precioOriginal: 1427143, stock: 5, stockMin: 2, activo: true,
    imagen: I("eticos-mdlipoless-15-1v.png"),
    url: "https://elnegro.com.py/producto/eticos-md-lipoless-15-mg-x-1-vial-de-24-ml/",
    descripcion: "Lipolítico inyectable 15mg. Reducción localizada de grasa.",
  },
  {
    sku: "ETC-LIP15-4V",
    nombre: "Eticos – Lipoless 15 Mg X 4 Viales",
    cat: "Farma", marca: "Eticos", pres: "4 Viales",
    precio: 890000, precioOriginal: 1271428, stock: 5, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-15-viales.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-15-mg-x-4-viales/",
    descripcion: "Lipolítico 15mg x4. Alta concentración para reducción avanzada.",
  },
  {
    sku: "ETC-LIP15-4J",
    nombre: "Eticos – Lipoless 15 Mg x 4 Jeringas C/Vastago",
    cat: "Farma", marca: "Eticos", pres: "4 Jeringas con vástago",
    precio: 930000, precioOriginal: 1328571, stock: 5, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-15-jeringas.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-15-mg-x-4-jeringas-c-vastago/",
    descripcion: "Lipolítico 15mg set completo con jeringas y vástago.",
  },
  {
    sku: "ETC-LIP75-4V",
    nombre: "Eticos – Lipoless 7,5 Mg X 4 Viales",
    cat: "Farma", marca: "Eticos", pres: "4 Viales",
    precio: 849000, precioOriginal: 1212857, stock: 5, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-75-viales.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-75-mg-x-4-viales/",
    descripcion: "Lipolítico 7,5mg x4. Reducción de grasa localizada.",
  },
  {
    sku: "ETC-LIP75-4J",
    nombre: "Eticos – Lipoless 7,5 Mg x 4 Jeringas C/Vastago",
    cat: "Farma", marca: "Eticos", pres: "4 Jeringas con vástago",
    precio: 795700, precioOriginal: 1136714, stock: 5, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-75-jeringas.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-75-mg-x-4-jeringas-c-vastago/",
    descripcion: "Lipolítico 7,5mg set completo con jeringas y vástago.",
  },
  {
    sku: "ETC-LIP5-4V",
    nombre: "Eticos – Lipoless 5 Mg x 4 Viales",
    cat: "Farma", marca: "Eticos", pres: "4 Viales",
    precio: 620000, precioOriginal: 885714, stock: 8, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-5-viales.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-5-mg-x-4-viales/",
    descripcion: "Lipolítico 5mg x4. Concentración estándar.",
  },
  {
    sku: "ETC-LIP5-4J",
    nombre: "Eticos – Lipoless 5 Mg x 4 Jeringas C/Vastago",
    cat: "Farma", marca: "Eticos", pres: "4 Jeringas con vástago",
    precio: 672200, precioOriginal: 960285, stock: 8, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-5-jeringas.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-5-mg-x-4-jeringas-c-vastago/",
    descripcion: "Lipolítico 5mg set jeringas con vástago.",
  },
  {
    sku: "ETC-LIP25-4V",
    nombre: "Eticos – Lipoless 2,5 Mg X 4 Viales",
    cat: "Farma", marca: "Eticos", pres: "4 Viales",
    precio: 520000, precioOriginal: 742857, stock: 8, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-25-viales.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-25-mg-x-4-viales/",
    descripcion: "Lipolítico 2,5mg x4. Concentración de inicio.",
  },
  {
    sku: "ETC-LIP25-4J",
    nombre: "Eticos – Lipoless 2,5 Mg x 4 Jeringas C/Vastago",
    cat: "Farma", marca: "Eticos", pres: "4 Jeringas con vástago",
    precio: 560000, precioOriginal: 800000, stock: 8, stockMin: 2, activo: true,
    imagen: I("eticos-lipoless-25-jeringas.png"),
    url: "https://elnegro.com.py/producto/eticos-lipoless-25-mg-x-4-jeringas-c-vastago/",
    descripcion: "Lipolítico 2,5mg set jeringas con vástago.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LANDERLAN GOLD — Esteroides & Anabólicos
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "LAN-BOLD-250-10ML",
    nombre: "Boldenona Undecilenato Landerlan Gold 250mg/ml X 10 Ml",
    cat: "Farma", marca: "Landerlan Gold", pres: "Vial 10ml",
    precio: 189000, precioOriginal: 270000, stock: 10, stockMin: 3, activo: true,
    imagen: I("landerlan-boldenona-250.jpg"),
    url: "https://elnegro.com.py/producto/boldenona-undecilenato-250mg-ml-landerlan-gold-x-10-ml/",
    descripcion: "Boldenona Undecilenato 250mg/ml. Volumen muscular y resistencia.",
  },
  {
    sku: "LAN-CLEM-002-20",
    nombre: "BRONTEL Clenbuterol Clorhidrato 0,02 mg – 20 Comprimidos",
    cat: "Farma", marca: "Brontel", pres: "20 Comprimidos",
    precio: 62000, precioOriginal: 88570, stock: 20, stockMin: 5, activo: true,
    imagen: I("landerlan-clembuterol-brontel.jpg"),
    url: "https://elnegro.com.py/producto/brontel-clenbuterol-clorhidrato-002-mg-caja-de-20-comprimidos/",
    descripcion: "Clenbuterol 0,02mg. Broncodilatador y quemador de grasa.",
  },
  {
    sku: "LAN-CABER-050-8",
    nombre: "CABERTRIX Cabergolina 0,50 mg – 8 Comprimidos",
    cat: "Farma", marca: "Cabertrix", pres: "8 Comprimidos",
    precio: 145000, precioOriginal: 207142, stock: 10, stockMin: 3, activo: true,
    imagen: LANDERLAN_PLACEHOLDER,
    url: "https://elnegro.com.py/producto/cabertrix-cabergolina-050-mg-caja-de-8-comprimidos/",
    descripcion: "Cabergolina 0,50mg. Control de prolactina en ciclos anabólicos.",
  },
  {
    sku: "LAN-CABER-050-2",
    nombre: "CABERTRIX Cabergolina 0,50 mg – 2 Comprimidos",
    cat: "Farma", marca: "Cabertrix", pres: "2 Comprimidos",
    precio: 48000, precioOriginal: 68571, stock: 15, stockMin: 5, activo: true,
    imagen: LANDERLAN_PLACEHOLDER,
    url: "https://elnegro.com.py/producto/cabertrix-cabergolina-050-mg-caja-de-2-comprimidos/",
    descripcion: "Cabergolina 0,50mg x 2. Dosis individual.",
  },
  {
    sku: "LAN-CLEM-004-50",
    nombre: "CLEMBUTEROL 0,04 Mg X 50 Comprimidos – Landerlan",
    cat: "Farma", marca: "Landerlan", pres: "50 Comprimidos",
    precio: 95000, precioOriginal: 135714, stock: 15, stockMin: 5, activo: true,
    imagen: I("landerlan-clembuterol-04.jpg"),
    url: "https://elnegro.com.py/producto/clembuterol-004-mg-x-50-comprimidos-landerlan/",
    descripcion: "Clembuterol 0,04mg x50. Ciclos de definición y corte.",
  },
  {
    sku: "LAN-DECA-200-10ML",
    nombre: "DECALAND Depot 200mg X 10 Ml – Landerlan Gold",
    cat: "Farma", marca: "Landerlan Gold", pres: "Vial 10ml",
    precio: 175000, precioOriginal: 250000, stock: 10, stockMin: 3, activo: true,
    imagen: LANDERLAN_PLACEHOLDER,
    url: "https://elnegro.com.py/producto/decaland-depot-200mg-ml-x-10-ml-landerlan-gold/",
    descripcion: "Decanoato de Nandrolona 200mg/ml. Volumen y recuperación muscular.",
  },
  {
    sku: "LAN-DECA-200-5ML",
    nombre: "DECALAND Depot 200mg x 5ml – Decanoato Nandrolona",
    cat: "Farma", marca: "Landerlan Gold", pres: "Vial 5ml",
    precio: 98000, precioOriginal: 140000, stock: 10, stockMin: 3, activo: true,
    imagen: LANDERLAN_PLACEHOLDER,
    url: "https://elnegro.com.py/producto/decaland-depot-200-mg-ml-x-5-ml-decanoato-de-nandrolona/",
    descripcion: "Decanoato de Nandrolona 200mg/ml x 5ml. Presentación mediana.",
  },
  {
    sku: "LAN-DROST-100-10ML",
    nombre: "DROSTANOLONA Propionato 100 Mg/ml Landerlan Gold X 10 Ml",
    cat: "Farma", marca: "Landerlan Gold", pres: "Vial 10ml",
    precio: 185000, precioOriginal: 264285, stock: 8, stockMin: 2, activo: true,
    imagen: I("landerlan-drostanolona.jpg"),
    url: "https://elnegro.com.py/producto/drostanolona-propionato-100-mg-ml-landerlan-gold-x-10-ml/",
    descripcion: "Drostanolona Propionato 100mg/ml. Definición y competencia.",
  },
  {
    sku: "LAN-DURA-250-10ML",
    nombre: "DURATESTON Plusgold 250 Mg/ml X 10 Ml – Landerlan Gold",
    cat: "Farma", marca: "Landerlan Gold", pres: "Vial 10ml",
    precio: 178000, precioOriginal: 254285, stock: 10, stockMin: 3, activo: true,
    imagen: LANDERLAN_PLACEHOLDER,
    url: "https://elnegro.com.py/producto/durateston-plusgold-250-mg-ml-x-10-ml-landerlan-gold/",
    descripcion: "Mezcla de testosteronas 250mg/ml. Máximo volumen muscular.",
  },
  {
    sku: "LAN-BILETAN-50-20",
    nombre: "Biletan Forte Ácido Tióctico 50mg – 20 Comprimidos",
    cat: "Farma", marca: "Biletan", pres: "20 Comprimidos",
    precio: 55000, precioOriginal: 78571, stock: 15, stockMin: 5, activo: true,
    imagen: LANDERLAN_PLACEHOLDER,
    url: "https://elnegro.com.py/producto/biletan-forte-acido-tioctico-50-mg-caja-de-20-comprimidos-revestidos/",
    descripcion: "Ácido Alfa Lipoico (Tióctico) 50mg. Antioxidante hepático.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EARTH'S CREATION — Vitaminas y Booster
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "EC-7KETO-25-60",
    nombre: "Earth's Creation – 7 Keto Dhea 25 Mg X 60 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Cápsulas",
    precio: 89000, precioOriginal: 127142, stock: 10, stockMin: 3, activo: true,
    imagen: I("ec-7keto-25-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-7-keto-dhea-25-mg-x-60-caps/",
    descripcion: "7-Keto DHEA 25mg. Metabolismo y quema de grasa.",
  },
  {
    sku: "EC-7KETO-50-60",
    nombre: "Earth's Creation – 7 Keto Dhea 50 Mg X 60 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Cápsulas",
    precio: 115000, precioOriginal: 164285, stock: 10, stockMin: 3, activo: true,
    imagen: I("ec-7keto-50-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-7-keto-dhea-50-mg-x-60-caps/",
    descripcion: "7-Keto DHEA 50mg. Alta dosis termogénica.",
  },
  {
    sku: "EC-ANDROT-60",
    nombre: "Earth's Creation – Andro-T X 60 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Cápsulas",
    precio: 145000, precioOriginal: 207142, stock: 8, stockMin: 3, activo: true,
    imagen: I("ec-androt-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-andro-t-x-60-caps/",
    descripcion: "Andro-T – booster de testosterona natural.",
  },
  {
    sku: "EC-ARTICH-500-60",
    nombre: "Earth's Creation – Artichoke 500 Mg X 60 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Cápsulas",
    precio: 75000, precioOriginal: 107142, stock: 10, stockMin: 3, activo: true,
    imagen: I("ec-artichoke-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-artichoke-500-mg-x-60-caps/",
    descripcion: "Alcachofa 500mg. Hígado, digestión y colesterol.",
  },
  {
    sku: "EC-ASHWA-470-60",
    nombre: "Earth's Creation – Ashwagandha 470 Mg X 60 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Cápsulas",
    precio: 98000, precioOriginal: 140000, stock: 10, stockMin: 3, activo: true,
    imagen: I("ec-ashwagandha-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-ashwagandha-470-mg-x-60-caps/",
    descripcion: "Ashwagandha 470mg. Reduce cortisol y estrés. Adaptógeno.",
  },
  {
    sku: "EC-ASHWA-GUM-60",
    nombre: "Earth's Creation – Ashwagandha Gummy X 60",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Gummies",
    precio: 85000, precioOriginal: 121428, stock: 10, stockMin: 3, activo: true,
    imagen: I("ec-ashwagandha-gummy-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-artichoke-gummy-x-60/",
    descripcion: "Ashwagandha en gomitas. Fácil consumo diario.",
  },
  {
    sku: "EC-B12-1000-60",
    nombre: "Earth's Creation – B12 1000Mcg X 60 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "60 Cápsulas",
    precio: 62000, precioOriginal: 88571, stock: 15, stockMin: 5, activo: true,
    imagen: I("ec-b12-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-b12-1000mcg-x-60-caps/",
    descripcion: "Vitamina B12 1000mcg. Energía, sistema nervioso.",
  },
  {
    sku: "EC-BIOTIN-10MG-100",
    nombre: "Earth's Creation – Biotin 10 Mg X 100 Caps",
    cat: "Farma", marca: "Earth's Creation", pres: "100 Cápsulas",
    precio: 78000, precioOriginal: 111428, stock: 15, stockMin: 5, activo: true,
    imagen: I("ec-biotin-v2.png"),
    url: "https://elnegro.com.py/producto/earths-creation-biotin-10-mg-x-100-caps/",
    descripcion: "Biotina 10mg. Cabello, uñas y piel.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EVODIA — Suplementos naturales
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "EVO-OREG-60",
    nombre: "Evodia – Oregano Oil X 60 Softgel",
    cat: "Farma", marca: "Evodia", pres: "60 Softgel",
    precio: 95000, precioOriginal: 135714, stock: 10, stockMin: 3, activo: true,
    imagen: I("evodia-oregano-v2.png"),
    url: "https://elnegro.com.py/producto/evodia-oregano-oil-x-60-softgel/",
    descripcion: "Aceite de Orégano. Antimicrobiano y antioxidante natural.",
  },
  {
    sku: "EVO-OMEGA-980-30",
    nombre: "Evodia – Omega 980 Mg X 30 Caps",
    cat: "Farma", marca: "Evodia", pres: "30 Cápsulas",
    precio: 72000, precioOriginal: 102857, stock: 15, stockMin: 5, activo: true,
    imagen: I("evodia-omega-v2.png"),
    url: "https://elnegro.com.py/producto/evodia-omega-980-mg-x-30-caps/",
    descripcion: "Omega 3 980mg. EPA/DHA corazón, articulaciones y cerebro.",
  },
  {
    sku: "EVO-LADY-30",
    nombre: "Evodia – Lady Complex X 30 Caps",
    cat: "Farma", marca: "Evodia", pres: "30 Cápsulas",
    precio: 88000, precioOriginal: 125714, stock: 10, stockMin: 3, activo: true,
    imagen: I("evodia-lady-v2.png"),
    url: "https://elnegro.com.py/producto/evodia-lady-complex-x-30-caps/",
    descripcion: "Complejo femenino multivitamínico. Salud hormonal.",
  },
  {
    sku: "EVO-GRAN-60",
    nombre: "Evodia – Granagard X 60 Caps",
    cat: "Farma", marca: "Evodia", pres: "60 Cápsulas",
    precio: 115000, precioOriginal: 164285, stock: 10, stockMin: 3, activo: true,
    imagen: I("evodia-granagard-v2.png"),
    url: "https://elnegro.com.py/producto/evodia-granagard-x-60-caps/",
    descripcion: "Extracto de granada. Antioxidante potente.",
  },
  {
    sku: "EVO-IRON-90",
    nombre: "Evodia – Gentle Iron Complex X 90 Caps",
    cat: "Farma", marca: "Evodia", pres: "90 Cápsulas",
    precio: 82000, precioOriginal: 117142, stock: 10, stockMin: 3, activo: true,
    imagen: I("evodia-oregano-v2.png"),
    url: "https://elnegro.com.py/producto/evodia-gentle-iron-complex-x-90-caps/",
    descripcion: "Hierro suave + vitaminas B. Sin estreñimiento.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DESINCHA & ALLWAYS
  // ══════════════════════════════════════════════════════════════════════════
  {
    sku: "DES-DIANOCHE-60",
    nombre: "Desincha – Dia/Noche X 60 Unid",
    cat: "Farma", marca: "Desincha", pres: "60 Saquitos",
    precio: 68000, precioOriginal: 97142, stock: 15, stockMin: 5, activo: true,
    imagen: I("desincha-v2.png"),
    url: "https://elnegro.com.py/producto/desincha-dia-noche-x-60-saquitos/",
    descripcion: "Diurético natural. Reduce retención de líquidos día y noche.",
  },
  {
    sku: "ALL-CAFF-550-60",
    nombre: "Cafeína 550mg Allways 60 Cápsulas",
    cat: "Farma", marca: "Allways", pres: "60 Cápsulas",
    precio: 45000, precioOriginal: 64285, stock: 20, stockMin: 5, activo: true,
    imagen: I("cafeina-v2.png"),
    url: "https://elnegro.com.py/producto/allways-caffeine-power-550-mg-x-60-caps/",
    descripcion: "Cafeína anhidra 550mg. Energía, foco y termogénesis.",
  },
];

/**
 * Mezcla el catálogo FARMA con los productos existentes del POS.
 * No sobreescribe productos si ya existe el SKU.
 */
export function mergeFarmaIntoExistingCatalog(existingProducts = []) {
  const existingSkus = new Set(existingProducts.map((p) => p.sku));
  const newProducts = FARMA_CATALOG.filter((p) => !existingSkus.has(p.sku));
  return [...existingProducts, ...newProducts];
}
