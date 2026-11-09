/**
 * Parallax leve para fondos decorativos: `[data-parallax="10"]` se desplaza como máximo ±10 px
 * (tope 12) según su posición en la ventana. Solo trabaja mientras el elemento está en pantalla
 * (IntersectionObserver) y en un único rAF por frame. Off con reduced-motion y con Save-Data.
 */
const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const els = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];

if (els.length && !reduce.matches && !conn?.saveData && 'IntersectionObserver' in window) {
  const visibles = new Set<HTMLElement>();
  let raf = 0;
  const frame = () => {
    raf = 0;
    const vh = innerHeight;
    visibles.forEach((el) => {
      const max = Math.min(12, Number(el.dataset.parallax) || 8);
      const r = (el.parentElement ?? el).getBoundingClientRect();
      // -1 (entra por abajo) … 1 (sale por arriba)
      const p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
      el.style.translate = `0 ${(p * max).toFixed(2)}px`;
    });
  };
  const tick = () => { if (!raf && visibles.size) raf = requestAnimationFrame(frame); };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visibles.add(e.target as HTMLElement) : visibles.delete(e.target as HTMLElement)));
    tick();
  });
  els.forEach((el) => io.observe(el));
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick, { passive: true });
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return;
    io.disconnect();
    visibles.clear();
    els.forEach((el) => { el.style.translate = ''; });
  });
}
