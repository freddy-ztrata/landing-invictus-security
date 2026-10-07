/**
 * Medición: todo va al dataLayer (GTM es la fuente única). Nada de gtag inline salvo en
 * /gracias/, donde se dispara la conversión primaria condicionada al token del envío.
 *
 * Eventos: form_start, form_step, form_submit_error, generate_lead (solo en /gracias/),
 * call_click, cta_click, calculator_complete, faq_open, web_vitals.
 */
declare global {
  interface Window { dataLayer: Record<string, unknown>[] }
}

window.dataLayer = window.dataLayer || [];

export function track(event: string, params: Record<string, unknown> = {}) {
  window.dataLayer.push({ event, ...params });
}

// Clicks delegados (funciona también para elementos que se agregan después)
document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]');
  if (!el) return;
  const kind = el.dataset.track;
  if (kind === 'call') track('call_click', { contact_method: 'phone', placement: el.dataset.placement || '' });
  else if (kind === 'cta') track('cta_click', { placement: el.dataset.placement || '', label: el.textContent?.trim().slice(0, 60) || '' });
});

// FAQ abiertas (<details data-faq>)
document.addEventListener('toggle', (e) => {
  const d = e.target as HTMLDetailsElement;
  if (d instanceof HTMLDetailsElement && d.open && d.hasAttribute('data-faq')) {
    track('faq_open', { question: d.querySelector('summary')?.textContent?.trim().slice(0, 100) || '' });
  }
}, true);

// Core Web Vitals reales (RUM) → GA4 vía GTM. Se carga en idle para no competir con el LCP.
const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 2500));
idle(() => {
  import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
    const send = (m: { name: string; value: number; rating: string; id: string }) =>
      track('web_vitals', { metric_name: m.name, metric_value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value), metric_rating: m.rating, metric_id: m.id });
    onLCP(send);
    onINP(send);
    onCLS(send);
  }).catch(() => { /* sin RUM, no pasa nada */ });
});

export {};
