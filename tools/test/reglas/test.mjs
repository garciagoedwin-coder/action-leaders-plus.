// Pruebas de las reglas de juntas/eventos (15 nov): autorización y cupo. Corre en el emulador (GitHub Actions).
import fs from "fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, writeBatch, collection } from "firebase/firestore";
const env = await initializeTestEnvironment({ projectId: "demo-reglas", firestore: { rules: fs.readFileSync("../../../respaldo/firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
let ok = 0, mal = 0;
const t = async (nombre, p) => { try { await p; ok++; console.log("✓", nombre); } catch (e) { mal++; console.log("✗", nombre, "→", e.message.slice(0, 160)); } };
const cre = env.authenticatedContext("CRE").firestore(), apr = env.authenticatedContext("APR", { sis: true }).firestore(),
  apr2 = env.authenticatedContext("APR2").firestore(), otro = env.authenticatedContext("OTRO").firestore(), anon = env.unauthenticatedContext().firestore();
const base = { cre: "CRE", tipo: "gran", fecha: "2026-11-22", hora: "15:45", lugar: "Nuevos Horizontes", modo: "presencial", lidU: [], ver: ["u:CRE", "adm", "u:APR", "u:APR2"], verA: ["all"], autU: ["APR", "APR2"] };
// creación
await t("crear evento por autorizar", assertSucceeds(setDoc(doc(cre, "agendaEv/E1"), { ...base, aut: { st: "p", t: 1 } })));
await t("NO crear evento ya autorizado", assertFails(setDoc(doc(cre, "agendaEv/E2"), { ...base, aut: { st: "ok", t: 1 } })));
await t("NO crear evento sin aut", assertFails(setDoc(doc(cre, "agendaEv/E3"), { ...base })));
await t("crear junta libre", assertSucceeds(setDoc(doc(cre, "agendaEv/J1"), { ...base, tipo: "junta", ver: ["all"] })));
// creador no se autoriza
await t("NO creador se autoriza", assertFails(updateDoc(doc(cre, "agendaEv/E1"), { aut: { st: "ok", u: "CRE", t: 2 }, ver: ["all"] })));
// quien autoriza
await t("NO autoriza sin ser del sistema", assertFails(updateDoc(doc(apr2, "agendaEv/E1"), { aut: { st: "ok", u: "APR2", t: 2 }, ver: ["all"] })));
await t("NO autoriza cambiando otra cosa", assertFails(updateDoc(doc(apr, "agendaEv/E1"), { aut: { st: "ok", u: "APR", t: 2 }, ver: ["all"], fecha: "2026-12-01" })));
await t("NO autoriza con ver distinto a verA", assertFails(updateDoc(doc(apr, "agendaEv/E1"), { aut: { st: "ok", u: "APR", t: 2 }, ver: ["all", "u:X"] })));
await t("NO autoriza alguien fuera de autU", assertFails(updateDoc(doc(env.authenticatedContext("OTRO", { sis: true }).firestore(), "agendaEv/E1"), { aut: { st: "ok", u: "OTRO", t: 2 }, ver: ["all"] })));
await t("autoriza (miembro del sistema en autU)", assertSucceeds(updateDoc(doc(apr, "agendaEv/E1"), { aut: { st: "ok", u: "APR", t: 2, rt: false }, ver: ["all"] })));
// creador después de autorizado
await t("creador edita algo sin fecha/lugar", assertSucceeds(updateDoc(doc(cre, "agendaEv/E1"), { tk: 300 })));
await t("NO creador cambia fecha sin volver a pedir", assertFails(updateDoc(doc(cre, "agendaEv/E1"), { fecha: "2026-11-29" })));
await t("creador cambia fecha y vuelve a «p»", assertSucceeds(updateDoc(doc(cre, "agendaEv/E1"), { fecha: "2026-11-29", aut: { st: "p", t: 3, nt: false }, ver: ["u:CRE", "adm", "u:APR"], verA: ["all"] })));
await t("no autoriza con motivo", assertSucceeds(updateDoc(doc(apr, "agendaEv/E1"), { aut: { st: "no", u: "APR", t: 4, mot: "Otra fecha", rt: false } })));
await t("creador reenvía a autorizar", assertSucceeds(updateDoc(doc(cre, "agendaEv/E1"), { aut: { st: "p", t: 5, nt: false } })));
// eventos viejos (sin aut)
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "agendaEv/V1"), { ...base, ver: ["all"], autU: [] }); });
await t("evento viejo: creador cambia fecha", assertSucceeds(updateDoc(doc(cre, "agendaEv/V1"), { fecha: "2026-11-30" })));
await t("NO otro socio edita", assertFails(updateDoc(doc(otro, "agendaEv/V1"), { fecha: "2026-12-30" })));
// cupo
await t("creador pone cupo", assertSucceeds(setDoc(doc(cre, "evCupo/V1"), { cupo: 2, n: 0 })));
await t("NO otro pone cupo", assertFails(setDoc(doc(otro, "evCupo/V1"), { cupo: 99, n: 0 })));
const rs = { n: "Ana Pérez", w: "99998888", cc: "504", de: "CRE", dn: "Edwin", t: 1 };
await t("NO confirmar sin sumar al cupo", assertFails(setDoc(doc(anon, "agendaEv/V1/rsvp/R0"), rs)));
await t("NO sumar al cupo sin confirmar", assertFails(updateDoc(doc(anon, "evCupo/V1"), { n: 1, r: "RX" })));
const conf = async (id, n) => { const b = writeBatch(anon); b.set(doc(anon, "agendaEv/V1/rsvp/" + id), rs); b.update(doc(anon, "evCupo/V1"), { n, r: id }); await b.commit(); };
await t("confirmar 1 (cupo 2)", assertSucceeds(conf("R1", 1)));
await t("confirmar 2 (cupo 2)", assertSucceeds(conf("R2", 2)));
await t("NO confirmar 3 (cupo lleno)", assertFails(conf("R3", 3)));
await t("confirmar sin cupo (junta)", assertSucceeds(setDoc(doc(anon, "agendaEv/J1/rsvp/X1"), rs)));
console.log(`Resultado: ${ok} bien · ${mal} mal`);
await env.cleanup(); process.exit(mal ? 1 : 0);
