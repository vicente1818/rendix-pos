import { fmt, fmtD } from "./constants.js";

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
  appendText(`${fmtD(sale.fecha)}\n`);
  appendText("-".repeat(paperColumns) + "\n");

  // Align Left
  bytes.push(0x1B, 0x61, 0x00);
  appendText(`Cliente: ${sale.cli?.nombre || "Mostrador"}\n`);
  appendText(`Canal: ${sale.canal} | Pago: ${sale.metodo}\n`);
  appendText("-".repeat(paperColumns) + "\n");

  (sale.items || []).forEach(i => {
    const left = `${i.qty}x ${i.nombre}`;
    const right = fmt(i.subtotal);
    const space = Math.max(1, paperColumns - left.length - right.length);
    appendText(left + " ".repeat(space) + right + "\n");
  });

  appendText("-".repeat(paperColumns) + "\n");
  if (sale.descPct > 0) {
    const descStr = `Descuento ${sale.descPct}%: -${fmt(sale.descMonto)}`;
    appendText(descStr + "\n");
  }

  // Align Right
  bytes.push(0x1B, 0x61, 0x02);
  // Bold ON
  bytes.push(0x1B, 0x45, 0x01);
  // 2x Large
  bytes.push(0x1D, 0x21, 0x11);
  appendText(`TOTAL: ${fmt(sale.total)}\n`);

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
