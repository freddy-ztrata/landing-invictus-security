import { test, expect, type Page } from '@playwright/test';

const PAGES = ['/', '/guardias-de-seguridad/', '/seguridad-para-condominios/', '/guardias-para-eventos/', '/seguridad-para-empresas/', '/cotizar/', '/nosotros/', '/guia/cuantos-guardias-necesito/', '/guia/ley-21659-seguridad-privada/', '/trabaja-con-nosotros/', '/privacidad/'];
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
      expect(await page.locator('link[rel=canonical]').getAttribute('href')).toBe(`https://invictussecurity.cl${path}`);
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

test('"Busco empleo" desvía a la página de postulantes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#cotizar .lead__job').click();
  await page.waitForURL('**/trabaja-con-nosotros/');
  await expect(page.locator('h1')).toContainText('guardia');
  await expect(page.locator('[data-zentru-form="invictus_security/postulantes-trabaja-con-nosotros-web"]')).toHaveCount(1);
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

test('embed real: el formulario de hapee carga en la página', async ({ page }) => {
  test.skip(!!process.env.OFFLINE, 'sin red');
  await page.goto('/cotizar/');
  const frame = page.frameLocator(`#cotizar iframe[data-zentru-iframe-id="${HAPEE_FORM}"]`);
  await expect(frame.locator('select').first()).toBeVisible({ timeout: 20000 });
  await expect(frame.getByRole('button', { name: /enviar/i })).toBeVisible();
});
