# Design Brief — Dashboard de Template

## 1. Propósito del producto
Plantilla de dashboard empresarial que da a cada proyecto derivado administración de seguridad, parámetros, auditoría, monitor de interfaces y cluster, e informes, sobre una UI homogénea.

## 2. Usuario principal
Un administrador u operador interno de una aplicación corporativa, que trabaja en escritorio durante la jornada. Revisa listas, filtra, edita registros y vigila el estado de interfaces y nodos. Sesiones largas y uso repetido.
[Secundario: desarrollador que parte de la plantilla y la extiende.]

## 3. Principios (por orden de prioridad)
1. **Consistencia antes que originalidad.** Una pantalla nueva reutiliza los componentes compartidos (botones `tp-button`, listas, filtros, formularios) en vez de inventar variantes.
2. **Se preserva lo existente.** Un rediseño no cambia el layout ni el estilo de pantallas que ya funcionan, salvo petición expresa.
3. **Datos primero, decoración después.** El color se reserva para estado y acción (`--tp-color-*`). Sin adornos que compitan con las tablas y los filtros.
4. **Lo destructivo exige confirmación.** Borrar, ejecutar y limpiar son acciones explícitas y distinguibles. Auditoría y trazabilidad no se ocultan.
5. **Todo estado es de primera clase.** Carga, vacío, error y sin permisos se diseñan igual que el caso feliz, en todos los idiomas soportados.

## 4. Métrica de éxito de la superficie
Un administrador encuentra, filtra y edita un registro de una lista en pocos pasos, sin buscar dónde está la acción. Detecta de un vistazo una interfaz o nodo en estado anómalo.

## 5. Fuera de alcance
- No introduce un sistema visual distinto al de Bootstrap 5 y los tokens `--tp-*`.
- No añade lógica de negocio en componentes; vive en `core`.
- No rediseña pantallas existentes sin petición expresa.
- No incorpora dependencias de UI externas ni servicios de terceros.
- No sacrifica accesibilidad ni i18n por estética.

## 6. Restricciones aprendidas
- **2026-07** — Las acciones de Detalle, Editar, Crear, Eliminar, Exportar, Filtrar, Ejecutar y Limpiar usan los componentes compartidos `tp-button`. *Por qué:* mantener homogeneidad en toolbars, filtros y cabeceras de formulario.
- **2026-07** — Al aplicar specs de rediseño, no cambiar layout ni estilo de pantallas existentes. *Por qué:* preferencia explícita del propietario.
