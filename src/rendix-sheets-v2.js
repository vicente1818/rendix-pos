// ═══════════════════════════════════════════════════════════════════════════
// RENDIX · Google Apps Script v2 · Hub central
// ═══════════════════════════════════════════════════════════════════════════
//
// CÓMO CONFIGURAR (5 minutos):
// 1. Abrí tu Google Sheet → Extensiones → Apps Script
// 2. Borrá todo y pegá este código → Guardar
// 3. Implementar → Nueva implementación
//    Tipo: Aplicación web
//    Ejecutar como: Yo
//    Quién tiene acceso: Cualquier persona
// 4. Copiá la URL del Web App
// 5. Pegála en la app RENDIX → Config → URL del Web App → Guardar
//
// CÓMO CARGAR EL CATÁLOGO DESDE EXCEL:
// - En Sheets: Archivo → Importar → subís el .xlsx
// - O copiás y pegás las filas del Excel directamente en la hoja "Catálogo"
// - La app lee el catálogo de esta hoja automáticamente
//
// CÓMO EXPORTAR A EXCEL:
// - En Sheets: Archivo → Descargar → Microsoft Excel (.xlsx)
// ═══════════════════════════════════════════════════════════════════════════

const HOJA_VENTAS   = "Ventas";
const HOJA_STOCK    = "Movimientos Stock";
const HOJA_CLIENTES = "Clientes";
const HOJA_CATALOGO = "Catálogo";
const HOJA_RESUMEN  = "Resumen";

// ── GET: la app lee el catálogo y hace ping de conexión ──────────────────────
function doGet(e) {
  const action = e?.parameter?.action || "ping";

  if (action === "catalog") {
    return servirCatalogo();
  }

  // Ping de conexión
  return respuesta({
    status: "connected",
    version: "2.0",
    timestamp: new Date().toISOString(),
    message: "RENDIX Hub activo"
  });
}

function servirCatalogo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_CATALOGO);

  if (!sheet || sheet.getLastRow() < 2) {
    return respuesta({ status: "empty", products: [] });
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());

  const idx = {
    sku:      headers.findIndex(h => h.includes("sku") || h.includes("código")),
    nombre:   headers.findIndex(h => h.includes("nombre") || h.includes("producto")),
    cat:      headers.findIndex(h => h.includes("categ")),
    marca:    headers.findIndex(h => h.includes("marca")),
    pres:     headers.findIndex(h => h.includes("presentac")),
    precio:   headers.findIndex(h => h.includes("precio") && h.includes("pub") || h === "precio publicado" || h.includes("precio venta")),
    stock:    headers.findIndex(h => h.includes("stock actual") || h === "stock"),
    stockMin: headers.findIndex(h => h.includes("mínimo") || h.includes("minimo") || h.includes("stock mín")),
    activo:   headers.findIndex(h => h.includes("estado")),
  };

  // Fallback para precio si no encontró
  if (idx.precio < 0) {
    idx.precio = headers.findIndex(h => h.includes("precio"));
  }

  const products = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sku = String(row[idx.sku] || "").trim().toUpperCase();
    if (!sku) continue;

    const precio = parseFloat(String(row[idx.precio] || "0").replace(/[^0-9.]/g, "")) || 0;
    const nombre = String(row[idx.nombre] || "").trim();
    if (!nombre || precio <= 0) continue;

    const estado = idx.activo >= 0 ? String(row[idx.activo] || "Activo") : "Activo";

    products.push({
      sku,
      nombre,
      cat:      idx.cat      >= 0 ? String(row[idx.cat]      || "Suplementos").trim() : "Suplementos",
      marca:    idx.marca    >= 0 ? String(row[idx.marca]     || "").trim()            : "",
      pres:     idx.pres     >= 0 ? String(row[idx.pres]      || "").trim()            : "",
      precio,
      stock:    idx.stock    >= 0 ? (parseInt(row[idx.stock]) || 0)                    : 0,
      stockMin: idx.stockMin >= 0 ? (parseInt(row[idx.stockMin]) || 3)                 : 3,
      activo:   estado.toLowerCase().includes("activo"),
    });
  }

  return respuesta({ status: "ok", products, count: products.length });
}

// ── POST: recibe ventas y actualizaciones de stock desde la app ──────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === "venta") {
      registrarVenta(ss, data);
      registrarMovimientoStock(ss, data);
      actualizarCliente(ss, data);
      actualizarStockEnCatalogo(ss, data);
      actualizarResumen(ss);
    }

    if (data.type === "stock_update") {
      const sheet = obtenerOCrear(ss, HOJA_STOCK);
      if (sheet.getLastRow() === 0) agregarHeadersStock(sheet);
      sheet.appendRow([
        new Date().toISOString(),
        data.sku, data.nombre || "",
        "Actualización manual", "",
        data.stockAnterior || "", data.stockNuevo || "",
        (data.stockNuevo || 0) - (data.stockAnterior || 0)
      ]);
      // También actualiza el catálogo
      actualizarStockProductoEnCatalogo(ss, data.sku, data.stockNuevo);
    }

    return respuesta({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    return respuesta({ status: "error", message: err.toString() });
  }
}

// ── Actualiza el stock en la hoja Catálogo cuando se registra una venta ──────
function actualizarStockEnCatalogo(ss, data) {
  (data.items || []).forEach(item => {
    actualizarStockProductoEnCatalogo(ss, item.sku, null, -(item.qty || 0));
  });
}

function actualizarStockProductoEnCatalogo(ss, sku, nuevoStock, delta) {
  const sheet = ss.getSheetByName(HOJA_CATALOGO);
  if (!sheet || sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const iSku   = headers.findIndex(h => h.includes("sku") || h.includes("código"));
  const iStock = headers.findIndex(h => h.includes("stock actual") || h === "stock");
  if (iSku < 0 || iStock < 0) return;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iSku]).trim().toUpperCase() === sku.toUpperCase()) {
      const stockActual = parseInt(data[i][iStock]) || 0;
      const nuevo = nuevoStock !== null ? nuevoStock : Math.max(0, stockActual + (delta || 0));
      sheet.getRange(i + 1, iStock + 1).setValue(nuevo);
      break;
    }
  }
}

// ── Registra venta en hoja Ventas ────────────────────────────────────────────
function registrarVenta(ss, data) {
  const sheet = obtenerOCrear(ss, HOJA_VENTAS);
  if (sheet.getLastRow() === 0) {
    const h = ["ID","Fecha","Canal","Vendedor","Nombre","Tel/WA","Instagram","Ciudad","Pago","Productos","Subtotal","Desc%","Desc$","Total","Estado"];
    sheet.appendRow(h);
    const r = sheet.getRange(1,1,1,h.length);
    r.setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF").setFontSize(10);
    sheet.setFrozenRows(1);
  }
  const productos = (data.items||[]).map(i=>`${i.qty}x ${i.nombre}`).join(" | ");
  const lastRow = sheet.appendRow([
    data.id||"", data.fecha||"", data.canal||"", data.vendedor||"",
    data.cli?.nombre||"", data.cli?.tel||"", data.cli?.ig||"", data.cli?.ciudad||"",
    data.metodo||"", productos,
    data.subtotal||0, (data.descPct||0)+"%", data.descMonto||0, data.total||0, data.estado||"Confirmado"
  ]);
  const lr = sheet.getLastRow();
  sheet.getRange(lr,11,1,4).setNumberFormat("$#,##0");
  if (lr % 2 === 0) sheet.getRange(lr,1,1,15).setBackground("#F8F8F8");
}

// ── Movimientos de stock ─────────────────────────────────────────────────────
function registrarMovimientoStock(ss, data) {
  const sheet = obtenerOCrear(ss, HOJA_STOCK);
  if (sheet.getLastRow() === 0) agregarHeadersStock(sheet);
  (data.items||[]).forEach(item => {
    sheet.appendRow([data.fecha||"", item.sku||"", item.nombre||"", "Venta", data.id||"", "", "", -(item.qty||0)]);
  });
}

function agregarHeadersStock(sheet) {
  const h = ["Fecha","SKU","Producto","Motivo","ID Venta","Stock Anterior","Stock Nuevo","Variación"];
  sheet.appendRow(h);
  sheet.getRange(1,1,1,h.length).setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF").setFontSize(10);
  sheet.setFrozenRows(1);
}

// ── Clientes ─────────────────────────────────────────────────────────────────
function actualizarCliente(ss, data) {
  if (!data.cli?.nombre && !data.cli?.tel && !data.cli?.ig) return;
  const sheet = obtenerOCrear(ss, HOJA_CLIENTES);
  if (sheet.getLastRow() === 0) {
    const h = ["Nombre","Tel/WA","Instagram","Ciudad","Nro Compras","Total Gastado","Primera Compra","Última Compra","Último Canal"];
    sheet.appendRow(h);
    sheet.getRange(1,1,1,h.length).setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF").setFontSize(10);
    sheet.setFrozenRows(1);
  }
  const all = sheet.getDataRange().getValues();
  let fila = -1;
  for (let i=1; i<all.length; i++) {
    const rt = String(all[i][1]).trim(); const ri = String(all[i][2]).trim();
    const nt = String(data.cli?.tel||"").trim(); const ni = String(data.cli?.ig||"").trim();
    if ((nt && rt===nt) || (ni && ri===ni)) { fila=i+1; break; }
  }
  if (fila===-1) {
    sheet.appendRow([data.cli?.nombre||"",data.cli?.tel||"",data.cli?.ig||"",data.cli?.ciudad||"",1,data.total||0,data.fecha||"",data.fecha||"",data.canal||""]);
    sheet.getRange(sheet.getLastRow(),6).setNumberFormat("$#,##0");
  } else {
    sheet.getRange(fila,5).setValue((sheet.getRange(fila,5).getValue()||0)+1);
    sheet.getRange(fila,6).setValue((sheet.getRange(fila,6).getValue()||0)+(data.total||0));
    sheet.getRange(fila,8).setValue(data.fecha||"");
    sheet.getRange(fila,9).setValue(data.canal||"");
    if (!sheet.getRange(fila,4).getValue() && data.cli?.ciudad) sheet.getRange(fila,4).setValue(data.cli.ciudad);
    if (!sheet.getRange(fila,1).getValue() && data.cli?.nombre) sheet.getRange(fila,1).setValue(data.cli.nombre);
  }
}

// ── Resumen ──────────────────────────────────────────────────────────────────
function actualizarResumen(ss) {
  const vs = ss.getSheetByName(HOJA_VENTAS);
  if (!vs || vs.getLastRow() < 2) return;
  const res = obtenerOCrear(ss, HOJA_RESUMEN);
  res.clearContents();
  res.getRange(1,1).setValue("RENDIX · Resumen").setFontWeight("bold").setFontSize(13);
  res.getRange(2,1).setValue("Actualizado: "+new Date().toLocaleString("es-AR")).setFontSize(10);
  const vd = vs.getDataRange().getValues().slice(1);
  const total = vd.reduce((s,r)=>s+(Number(r[13])||0),0);
  res.getRange(4,1).setValue("Total ventas").setFontWeight("bold");
  res.getRange(4,2).setValue(vd.length);
  res.getRange(5,1).setValue("Total $").setFontWeight("bold");
  res.getRange(5,2).setValue(total).setNumberFormat("$#,##0");
  res.getRange(7,1).setValue("Canal").setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF");
  res.getRange(7,2).setValue("Ventas").setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF");
  res.getRange(7,3).setValue("Total $").setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF");
  const canales={};
  vd.forEach(r=>{ const c=r[2]||"Sin canal"; if(!canales[c])canales[c]={q:0,t:0}; canales[c].q++; canales[c].t+=Number(r[13])||0; });
  let f=8;
  Object.entries(canales).sort((a,b)=>b[1].t-a[1].t).forEach(([c,d])=>{
    res.getRange(f,1).setValue(c); res.getRange(f,2).setValue(d.q); res.getRange(f,3).setValue(d.t).setNumberFormat("$#,##0"); f++;
  });
  res.autoResizeColumns(1,3);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function obtenerOCrear(ss, nombre) {
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── Función de setup inicial: crea la hoja Catálogo con headers correctos ────
function crearHojaCatalogo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerOCrear(ss, HOJA_CATALOGO);
  if (sheet.getLastRow() > 0) { SpreadsheetApp.getUi().alert("La hoja Catálogo ya tiene datos."); return; }
  const headers = ["SKU","Nombre","Categoría","Marca","Presentación","Concentración","Sabor","Precio Publicado","Stock Actual","Stock Mínimo","Estado"];
  sheet.appendRow(headers);
  sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#0A0A0A").setFontColor("#FFFFFF").setFontSize(10);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(2,280); sheet.setColumnWidth(3,160); sheet.setColumnWidth(8,140);
  SpreadsheetApp.getUi().alert("Hoja Catálogo creada. Ahora podés pegar los datos del Excel.");
}

// ── Menú personalizado en Sheets ─────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("RENDIX")
    .addItem("Crear hoja Catálogo", "crearHojaCatalogo")
    .addToUi();
}
