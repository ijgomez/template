# Monitor de Interfaces

## Introducción

El **Monitor** de interfaces permite al administrador supervisar la actividad de todas las integraciones con sistemas externos en tiempo real.

Muestra la trazabilidad de operaciones realizadas por las interfaces, ya sean de entrada (recepción de datos) o de salida (envío de datos), proporcionando visibilidad completa sobre el tráfico de integración.

---

## Funcionalidad

### Listado de operaciones

La pantalla principal presenta un listado paginado de todas las operaciones de interfaces registradas por el sistema.

| Campo            | Descripción                                          |
|------------------|------------------------------------------------------|
| Fecha/hora       | Timestamp de la operación (convertido a zona local)  |
| Tipo operación   | IN (entrada) / OUT (salida)                          |
| Interfaz         | Nombre de la interfaz por la que se realizó          |
| Estado           | SUCCESS / ERROR                                      |

### Filtros disponibles

| Filtro           | Tipo                      | Descripción                           |
|------------------|---------------------------|---------------------------------------|
| Fecha desde      | Date picker               | Inicio del rango temporal             |
| Fecha hasta      | Date picker               | Fin del rango temporal                |
| Tipo operación   | Selector (IN, OUT)        | Filtrar por dirección de la operación |
| Interfaz         | Selector / texto          | Filtrar por nombre de interfaz        |
| Estado           | Selector (SUCCESS, ERROR) | Filtrar por resultado                 |

### Detalle de operación

Al seleccionar una operación del listado se muestra su detalle completo:

| Campo              | Descripción                                     |
|--------------------|-------------------------------------------------|
| Fecha/hora         | Timestamp exacto de la operación                |
| Tipo operación     | IN / OUT                                        |
| Interfaz           | Nombre de la interfaz                           |
| Payload petición   | Contenido de la petición realizada (texto)      |
| Payload respuesta  | Contenido de la respuesta recibida (texto)      |
| Estado             | SUCCESS / ERROR                                 |

---

## Comportamiento

- Vista de solo lectura (no permite crear, editar ni eliminar registros).
- Paginación del lado del servidor.
- Exportación a CSV de los registros filtrados.
- Los registros son inmutables (append-only).
- El registro de operaciones es automático y transparente al código de negocio.

---

## Documentación relacionada

- [Módulo Interfaces](../README.md)
- [Configuración de Interfaces](../configuration/README.md)
