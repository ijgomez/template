# Interfaces

## Introducción

El módulo **Interfaces** es un módulo funcional de primer nivel que agrupa toda la funcionalidad relacionada con la supervisión e integración de la aplicación con sistemas externos.

Su objetivo es proporcionar al administrador una visión unificada del estado de las interfaces, su actividad y su configuración, facilitando la detección de problemas de conectividad y garantizando la disponibilidad de las integraciones.

---

## Estructura del módulo

El módulo se organiza en dos secciones:

| Sección        | Descripción                                                                                      |
|----------------|--------------------------------------------------------------------------------------------------|
| Monitor        | Panel de actividad de las interfaces: trazabilidad de operaciones de entrada/salida, estados y payloads. |
| Configuración  | Listado de interfaces registradas con su estado actual y detalle de cada interfaz.                |

---

## Navegación

El módulo Interfaces aparece como menú desplegable de primer nivel en el sidebar, al mismo nivel que Informes y Administración.

```text
Interfaces ▾
├── Monitor
└── Configuración
```

---

## Secciones

### Monitor

Proporciona un panel de supervisión de la actividad de las interfaces. Permite al administrador:

- Consultar el registro de todas las operaciones realizadas (entrada y salida).
- Filtrar por rango de fechas, tipo de operación (IN, OUT), interfaz y estado (SUCCESS, ERROR).
- Consultar el detalle de una operación concreta (timestamp, tipo, interfaz, payload de petición, payload de respuesta, estado).
- Paginación del lado del servidor.

Más detalle en [monitor/README.md](monitor/README.md).

### Configuración

Proporciona la vista de las interfaces registradas en el sistema. Permite al administrador:

- Visualizar el estado consolidado de todas las interfaces con indicadores visuales (verde=activa, rojo=error, gris=inactiva).
- Consultar el detalle de una interfaz (nombre, descripción, URL, protocolo, frecuencia de verificación).
- Solo lectura: no se permite crear, editar ni eliminar interfaces desde la interfaz de usuario.

Más detalle en [configuration/README.md](configuration/README.md).

---

## Permisos

El acceso al módulo Interfaces está controlado por el sistema de acciones del perfil del usuario. Solo los usuarios con las acciones correspondientes pueden visualizar las opciones del menú y acceder a las pantallas.

---

## Documentación relacionada

- [Monitor](monitor/README.md)
- [Configuración](configuration/README.md)
- [Navegación](../../03-technical/frontend/navigation.md)
- [API de Interfaces](../../03-technical/backend/api.md)
