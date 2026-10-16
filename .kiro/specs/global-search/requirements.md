# Buscador Global — Requisitos

> Estado: Borrador (pendiente de implementar)
> Feature: `global-search`
> Ámbito: Frontend Angular (`template/dashboard`) + endpoints de backend si son necesarios

## Contexto

El header del layout (`core/layout/layout.component.html`) ya incluye un campo de
búsqueda (`data-testid="input-global-search"`) que **actualmente no tiene
funcionalidad**: es un input decorativo sin handler. Esto es un anti-patrón de
interacción (UI que parece funcional pero no hace nada).

Este documento define el comportamiento esperado del buscador global para
abordarlo en una iteración futura. No introduce dependencias nuevas; se apoya en
Angular 22, Bootstrap 5.3.8 y los servicios de entidad existentes.

## Objetivo

Permitir al usuario buscar de forma rápida y transversal sobre varias entidades
del sistema desde un único campo en el header, mostrando los resultados en un
popup organizados por tipo de entidad, y navegar al detalle con un clic.

## Entidades buscables (alcance inicial)

| Entidad     | Servicio existente              | Ruta de listado/detalle                         | Permiso de lectura        |
|-------------|---------------------------------|-------------------------------------------------|---------------------------|
| Usuarios    | `UserService.findByCriteria`    | `/administration/security/users`                | `USER_READ`               |
| Parámetros  | `ParameterService` (criteria)   | `/administration/parameters`                    | `SYSTEM_PARAMETER_READ`   |
| Interfaces  | `InterfaceService` (criteria)   | `/interfaces`                                   | `INTERFACES_READ`         |

Ampliables más adelante: Perfiles (`PROFILE_READ`), Acciones (`ACTION_READ`),
Nodos de cluster (`CLUSTER_NODE_READ`), Informes (`REPORT_EXECUTE`).

## Requisitos funcionales

### RF-1 — Activación de la búsqueda
- La búsqueda se dispara automáticamente al escribir en el campo del header, con
  **debounce** (recomendado 300 ms), siguiendo el patrón de filtros de listados
  del proyecto (`template-docs/03-technical/frontend/list-filters.md`).
- Longitud mínima de término: 2 caracteres. Por debajo no se lanza la búsqueda.
- La búsqueda es **case-insensitive** y por coincidencia parcial.

### RF-2 — Búsqueda multi-entidad
- La búsqueda consulta en paralelo las entidades buscables para las que el usuario
  tenga permiso de lectura (ver tabla). Las entidades sin permiso **no se
  consultan ni se muestran**.
- Cada entidad se consulta con su `findByCriteria` reutilizando el campo de texto
  más representativo (p. ej. usuarios por `username`, parámetros por `code`,
  interfaces por `name`). El término se aplica a ese/esos campos.
- Se limita el número de resultados por entidad (recomendado `size = 5`) para
  mantener el popup compacto; se indica si hay más resultados ("Ver todos").

### RF-3 — Popup de resultados
- Los resultados se muestran en un **popup/dropdown** anclado al campo de búsqueda.
- Los resultados se **agrupan por tipo de entidad**, con un encabezado por grupo
  (Usuarios, Parámetros, Interfaces…) y el número de coincidencias.
- Cada resultado muestra un texto principal (identificador) y un texto secundario
  de contexto (p. ej. perfil del usuario, tipo del parámetro, protocolo de la
  interfaz).
- Cada grupo con más resultados que el límite muestra una acción "Ver todos" que
  navega al listado de esa entidad con el filtro aplicado.

### RF-4 — Navegación
- Al hacer clic en un resultado, se navega a la vista de detalle de esa entidad.
- El popup se cierra tras la navegación.

### RF-5 — Estados visibles
- **Cargando**: indicador mientras se resuelven las búsquedas (spinner).
- **Vacío**: mensaje "Sin resultados para «término»" cuando ninguna entidad
  devuelve coincidencias.
- **Error parcial**: si una entidad falla, se muestran las demás y se indica el
  fallo de esa entidad sin romper el resto (degradación elegante).

### RF-6 — Cierre del popup
- El popup se cierra con `Escape`, al hacer clic fuera, al navegar, y al vaciar el
  campo.

## Requisitos no funcionales

### RNF-1 — Accesibilidad (WCAG AA)
- El campo de búsqueda usa el patrón **combobox** de ARIA:
  `role="combobox"`, `aria-expanded`, `aria-controls` apuntando al popup, y
  `aria-activedescendant` para el resultado resaltado.
- Navegación completa por teclado: flechas ↑/↓ para moverse entre resultados,
  `Enter` para abrir el resaltado, `Escape` para cerrar.
- El popup es una lista (`role="listbox"`) con resultados `role="option"`.
- El estado de carga se anuncia con una región `aria-live="polite"`.
- Foco gestionado: al cerrar el popup, el foco vuelve al campo de búsqueda.

### RNF-2 — Rendimiento
- Debounce para evitar peticiones por cada tecla.
- Las peticiones a las distintas entidades se lanzan en paralelo (`forkJoin` o
  equivalente) y se cancela la búsqueda anterior al teclear (`switchMap`).
- Límite de resultados por entidad para acotar payload y renderizado.

### RNF-3 — Seguridad
- Respetar los permisos: no consultar entidades para las que el usuario carece de
  permiso de lectura (consistente con `actionGuard` y `AuthService.hasAction`).
- No exponer datos sensibles en los resultados (p. ej. nunca contraseñas).

### RNF-4 — Internacionalización
- Todos los textos (encabezados de grupo, "Ver todos", estados vacío/carga/error)
  mediante claves i18n en `es.json` y `en.json`, manteniendo simetría entre ambos.

### RNF-5 — Sin dependencias nuevas
- Implementable con Angular 22 + Bootstrap 5.3.8 + bootstrap-icons + RxJS, ya
  presentes. No añadir librerías de UI ni de búsqueda.

## Fuera de alcance (iteración inicial)

- Búsqueda full-text en el contenido (payloads, descripciones largas).
- Historial de búsquedas / sugerencias.
- Resaltado del término dentro de cada resultado (nice-to-have posterior).
- Un endpoint de backend unificado de búsqueda (la iteración inicial reutiliza los
  `findByCriteria` existentes; ver nota en el diseño).
