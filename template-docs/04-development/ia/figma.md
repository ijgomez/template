# Integración con Figma

Guía de uso de la integración con Figma mediante el power de Kiro para la implementación de diseños, conexión de componentes y generación de reglas de sistema de diseño.

## Requisitos previos

- **Kiro Power "Figma"** instalado y activo en el IDE.
- **Servidor MCP de Figma** conectado (se gestiona automáticamente por el power; verificar estado en el panel de MCP Servers de Kiro).
- **Cuenta de Figma** autenticada (se solicita la primera vez que se usa el servidor).
- Acceso al fichero Figma del proyecto con permisos de lectura.

## Capacidades

| Capacidad                   | Descripción                                                                                      |
|-----------------------------|--------------------------------------------------------------------------------------------------|
| Implementar diseño          | Traduce un diseño de Figma a código Angular + Bootstrap respetando las convenciones del proyecto |
| Code Connect                | Conecta componentes de Figma con sus implementaciones de código (requiere plan Organization+)    |
| Reglas de sistema de diseño | Genera reglas específicas del proyecto para guiar flujos consistentes de Figma-a-código          |

## Herramientas disponibles (MCP)

| Herramienta                    | Uso                                                                 |
|--------------------------------|---------------------------------------------------------------------|
| `get_design_context`           | Obtiene datos estructurados de diseño (layout, tipografía, colores) |
| `get_metadata`                 | Devuelve estructura XML del nodo con IDs y dimensiones              |
| `get_screenshot`               | Captura una imagen visual del diseño para validación                |
| `get_variable_defs`            | Recupera variables y estilos (colores, espaciado, tipografía)       |
| `get_code_connect_suggestions` | Detecta y sugiere mappings de Code Connect                          |
| `send_code_connect_mappings`   | Confirma los mappings de Code Connect generados                     |
| `get_code_connect_map`         | Mapea IDs de nodo Figma a componentes de código                     |
| `add_code_connect_map`         | Establece nuevos mappings entre elementos Figma y código            |
| `create_design_system_rules`   | Genera ficheros de reglas para guiar la traducción diseño → código  |
| `generate_figma_design`        | Convierte descripciones de UI en capas de diseño en Figma           |
| `get_figjam`                   | Convierte diagramas FigJam a formato XML                            |
| `generate_diagram`             | Crea diagramas FigJam a partir de sintaxis Mermaid                  |
| `whoami`                       | Devuelve la identidad del usuario autenticado                       |

## Flujo de trabajo: Implementar un diseño

### Paso 1: Obtener el Node ID

Extraer el `fileKey` y `nodeId` de la URL de Figma proporcionada.

**Formato de URL:** `https://figma.com/design/:fileKey/:fileName?node-id=X-Y`

- **File key:** segmento después de `/design/`
- **Node ID:** valor del parámetro `node-id`

**Ejemplo:**

```
URL:      https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15
File key: kL9xQn2VwM8pYrTb4ZcHjF
Node ID:  42-15
```

### Paso 2: Obtener contexto de diseño

Ejecutar `get_design_context` con el file key y node ID extraídos. Esto proporciona:

- Propiedades de layout (Auto Layout, constraints, sizing)
- Especificaciones tipográficas
- Valores de color y tokens de diseño
- Estructura de componentes y variantes
- Valores de espaciado y padding

Si la respuesta es demasiado grande, usar `get_metadata` primero para obtener la estructura y luego consultar nodos hijos individualmente.

### Paso 3: Capturar referencia visual

Ejecutar `get_screenshot` para obtener una captura visual que sirve como fuente de verdad durante toda la implementación.

### Paso 4: Descargar assets

Descargar imágenes, iconos y SVGs devueltos por el servidor.

**Reglas importantes:**

- Usar directamente las URLs `localhost` proporcionadas por el servidor MCP.
- NO importar paquetes de iconos nuevos.
- NO crear placeholders si existe una URL de asset disponible.

### Paso 5: Traducir a convenciones del proyecto

Adaptar la salida de Figma al stack del proyecto:

| Aspecto          | Convención del proyecto                                          |
|------------------|------------------------------------------------------------------|
| Framework        | Angular 22 (componentes standalone, `OnPush`)                    |
| Estilos          | Bootstrap 5.3.8 (clases utilitarias, variables SCSS)             |
| Estructura       | `src/app/features/<modulo>/components/`                          |
| Nomenclatura     | kebab-case para ficheros, PascalCase para componentes            |
| Tokens de diseño | Variables SCSS de Bootstrap; mapear tokens Figma a equivalentes  |

**Principios clave:**

- La salida de Figma (normalmente React + Tailwind) es una representación del diseño, no código final.
- Reutilizar componentes existentes en `shared/` antes de crear nuevos.
- Respetar los patrones de routing, estado y data-fetch del proyecto.
- Usar variables SCSS de Bootstrap en lugar de valores hardcoded.

### Paso 6: Lograr paridad visual 1:1

- Priorizar la fidelidad con Figma.
- Usar tokens de diseño; evitar valores hardcoded.
- Si hay conflicto entre tokens del proyecto y valores Figma, preferir los tokens del proyecto ajustando mínimamente para mantener la fidelidad visual.
- Cumplir con requisitos WCAG de accesibilidad.

### Paso 7: Validar contra Figma

Checklist de validación antes de dar por completada la implementación:

- [ ] Layout coincide (espaciado, alineación, tamaños)
- [ ] Tipografía coincide (fuente, tamaño, peso, line-height)
- [ ] Colores coinciden exactamente
- [ ] Estados interactivos funcionan (hover, active, disabled)
- [ ] Comportamiento responsive sigue las constraints de Figma
- [ ] Assets se renderizan correctamente
- [ ] Estándares de accesibilidad cumplidos

## Flujo de trabajo: Code Connect

Conecta componentes de Figma con su implementación en código para mantener sincronía entre diseño y desarrollo.

> **Nota:** Code Connect solo funciona con componentes publicados en una librería de equipo y requiere plan Organization o Enterprise de Figma.

### Pasos

1. Proporcionar la URL del componente Figma.
2. Ejecutar `get_code_connect_suggestions` para detectar mappings posibles.
3. Revisar las sugerencias y confirmar con `send_code_connect_mappings`.
4. Consultar mappings existentes con `get_code_connect_map`.

## Flujo de trabajo: Reglas de sistema de diseño

Genera reglas específicas del proyecto que guían flujos consistentes de Figma-a-código.

### Pasos

1. Ejecutar `create_design_system_rules`.
2. Analizar la base de código para identificar patrones y convenciones.
3. Generar fichero de reglas con mapeos de tokens, componentes y convenciones.
4. Guardar en la configuración del proyecto.
5. Validar que las reglas generadas se alinean con las convenciones existentes.

## Ejemplo práctico

### Implementar un componente Card desde Figma

**Solicitud al asistente:**

```
Implementa este diseño de Figma: https://figma.com/design/abc123/Template?node-id=10-5
```

**El asistente ejecutará:**

1. Extrae `fileKey=abc123`, `nodeId=10-5`.
2. Llama a `get_design_context` → obtiene padding 16px, border-radius 8px, shadow, tipografía.
3. Llama a `get_screenshot` → referencia visual.
4. Descarga iconos si los hay.
5. Genera un componente Angular standalone usando clases de Bootstrap:

```typescript
@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoCardComponent {
  @Input() title = '';
  @Input() description = '';
}
```

```html
<div class="card shadow-sm rounded-3 p-3">
  <h5 class="card-title fw-semibold">{{ title }}</h5>
  <p class="card-text text-muted">{{ description }}</p>
</div>
```

6. Valida contra el screenshot de Figma.

## Solución de problemas

| Problema                      | Causa                                                    | Solución                                                                        |
|-------------------------------|----------------------------------------------------------|---------------------------------------------------------------------------------|
| Servidor MCP no conectado     | El power no está activo o falta autenticación            | Verificar en el panel MCP Servers de Kiro; re-autenticar si es necesario        |
| Respuesta truncada            | Diseño demasiado complejo para una sola respuesta        | Usar `get_metadata` primero y luego consultar nodos hijos individualmente       |
| Assets no cargan              | URLs de assets no accesibles                             | Verificar que el servidor MCP está corriendo; usar URLs localhost sin modificar |
| Tokens no coinciden con Figma | Diferencias entre sistema de diseño del proyecto y Figma | Preferir tokens del proyecto; ajustar spacing/sizing para mantener fidelidad    |
| Code Connect sin componentes  | Componentes no publicados en librería de equipo          | Publicar el componente a la librería de equipo en Figma                         |

## Referencias

- [Documentación del servidor MCP de Figma](https://developers.figma.com/docs/figma-mcp-server/)
- [Herramientas y prompts del MCP](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Variables y tokens de diseño en Figma](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
