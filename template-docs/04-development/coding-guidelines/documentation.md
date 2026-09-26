# Reglas de Documentación

Directrices para generar, mantener y dar formato a la documentación del proyecto. Cubre tres aspectos: qué documentación entregar en cada evolutivo, cuándo consultarla y actualizarla, y cómo redactarla.

## Documentación obligatoria por evolutivo

Todo evolutivo de la aplicación debe ir acompañado, como mínimo, de la generación y actualización de los siguientes documentos:

### 1. Documento de Planificación

Debe recoger el alcance del evolutivo, los objetivos, las tareas previstas, dependencias, riesgos y fechas objetivo.

### 2. Documento del Diseño Funcional

Debe estructurarse en dos partes claramente diferenciadas:

- **Parte funcional**: qué cambios realiza el evolutivo, qué necesidad cubre, qué flujos afecta y qué validaciones funcionales introduce.
- **Parte técnica**: cómo se implementa el cambio, incluyendo componentes afectados, reglas técnicas, impactos en backend, frontend, base de datos, integraciones y consideraciones de despliegue si aplican.

### 3. Documento de Pruebas

Debe describir el plan de validación del evolutivo, los casos de prueba ejecutados, los datos utilizados, los resultados obtenidos y cualquier incidencia detectada.

### Criterio de obligatoriedad

Esta documentación forma parte del entregable de cada evolutivo y debe mantenerse alineada con los cambios implementados antes de su cierre o validación final.

Si un evolutivo modifica alcance, comportamiento o implementación, los tres documentos deben actualizarse antes de su aprobación.

## Flujo de Trabajo con Documentación

Directrices para revisar y mantener la documentación al trabajar en bugfixes, incidencias o evolutivos.

### Reglas

1. **Antes de implementar cambios**, revisar si las pantallas o funcionalidades afectadas están documentadas en `template-docs/`.
2. **Si existe documentación relevante**, leerla para entender el comportamiento esperado y el contexto funcional antes de hacer cambios.
3. **Si el cambio altera el comportamiento documentado**, actualizar la documentación correspondiente como parte del mismo cambio (mismo commit o PR).
4. **Si no existe documentación** para la funcionalidad afectada, valorar si es necesario crearla.

### Ubicaciones de documentación a consultar

| Tipo de documentación      | Directorio                              |
|----------------------------|-----------------------------------------|
| Funcional / Casos de uso   | `template-docs/02-functional/`          |
| Técnica backend            | `template-docs/03-technical/backend/`   |
| Técnica frontend           | `template-docs/03-technical/frontend/`  |
| Especificación / Modelo    | `template-docs/specification/`          |

### Criterios para crear documentación nueva

- La funcionalidad es compleja o no obvia.
- Tiene reglas de negocio que podrían malinterpretarse.
- Involucra integraciones con sistemas externos.
- Afecta a múltiples módulos o equipos.

## Diagramas y Esquemas

- Utilizar el formato **Mermaid** siempre que sea posible en ficheros Markdown.
- Compatibles con el renderizado nativo de **GitHub** y **GitLab** (Mermaid 9.1.x).

### Tipos de diagramas recomendados

| Tipo                | Uso                                           |
|---------------------|-----------------------------------------------|
| `flowchart`         | Flujos de proceso y decisiones                |
| `sequenceDiagram`   | Interacciones entre componentes o servicios   |
| `erDiagram`         | Modelos de datos y relaciones entre entidades |
| `classDiagram`      | Estructura de clases y módulos                |
| `stateDiagram-v2`   | Máquinas de estados                           |
| `gantt`             | Planificación temporal                        |

### Reglas de compatibilidad (Mermaid 9.1.x)

- Nodos entre `["..."]`.
- Decisiones (rombos) entre `{"..."}`.
- Solo `Si` y `No` en ramas de decisión.
- Solo `<br/>` para saltos de línea (no `\n`).
- No usar comillas, `?`, `?`, emojis ni HTML (excepto `<br/>`).
- Textos cortos: máximo 2-3 líneas por nodo.
- No usar estilos (`style`, `classDef`, `linkStyle`).
- No usar directivas `%%{init: ...}%%`.

## Documentación AI-Readable (OpenSpec)

Todos los documentos en `template-docs/` deben ser interpretables por cualquier IA:

- **Estructura explícita**: Encabezados jerárquicos (`#`, `##`, `###`) consistentes.
- **Secciones autocontenidas**: Comprensibles de forma aislada.
- **Nomenclatura uniforme**: Mismos nombres en todos los documentos.
- **Referencias explícitas**: Enlaces relativos entre documentos dependientes.
- **Intención única por sección**: Redactar cada sección con una única intención clara; evitar lenguaje ambiguo, abreviaturas no definidas o estructuras propietarias.
- Formato: Markdown UTF-8 sin BOM, idioma español.
- Preferir listas y tablas sobre párrafos largos para datos estructurados.
- Definir acrónimos en el glosario central (`template-docs/specification/glossary.md`).
- No incrustar información en imágenes sin descripción textual equivalente.
