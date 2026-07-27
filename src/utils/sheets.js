let _sheetsUrl = "";

export function setSheetsUrl(url) {
  _sheetsUrl = url || "";
}

export function getSheetsUrl() {
  return _sheetsUrl;
}

export async function postToSheets(type, payload) {
  if (!_sheetsUrl) return;
  try {
    await fetch(_sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
  } catch (e) {
    console.warn("Sheets POST warning:", e);
  }
}

export async function fetchCatalogFromSheets() {
  if (!_sheetsUrl) return null;
  try {
    const url = _sheetsUrl + "?action=catalog";
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
