import { FARMA_CATALOG } from "../data/farma-catalog.js";

const DEFAULT_FALLBACK = "/farma/landerlan-drostanolona.jpg";

/**
 * Retorna la mejor URL de imagen local para un producto.
 * Fuerza el uso de imágenes locales en /farma/ para evitar enlaces externos rotos.
 */
export function getProductImage(product) {
  if (!product) return DEFAULT_FALLBACK;

  const img = (product.imagen || "").trim();
  // Si ya tiene una imagen local en /farma/, o una subida/pegada por el usuario
  // (data URL o URL externa), respetarla: no pisar una imagen personalizada.
  if (img.startsWith("/farma/") || img.startsWith("data:image") || /^https?:\/\//i.test(img)) {
    return img;
  }

  const name = (product.nombre || "").toLowerCase();
  const sku = (product.sku || "").toLowerCase();

  // 1. Coincidencia exacta por SKU en FARMA_CATALOG
  const exact = FARMA_CATALOG.find(p => p.sku.toLowerCase() === sku);
  if (exact && exact.imagen && exact.imagen.startsWith("/farma/")) return exact.imagen;

  // 2. Coincidencias por palabras clave en Nombre o SKU
  if (name.includes("landertropin") || name.includes("gh") || sku.includes("gh")) return "/farma/landerlan-landertropin.jpg";
  if (name.includes("gonadotropina") || name.includes("hcg") || sku.includes("hcg")) return "/farma/landerlan-hcg.jpg";
  if (name.includes("oxandroland") || name.includes("oxandrolona") || sku.includes("oxand")) return "/farma/landerlan-oxandroland.jpg";
  if (name.includes("metenolona") || name.includes("primobolan") || sku.includes("primo")) return "/farma/landerlan-primobolan.jpg";
  if (name.includes("stanozoland") || name.includes("stanozolol") || sku.includes("stanoz")) return "/farma/landerlan-stanozoland.jpg";

  if (name.includes("boldenona") || sku.includes("bold")) return "/farma/landerlan-boldenona-250.jpg";
  if (name.includes("brontel") || sku.includes("brontel")) return "/farma/landerlan-clembuterol-brontel.jpg";
  if (name.includes("clembuterol") || sku.includes("clen")) return "/farma/landerlan-clembuterol-04.jpg";
  if (name.includes("cabertrix") || name.includes("cabergolina") || sku.includes("caber")) return "/farma/landerlan-drostanolona.jpg";
  if (name.includes("decaland") || name.includes("nandrolona") || sku.includes("deca")) {
    return name.includes("5ml") ? "/farma/landerlan-decaland-5ml.jpg" : "/farma/landerlan-decaland-10ml.jpg";
  }
  if (name.includes("durateston") || sku.includes("dura")) return "/farma/landerlan-durateston.jpg";
  if (name.includes("biletan") || name.includes("tióctico") || name.includes("tioctico")) return "/farma/biletan-forte.webp";
  if (name.includes("tamsulon duo")) return "/farma/fapasa-tamsulon-duo.png";
  if (name.includes("tamsulon")) return "/farma/fapasa-tamsulon-04.png";
  if (name.includes("emadian") || name.includes("anastrozol") || name.includes("trozolet") || sku.includes("anast")) return "/farma/fapasa-emadian.png";
  if (name.includes("domper")) return "/farma/fapasa-domper.png";
  if (name.includes("cetrizet")) return "/farma/eticos-cetrizet.png";
  if (name.includes("lipoless")) return "/farma/eticos-mdlipoless-15-1v.png";
  if (name.includes("7 keto") || name.includes("7-keto")) return "/farma/ec-7keto-25-v2.png";
  if (name.includes("andro-t") || name.includes("andro t")) return "/farma/ec-androt-v2.png";
  if (name.includes("ashwagandha")) return "/farma/ec-ashwagandha-v2.png";
  if (name.includes("b12")) return "/farma/ec-b12-v2.png";
  if (name.includes("biotin") || name.includes("biotina")) return "/farma/ec-biotin-v2.png";
  if (name.includes("oregano")) return "/farma/evodia-oregano-v2.png";
  if (name.includes("omega")) return "/farma/evodia-omega-v2.png";
  if (name.includes("lady")) return "/farma/evodia-lady-v2.png";
  if (name.includes("granagard")) return "/farma/evodia-granagard-v2.png";
  if (name.includes("desincha") || name.includes("desinchá")) return "/farma/desincha-v2.png";
  if (name.includes("cafeina") || name.includes("caffeine")) return "/farma/cafeina-v2.png";

  return DEFAULT_FALLBACK;
}

/**
 * Escanea y repara automáticamente las URLs de imagen de una lista de productos
 */
export function autoFixProductImages(products) {
  if (!Array.isArray(products)) return [];
  return products.map(p => {
    const fixedImage = getProductImage(p);
    return {
      ...p,
      imagen: fixedImage
    };
  });
}
