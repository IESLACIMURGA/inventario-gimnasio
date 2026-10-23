/* =====================================================================
   Descarga de las hojas (Google Sheets publicado o CSV de ejemplo) y copia
   local para seguir consultando el inventario si falla la conexión.
   ===================================================================== */

import { csvAObjetos } from './csv.js';
import { HOJAS } from './datos.js';

const CLAVE_CACHE = 'inventario-gimnasio:copia';

/** Construye la URL CSV de una pestaña a partir del enlace publicado y su gid. */
export function urlHojaGoogle(urlPublicada, gid) {
  const u = String(urlPublicada || '').trim();
  const m = u.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/([\w-]+)\/pub/);
  if (!m) throw new Error('El enlace de Google Sheets de config.js no parece un enlace de «Publicar en la web».');
  if (!/^\d+$/.test(String(gid ?? '').trim())) throw new Error('Falta algún número gid en config.js.');
  return `https://docs.google.com/spreadsheets/d/e/${m[1]}/pub?gid=${String(gid).trim()}&single=true&output=csv`;
}

export function urlsFuente(config) {
  if (config.fuente === 'google') {
    return Object.fromEntries(HOJAS.map((h) => [h, urlHojaGoogle(config.googleUrlPublicada, config.googleGids?.[h])]));
  }
  return Object.fromEntries(HOJAS.map((h) => [h, `datos/${h}.csv`]));
}

async function descargar(url) {
  const r = await fetch(url, { cache: 'no-store', credentials: 'omit', redirect: 'follow' });
  if (!r.ok) throw new Error(`No se pudo descargar una hoja (código ${r.status}).`);
  const texto = await r.text();
  // Si la hoja no está publicada, Google devuelve una página HTML en lugar del CSV
  if (/^\s*<(!doctype|html)/i.test(texto)) throw new Error('Google devolvió una página en lugar de datos: revisa que la hoja esté publicada en la web como CSV.');
  return texto;
}

function leerCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CACHE) || 'null');
    return c && c.textos && c.fecha ? c : null;
  } catch { return null; }
}

function guardarCache(textos, origen) {
  try { localStorage.setItem(CLAVE_CACHE, JSON.stringify({ textos, origen, fecha: new Date().toISOString() })); } catch { /* sin almacenamiento: no pasa nada */ }
}

/**
 * Devuelve { hojas, fecha, desdeCopia, error }.
 * Si la descarga falla y hay una copia guardada de la misma fuente, usa la copia.
 */
export async function cargarHojas(config) {
  const origen = config.fuente === 'google' ? `google:${config.googleUrlPublicada}` : 'demo';
  try {
    const urls = urlsFuente(config);
    const textos = Object.fromEntries(await Promise.all(HOJAS.map(async (h) => [h, await descargar(urls[h])])));
    guardarCache(textos, origen);
    return { hojas: aObjetos(textos), fecha: new Date(), desdeCopia: false };
  } catch (error) {
    const copia = leerCache();
    if (copia && copia.origen === origen) {
      return { hojas: aObjetos(copia.textos), fecha: new Date(copia.fecha), desdeCopia: true, error };
    }
    throw error;
  }
}

function aObjetos(textos) {
  return Object.fromEntries(HOJAS.map((h) => [h, csvAObjetos(textos[h] || '')]));
}
