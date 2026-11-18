// Copia CommonJS de tools/push/lluvia.mjs (helpers de la Lluvia de prospectos). Si cambia uno, cambiar el otro.
const HOJA_LLUVIA = "1uJkSA8rlK83Z9HjnYElv_DE5j9MVO6ra_n-2RxPY-OM", PESTANA = "Hoja 1";
// Token con permiso de solo lectura de Sheets, desde la cuenta con la que corre la función (la hoja está compartida con ella).
async function tokSheets() {
  const r = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?scopes=" + encodeURIComponent("https://www.googleapis.com/auth/spreadsheets.readonly"), { headers: { "Metadata-Flavor": "Google" } });
  const j = await r.json(); if (!j.access_token) throw new Error("sin token " + r.status); return j.access_token;
}
async function leerHoja() {
  const tk = await tokSheets();
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${HOJA_LLUVIA}/values/${encodeURIComponent("'" + PESTANA + "'!A1:Z")}`, { headers: { authorization: "Bearer " + tk } });
  if (r.status === 403 || r.status === 404) { const e = new Error("SIN PERMISO " + r.status); e.sinPermiso = true; throw e; }
  const j = await r.json(); if (!r.ok) throw new Error("Hoja: " + r.status);
  return j.values || [];
}
const nk = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
function prospectos(vals) {
  if (!vals || vals.length < 2) return [];
  const H = vals[0].map(nk), col = (...ks) => { for (const k of ks) { const i = H.indexOf(k); if (i >= 0) return i; } for (const k of ks) { const i = H.findIndex(h => h.includes(k)); if (i >= 0) return i; } return -1; };
  const iId = col("id"), iT = col("createdtime"), iInt = col("queleinteresamas", "interesa"), iE = col("email", "correo"), iN = col("fullname", "nombre"),
    iP = col("phonenumber", "telefono", "whatsapp"), iF = col("formname"), iO = col("isorganic"), iPl = col("platform"), iC = col("campaignname"), iS = col("leadstatus");
  const v = (r, i) => i >= 0 ? String(r[i] == null ? "" : r[i]).trim() : "";
  return vals.slice(1).map(r => ({ id: v(r, iId), t: Date.parse(v(r, iT)) || 0, int: v(r, iInt), email: v(r, iE).toLowerCase(), n: v(r, iN),
    tel: v(r, iP).replace(/^p:/i, "").trim(), form: v(r, iF), org: /^true$/i.test(v(r, iO)), pl: v(r, iPl), camp: v(r, iC), st: v(r, iS) }))
    .filter(x => x.id && (x.n || x.tel || x.email));
}
function interesTxt(s) {
  const k = nk(s); if (!k) return "";
  if (/lasdos|ambas|ambos/.test(k)) return "Las dos (viajar y emprender)";
  const t = String(s).replace(/_/g, " ").trim(); return t[0].toUpperCase() + t.slice(1);
}
const idDoc = id => "mc" + String(id).replace(/\D/g, "").slice(-18);
const dig8 = t => String(t || "").replace(/\D/g, "").slice(-8);
const telNorm = t => { const d = String(t || "").replace(/\D/g, ""); if (!d) return ""; return "+" + (d.length === 8 ? "504" + d : d); };
const fechaHN = ms => new Date(ms).toLocaleDateString("es-HN", { day: "numeric", month: "short", timeZone: "America/Tegucigalpa" });
const hoyHN = (ms = Date.now()) => new Date(ms - 6 * 3600e3).toISOString().slice(0, 10);
const cap = s => String(s || "").toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).trim();
function contactoDe(p, ms = Date.now()) {
  const it = interesTxt(p.int), ori = p.org ? "orgánico" : "anuncio" + (p.pl === "ig" ? " de Instagram" : p.pl === "fb" ? " de Facebook" : "");
  const c = { name: cap(p.n).slice(0, 80) || "Prospecto de la campaña", phone: telNorm(p.tel), cc: "", stage: "Nuevo", stT: ms,
    note: "📣 Campaña" + (p.camp ? " «" + p.camp + "»" : "") + " · " + ori + " · se registró el " + fechaHN(p.t || ms) + (it ? " · Le interesa: " + it : ""),
    next: hoyHN(ms), cat: ["camp"], camp: { lid: p.id, t: p.t || ms, int: it, f: p.form || "", o: p.org ? 1 : 0 }, creado: ms, updated: ms };
  if (p.email && p.email.includes("@")) c.email = p.email.slice(0, 120);
  return c;
}
module.exports = { leerHoja, prospectos, contactoDe, idDoc, dig8, hoyHN, fechaHN };
