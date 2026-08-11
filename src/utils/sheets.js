let _sheetsUrl = "";
let _sheetsSecret = "";

export function setSheetsUrl(url) {
  _sheetsUrl = url || "";
}

export function getSheetsUrl() {
  return _sheetsUrl;
}

export function setSheetsSecret(secret) {
  _sheetsSecret = secret || "";
}

export async function postToSheets(type, payload) {
  if (!_sheetsUrl) return false;
  try {
    // mode:"no-cors" no permite leer la respuesta real del Apps Script (limitación de CORS
    // de Google), así que solo confirma que el request salió sin error de red, no que el
    // servidor lo aceptó. El outbox de syncManager.js compensa reintentando si esto falla.
    await fetch(_sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, secret: _sheetsSecret, ...payload }),
    });
    return true;
  } catch (e) {
    console.warn("Sheets POST warning:", e);
    return false;
  }
}

export async function fetchCatalogFromSheets() {
  if (!_sheetsUrl) return null;
  try {
    const url = _sheetsUrl + "?action=catalog&secret=" + encodeURIComponent(_sheetsSecret);
    const r = await fetch(url, { method: "GET", mode: "cors" });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.status === "ok" && data.products?.length > 0) return data.products;
    return null;
  } catch (e) {
    console.warn("Sheets GET warning:", e);
    return null;
  }
}
