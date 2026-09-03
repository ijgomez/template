# Reglas de Codificación — Angular / Frontend

#[[file:template-docs/04-development/coding-guidelines/angular.md]]

#[[file:template-docs/03-technical/frontend/components.md]]

## Flujo de Trabajo Eficiente (Optimización de Créditos)

Al modificar componentes, servicios, pipes o directivas Angular, **prioriza la navegación selectiva por símbolos sobre la lectura completa de ficheros**. Leer archivos enteros consume créditos innecesariamente cuando el cambio afecta a un método o variable concretos.

### Procedimiento recomendado

Siempre que sea posible, sigue este orden en lugar de leer ficheros completos:

1. **Buscar el componente/símbolo** con herramientas de símbolos (`find_symbol` con el `name_path`, p. ej. `UserListComponent` o `UserListComponent/loadUsers`) o `get_symbols_overview` para ver la estructura del fichero sin leerlo entero.
2. **Buscar referencias** al componente/símbolo (`find_referencing_symbols`) para localizar todos los puntos afectados por el cambio (templates, rutas, componentes padre).
3. **Buscar el método o variable afectado** dentro del símbolo (`find_symbol` con `depth` para ver hijos, o `grep_search` acotado con `includePattern`).
4. **Leer únicamente esos fragmentos** (el cuerpo del símbolo con `include_body=true`, o un rango de líneas concreto), no el fichero completo.
5. **Aplicar el cambio** con edición a nivel de símbolo (`replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`) o reemplazo por patrón acotado (`replace_content`).
6. **Ejecutar las comprobaciones**: diagnósticos LSP del fichero (`get_diagnostics_for_file`), tests del componente (`.spec.ts`) y, cuando aplique, verificación en navegador con el MCP de Playwright.

### Reglas

- Lee un fichero completo **solo** cuando el cambio sea transversal a todo el fichero o cuando la estructura de símbolos no baste para entender el contexto.
- Para renombrados de símbolos usa `rename_symbol` en vez de múltiples reemplazos manuales.
- Para cambios repetidos en varios ficheros (imports, selectores, rutas) usa el reemplazo multi-fichero acotado con un `paths_include_glob` (p. ej. `template/dashboard/src/**/*.ts`).
- Acota siempre las búsquedas de texto con `includePattern`/`relative_path` al directorio del frontend (`template/dashboard/`) para no recorrer todo el repositorio.
- No añadas la creación/actualización de tests ni las verificaciones de accesibilidad/UX que exige el resto de esta guía: la optimización de créditos afecta a *cómo navegas y editas*, no a *qué entregas*.

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
