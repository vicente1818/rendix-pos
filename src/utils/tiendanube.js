export function fileToDataURL(file) {
  return new Promise((res, rej) => {
    if (file.size > 1.5 * 1024 * 1024) {
      rej(new Error("La imagen no puede superar 1.5 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = () => rej(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function mapTNProducts(items) {
  const result = [];
  for (const p of items) {
    const nombre = p.name?.es || p.name?.pt || Object.values(p.name || {})[0] || `Producto ${p.id}`;
    const cat = p.categories?.[0]?.name?.es || "Suplementos";
    const imagen = p.images?.[0]?.src || "";
    for (const v of (p.variants || [])) {
      const baseSku = (v.sku || `TN${p.id}V${v.id}`).toUpperCase();
      const varLabel = (v.values || []).length
        ? " — " + v.values.map(x => x.es || x.pt || String(x)).join(" / ")
        : "";
      result.push({
        sku: baseSku,
        nombre: p.variants.length > 1 ? nombre + varLabel : nombre,
        cat, marca: "", pres: "",
        precio: parseFloat(v.price || "0"),
        stock: v.stock === null ? 999 : (parseInt(v.stock) || 0),
        stockMin: 3, activo: true, imagen,
        _tnId: p.id, _tnVid: v.id,
      });
    }
  }
  return result;
}

export function mergeTNProducts(local, tnProds) {
  const byVid = {};
  tnProds.forEach(p => { if (p._tnVid) byVid[p._tnVid] = p; });
  const updated = local.map(p => {
    const tn = p._tnVid ? byVid[p._tnVid] : null;
    if (!tn) return p;
    return { ...p, precio: tn.precio, stock: tn.stock, nombre: tn.nombre, imagen: p.imagen || tn.imagen };
  });
  const existingVids = new Set(local.filter(p => p._tnVid).map(p => p._tnVid));
  return [...updated, ...tnProds.filter(p => p._tnVid && !existingVids.has(p._tnVid))];
}

export async function fetchFromTiendaNube(storeId, token) {
  if (!storeId || !token) return null;
  try {
    let all = [], page = 1;
    while (true) {
      const r = await fetch(
        `https://api.tiendanube.com/v1/${storeId}/products?page=${page}&per_page=200`,
        { headers: { "Authentication": `bearer ${token}`, "User-Agent": "RendixPOS (pos@rendix.app)" } }
      );
      if (!r.ok) { console.warn("TiendaNube HTTP", r.status); return null; }
      const data = await r.json();
      if (!Array.isArray(data) || !data.length) break;
      all = [...all, ...data];
      if (data.length < 200) break;
      page++;
    }
    return mapTNProducts(all);
  } catch (e) { console.warn("TiendaNube error:", e); return null; }
}
