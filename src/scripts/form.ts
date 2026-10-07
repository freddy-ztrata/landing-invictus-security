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
    const id = msg.eventId || `hp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ id, ts: Date.now(), segmento }));
    } catch { /* sin storage: /gracias/ usa el respaldo por referrer */ }
    track('form_submit', { form: 'hapee-cotizacion', segmento, page: location.pathname });
    // Breve pausa para que se vea el "¡Enviado!" de hapee y salga el evento.
    setTimeout(() => location.assign(`/gracias/${segmento ? `?s=${encodeURIComponent(segmento)}` : ''}`), 700);
  });
}
