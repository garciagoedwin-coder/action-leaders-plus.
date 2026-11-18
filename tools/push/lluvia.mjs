// 17 nov (Edwin): «Lluvia de prospectos», versión 1 (básica).
// Los prospectos del formulario de Meta llegan a la hoja «Prospectos Ilimitados» (Drive de garciagoedwin).
// enviar.mjs lluvia los pasa al CRM de la cuenta garciagoedwin (etapa Nuevo, etiqueta 📣 Campaña) con aviso al teléfono,
// y copia al CRM del Action Leader los que Edwin pasa con «📤 Pasar a un Action Leader» (rep en el contacto).
// NUNCA imprimir nombres, teléfonos ni correos: los registros de GitHub son públicos.
import crypto from "node:crypto";

export const HOJA_LLUVIA = "1uJkSA8rlK83Z9HjnYElv_DE5j9MVO6ra_n-2RxPY-OM";
export const PESTANA = "Hoja 1";

const b64u = b => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
export async function gToken(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 }));
  const sig = b64u(crypto.createSign("RSA-SHA256").update(head + "." + body).sign(sa.private_key));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + head + "." + body + "." + sig });
  const j = await r.json(); if (!j.access_token) throw new Error("Sin token de Google: " + (j.error || r.status));
  return j.access_token;
}
export async function leerHoja(sa, id = HOJA_LLUVIA, tab = PESTANA) {
  const tk = await gToken(sa, "https://www.googleapis.com/auth/spreadsheets.readonly");
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent("'" + tab + "'!A1:Z")}`, { headers: { authorization: "Bearer " + tk } });
  if (r.status === 403 || r.status === 404) { const e = new Error("SIN PERMISO"); e.sinPermiso = true; throw e; }
  const j = await r.json(); if (!r.ok) throw new Error("Hoja: " + r.status);
  return j.values || [];
}
const nk = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
// Filas → prospectos (las columnas se buscan por nombre, no por posición)
export function prospectos(vals) {
  if (!vals || vals.length < 2) return [];
  const H = vals[0].map(nk), col = (...ks) => { for (const k of ks) { const i = H.indexOf(k); if (i >= 0) return i; } for (const k of ks) { const i = H.findIndex(h => h.includes(k)); if (i >= 0) return i; } return -1; };
  const iId = col("id"), iT = col("createdtime"), iInt = col("queleinteresamas", "interesa"), iE = col("email", "correo"), iN = col("fullname", "nombre"),
    iP = col("phonenumber", "telefono", "whatsapp"), iF = col("formname"), iO = col("isorganic"), iPl = col("platform"), iC = col("campaignname"), iS = col("leadstatus");
  const v = (r, i) => i >= 0 ? String(r[i] == null ? "" : r[i]).trim() : "";
  return vals.slice(1).map(r => ({ id: v(r, iId), t: Date.parse(v(r, iT)) || 0, int: v(r, iInt), email: v(r, iE).toLowerCase(), n: v(r, iN),
    tel: v(r, iP).replace(/^p:/i, "").trim(), form: v(r, iF), org: /^true$/i.test(v(r, iO)), pl: v(r, iPl), camp: v(r, iC), st: v(r, iS) }))
    .filter(x => x.id && (x.n || x.tel || x.email));
}
export function interesTxt(s) {
  const k = nk(s); if (!k) return "";
  if (/lasdos|ambas|ambos/.test(k)) return "Las dos (viajar y emprender)";
  const t = String(s).replace(/_/g, " ").trim(); return t[0].toUpperCase() + t.slice(1);
}
export const idDoc = id => "mc" + String(id).replace(/\D/g, "").slice(-18);
export const dig8 = t => String(t || "").replace(/\D/g, "").slice(-8);
export const telNorm = t => { const d = String(t || "").replace(/\D/g, ""); if (!d) return ""; return "+" + (d.length === 8 ? "504" + d : d); };
const fechaHN = ms => new Date(ms).toLocaleDateString("es-HN", { day: "numeric", month: "short", timeZone: "America/Tegucigalpa" });
const hoyHN = (ms = Date.now()) => new Date(ms - 6 * 3600e3).toISOString().slice(0, 10);
const cap = s => String(s || "").toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).trim();
// Contacto para el CRM (mismo formato que la app: name, phone con +código, cc vacío, stage, note, next, cat…)
export function contactoDe(p, ms = Date.now()) {
  const it = interesTxt(p.int), ori = p.org ? "orgánico" : "anuncio" + (p.pl === "ig" ? " de Instagram" : p.pl === "fb" ? " de Facebook" : "");
  const c = { name: cap(p.n).slice(0, 80) || "Prospecto de la campaña", phone: telNorm(p.tel), cc: "", stage: "Nuevo", stT: ms,
    note: "📣 Campaña" + (p.camp ? " «" + p.camp + "»" : "") + " · " + ori + " · se registró el " + fechaHN(p.t || ms) + (it ? " · Le interesa: " + it : ""),
    next: hoyHN(ms), cat: ["camp"], camp: { lid: p.id, t: p.t || ms, int: it, f: p.form || "", o: p.org ? 1 : 0 }, creado: ms, updated: ms };
  if (p.email && p.email.includes("@")) c.email = p.email.slice(0, 120);
  return c;
}
