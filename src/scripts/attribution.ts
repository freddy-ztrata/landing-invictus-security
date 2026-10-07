/**
 * Atribución: captura gclid/gbraid/wbraid y utm_* de la URL de entrada y los guarda para
 * enviarlos con el lead (→ hapee → importación de conversiones offline en Google Ads).
 * - first touch: localStorage, no se sobreescribe (90 días).
 * - last touch: se actualiza cada vez que llega una URL con parámetros.
 */
const KEYS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
type Key = (typeof KEYS)[number];
export type Touch = Partial<Record<Key, string>> & { ts: number; landing: string; referrer: string };

const TTL = 90 * 24 * 60 * 60 * 1000;
const FIRST = 'inv_attr_first';
const LAST = 'inv_attr_last';

function read(key: string): Touch | null {
  try {
    const t = JSON.parse(localStorage.getItem(key) || 'null') as Touch | null;
    return t && Date.now() - t.ts < TTL ? t : null;
  } catch {
    return null;
  }
}

function write(key: string, t: Touch) {
  try { localStorage.setItem(key, JSON.stringify(t)); } catch { /* modo privado */ }
}

(function capture() {
  const params = new URLSearchParams(location.search);
  const touch: Touch = { ts: Date.now(), landing: location.pathname, referrer: document.referrer ? new URL(document.referrer).hostname : '' };
  let has = false;
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) { touch[k] = v.slice(0, 200); has = true; }
  }
  // Primera página de la sesión (para "landing_page" del lead aunque no traiga parámetros)
  try { if (!sessionStorage.getItem('inv_landing')) sessionStorage.setItem('inv_landing', location.pathname + location.search); } catch { /* */ }
  if (!has) return;
  if (!read(FIRST)) write(FIRST, touch);
  write(LAST, touch);
})();

/** Datos de atribución para adjuntar al lead. */
export function getAttribution() {
  const last = read(LAST);
  const first = read(FIRST);
  // El click ID más reciente gana (last touch), y dentro de cada toque: gclid > gbraid > wbraid.
  let clickId = '';
  let clickIdTipo = '';
  for (const t of [last, first]) {
    if (!t || clickId) continue;
    for (const k of ['gclid', 'gbraid', 'wbraid'] as const) {
      if (t[k]) { clickId = t[k] as string; clickIdTipo = k; break; }
    }
  }
  let landing = '';
  try { landing = sessionStorage.getItem('inv_landing') || ''; } catch { /* */ }
  return {
    click_id: clickId,
    click_id_tipo: clickIdTipo,
    gclid: last?.gclid ?? first?.gclid ?? '',
    gbraid: last?.gbraid ?? first?.gbraid ?? '',
    wbraid: last?.wbraid ?? first?.wbraid ?? '',
    utm_source: last?.utm_source ?? first?.utm_source ?? '',
    utm_medium: last?.utm_medium ?? first?.utm_medium ?? '',
    utm_campaign: last?.utm_campaign ?? first?.utm_campaign ?? '',
    utm_term: last?.utm_term ?? first?.utm_term ?? '',
    utm_content: last?.utm_content ?? first?.utm_content ?? '',
    first_utm_source: first?.utm_source ?? '',
    first_utm_campaign: first?.utm_campaign ?? '',
    first_landing: first?.landing ?? '',
    landing_page: landing,
    referrer: last?.referrer ?? first?.referrer ?? '',
  };
}
