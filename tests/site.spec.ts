import { test, expect, type Page } from '@playwright/test';

const PAGES = ['/', '/guardias-de-seguridad/', '/seguridad-para-condominios/', '/guardias-para-eventos/', '/seguridad-para-empresas/', '/cotizar/', '/nosotros/', '/guia/cuantos-guardias-necesito/', '/guia/ley-21659-seguridad-privada/', '/privacidad/'];
const HAPEE_FORM = 'invictus_security/cotizaci-n-web-invictussecurity-cl';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/hapee|ERR_|net::|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return errors;
}

/** Simula el aviso real del embed de hapee al enviarse el formulario. */
async function simulateHapeeSubmit(page: Page, origin = 'https://beta.hapee.ai', formId = HAPEE_FORM) {
  await page.evaluate(([o, f]) => {
    window.dispatchEvent(new MessageEvent('message', { origin: o, data: { type: 'zentru_form_submitted', formId: f, eventId: 'lead.999' } }));
  }, [origin, formId]);
}

// Por defecto no dependemos de hapee (tests deterministas). El test "embed real" lo habilita.
test.beforeEach(async ({ page }, info) => {
  if (!info.title.includes('embed real')) await page.route('https://beta.hapee.ai/**', (r) => r.abort());
});

test.describe('Todas las páginas', () => {
  for (const path of PAGES) {
    test(`carga sin errores y con SEO básico: ${path}`, async ({ page }) => {
      const errors = collectErrors(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThanOrEqual(65);
      const noindex = await page.locator('meta[name=robots][content*=noindex]').count();
      if (noindex) await expect(page.locator('link[rel=canonical]')).toHaveCount(0);
      else expect(await page.locator('link[rel=canonical]').getAttribute('href')).toBe(`https://invictussecurity.cl${path}`);
      const desc = await page.locator('meta[name=description]').getAttribute('content');
      expect(desc!.length).toBeLessThanOrEqual(155);
      for (const raw of await page.locator('script[type="application/ld+json"]').allTextContents()) {
        expect(() => JSON.parse(raw)).not.toThrow();
      }
      expect(errors, errors.join('\n')).toHaveLength(0);
    });
  }
});

test('las cifras están en el HTML (sin JS)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Empresa de seguridad privada');
  expect(await page.locator('.stat__num').allTextContents()).toEqual(['+200', '+150', '24/7', '100%']);
  await ctx.close();
});

test('cada página con formulario usa el embed de hapee de cotización (uno solo)', async ({ page }) => {
  for (const path of ['/', '/seguridad-para-condominios/', '/cotizar/', '/guia/cuantos-guardias-necesito/']) {
    await page.goto(path);
    await expect(page.locator(`#cotizar [data-zentru-form="${HAPEE_FORM}"]`)).toHaveCount(1);
    await expect(page.locator('#cotizar')).toHaveCount(1);
  }
});

test('envío en hapee → /gracias/ mide UNA vez; recarga no mide', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/seguridad-para-condominios/?gclid=TEST');
  await simulateHapeeSubmit(page);
  await page.waitForURL('**/gracias/?s=condominio');
  await expect(page.locator('h1')).toContainText('Recibimos tu solicitud');
  await expect.poll(() => logs.filter((l) => l.includes('conversión simulada')).length).toBe(1);
  expect(logs.find((l) => l.includes('conversión simulada'))).toContain('lead.999');
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(logs.filter((l) => l.includes('conversión simulada')).length).toBe(1);
});

test('mensajes de otro origen o de otro formulario se ignoran', async ({ page }) => {
  await page.goto('/cotizar/');
  await simulateHapeeSubmit(page, 'https://evil.example');
  await simulateHapeeSubmit(page, 'https://beta.hapee.ai', 'otro_cliente/otro-form');
  await page.waitForTimeout(1200);
  await expect(page).toHaveURL(/\/cotizar\/$/);
});

test('visita directa a /gracias/ no mide', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/gracias/');
  await page.waitForLoadState('networkidle');
  expect(logs.some((l) => l.includes('conversión simulada'))).toBe(false);
});

test('el gclid de la llegada se conserva para el formulario en otra página', async ({ page }) => {
  await page.goto('/?gclid=GCLID-LLEGADA&utm_source=google&utm_campaign=marca');
  await page.goto('/cotizar/');
  await expect(page).toHaveURL(/gclid=GCLID-LLEGADA/);
  await expect(page).toHaveURL(/utm_campaign=marca/);
});

test('sin opción de empleo: ningún enlace a postulaciones', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href*="trabaja"]')).toHaveCount(0);
  await expect(page.getByText(/buscas trabajo|busco empleo|postula/i)).toHaveCount(0);
});

test('home: foto real a pantalla completa con art-direction móvil; sin video en esta fase', async ({ page }, info) => {
  await page.goto('/');
  const poster = page.locator('.hero__stage .hero__poster');
  await expect(poster).toBeVisible();
  await expect(poster).toHaveAttribute('fetchpriority', 'high');
  // Un solo <img> LCP en el DOM (la variante móvil es una <source media>), con alt
  await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(1);
  await expect(page.locator('.hero__stage img')).toHaveCount(1);
  await expect(poster).toHaveAttribute('alt', /Invictus Security/);
  // Preload en <head> de cada variante con su media query (cada viewport baja solo la suya)
  const preloads = page.locator('head link[rel="preload"][as="image"]');
  await expect(preloads).toHaveCount(2);
  await expect(preloads.nth(0)).toHaveAttribute('media', '(max-width: 960px)');
  await expect(preloads.nth(1)).toHaveAttribute('media', '(min-width: 961px)');
  const box = await poster.boundingBox();
  expect(box!.y).toBeLessThan(page.viewportSize()!.height);
  expect(box!.height).toBeGreaterThan(info.project.name === 'desktop' ? 300 : 150);
  const src = await poster.evaluate((img: HTMLImageElement) => img.currentSrc);
  expect(src).toMatch(info.project.name === 'desktop' ? /invictus-hero-flota/ : /invictus-camioneta-atardecer/);
  if (info.project.name === 'mobile') {
    await expect(page.locator('.hero__quick .btn')).toBeInViewport();
    await expect(page.locator('.hero__confidence')).toBeInViewport();
  }
  await expect(page.locator('[data-hero-video]')).toHaveCount(0);
});

test('home: cada viewport descarga UNA sola foto de hero', async ({ page }, info) => {
  const heroReqs: string[] = [];
  page.on('request', (r) => { if (/invictus-(hero-flota|camioneta-atardecer-4x3)/.test(r.url())) heroReqs.push(r.url()); });
  await page.goto('/');
  await page.waitForLoadState('load');
  const otra = info.project.name === 'desktop' ? /camioneta-atardecer-4x3/ : /hero-flota/;
  expect(heroReqs.filter((u) => otra.test(u)), heroReqs.join('\n')).toHaveLength(0);
  expect(heroReqs.length).toBeGreaterThanOrEqual(1);
});

test('home: hero 4K nítido en pantallas anchas, full-bleed y sin scroll horizontal', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'solo desktop');
  for (const w of [1440, 1920, 2560]) {
    await page.setViewportSize({ width: w, height: Math.round(w * 0.5625) });
    await page.goto('/');
    const poster = page.locator('.hero__stage .hero__poster');
    await expect.poll(() => poster.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeTruthy();
    const { src, natural, shown, vw, scrollW, stageW } = await poster.evaluate((i: HTMLImageElement) => ({
      src: i.currentSrc, natural: i.naturalWidth, shown: i.getBoundingClientRect().width / 1.02,
      vw: innerWidth, scrollW: document.documentElement.scrollWidth,
      stageW: document.querySelector('.hero__stage')!.getBoundingClientRect().width,
    }));
    expect(src, `${w}`).toMatch(/invictus-hero-flota-4k/);
    // la variante elegida cubre el ancho al que se muestra (sin estirar un archivo de 1600/1920)
    expect(natural, `${w}: ${natural}px para ${Math.round(shown)}px`).toBeGreaterThanOrEqual(Math.min(3200, shown * 0.95));
    expect(stageW, `${w}`).toBe(vw);
    expect(scrollW, `${w}`).toBe(vw);
  }
});

test('home: movimiento de cámara 6 s en CSS (sin video); estático con reduced-motion', async ({ page, browser }, info) => {
  const videoReqs: string[] = [];
  page.on('request', (r) => { if (/\.(mp4|webm)(\?|$)/.test(r.url())) videoReqs.push(r.url()); });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);
  expect(videoReqs, 'el hero no descarga video').toHaveLength(0);
  const anim = await page.locator('.hero__stage .hero__poster').evaluate((i) => {
    const cs = getComputedStyle(i);
    return { name: cs.animationName, dur: cs.animationDuration, dir: cs.animationDirection, iter: cs.animationIterationCount, origin: cs.transformOrigin };
  });
  expect(anim).toMatchObject({ name: 'hero-breathe', dur: '3s', dir: 'alternate', iter: 'infinite' });
  // reduced-motion: imagen estática
  const ctx = await browser.newContext({ ...(info.project.use as object), reducedMotion: 'reduce' });
  const p2 = await ctx.newPage();
  await p2.route('https://beta.hapee.ai/**', (r) => r.abort());
  await p2.goto('http://localhost:4321/');
  const rm = await p2.locator('.hero__stage .hero__poster').evaluate((i) => ({ name: getComputedStyle(i).animationName, t: getComputedStyle(i).transform }));
  expect(rm).toEqual({ name: 'none', t: 'none' });
  await ctx.close();
});

test('fotos reales: galería "En terreno" en Nosotros y banda en Eventos', async ({ page }) => {
  await page.goto('/nosotros/');
  const gal = page.locator('#en-terreno');
  await expect(gal.getByRole('heading', { level: 2 })).toBeVisible();
  expect(await gal.locator('.gallery__item').count()).toBeGreaterThanOrEqual(4);
  await expect(gal.locator('img[src*="/img/gen/"], img[src*="central-monitoreo"]')).toHaveCount(0);
  // Todas las fotos de la tira cargan (también las que están fuera de pantalla en el scroll horizontal)
  await gal.scrollIntoViewIfNeeded();
  await expect.poll(() => gal.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0)), { timeout: 10000 }).toBe(true);
  // Eventos: la banda solo existe con 3 fotos o más (con el flag de marcas apagado no se muestra)
  await page.goto('/guardias-para-eventos/');
  const ev = page.locator('#eventos-en-terreno');
  const n = await ev.locator('.gallery__item').count();
  expect(n === 0 || n >= 3, `fotos en la banda de eventos: ${n}`).toBe(true);
  // Toda foto con marca de tercero visible lleva el sello de vista previa
  const conMarca = page.locator('.gallery__fig:has(.brand-seal)');
  for (const f of await conMarca.all()) await expect(f.locator('.brand-seal')).toHaveText(/pendiente de autorización/i);
});

test('fotos reales: ninguna página usa fotos IA de img/gen ni el video', async ({ page }) => {
  for (const path of ['/', '/guardias-de-seguridad/', '/seguridad-para-condominios/', '/guardias-para-eventos/', '/seguridad-para-empresas/', '/nosotros/']) {
    await page.goto(path);
    const html = await page.content();
    expect(html, path).not.toMatch(/central-monitoreo|hero-guardias-(centro|equipo)|condominio-conserjeria|empresa-bodega-acceso|evento-control-acceso|ppi-escolta|santiago-noche-aerea|hero-guardias-v2/);
  }
});

test('segmento: foto en tarjeta sobre el pliegue', async ({ page }) => {
  await page.goto('/guardias-de-seguridad/');
  const img = page.locator('.hero__visual img');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  const box = await img.boundingBox();
  expect(box!.y).toBeLessThan(page.viewportSize()!.height);
  expect(box!.height).toBeGreaterThan(150);
});

test('calculadora: 24 h lun–vie = 3 guardias; el CTA lleva al formulario', async ({ page }) => {
  await page.goto('/guia/cuantos-guardias-necesito/');
  const calc = page.locator('[data-calc]').first();
  await expect(calc.locator('[data-total]')).toHaveText('4');
  await calc.locator('label:has(input[name="c-dias"][value="5"])').click();
  await expect(calc.locator('[data-total]')).toHaveText('3');
  await calc.locator('[data-inc]').click();
  await expect(calc.locator('[data-total]')).toHaveText('6');
  await calc.locator('[data-calc-cta]').click();
  await expect(page.locator('#cotizar')).toBeInViewport({ timeout: 4000 });
});

test('URL sin barra final redirige conservando el gclid', async ({ request }) => {
  const res = await request.get('/seguridad-para-condominios?gclid=ABC', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()['location']).toBe('/seguridad-para-condominios/?gclid=ABC');
});

// Depende de la red y de beta.hapee.ai (servicio externo): reintentos + esperas explícitas por
// etapa, para distinguir "el sitio no carga el embed" de "hapee tardó/falló" en el log del CI.
test.describe('embed real', () => {
  test.describe.configure({ retries: 2 });
  test('embed real: el formulario de hapee carga en la página', async ({ page }) => {
    test.skip(!!process.env.OFFLINE, 'sin red');
    test.setTimeout(90_000);
    const esEmbed = (url: string) => url.startsWith('https://beta.hapee.ai/static/form-embed.js');
    // Respuesta o fallo de red (lo que ocurra primero): el error del CI dice cuál fue.
    const embedJs = Promise.race([
      page.waitForResponse((r) => esEmbed(r.url()), { timeout: 30_000 }).then((r) => `HTTP ${r.status()}`),
      page.waitForEvent('requestfailed', { predicate: (r) => esEmbed(r.url()), timeout: 30_000 }).then((r) => `falla de red: ${r.failure()?.errorText}`),
    ]);
    await page.goto('/cotizar/');
    // El sitio carga el embed al acercarse el formulario (IntersectionObserver): lo llevamos a la vista.
    await page.locator('#cotizar').scrollIntoViewIfNeeded();
    expect(await embedJs, 'carga de https://beta.hapee.ai/static/form-embed.js').toBe('HTTP 200');
    // 1) el embed convierte el div en un iframe de hapee
    const iframe = page.locator('#cotizar iframe').first();
    await expect(iframe, 'iframe de hapee creado').toBeAttached({ timeout: 30_000 });
    // 2) dentro del iframe aparece el formulario (selects/inputs) y un submit
    const frame = iframe.contentFrame();
    await expect(frame.locator('select, input:not([type="hidden"])').first(), 'campos del formulario').toBeVisible({ timeout: 30_000 });
    // El texto del botón se edita en hapee ("Enviar", "Solicitar cotización"...): basta con que exista un submit.
    await expect(frame.locator('button[type="submit"], input[type="submit"]').first()).toBeVisible();
  });
});

test('convención dg_: dg_envio_formulario se dispara en /gracias/ con el token del envío', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/cotizar/');
  await simulateHapeeSubmit(page);
  await page.waitForURL('**/gracias/**');
  await expect.poll(() => logs.find((l) => l.includes('conversión simulada')) || '').toContain('dg_envio_formulario');
});

test('envío descartado por hapee (eventId null, honeypot): llega a /gracias/ pero no mide', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/cotizar/');
  await page.evaluate(([o, f]) => {
    window.dispatchEvent(new MessageEvent('message', { origin: o, data: { type: 'zentru_form_submitted', formId: f, eventId: null } }));
  }, ['https://beta.hapee.ai', HAPEE_FORM]);
  await page.waitForURL('**/gracias/');
  await page.waitForLoadState('networkidle');
  expect(logs.some((l) => l.includes('descartado por hapee'))).toBe(true);
  expect(logs.some((l) => l.includes('conversión simulada'))).toBe(false);
  const dl = await page.evaluate(() => ((window as any).dataLayer || []).map((e: any) => e && e.event).filter(Boolean));
  expect(dl).not.toContain('generate_lead');
});
