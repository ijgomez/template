# Interfaces

El módulo **Interfaces** es un módulo funcional de primer nivel que agrupa toda la funcionalidad relacionada con la supervisión e integración de la aplicación con sistemas externos.

Su objetivo es proporcionar al administrador una visión unificada del estado de las interfaces, su actividad y su configuración, facilitando la detección de problemas de conectividad y garantizando la disponibilidad de las integraciones.

## Conceptos clave

| Concepto | Descripción |
|-----------|---------|
|  |  |

## Modelo de entidades

### Relación de negocio

## Seguridad

El acceso al módulo Interfaces está controlado por el sistema de acciones del perfil del usuario. Solo los usuarios con las acciones correspondientes pueden visualizar las opciones del menú y acceder a las pantallas.

## Navegación

```
Interfaces > Monitor
Interfaces > Configuración
```

## Pantallas

| Pantalla | Tipo | Descripción |
|---------------|-------------|-----------|
| [Monitor](./monitor/monitor.md) | Pagina | Panel de actividad de las interfaces: trazabilidad de operaciones de entrada/salida, estados y payloads. |
| [Configuración](./configuration/configuration.md) | Pagina | Listado de interfaces registradas con su estado actual y detalle de cada interfaz. |

## Referencias

- [Requisitos](../../specification/requirements.md)
- [Glosario](../../specification/glossary.md)
- [Modelo de datos](../../specification/data-model.md)
- [Autenticación y Gestión de Sesión](../login/authentication.md)
- [Seguridad (backend)](../../03-technical/backend/security.md)

