import { fmt, fmtD } from "./constants.js";

export function generateWhatsAppReceiptText(sale) {
  const lines = [
    "🧾 *RENDIX NUTRITION & FITNESS*",
    `📍 Ticket #${sale.id}`,
    `📅 ${fmtD(sale.fecha)}`,
    "--------------------------------",
    `👤 *Cliente:* ${sale.cli?.nombre || "Cliente en mostrador"}`,
    sale.cli?.tel ? `📱 *Tel:* ${sale.cli.tel}` : null,
    sale.cli?.ciudad ? `🌆 *Ciudad:* ${sale.cli.ciudad}` : null,
    "--------------------------------",
    "📦 *DETALLE DE COMPRA:*",
  ].filter(Boolean);

  (sale.items || []).forEach(i => {
    lines.push(`• *${i.qty}x* ${i.nombre} — ${fmt(i.subtotal)}`);
  });

  lines.push("--------------------------------");
  if (sale.descPct > 0) {
    lines.push(`🏷️ *Descuento ${sale.descPct}%:* -${fmt(sale.descMonto)}`);
  }
  lines.push(`💵 *TOTAL FINAL:* *${fmt(sale.total)} ARS*`);
  lines.push(`💳 *Método de pago:* ${sale.metodo}`);
  lines.push("--------------------------------");
  lines.push("💪 ¡Muchas gracias por tu compra!");
  lines.push("🔗 *RENDIX POS* — High Performance Nutrition");

  return lines.join("\n");
}

export function generateWhatsAppQuoteText(cart, subtotal, descPct, descMonto, total, cli) {
  const lines = [
    "📋 *PRESUPUESTO RENDIX*",
    `📅 Válido por 48 hs | ${new Date().toLocaleDateString("es-AR")}`,
    "--------------------------------",
  ];

  if (cli?.nombre) lines.push(`👤 *Para:* ${cli.nombre}`);
  lines.push("--------------------------------");
  lines.push("📦 *PRODUCTOS:*");

  cart.forEach(i => {
    lines.push(`• *${i.qty}x* ${i.nombre} — ${fmt(i.precio * i.qty)}`);
  });

  lines.push("--------------------------------");
  if (descPct > 0) {
    lines.push(`🏷️ *Descuento Especial (${descPct}%):* -${fmt(descMonto)}`);
  }
  lines.push(`💰 *TOTAL:* *${fmt(total)} ARS*`);
  lines.push("");
  lines.push("📱 *Respondé este mensaje para confirmar tu pedido o coordinar el envío!* 💪");

  return lines.join("\n");
}

export function sendWhatsAppMessage(phone, text) {
  const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(url, "_blank");
}
