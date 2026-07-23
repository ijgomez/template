# Flujo de Trabajo con Documentación

Directrices para revisar y mantener la documentación al trabajar en bugfixes, incidencias o evolutivos.

## Reglas

1. **Antes de implementar cambios**, revisar si las pantallas o funcionalidades afectadas están documentadas en `template-docs/`.
2. **Si existe documentación relevante**, leerla para entender el comportamiento esperado y el contexto funcional antes de hacer cambios.
3. **Si el cambio altera el comportamiento documentado**, actualizar la documentación correspondiente como parte del mismo cambio (mismo commit o PR).
4. **Si no existe documentación** para la funcionalidad afectada, valorar si es necesario crearla.

## Ubicaciones de documentación a consultar

| Tipo de documentación      | Directorio                              |
|----------------------------|-----------------------------------------|
| Funcional / Casos de uso   | `template-docs/02-functional/`          |
| Técnica backend            | `template-docs/03-technical/backend/`   |
| Técnica frontend           | `template-docs/03-technical/frontend/`  |
| Especificación / Modelo    | `template-docs/specification/`          |

## Criterios para crear documentación nueva

- La funcionalidad es compleja o no obvia.
- Tiene reglas de negocio que podrían malinterpretarse.
- Involucra integraciones con sistemas externos.
- Afecta a múltiples módulos o equipos.
