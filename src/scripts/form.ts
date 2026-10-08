/**
 * Formulario de cotización embebido de hapee (iframe). El envío y los datos los maneja hapee;
 * aquí solo escuchamos su aviso `zentru_form_submitted` (postMessage desde beta.hapee.ai) para:
 *   1) dejar el token de envío real que /gracias/ necesita para medir la conversión, y
 *   2) llevar al visitante a /gracias/.
 * transaction_id = eventId de hapee ("lead.<id del envío>"): Ads deduplica por envío.
 */
import { track } from './tracking';
import { HAPEE_FORM_COTIZACION as HAPEE_FORM, HAPEE_ORIGIN } from '../data/hapee';

const TOKEN_KEY = 'inv_lead';

export function onHapeeSubmit() {
  const host = document.querySelector<HTMLElement>('[data-lead-form]');
  if (!host || host.dataset.ready) return;
  host.dataset.ready = '1';

  // Accesibilidad: el embed de hapee crea el iframe sin `title`; se lo ponemos apenas aparece.
  const setTitle = () => host.querySelectorAll<HTMLIFrameElement>('iframe:not([title])').forEach((f) => (f.title = 'Formulario de cotización de Invictus Security'));
  setTitle();
  new MutationObserver(setTitle).observe(host, { childList: true, subtree: true });

  // form_start: la primera vez que el foco entra al iframe del formulario.
  let started = false;
  addEventListener('blur', () => {
    const el = document.activeElement;
    if (!started && el?.tagName === 'IFRAME' && host.contains(el)) {
      started = true;
      track('form_start', { form: 'hapee-cotizacion', page: location.pathname });
    }
  });

  let done = false;
  addEventListener('message', (ev: MessageEvent) => {
    if (ev.origin !== HAPEE_ORIGIN) return;
    const msg = ev.data as { type?: string; formId?: string; eventId?: string } | null;
    if (!msg || typeof msg !== 'object' || msg.type !== 'zentru_form_submitted' || msg.formId !== HAPEE_FORM || done) return;
    done = true;
    const segmento = host.dataset.segmento || '';
    // eventId null = hapee respondió "ok" pero descartó el envío (honeypot / spam): no crea el lead.
    // Se lleva igual a /gracias/ (no delatar al bot) pero marcado para que NO mida nada.
    const spam = !msg.eventId;
    const id = msg.eventId || `spam-${Date.now()}`;
    try {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ id, ts: Date.now(), segmento, spam }));
    } catch { /* sin storage: /gracias/ usa el respaldo por referrer */ }
    if (spam) {
      setTimeout(() => location.assign('/gracias/'), 700);
      return;
    }
    track('form_submit', { form: 'hapee-cotizacion', segmento, page: location.pathname });
    // Convención Digitals: dg_formulario por gtag (GA4 + Ads) y recién después /gracias/, para no
    // perder el evento si la navegación corta el request. Breve pausa para que se vea el
    // "¡Enviado!" de hapee. Sin helper (no debería pasar), navega igual.
    const gracias = `/gracias/${segmento ? `?s=${encodeURIComponent(segmento)}` : ''}`;
    setTimeout(() => {
      const send = (window as Window & { dgSendEvent?: (url: string, ev: string, p: Record<string, unknown>) => void }).dgSendEvent;
      if (send) send(gracias, 'dg_formulario', { form_id: 'hapee-147', segmento, page: location.pathname });
      else location.assign(gracias);
    }, 700);
  });
}
