# Configuración de Interfaces

## Introducción

La sección de **Configuración** del módulo Interfaces permite al administrador consultar el estado y la definición de todas las interfaces registradas en el sistema.

Proporciona una visión consolidada de la salud de las integraciones, con indicadores visuales que facilitan la detección rápida de problemas de conectividad.

---

## Funcionalidad

### Panel de interfaces

La pantalla principal muestra un listado de todas las interfaces registradas con indicadores de estado:

| Indicador | Estado   | Descripción                              |
|-----------|----------|------------------------------------------|
| Verde     | Activa   | La interfaz está operativa               |
| Rojo      | Error    | La interfaz presenta problemas           |
| Gris      | Inactiva | La interfaz está deshabilitada           |

### Campos del listado

| Campo              | Descripción                                      |
|--------------------|--------------------------------------------------|
| Nombre             | Nombre identificador de la interfaz              |
| Descripción        | Descripción funcional                            |
| Estado             | ACTIVE / INACTIVE / ERROR                        |
| Protocolo          | Protocolo de comunicación                        |
| URL                | Dirección del servicio externo                   |

### Detalle de interfaz

Al seleccionar una interfaz se muestra su información completa:

| Campo                | Descripción                                     |
|----------------------|-------------------------------------------------|
| Nombre               | Nombre identificador                            |
| Descripción          | Descripción funcional de la interfaz            |
| URL                  | Dirección del servicio externo                  |
| Protocolo            | Protocolo de comunicación (REST, SOAP, etc.)    |
| Estado               | Estado actual (ACTIVE, INACTIVE, ERROR)         |
| Frecuencia de check  | Intervalo de verificación de disponibilidad     |
| Fecha creación       | Fecha de registro en el sistema                 |
| Última modificación  | Fecha de última actualización                   |

---

## Comportamiento

- Vista de solo lectura (no permite crear, editar ni eliminar interfaces desde la interfaz de usuario).
- Las interfaces son gestionadas exclusivamente por el sistema.
- Los cambios de estado se registran automáticamente en el sistema de auditoría.

---

## Documentación relacionada

- [Módulo Interfaces](../README.md)
- [Monitor de Interfaces](../monitor/README.md)
