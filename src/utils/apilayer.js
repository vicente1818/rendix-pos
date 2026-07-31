// APILayer integrations: exchangerates_data, numverify, mailboxlayer, vatlayer
const BASE = "https://api.apilayer.com";

// ── Rate cache (avoid hammering the free tier) ───────────────────────────────
let _rateCache = null;
let _rateCacheTs = 0;
const RATE_TTL = 15 * 60 * 1000; // 15 min

// ── Config accessor (keys stored in IndexedDB via appConfig) ─────────────────
let _keys = {};
export function setApiLayerKeys(keys) {
  _keys = keys || {};
}

// ── 1. Exchange Rates (exchangerates_data) ───────────────────────────────────
export async function getUsdToArs() {
  if (!_keys.exchangeKey) throw new Error("API key exchangerates_data no configurada");
  const now = Date.now();
  if (_rateCache && now - _rateCacheTs < RATE_TTL) return _rateCache;
  const res = await fetch(`${BASE}/exchangerates_data/latest?base=USD&symbols=ARS`, {
    headers: { apikey: _keys.exchangeKey },
  });
  if (!res.ok) throw new Error(`exchangerates_data error ${res.status}`);
  const data = await res.json();
  const rate = data.rates?.ARS;
  if (!rate) throw new Error("Respuesta sin tasa ARS");
  _rateCache = rate;
  _rateCacheTs = now;
  return rate;
}

export function clearRateCache() {
  _rateCache = null;
  _rateCacheTs = 0;
}

// ── 2. Phone Validation (numverify) ─────────────────────────────────────────
export async function validatePhone(number, countryCode = "AR") {
  if (!_keys.numverifyKey) return null; // silently skip if not configured
  const clean = number.replace(/\D/g, "");
  if (clean.length < 8) return null;
  const res = await fetch(
    `${BASE}/numverify/validate?number=${clean}&country_code=${countryCode}&format=1`,
    { headers: { apikey: _keys.numverifyKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    valid: data.valid,
    localFormat: data.local_format,
    intlFormat: data.international_format,
    carrier: data.carrier,
    lineType: data.line_type, // "mobile" | "landline" | etc
  };
}

// ── 3. Email Validation (mailboxlayer) ──────────────────────────────────────
export async function validateEmail(email) {
  if (!_keys.mailboxKey) return null;
  if (!email || !email.includes("@")) return null;
  const res = await fetch(
    `${BASE}/mailboxlayer/check?access_key=${_keys.mailboxKey}&email=${encodeURIComponent(email)}&smtp=1&format=1`,
    { headers: { apikey: _keys.mailboxKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    valid: data.format_valid && data.mx_found,
    disposable: data.disposable,
    smtpValid: data.smtp_check,
    score: data.score,
  };
}

// ── 4. VAT Rates (vatlayer) ──────────────────────────────────────────────────
export async function getVatRate(countryCode = "AR") {
  if (!_keys.vatKey) return null;
  const res = await fetch(
    `${BASE}/vatlayer/rate?country_code=${countryCode}`,
    { headers: { apikey: _keys.vatKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    standard: data.standard_rate,
    reduced: data.reduced_rates,
    country: data.country_name,
  };
}
