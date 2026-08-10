import { formatCurrency, formatDateTime } from "./constants.js";

export function generateEscPosBytes(sale, paperColumns = 48) {
  const bytes = [];

  // Init ESC @
  bytes.push(0x1B, 0x40);
  // Code page CP858
  bytes.push(0x1B, 0x74, 0x10);

  // Align Center
  bytes.push(0x1B, 0x61, 0x01);
  // Double height & width for header
  bytes.push(0x1D, 0x21, 0x11);
  
  const textEncoder = new TextEncoder();
  const appendText = str => bytes.push(...Array.from(textEncoder.encode(str)));

  appendText("RENDIX POS\n");
  
  // Normal size
  bytes.push(0x1D, 0x21, 0x00);
  appendText("High Performance Nutrition\n");
  appendText(`Ticket #${sale.id}\n`);
  appendText(`${formatDateTime(sale.fecha)}\n`);
  appendText("-".repeat(paperColumns) + "\n");

  // Align Left
  bytes.push(0x1B, 0x61, 0x00);
  appendText(`Cliente: ${sale.cli?.nombre || "Mostrador"}\n`);
  appendText(`Canal: ${sale.canal} | Pago: ${sale.metodo}\n`);
  appendText("-".repeat(paperColumns) + "\n");

  (sale.items || []).forEach(i => {
    const left = `${i.qty}x ${i.nombre}`;
    const right = formatCurrency(i.subtotal);
    const space = Math.max(1, paperColumns - left.length - right.length);
    appendText(left + " ".repeat(space) + right + "\n");
  });

  appendText("-".repeat(paperColumns) + "\n");
  if (sale.descPct > 0) {
    const descStr = `Descuento ${sale.descPct}%: -${formatCurrency(sale.descMonto)}`;
    appendText(descStr + "\n");
  }

  // Align Right
  bytes.push(0x1B, 0x61, 0x02);
  // Bold ON
  bytes.push(0x1B, 0x45, 0x01);
  // 2x Large
  bytes.push(0x1D, 0x21, 0x11);
  appendText(`TOTAL: ${formatCurrency(sale.total)}\n`);

  // Bold OFF, Normal size
  bytes.push(0x1B, 0x45, 0x00);
  bytes.push(0x1D, 0x21, 0x00);

  // Align Center
  bytes.push(0x1B, 0x61, 0x01);
  appendText("\nGracias por su compra 💪\n\n\n");

  // Kick Cash Drawer Pin 2 (0x1B 0x70 0x00 0x19 0xFA)
  bytes.push(0x1B, 0x70, 0x00, 0x19, 0xFA);

  // Cut Paper GS V 0
  bytes.push(0x1D, 0x56, 0x00);

  return new Uint8Array(bytes);
}

// ── Receipt printing ─────────────────────────────────────────────────────────

const RECEIPT_W = 32;

function receiptCenter(str) {
  const pad = Math.max(0, Math.floor((RECEIPT_W - str.length) / 2));
  return " ".repeat(pad) + str;
}

function receiptPadRight(left, right) {
  const space = Math.max(1, RECEIPT_W - left.length - right.length);
  return left + " ".repeat(space) + right;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildReceiptContent(sale) {
  const HR = "-".repeat(RECEIPT_W);
  const L = (str) => `<div>${escHtml(str)}</div>`;
  const B = (str) => `<div style="font-weight:bold">${escHtml(str)}</div>`;

  const discountMonto =
    sale.descMonto > 0
      ? sale.descMonto
      : sale.descPct > 0 && sale.total > 0
      ? Math.round((sale.total * sale.descPct) / (100 - sale.descPct))
      : 0;

  const itemLines = (sale.items || []).map((i) => {
    const qty = `${i.qty}x `;
    const price = formatCurrency(i.subtotal);
    const maxLen = Math.max(1, RECEIPT_W - qty.length - price.length - 1);
    return L(receiptPadRight(qty + (i.nombre || "").substring(0, maxLen), price));
  });

  return [
    B(receiptCenter("RENDIX POS")),
    L(receiptCenter("High Performance Nutrition")),
    L(HR),
    L(`Ticket #${sale.id}`),
    L(formatDateTime(sale.fecha)),
    L(HR),
    L(`Cliente: ${sale.cli?.nombre || "Mostrador"}`),
    L(`Canal: ${sale.canal || ""} | Pago: ${sale.metodo || ""}`),
    L(HR),
    ...itemLines,
    L(HR),
    ...(discountMonto > 0
      ? [L(receiptPadRight(`Desc ${sale.descPct}%`, `-${formatCurrency(discountMonto)}`))]
      : []),
    B(receiptPadRight("TOTAL", formatCurrency(sale.total))),
    L(HR),
    L(receiptCenter("Gracias por su compra")),
  ].join("");
}

export function printSaleReceipt(sale, _products) {
  const div = document.createElement("div");
  div.id = "__rendix_receipt__";
  div.style.cssText =
    "position:fixed;left:-9999px;top:0;width:290px;" +
    "font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.5;";

  const style = document.createElement("style");
  style.textContent =
    "@media print{" +
    "body *{visibility:hidden;}" +
    "#__rendix_receipt__,#__rendix_receipt__ *{visibility:visible;}" +
    "#__rendix_receipt__{position:fixed!important;top:0!important;left:0!important;}" +
    "}";

  div.appendChild(style);
  div.insertAdjacentHTML("beforeend", buildReceiptContent(sale));
  document.body.appendChild(div);

  window.print();

  const cleanup = () => {
    if (document.body.contains(div)) document.body.removeChild(div);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
}

export async function printViaWebUSB(sale) {
  if (!("usb" in navigator)) {
    throw new Error("WebUSB API no está soportada en este navegador");
  }
  const device = await navigator.usb.requestDevice({ filters: [{ classCode: 0x07 }] });
  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  
  const iface = device.configuration.interfaces[0];
  await device.claimInterface(iface.interfaceNumber);

  const endpoint = iface.alternate.endpoints.find(e => e.direction === "out");
  const bytes = generateEscPosBytes(sale);

  await device.transferOut(endpoint.endpointNumber, bytes);
  await device.close();
}

/**
 * Direct ESC/POS Web Bluetooth Thermal Receipt Printing
 */
export async function printViaWebBluetooth(sale) {
  if (!("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth API no está disponible en este navegador");
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
    ]
  });

  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();
  if (!services.length) throw new Error("No se encontraron servicios Bluetooth en la impresora");

  const characteristics = await services[0].getCharacteristics();
  const writeChar = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

  if (!writeChar) throw new Error("No se encontró característica de escritura ESC/POS");

  const bytes = generateEscPosBytes(sale);
  const CHUNK_SIZE = 512;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk);
    } else {
      await writeChar.writeValueWithResponse(chunk);
    }
  }
}

