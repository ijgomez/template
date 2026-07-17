# Reglas de Documentación

Directrices para la generación de documentación técnica y diagramas.

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
- Formato: Markdown UTF-8 sin BOM, idioma español.
- Preferir listas y tablas sobre párrafos largos para datos estructurados.
- Definir acrónimos en el glosario central (`template-docs/specification/glossary.md`).
- No incrustar información en imágenes sin descripción textual equivalente.
