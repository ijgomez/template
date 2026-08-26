# Reglas de Testing

#[[file:template-docs/04-development/coding-guidelines/testing.md]]

## Playwright MCP

El servidor MCP de Playwright (`@playwright/mcp@latest`) está configurado en el workspace. Utilízalo para:

- **Depuración visual**: navegar la aplicación, inspeccionar elementos y verificar estados de la UI antes de escribir o corregir tests E2E.
- **Generación de tests**: usar las herramientas de snapshot de accesibilidad (`browser_snapshot`) para identificar los `data-testid` y roles disponibles en cada pantalla, y generar tests Playwright basados en ellos.
- **Validación rápida**: ejecutar flujos manuales en el navegador (login, CRUD, navegación) para confirmar que la aplicación funciona antes de automatizar.

### Herramientas principales del MCP Playwright

| Herramienta | Uso |
|-------------|-----|
| `browser_navigate` | Navegar a una URL de la aplicación |
| `browser_snapshot` | Obtener el árbol de accesibilidad de la página (para localizar elementos) |
| `browser_click` | Hacer click en un elemento |
| `browser_fill_form` | Rellenar campos de formulario |
| `browser_find` | Buscar texto o regex en el snapshot de la página |
| `browser_take_screenshot` | Capturar screenshot para verificación visual |

### Flujo de trabajo recomendado

1. Navegar a la pantalla objetivo con `browser_navigate`.
2. Obtener el snapshot de accesibilidad con `browser_snapshot` para identificar elementos y sus `data-testid`.
3. Interactuar con la página (clicks, formularios) para validar el flujo.
4. Escribir el test Playwright (`.spec.ts`) usando los selectores identificados.
5. Ejecutar el test con `npx playwright test` para confirmar que pasa.
