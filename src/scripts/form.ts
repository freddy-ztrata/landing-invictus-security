/**
 * Formulario de cotización en 3 pasos.
 * Envío: POST JSON a /api/lead (nginx lo reenvía al webhook de hapee, que crea contacto + deal).
 * Éxito: deja en sessionStorage el token { id, ts, segmento, user_data } y navega a /gracias/,
 * que dispara la conversión UNA vez (con transaction_id y Enhanced Conversions).
 */
import { getAttribution } from './attribution';
import { track } from './tracking';

const DRAFT_KEY = 'inv_form_draft';
const TOKEN_KEY = 'inv_lead';
const FIELDS = ['segmento', 'comuna', 'cobertura', 'plazo', 'puestos', 'fecha_evento', 'asistentes', 'nombre', 'telefono', 'email', 'rol', 'empresa'] as const;

/**
 * Calidad del lead (las campañas son para leads de CONTRATACIÓN: fuera curiosos y postulantes).
 * "curioso" = solo está averiguando. Se envía igual a hapee (etiquetado), pero NO dispara la
 * conversión de Google Ads → el Smart Bidding aprende a buscar gente que va a contratar.
 */
export function calidadLead(d: { plazo?: string }): 'calificado' | 'curioso' {
  return d.plazo === 'Solo estoy averiguando' ? 'curioso' : 'calificado';
}
type Data = Partial<Record<(typeof FIELDS)[number], string>>;

/** Normaliza teléfonos chilenos a E.164 (+56 + 9 dígitos). Devuelve null si no es válido. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('56')) d = d.slice(2);
  if (d.length === 8 && /^[2-9]/.test(d)) d = '9' + d; // celular escrito sin el 9 inicial
  if (d.length !== 9 || !/^[2-9]/.test(d)) return null;
  return '+56' + d;
}

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function uuid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function readDraft(): Data {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
}

function saveDraft(d: Data) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* */ }
}

export function initLeadForms() {
  document.documentElement.classList.add('js');
  document.querySelectorAll<HTMLFormElement>('form[data-lead-form]').forEach(setup);
}

function setup(form: HTMLFormElement) {
  if (form.dataset.ready) return;
  form.dataset.ready = '1';

  const steps = Array.from(form.querySelectorAll<HTMLFieldSetElement>('.lead__step'));
  const bar = form.querySelector<HTMLElement>('[data-progress]');
  const label = form.querySelector<HTMLElement>('[data-step-label]');
  const status = form.querySelector<HTMLElement>('[data-status]');
  const fail = form.querySelector<HTMLElement>('[data-fail]');
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const startedAt = Date.now();
  let current = 1;
  let started = false;
  let sending = false;

  const el = (name: string) => form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;

  function value(name: string): string {
    const f = el(name);
    if (!f) return '';
    return (f as HTMLInputElement).value?.trim?.() ?? '';
  }

  function setValue(name: string, v: string) {
    const f = el(name);
    if (!f || !v) return;
    if (f instanceof RadioNodeList) {
      f.forEach((n) => { const i = n as HTMLInputElement; i.checked = i.value === v; });
    } else {
      f.value = v;
    }
  }

  function collect(): Data {
    const d: Data = {};
    for (const k of FIELDS) d[k] = value(k);
    return d;
  }

  function syncEventoFields() {
    const isEvento = value('segmento') === 'evento';
    form.querySelectorAll<HTMLElement>('[data-only="evento"]').forEach((n) => (n.hidden = !isEvento));
    form.querySelectorAll<HTMLElement>('[data-only="no-evento"]').forEach((n) => (n.hidden = isEvento));
  }

  function go(step: number, focus = true) {
    current = Math.max(1, Math.min(steps.length, step));
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === current));
    if (bar) bar.style.width = `${(current / steps.length) * 100}%`;
    if (label) label.textContent = `Paso ${current} de ${steps.length}`;
    syncEventoFields();
    if (focus) {
      const active = steps[current - 1];
      const rect = form.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.5) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const first = active.querySelector<HTMLElement>('input:not([type=radio]):not([tabindex="-1"]), select, input[type=radio]:checked, input[type=radio]');
      first?.focus({ preventScroll: true });
    }
    if (current > 1) track('form_step', { step: current, segmento: value('segmento') });
  }

  function showError(name: string, on: boolean) {
    const msg = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (msg) msg.hidden = !on;
    const f = el(name);
    if (f && !(f instanceof RadioNodeList)) {
      f.setAttribute('aria-invalid', String(on));
      if (msg) {
        msg.id ||= `err-${name}`;
        if (on) f.setAttribute('aria-describedby', msg.id); else f.removeAttribute('aria-describedby');
      }
    }
  }

  function validate(step: number): boolean {
    const bad: string[] = [];
    if (step === 1 && !value('segmento')) bad.push('segmento');
    if (step === 2) {
      if (!value('comuna')) bad.push('comuna');
      if (!value('cobertura')) bad.push('cobertura');
      if (!value('plazo')) bad.push('plazo');
    }
    if (step === 3) {
      if (value('nombre').length < 2) bad.push('nombre');
      if (!normalizePhone(value('telefono'))) bad.push('telefono');
      if (!isEmail(value('email'))) bad.push('email');
      if (!value('rol')) bad.push('rol');
    }
    const all = { 1: ['segmento'], 2: ['comuna', 'cobertura', 'plazo'], 3: ['nombre', 'telefono', 'email', 'rol'] }[step] ?? [];
    all.forEach((n) => showError(n, bad.includes(n)));
    if (bad.length) {
      const f = el(bad[0]);
      const target = f instanceof RadioNodeList ? (f[0] as HTMLElement) : (f as HTMLElement | null);
      target?.focus();
    }
    return bad.length === 0;
  }

  // Restaurar borrador / preselección
  const draft = readDraft();
  for (const k of FIELDS) if (draft[k]) setValue(k, draft[k]!);
  if (!value('segmento') && form.dataset.segmento) setValue('segmento', form.dataset.segmento);
  const qsSeg = new URLSearchParams(location.search).get('seg');
  if (qsSeg) setValue('segmento', qsSeg);
  go(1, false);

  form.addEventListener('input', () => saveDraft(collect()));
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    saveDraft(collect());
    if (t.name === 'segmento') {
      if (!started) { started = true; track('form_start', { segmento: t.value, page: location.pathname }); }
      showError('segmento', false);
      syncEventoFields();
    }
    if (t.name === 'cobertura') showError('cobertura', false);
    if (t.name === 'plazo') showError('plazo', false);
    if (t.name === 'rol') showError('rol', false);
  });

  // Micro-compromiso: tocar una opción (aunque ya venga preseleccionada) avanza al paso 2.
  // Solo con puntero: con teclado, las flechas recorren las opciones y "Continuar" avanza.
  form.addEventListener('pointerup', (e) => {
    const opt = (e.target as HTMLElement).closest('.opt');
    if (!opt || current !== 1) return;
    setTimeout(() => {
      const input = opt.querySelector<HTMLInputElement>('input');
      if (input?.checked && current === 1) {
        if (!started) { started = true; track('form_start', { segmento: input.value, page: location.pathname }); }
        go(2);
      }
    }, 200);
  });

  form.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button');
    if (!t) return;
    if (t.hasAttribute('data-next')) { if (validate(current)) go(current + 1); }
    if (t.hasAttribute('data-back')) go(current - 1);
    if (t.hasAttribute('data-retry')) form.requestSubmit();
  });

  // Enter en un input del paso 1/2 avanza en vez de enviar
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && current < steps.length && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      if (validate(current)) go(current + 1);
    }
  });

  // Precarga desde la calculadora de dotación
  window.addEventListener('inv:prefill', (e) => {
    const d = (e as CustomEvent<Data>).detail || {};
    for (const k of FIELDS) if (d[k]) setValue(k, d[k]!);
    saveDraft(collect());
    go(value('segmento') ? 2 : 1);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    for (const s of [1, 2]) if (!validate(s)) { go(s); validate(s); return; }
    if (!validate(3)) return;

    sending = true;
    submitBtn?.setAttribute('aria-busy', 'true');
    if (submitLabel) submitLabel.textContent = 'Enviando…';
    if (fail) fail.hidden = true;
    if (status) status.textContent = '';

    const d = collect();
    const telefono = normalizePhone(d.telefono || '')!;
    const email = (d.email || '').trim().toLowerCase();
    const leadId = uuid();
    const calidad = calidadLead(d);
    const payload = {
      lead_id: leadId,
      origen: 'web',
      formulario: 'cotizacion-web',
      calidad,
      segmento: d.segmento,
      comuna: d.comuna,
      cobertura: d.cobertura,
      plazo: d.plazo,
      rol: d.rol,
      puestos: d.segmento === 'evento' ? '' : d.puestos,
      fecha_evento: d.segmento === 'evento' ? d.fecha_evento : '',
      asistentes: d.segmento === 'evento' ? d.asistentes : '',
      nombre: d.nombre,
      telefono,
      email,
      empresa: d.empresa,
      pagina: location.pathname,
      dispositivo: matchMedia('(max-width: 768px)').matches ? 'movil' : 'escritorio',
      enviado_en: new Date().toISOString(),
      t_llenado_s: Math.round((Date.now() - startedAt) / 1000),
      website: value('website'), // honeypot
      ...getAttribution(),
    };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
        credentials: 'omit',
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      try {
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
          id: leadId,
          ts: Date.now(),
          segmento: d.segmento,
          calidad,
          user_data: { email, phone_number: telefono },
        }));
        sessionStorage.removeItem(DRAFT_KEY);
      } catch { /* sin storage: /gracias/ usa el respaldo por referrer */ }
      if (status) status.textContent = '¡Listo! Redirigiendo…';
      location.assign(`/gracias/?s=${encodeURIComponent(d.segmento || '')}`);
    } catch (err) {
      clearTimeout(timer);
      sending = false;
      submitBtn?.removeAttribute('aria-busy');
      if (submitLabel) submitLabel.textContent = 'Recibir mi cotización';
      if (fail) { fail.hidden = false; fail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      if (status) status.textContent = 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.';
      track('form_submit_error', { reason: String((err as Error)?.message || err).slice(0, 80), segmento: d.segmento });
    }
  });
}
