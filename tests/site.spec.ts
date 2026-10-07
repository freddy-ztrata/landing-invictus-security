import { test, expect, type Page } from '@playwright/test';

const PAGES = ['/', '/guardias-de-seguridad/', '/seguridad-para-condominios/', '/guardias-para-eventos/', '/seguridad-para-empresas/', '/cotizar/', '/nosotros/', '/guia/cuantos-guardias-necesito/', '/guia/ley-21659-seguridad-privada/', '/trabaja-con-nosotros/', '/privacidad/'];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/beta\.hapee\.ai|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  return errors;
}

async function fillForm(page: Page, opts: { segmento?: string; plazo?: string } = {}) {
  const form = page.locator('#cotizar');
  await form.locator(`label.opt:has(input[value="${opts.segmento ?? 'condominio'}"])`).click();
  await expect(form.locator('[data-step="2"]')).toBeVisible();
  await form.locator('#f-comuna').fill('Las Condes');
  await form.locator('label.pill:has(input[value="24/7"])').click();
  await form.locator(`label.pill:has(input[value="${opts.plazo ?? 'Este mes'}"])`).click();
  await form.locator('[data-step="2"] [data-next]').click();
  await expect(form.locator('[data-step="3"]')).toBeVisible();
  await form.locator('#f-nombre').fill('Prueba Playwright');
  await form.locator('#f-telefono').fill('9 1234 5678');
  await form.locator('#f-email').fill('Prueba@Example.cl');
  await form.locator('#f-rol').selectOption('Administrador o comité');
}

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
      const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
      expect(canonical).toBe(`https://invictussecurity.cl${path}`);
      // JSON-LD válido
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
  const nums = await page.locator('.stat__num').allTextContents();
  expect(nums).toEqual(['+200', '+150', '24/7', '100%']);
  await ctx.close();
});

test('formulario: envío exitoso → /gracias/ mide UNA vez; recarga no mide', async ({ page }) => {
  let payload: Record<string, unknown> | null = null;
  await page.route('**/api/lead', async (route) => {
    payload = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));

  await page.goto('/seguridad-para-condominios/?gclid=TEST-GCLID-123&utm_source=google&utm_campaign=condominios');
  await fillForm(page);
  await page.locator('#cotizar [data-submit]').click();
  await page.waitForURL('**/gracias/?s=condominio');

  expect(payload).not.toBeNull();
  const p = payload as unknown as Record<string, string>;
  expect(p.segmento).toBe('condominio');
  expect(p.comuna).toBe('Las Condes');
  expect(p.cobertura).toBe('24/7');
  expect(p.telefono).toBe('+56912345678');
  expect(p.email).toBe('prueba@example.cl');
  expect(p.gclid).toBe('TEST-GCLID-123');
  expect(p.click_id_tipo).toBe('gclid');
  expect(p.utm_campaign).toBe('condominios');
  expect(p.website).toBe('');
  expect(p.lead_id).toMatch(/[0-9a-f-]{20,}/);
  expect(p.plazo).toBe('Este mes');
  expect(p.rol).toBe('Administrador o comité');
  expect(p.calidad).toBe('calificado');

  await expect(page.locator('h1')).toContainText('Recibimos tu solicitud');
  await expect.poll(() => logs.filter((l) => l.includes('conversión simulada')).length).toBe(1);

  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(logs.filter((l) => l.includes('conversión simulada')).length).toBe(1);
});

test('lead "solo estoy averiguando" se envía como curioso y NO dispara conversión de Ads', async ({ page }) => {
  let payload: Record<string, string> | null = null;
  await page.route('**/api/lead', async (route) => {
    payload = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/cotizar/');
  await fillForm(page, { plazo: 'Solo estoy averiguando' });
  await page.locator('#cotizar [data-submit]').click();
  await page.waitForURL('**/gracias/**');
  expect((payload as unknown as Record<string, string>).calidad).toBe('curioso');
  await expect.poll(() => logs.some((l) => l.includes('lead curioso'))).toBe(true);
  expect(logs.some((l) => l.includes('conversión simulada'))).toBe(false);
});

test('el paso 2 exige el plazo', async ({ page }) => {
  await page.goto('/cotizar/');
  await page.locator('#cotizar label.opt:has(input[value="empresa"])').click();
  await page.locator('#f-comuna').fill('Maipú');
  await page.locator('#cotizar label.pill:has(input[value="Noche"])').click();
  await page.locator('#cotizar [data-step="2"] [data-next]').click();
  await expect(page.locator('[data-error-for="plazo"]')).toBeVisible();
  await expect(page.locator('#cotizar [data-step="2"]')).toBeVisible();
});

test('visita directa a /gracias/ no mide', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/gracias/');
  await page.waitForLoadState('networkidle');
  expect(logs.some((l) => l.includes('conversión simulada'))).toBe(false);
});

test('formulario: validaciones del paso 3', async ({ page }) => {
  await page.goto('/cotizar/');
  await fillForm(page, { segmento: 'empresa' });
  await page.locator('#f-telefono').fill('123');
  await page.locator('#f-email').fill('no-es-email');
  await page.locator('#cotizar [data-submit]').click();
  await expect(page.locator('[data-error-for="telefono"]')).toBeVisible();
  await expect(page.locator('[data-error-for="email"]')).toBeVisible();
  await expect(page).toHaveURL(/\/cotizar\/$/);
});

test('formulario: si el endpoint falla, muestra respaldo y conserva los datos', async ({ page }) => {
  await page.route('**/api/lead', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto('/cotizar/');
  await fillForm(page, { segmento: 'evento' });
  await page.locator('#cotizar [data-submit]').click();
  await expect(page.locator('[data-fail]')).toBeVisible();
  await expect(page.locator('#f-nombre')).toHaveValue('Prueba Playwright');
  await expect(page).toHaveURL(/\/cotizar\/$/);
});

test('evento muestra fecha y asistentes; oculta puestos', async ({ page }) => {
  await page.goto('/guardias-para-eventos/');
  await expect(page.locator('#cotizar input[value="evento"]')).toBeChecked();
  await page.locator('#cotizar [data-step="1"] [data-next]').click();
  await expect(page.locator('#f-fecha')).toBeVisible();
  await expect(page.locator('#f-puestos')).toBeHidden();
});

test('"Busco trabajo" desvía a postulantes sin enviar lead', async ({ page }) => {
  let posted = false;
  await page.route('**/api/lead', (route) => { posted = true; return route.fulfill({ status: 200, body: '{}' }); });
  await page.goto('/');
  await page.locator('#cotizar .opt--job').click();
  await page.waitForURL('**/trabaja-con-nosotros/');
  await expect(page.locator('h1')).toContainText('guardia');
  expect(posted).toBe(false);
});

test('calculadora: 24 h lun–vie = 3 guardias y precarga el formulario', async ({ page }) => {
  await page.goto('/guia/cuantos-guardias-necesito/');
  const calc = page.locator('[data-calc]').first();
  await expect(calc.locator('[data-total]')).toHaveText('4');
  await calc.locator('label:has(input[name="c-dias"][value="5"])').click();
  await expect(calc.locator('[data-total]')).toHaveText('3');
  await calc.locator('[data-inc]').click();
  await expect(calc.locator('[data-total]')).toHaveText('6');
  await calc.locator('label:has(input[name="c-recinto"][value="empresa"])').click();
  await calc.locator('[data-calc-cta]').click();
  await expect(page.locator('#cotizar [data-step="2"]')).toBeVisible();
  await expect(page.locator('#cotizar input[name="cobertura"][value="24/7"]')).toBeChecked();
  await expect(page.locator('#f-puestos')).toHaveValue('2');
});

test('URL sin barra final redirige conservando el gclid', async ({ request }) => {
  const res = await request.get('/seguridad-para-condominios?gclid=ABC', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()['location']).toBe('/seguridad-para-condominios/?gclid=ABC');
});
