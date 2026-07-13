---
name: Estandar Documentacion Requisitos
description: "Usar cuando se creen o editen documentos funcionales en template-docs para mantener plantilla, trazabilidad y consistencia entre requisitos, casos de uso y arquitectura."
applyTo: "template-docs/**/*.md"
---
# Estandar de Documentacion Funcional

Aplica esta estructura base al documentar analisis funcional y definicion conceptual.

## Estructura recomendada
1. Contexto y alcance
2. Requisitos funcionales
3. Casos de uso
4. Modelo de datos conceptual
5. Arquitectura funcional
6. Riesgos y decisiones abiertas
7. Trazabilidad

## Reglas de contenido
- No incluir codigo de implementacion salvo solicitud explicita.
- Usar lenguaje funcional y de negocio, no tecnico de bajo nivel.
- Diferenciar claramente hechos, supuestos y decisiones.
- Mantener consistencia de nombres entre secciones.

## Formato obligatorio para Casos de Uso
- ID:
- Actor:
- Precondiciones:
- Flujo Principal:
- Flujos Alternativos:
- Postcondiciones:

## Trazabilidad minima
Incluye una tabla de trazabilidad con estas columnas:
- Requisito
- Caso de Uso
- Entidad
- Componente

Ejemplo:

| Requisito | Caso de Uso | Entidad | Componente |
|---|---|---|---|
| RF-01 | CU-01 | Usuario | Gestion de Acceso |

## Diagramas
- Cuando aporte claridad, incluir Mermaid para flujo o secuencia.
- Mantener diagramas cortos y alineados al caso de uso.
