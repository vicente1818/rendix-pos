import { fmt, fmtD } from "./constants.js";

/**
 * Normalise an Argentine phone number to the E.164 wa.me format (no + sign).
 *
 * Argentine mobile numbers for WhatsApp require the format:
 *   549 [area code] [subscriber]   e.g. 5491153827364
 *
 * Common raw inputs handled:
 *   "1153827364"      (10-digit local, area 11)   -> 5491153827364
 *   "01153827364"     (11-digit with leading 0)   -> 5491153827364
 *   "541153827364"    (international without 9)   -> 5491153827364
 *   "+541153827364"   (international with +)      -> 5491153827364
 *   "5491153827364"   (already correct)            -> 5491153827364
 */
export function formatArgentinePhone(rawPhone) {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";

  // Already in WhatsApp format: 549 + at least 10 subscriber digits
  if (digits.startsWith("549") && digits.length >= 12) return digits;

  // International format 54 + 10 digits but missing the mobile 9 marker
  if (digits.startsWith("54")) return "549" + digits.slice(2);

  // Local format with leading trunk 0 (e.g. 011-xxxx-xxxx -> 11xxxxxxxx)
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  return "549" + local;
}

/**
 * Generates a WhatsApp Markdown formatted ticket string with a direct wa.me link
 */
export function generateWhatsAppReceiptText(sale) {
  const itemLines = (sale.items || []).map(
    i => `• *${i.qty}x* ${i.nombre}\n  └ Subtotal: *${fmt(i.subtotal)}*`
  ).join("\n");

  const markdown = 
    `🏋️‍♂️ *RENDIX POS - Ticket de Compra* 🏋️‍♂️\n` +
    `_Comprobante Digital de Venta_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📄 *Ticket:* \`\`\`#${sale.id}\`\`\`\n` +
    `📅 *Fecha:* ${fmtD(sale.fecha)}\n` +
    `👤 *Cliente:* ${sale.cli?.nombre || "Mostrador"}\n` +
    `💳 *Pago:* ${sale.metodo} (Canal: ${sale.canal})\n\n` +
    `🛒 *DETALLE DE PRODUCTOS:*\n${itemLines}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    (sale.descPct > 0 ? `💰 *Descuento (${sale.descPct}%):* -${fmt(sale.descMonto)}\n` : "") +
    `💵 *TOTAL PAGADO:* *${fmt(sale.total)}*\n\n` +
    `¡Muchas gracias por su compra! 💪`;

  return markdown;
}

export function generateWhatsAppReceiptLink(sale) {
  const text = generateWhatsAppReceiptText(sale);
  const rawPhone = sale.cli?.tel || sale.cli?.telefono || "";
  const phone = formatArgentinePhone(rawPhone);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppQuoteText(cart, descPct, total, cli) {
  const itemLines = cart.map(
    i => `• *${i.qty}x* ${i.nombre} ── *${fmt(i.precio * i.qty)}*`
  ).join("\n");

  return (
    `🔥 *PRESUPUESTO RENDIX POS* 🔥\n` +
    `Hola ${cli?.nombre || "Cliente"}! Aquí tienes el detalle solicitado:\n\n` +
    `📋 *PRODUCTOS:*\n${itemLines}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    (descPct > 0 ? `🏷️ *Descuento Aplicado:* ${descPct}%\n` : "") +
    `💰 *TOTAL ESTIMADO:* *${fmt(total)}*\n\n` +
    `⏱️ _Presupuesto válido por 24hs._`
  );
}

export function generateWhatsAppQuoteLink(cart, descPct, total, cli) {
  const text = generateWhatsAppQuoteText(cart, descPct, total, cli);
  const rawPhone = cli?.tel || cli?.telefono || "";
  const phone = formatArgentinePhone(rawPhone);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
