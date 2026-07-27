import { fmt, fmtD } from "./constants.js";

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
  const phone = rawPhone.replace(/\D/g, "");
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
  const phone = rawPhone.replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
