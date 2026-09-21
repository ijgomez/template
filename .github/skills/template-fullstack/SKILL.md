---
name: template-fullstack
description: Coordinates backend, frontend, architecture guardrails, and verification steps for end-to-end changes in the Java + Angular template.
---

# Skill: template-fullstack

Aplica esta skill cuando quieras hacer un cambio completo del sistema, ya sea un caso de uso, una mejora funcional, un bug end-to-end o un ajuste que implique backend, frontend y validación.

## Objetivo

Asegurar que el cambio se implemente en la capa correcta, con un alcance mínimo y con evidencia de validación real antes de cerrarlo.

## Principios obligatorios

- Mantener la separación por capas: dominio, core, web y UI.
- No introducir dependencias cruzadas innecesarias entre módulos.
- No mezclar lógica de negocio en componentes o controladores si no corresponde.
- Priorizar soluciones simples, legibles y mantenibles.
- No tocar artefactos generados ni archivos de build manualmente, especialmente `target/`.
- Preservar seguridad, auditoría y trazabilidad en servicios y endpoints.

## Workflow recomendado

1. Identifica el punto exacto del cambio.
2. Decide si el problema afecta backend, frontend o ambos.
3. Coloca la lógica en la capa responsable:
   - dominio: reglas y persistencia
   - core: casos de uso y negocio
   - webapp / ws: API y adaptadores de entrada/salida
   - dashboard: presentación y UI
4. Mantén el cambio lo más local posible.
5. Revisa si el cambio modifica contratos, modelos, validaciones o comportamiento visible.
6. Añade o actualiza pruebas relevantes en el módulo afectado.
7. Ejecuta la validación mínima necesaria para comprobar el flujo real.
8. Comprueba que no has dejado artefactos generados ni cambios de build manuales.

## Reglas por área

### Backend

- No pongas lógica de negocio en controllers.
- Reúsa validaciones y persistencia en la capa adecuada.
- Reutiliza utilidades y servicios ya existentes antes de crear nuevas abstracciones.

### Frontend

- Los componentes deben centrarse en renderizar y delegar la lógica de negocio a servicios o capas adecuadas.
- Evita lógica compleja en templates.
- Si hay un flujo de datos con backend, revisa la API y el contrato implicado.

### Testing

- Si cambia comportamiento funcional, debe haber prueba relevante.
- No valides solo con mocks ni con pruebas que no reflejen el comportamiento real.
- Usa la prueba mínima que cubra el flujo afectado.

## Validación mínima requerida

- Backend: prueba del módulo o flujo afectado.
- Frontend: prueba del componente, servicio o flujo implicado.
- Full-stack: valida la integración real del flujo afectado, no solo una de las capas por separado.

## Checklist final

- La solución está en la capa correcta.
- Se ha respetado la arquitectura modular del repositorio.
- El cambio es simple y mantenible.
- Se han actualizado pruebas relevantes.
- La validación mínima se ejecutó y da resultado aceptable.
- No se han dejado cambios innecesarios ni artefactos generados.

## Referencias del repositorio

- [AGENTS.md](../../../AGENTS.md)
- [.github/copilot-instructions.md](../../copilot-instructions.md)
- [template-docs/README.md](../../../template-docs/README.md)
- [template-docs/04-development/coding-guidelines.md](../../../template-docs/04-development/coding-guidelines.md)
- [template-docs/04-development/testing.md](../../../template-docs/04-development/testing.md)
