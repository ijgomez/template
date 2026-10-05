# Flujo de Trabajo del Agente

Reglas de eficiencia para cualquier agente o asistente que opere sobre el proyecto.
El objetivo es reducir el consumo de créditos y de tiempo evitando ejecuciones repetidas.

## Agrupar verificación y tests

- **No** compilar, construir ni ejecutar tests tras cada modificación individual.
- Realizar **todas** las modificaciones de la tarea primero.
- Ejecutar la verificación (build/compilación) y los tests **una sola vez, al final**, de forma agrupada, cuando el conjunto de cambios esté completo.
- Agrupar la verificación por módulo o área afectada en una única pasada en lugar de verificar archivo por archivo.
- Si varios cambios dependen entre sí, completarlos todos antes de lanzar la verificación conjunta.

Excepción: si un cambio es claramente arriesgado o bloqueante para el resto de la tarea, se puede verificar antes de continuar.
