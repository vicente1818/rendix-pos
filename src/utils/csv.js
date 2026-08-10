export function downloadCSV(rows, filename) {
  // RFC 4180: use CRLF line endings; wrap every field in quotes; double internal quotes.
  // Embedded newlines inside a field are also allowed by RFC 4180 since the field is quoted.
  const csv = "\ufeff" + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export function exportVentas(sales) {
  const header = ["ID", "Fecha", "Canal", "Vendedor", "Cliente", "Tel", "Instagram", "Ciudad", "Método", "Productos", "Subtotal", "Desc%", "Total", "Estado"];
  const rows = sales.map(v => [
    v.id, v.fecha, v.canal, v.vendedor,
    v.cli?.nombre || "", v.cli?.tel || "", v.cli?.ig || "", v.cli?.ciudad || "",
    v.metodo,
    (v.items || []).map(i => `${i.qty}x ${i.nombre}`).join(" | "),
    v.subtotal, v.descPct + "%", v.total, v.estado,
  ]);
  downloadCSV([header, ...rows], `rendix-ventas-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportProductos(products) {
  const header = ["SKU", "Nombre", "Categoría", "Marca", "Presentación", "Precio", "Stock", "StockMínimo"];
  const rows = products.map(p => [p.sku, p.nombre, p.cat, p.marca, p.pres, p.precio, p.stock, p.stockMin]);
  downloadCSV([header, ...rows], `rendix-productos-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportVentasSummary(sales) {
  const today = new Date().toISOString().slice(0, 10);
  const header = ["Fecha", "Hora", "Vendedor", "Productos", "Cantidad items", "Total"];
  const rows = sales.map(v => {
    const d = new Date(v.fecha);
    const fecha = d.toLocaleDateString("es-AR");
    const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const productos = (v.items || []).map(i => `${i.qty}x ${i.nombre}`).join(" | ");
    const cantItems = (v.items || []).reduce((s, i) => s + (i.qty || 0), 0);
    return [fecha, hora, v.vendedor || "", productos, cantItems, v.total];
  });
  downloadCSV([header, ...rows], `ventas_${today}.csv`);
}

export function exportClientes(sales) {
  const map = {};
  sales.forEach(s => {
    const k = s.cli?.tel || s.cli?.ig || s.id;
    if (!map[k]) map[k] = { nombre: s.cli?.nombre || "", tel: s.cli?.tel || "", ig: s.cli?.ig || "", ciudad: s.cli?.ciudad || "", compras: 0, total: 0, primera: s.fecha };
    map[k].compras++; map[k].total += s.total; map[k].ultima = s.fecha;
  });
  const header = ["Nombre", "Tel/WhatsApp", "Instagram", "Ciudad", "Nro Compras", "Total Gastado", "Primera Compra", "Última Compra"];
  const rows = Object.values(map).map(c => [c.nombre, c.tel, c.ig, c.ciudad, c.compras, c.total, c.primera, c.ultima]);
  downloadCSV([header, ...rows], `rendix-clientes-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function parseSpanishFloat(valStr) {
  if (!valStr) return 0;
  let s = String(valStr).trim().replace(/[$ \u00a0]/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.indexOf(".") < s.indexOf(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function parseCSVLine(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

export function importCatalogFromCSV(text, existingProducts) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { ok: false, msg: "El archivo está vacío o no tiene datos." };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-záéíóúñ0-9]/gi, ''));
  const findCol = (...keys) => { for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i >= 0) return i; } return -1; };

  const iSku = findCol('sku', 'codigo', 'cod');
  const iNom = findCol('nombre', 'producto', 'name');
  const iPre = findCol('precio', 'price', 'venta', 'pvp');
  const iCat = findCol('categ', 'categoria');
  const iMar = findCol('marca', 'brand');
  const iPres = findCol('presentac', 'pres', 'format');
  const iStk = findCol('stock', 'cantidad', 'cant', 'qty');
  const iMin = findCol('minimo', 'min', 'stockmin', 'stockm');

  if (iSku < 0 || iNom < 0 || iPre < 0) {
    return { ok: false, msg: `No encontré las columnas necesarias.\nEl CSV debe tener al menos: SKU, Nombre/Producto y Precio.\nColumnas detectadas: ${headers.join(', ')}` };
  }

  const imported = []; const updated = []; const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const sku = cols[iSku]?.trim().toUpperCase();
    if (!sku) continue;
    const nombre = cols[iNom]?.trim() || "";
    const precio = parseSpanishFloat(cols[iPre]);
    const stock = iStk >= 0 ? (parseInt(cols[iStk]) || 0) : null;
    const stockMin = iMin >= 0 ? (parseInt(cols[iMin]) || 3) : 3;
    const cat = iCat >= 0 ? cols[iCat]?.trim() || "Suplementos" : "Suplementos";
    const marca = iMar >= 0 ? cols[iMar]?.trim() || "" : "";
    const pres = iPres >= 0 ? cols[iPres]?.trim() || "" : "";

    if (!nombre || precio <= 0) { errors.push(`Fila ${i + 1}: SKU ${sku} sin nombre o precio`); continue; }

    const exists = existingProducts.find(p => p.sku === sku);
    if (exists) {
      updated.push({
        ...exists, nombre, precio, cat, marca, pres,
        stock: stock !== null ? stock : exists.stock,
        stockMin, activo: true
      });
    } else {
      imported.push({
        sku, nombre, cat, marca, pres, precio,
        stock: stock !== null ? stock : 0, stockMin, activo: true
      });
    }
  }

  const kept = existingProducts.filter(p => !updated.find(u => u.sku === p.sku));
  const final = [...imported, ...updated, ...kept];
  return { ok: true, products: final, imported: imported.length, updated: updated.length, errors };
}
