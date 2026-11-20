import { test as base, type Download, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

/**
 * `test` extendido que enriquece el report HTML de Playwright con:
 *
 * - Una captura tras cada paso de interacción (click, fill, select, check, goto...),
 *   adjunta como `NN-<acción>`, para poder seguir el flujo del test en el report.
 * - El fichero descargado (p. ej. los CSV/TXT de exportación), adjunto al test.
 *
 * Todos los specs deben importar `test` y `expect` desde este módulo en lugar de
 * `@playwright/test`.
 */

export { expect } from '@playwright/test';

interface StepContext {
  testInfo: TestInfo;
  counter: number;
  busy: boolean;
}

/** Test en ejecución en este worker (Playwright ejecuta un único test a la vez por worker). */
let current: StepContext | null = null;
let patched = false;

const LOCATOR_ACTIONS = [
  'click',
  'dblclick',
  'fill',
  'clear',
  'check',
  'uncheck',
  'selectOption',
  'setInputFiles',
  'press',
  'pressSequentially',
] as const;

const PAGE_ACTIONS = ['goto', 'reload', 'goBack'] as const;

type AnyFn = (...args: unknown[]) => Promise<unknown>;

async function captureStep(page: Page, action: string): Promise<void> {
  const ctx = current;
  if (!ctx || ctx.busy || page.isClosed()) {
    return;
  }
  ctx.busy = true;
  try {
    const body = await page.screenshot({ timeout: 5_000 });
    ctx.counter += 1;
    const index = String(ctx.counter).padStart(2, '0');
    await ctx.testInfo.attach(`${index}-${action}`, { body, contentType: 'image/png' });
  } catch {
    // La captura de un paso nunca debe hacer fallar el test.
  } finally {
    ctx.busy = false;
  }
}

function wrap(proto: object, name: string, resolvePage: (self: never) => Page): void {
  const original = (proto as Record<string, AnyFn>)[name];
  if (typeof original !== 'function') {
    return;
  }
  (proto as Record<string, AnyFn>)[name] = async function (this: never, ...args: unknown[]) {
    const result = await original.apply(this, args);
    await captureStep(resolvePage(this), name);
    return result;
  };
}

/** Parchea una sola vez (por worker) los prototipos de Locator y Page. */
function patchOnce(page: Page): void {
  if (patched) {
    return;
  }
  patched = true;
  const locatorProto = Object.getPrototypeOf(page.locator('body')) as object;
  for (const name of LOCATOR_ACTIONS) {
    wrap(locatorProto, name, (self: never) => (self as { page(): Page }).page());
  }
  const pageProto = Object.getPrototypeOf(page) as object;
  for (const name of PAGE_ACTIONS) {
    wrap(pageProto, name, (self: never) => self as Page);
  }
}

function contentTypeOf(filename: string): string {
  if (filename.endsWith('.csv')) {
    return 'text/csv';
  }
  if (filename.endsWith('.txt')) {
    return 'text/plain';
  }
  return 'application/octet-stream';
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    patchOnce(page);
    current = { testInfo, counter: 0, busy: false };

    const pending: Promise<void>[] = [];
    page.on('download', (download: Download) => {
      pending.push(
        (async () => {
          try {
            const filename = download.suggestedFilename();
            const dir = testInfo.outputPath('downloads');
            await mkdir(dir, { recursive: true });
            const path = `${dir}/${filename}`;
            await download.saveAs(path);
            await testInfo.attach(`download-${filename}`, {
              path,
              contentType: contentTypeOf(filename),
            });
          } catch {
            // Un fallo al guardar la descarga no debe romper el test.
          }
        })(),
      );
    });

    await use(page);

    await Promise.allSettled(pending);
    current = null;
  },
});
