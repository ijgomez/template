# Reglas de Codificación — Angular / Frontend

#[[file:template-docs/04-development/coding-guidelines/angular.md]]

#[[file:template-docs/03-technical/frontend/components.md]]

## Playwright MCP para Testing E2E del Frontend

El servidor MCP de Playwright (`@playwright/mcp@latest`) está configurado en el workspace. Úsalo al trabajar con componentes y pantallas Angular para:

- **Verificar la UI en navegador real** antes de dar por terminado un componente o pantalla.
- **Identificar selectores** (`data-testid`, roles accesibles) mediante `browser_snapshot` para escribir tests E2E precisos.
- **Validar estados visibles**: comprobar que se muestran correctamente los estados de carga, error, vacío y éxito.
- **Comprobar responsive**: redimensionar el navegador con `browser_resize` y verificar que el layout se adapta.
- **Verificar accesibilidad**: el snapshot de accesibilidad revela roles, `aria-label` y estructura semántica de la página.

### Cuándo usar el MCP Playwright

| Situación | Acción con MCP |
|-----------|----------------|
| Crear/modificar un componente de pantalla | Navegar a la ruta y hacer `browser_snapshot` para verificar estructura |
| Escribir un test E2E nuevo | Usar `browser_snapshot` + `browser_find` para localizar `data-testid` |
| Depurar un test E2E que falla | Navegar al flujo, reproducir los pasos y comparar con el test |
| Validar formularios | Usar `browser_fill_form` para probar validaciones y estados |
| Comprobar diseño responsive | Usar `browser_resize` con distintos viewports y verificar con `browser_snapshot` |
