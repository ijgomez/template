# Requirements Document

## Introduction

#[[file:template-docs/specification/requirements.md]]

## Glossary

#[[file:template-docs/specification/glossary.md]]

## Requirements

### Requirement 1: Login de usuario

**User Story:** As a usuario, I want autenticarme en la aplicación con mis credenciales, so that pueda acceder a las funcionalidades protegidas.

#### Acceptance Criteria

1. WHEN el usuario envía credenciales válidas (username y contraseña), THE AuthService SHALL autenticar al usuario y devolver un access token JWT y un refresh token.
2. WHEN el usuario envía credenciales inválidas, THE AuthService SHALL devolver un error 401 Unauthorized con un mensaje descriptivo.
3. WHEN la autenticación es exitosa, THE AuthService SHALL actualizar el campo lastAccess del usuario con la fecha y hora actuales del sistema.
4. WHEN el AuthModule recibe un access token válido, THE AuthModule SHALL almacenar el token en memoria y redirigir al usuario al Dashboard.
5. WHILE el usuario no está autenticado, THE Guard SHALL redirigir cualquier intento de acceso a rutas protegidas hacia la página de login.

### Requirement 2: Logout de usuario

**User Story:** As a usuario autenticado, I want cerrar mi sesión, so that mis credenciales dejen de ser válidas y mi sesión quede protegida.

#### Acceptance Criteria

1. WHEN el usuario solicita cerrar sesión, THE AuthModule SHALL eliminar el access token y el refresh token de la memoria del cliente.
2. WHEN el usuario cierra sesión, THE AuthService SHALL invalidar el refresh token en el servidor.
3. WHEN el logout se completa, THE AuthModule SHALL redirigir al usuario a la página de login.

### Requirement 3: Renovación automática del token

**User Story:** As a usuario autenticado, I want que mi sesión se renueve automáticamente, so that no tenga que volver a iniciar sesión mientras estoy activo.

#### Acceptance Criteria

1. WHEN el access token está próximo a expirar (margen configurable), THE Interceptor SHALL solicitar un nuevo access token utilizando el refresh token.
2. WHEN la renovación del token es exitosa, THE Interceptor SHALL reemplazar el access token anterior por el nuevo y reintentar la petición original.
3. IF el refresh token ha expirado o es inválido, THEN THE AuthModule SHALL cerrar la sesión del usuario y redirigirlo a la página de login.

### Requirement 4: Gestión de usuarios (CRUD)

**User Story:** As a administrador, I want gestionar los usuarios del sistema (crear, consultar, modificar y eliminar), so that pueda controlar quién tiene acceso a la aplicación.

#### Acceptance Criteria

1. THE UserService SHALL exponer un endpoint para crear un nuevo usuario aceptando un UserDTO con el campo id nulo y los datos: username (obligatorio, único), password (obligatorio), nombre (opcional), apellidos (opcional), email (opcional), perfil asignado y lista de informes permitidos (de 0 a N informes, sin duplicados). El sistema genera el identificador del usuario.
2. THE UserService SHALL exponer un endpoint para obtener la lista de usuarios con soporte de paginación y filtros por username, nombre, apellidos, email y perfil mediante un objeto UserCriteria, incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
3. THE UserService SHALL exponer un endpoint para obtener los datos de un usuario concreto por su identificador, devolviendo un UserDTO.
4. THE UserService SHALL exponer un endpoint para actualizar los datos de un usuario existente aceptando un UserDTO con el campo id poblado (identificando al usuario a actualizar), actualizando: nombre, apellidos, email, perfil asignado y lista de informes permitidos sin duplicados.
5. THE UserService SHALL exponer un endpoint para eliminar un usuario existente.
6. WHEN se intenta crear un usuario con un username que ya existe, THE UserService SHALL devolver un error 409 Conflict.
7. WHEN se intenta acceder a un usuario que no existe, THE UserService SHALL devolver un error 404 Not Found.
8. WHEN se intenta crear o actualizar un usuario con un informe duplicado en la lista de informes permitidos, THE UserService SHALL devolver un error 400 Bad Request indicando que la lista de informes contiene duplicados.

### Requirement 5: Autorización basada en perfiles y acciones

**User Story:** As a administrador, I want que el sistema restrinja el acceso a funcionalidades según el perfil y las acciones asignadas al usuario, so that cada usuario solo acceda a lo que le corresponde.

#### Acceptance Criteria

1. THE AuthService SHALL incluir el perfil y las acciones del usuario en el payload del token JWT.
2. WHILE el usuario tiene un perfil con acciones de administración, THE SPA SHALL mostrar todas las opciones de navegación incluyendo el módulo de Administración.
3. WHILE el usuario tiene un perfil sin acciones de administración, THE SPA SHALL mostrar únicamente las opciones de navegación correspondientes a las acciones asignadas a su perfil.
4. WHEN un usuario sin la acción requerida intenta acceder a un recurso protegido, THE AuthService SHALL devolver un error 403 Forbidden.
5. WHEN un usuario sin la acción requerida intenta navegar a una ruta restringida en el frontend, THE Guard SHALL redirigir al usuario al Dashboard.
6. THE SPA SHALL evaluar las acciones del usuario para determinar la visibilidad de cada elemento de navegación y funcionalidad en la interfaz.
7. THE SPA SHALL aplicar la siguiente nomenclatura para los códigos de acción: `<IDENTIFICADOR>_READ` para leer, consultar o visualizar datos; `<IDENTIFICADOR>_WRITE` para editar o modificar datos; `<IDENTIFICADOR>_EXECUTE` para ejecutar una operación. El campo `type` de la acción (READ, WRITE, EXECUTE) debe ser coherente con el sufijo del código.
8. THE SPA SHALL registrar todas las acciones del sistema en la tabla ACCION. No se permite controlar el acceso a una funcionalidad mediante acciones no registradas en dicha tabla.

### Requirement 6: Layout responsivo y adaptativo de la aplicación

**User Story:** As a usuario, I want una interfaz consistente y adaptable a distintos dispositivos, so that pueda usar la aplicación de forma óptima desde escritorio, tablet o móvil.

#### Acceptance Criteria

1. THE LayoutComponent SHALL presentar una estructura compuesta por: header con el nombre de la aplicación y el menú de usuario, sidebar con la navegación principal, área de contenido central y footer.
2. THE LayoutComponent SHALL seguir los principios de Responsive Web Design (RWD) utilizando media queries, unidades relativas y un grid fluido para adaptar la disposición de los elementos al tamaño de la ventana del navegador.
3. THE LayoutComponent SHALL utilizar el sistema de grid y las clases utilitarias de Bootstrap 5 para la disposición de los elementos.
4. WHILE la ventana del navegador tiene un ancho menor a 576px (dispositivo móvil), THE LayoutComponent SHALL ocultar el sidebar y mostrar un botón de menú hamburguesa en el header, utilizar un layout de una sola columna y priorizar el contenido principal.
5. WHILE la ventana del navegador tiene un ancho entre 576px y 991px (tablet), THE LayoutComponent SHALL colapsar el sidebar en un panel deslizable activable por el usuario y adaptar los formularios y tablas a un layout de dos columnas.
6. WHILE la ventana del navegador tiene un ancho igual o mayor a 992px (escritorio), THE LayoutComponent SHALL mostrar el sidebar expandido de forma permanente y utilizar el layout completo de múltiples columnas.
7. THE SPA SHALL aplicar principios de AdaptiveDesign ofreciendo experiencias diferenciadas por tipo de dispositivo: en móvil simplificando la navegación y priorizando acciones principales, en tablet ofreciendo un equilibrio entre densidad de información e interacción táctil, y en escritorio aprovechando el espacio disponible para mostrar más información simultáneamente.
8. THE LayoutComponent SHALL utilizar breakpoints consistentes con el sistema de Bootstrap 5: xs (<576px), sm (≥576px), md (≥768px), lg (≥992px), xl (≥1200px), xxl (≥1400px).

### Requirement 7: Navegación de la aplicación

**User Story:** As a usuario autenticado, I want navegar entre las distintas secciones de la aplicación, so that pueda acceder a la funcionalidad que necesito.

#### Acceptance Criteria

1. THE SPA SHALL implementar navegación del lado del cliente (client-side routing) sin recargas completas de página.
2. THE SPA SHALL mostrar en el sidebar los enlaces de navegación correspondientes a las acciones del perfil del usuario autenticado.
3. WHEN el usuario hace clic en un enlace de navegación, THE SPA SHALL cargar el módulo correspondiente de forma lazy (lazy loading).
4. WHEN el usuario navega a una URL que no existe, THE SPA SHALL mostrar una página de error 404 con un enlace para volver al Dashboard.
5. THE SPA SHALL organizar el menú de navegación principal con la siguiente estructura jerárquica:
   - Dashboard
   - Informes
   - Interfaces
     - Monitor
     - Configuración
   - Administración
     - Seguridad
       - Usuarios
       - Perfiles
       - Acciones
     - Parámetros
     - Auditoría
     - Cluster
       - Nodos
       - Bloqueos
6. THE SPA SHALL presentar los elementos del menú con capacidad de expandir y colapsar los sub-niveles (Interfaces, Administración, Seguridad, Cluster).
7. WHILE el usuario no tiene la acción requerida para acceder a una sección del menú, THE SPA SHALL ocultar dicha sección del menú de navegación.
8. THE SPA SHALL aplicar el siguiente mapeo de acciones por opción de menú para determinar la visibilidad y el acceso:

   | Opción de menú       | Acciones requeridas                                      |
   |----------------------|----------------------------------------------------------|
   | Dashboard            | `DASHBOARD_READ`                                         |
   | Informes             | `REPORT_EXECUTE`                                         |
   | Interfaces (completa)| `INTERFACES_READ`                                        |
   | Usuarios             | `USER_READ`, `USER_WRITE`                                |
   | Perfiles             | `PROFILE_READ`, `PROFILE_WRITE`                          |
   | Acciones             | `ACTION_READ`                                            |
   | Parámetros           | `SYSTEM_PARAMETER_READ`, `SYSTEM_PARAMETER_WRITE`        |
   | Auditoría            | `SYSTEM_LOG_READ`                                        |
   | Nodos                | `CLUSTER_NODE_READ`, `CLUSTER_NODE_WRITE`                |
   | Bloqueos             | `CLUSTER_LOCK_READ`                                      |

9. THE SPA SHALL mostrar una opción de menú si el usuario posee al menos una de las acciones asociadas a dicha opción. Por ejemplo, la opción "Usuarios" se muestra si el usuario tiene `USER_READ` o `USER_WRITE` (o ambas).
10. THE SPA SHALL aplicar herencia de visibilidad en secciones padre del menú: una sección padre se muestra únicamente si el usuario dispone de al menos una acción asociada a alguno de sus hijos. En concreto:
    - La sección **Seguridad** se muestra si el usuario tiene alguna de las acciones: `USER_READ`, `USER_WRITE`, `PROFILE_READ`, `PROFILE_WRITE` o `ACTION_READ`.
    - La sección **Cluster** se muestra si el usuario tiene alguna de las acciones: `CLUSTER_NODE_READ`, `CLUSTER_NODE_WRITE` o `CLUSTER_LOCK_READ`.
    - La sección **Administración** se muestra si el usuario tiene acceso a al menos una de sus subsecciones (Seguridad, Parámetros, Auditoría o Cluster).
11. THE SPA SHALL gobernar toda la sección Interfaces (Monitor y Configuración) con una única acción (`INTERFACES_READ`). Si el usuario no tiene esta acción, toda la sección queda oculta.
12. THE SPA SHALL gobernar toda la sección Informes con una única acción (`REPORT_EXECUTE`). La visibilidad de cada informe individual dentro de la sección depende de la relación `user2report` del usuario, pero el acceso a la sección requiere esta acción.

### Requirement 8: Modelo de datos de usuario

**User Story:** As a desarrollador, I want un modelo de datos de usuario bien definido en la base de datos, so that pueda gestionar la información de los usuarios de forma consistente.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de usuarios con los siguientes campos: identificador (autogenerado), username (único, obligatorio), contraseña (hash BCrypt, obligatorio), nombre (opcional), apellidos (opcional), email (opcional), lastAccess (fecha, solo lectura del sistema), perfil asignado (referencia a la tabla de perfiles), fecha de creación y fecha de última modificación.
2. THE SPA SHALL crear el esquema de la tabla de usuarios mediante una migración Liquibase versionada.
3. WHEN se crea un nuevo usuario, THE UserService SHALL almacenar la contraseña utilizando el algoritmo BCrypt con un strength mínimo de 12.
4. THE SPA SHALL gestionar la tabla intermedia de relación usuario-informe (join table) con el nombre `user2report`, siguiendo la convención de nomenclatura `<Entidad1>2<Entidad2>` para tablas intermedias. La tabla contendrá los campos: identificador del usuario (referencia a la tabla de usuarios) e identificador del informe (referencia a la tabla de informes).
5. THE SPA SHALL definir una restricción de unicidad compuesta en la tabla intermedia `user2report` sobre los campos identificador del usuario e identificador del informe, garantizando que un mismo informe no pueda asignarse dos veces al mismo usuario.
6. THE SPA SHALL crear el esquema de la tabla intermedia `user2report` mediante una migración Liquibase versionada.
7. THE SPA SHALL garantizar que el campo lastAccess sea de solo lectura y no modificable a través de la API de gestión de usuarios; su valor se actualiza exclusivamente por el AuthService tras un login exitoso.

### Requirement 9: Página de perfil del usuario

**User Story:** As a usuario autenticado, I want consultar y modificar mis datos de perfil, so that pueda mantener mi información actualizada.

#### Acceptance Criteria

1. THE SPA SHALL mostrar una página de perfil accesible para cualquier usuario autenticado con los siguientes datos: username (solo lectura), nombre, apellidos, email y lastAccess (solo lectura).
2. THE SPA SHALL permitir al usuario editar únicamente los campos: nombre, apellidos y email.
3. WHEN el usuario modifica sus datos de perfil y confirma, THE UserService SHALL actualizar los campos nombre, apellidos y email del usuario en la base de datos.

### Requirement 10: Configuración por entorno

**User Story:** As a desarrollador, I want que la aplicación soporte múltiples entornos de configuración, so that pueda desplegar la misma aplicación en local, desarrollo, integración, QA y producción con configuraciones específicas.

#### Acceptance Criteria

1. THE SPA SHALL externalizar toda la configuración específica de entorno (URL de API, timeouts, parámetros de seguridad) en ficheros de propiedades por entorno.
2. THE SPA SHALL soportar los perfiles de compilación Maven (local, dist, test) para generar artefactos específicos según el entorno de destino.
3. THE SPA SHALL utilizar los ficheros `environment.ts` de Angular para configurar variables específicas del frontend por entorno (desarrollo y producción como mínimo).

### Requirement 11: Notificaciones al usuario

**User Story:** As a usuario, I want recibir feedback visual sobre el progreso y resultado de mis acciones, so that sepa que la aplicación está procesando mi solicitud y conozca el resultado final de la operación.

#### Acceptance Criteria

1. WHEN el usuario ejecuta una acción que requiere procesamiento (crear, actualizar, eliminar), THE SPA SHALL mostrar inmediatamente una notificación de tipo progreso indicando que la operación está en curso.
2. WHEN la operación en curso se completa exitosamente, THE SPA SHALL reemplazar la notificación de progreso por una notificación de tipo éxito visible durante 5 segundos.
3. WHEN la operación en curso falla, THE SPA SHALL reemplazar la notificación de progreso por una notificación de tipo error con el mensaje descriptivo del motivo del fallo, visible durante 8 segundos.
4. THE SPA SHALL permitir al usuario cerrar manualmente cualquier notificación (progreso, éxito o error) antes de que expire.
5. WHILE la notificación de progreso está visible, THE SPA SHALL mostrar un indicador visual de actividad (spinner o barra de progreso indeterminada) junto al mensaje de la notificación.
6. THE SPA SHALL soportar tres tipos de notificación: progreso (información de operación en curso), éxito (confirmación de operación completada) y error (detalle del fallo ocurrido).

### Requirement 12: Internacionalización y detección de idioma

**User Story:** As a usuario, I want que la aplicación se adapte automáticamente a mi idioma, so that pueda utilizar la interfaz en mi lengua preferida sin configuración manual.

#### Acceptance Criteria

1. THE SPA SHALL externalizar todos los textos visibles de la interfaz en ficheros de traducción independientes para cada idioma soportado (inglés y español).
2. THE SPA SHALL soportar inglés (en) como idioma por defecto y español (es) como idioma adicional.
3. WHEN el usuario accede a la aplicación por primera vez y no tiene una preferencia de idioma almacenada, THE SPA SHALL detectar el idioma preferido del navegador a través de la propiedad navigator.language del Locale del usuario.
4. WHEN el idioma detectado del navegador coincide con uno de los idiomas soportados (en, es), THE SPA SHALL seleccionar automáticamente dicho idioma para la interfaz.
5. WHEN el idioma detectado del navegador no coincide con ninguno de los idiomas soportados, THE SPA SHALL utilizar inglés (en) como idioma por defecto.
6. WHEN el usuario selecciona manualmente un idioma diferente, THE SPA SHALL actualizar todos los textos de la interfaz sin recargar la página.
7. THE SPA SHALL persistir la preferencia de idioma del usuario en el almacenamiento local del navegador.
8. WHEN el usuario tiene una preferencia de idioma almacenada en el almacenamiento local, THE SPA SHALL utilizar dicha preferencia en lugar de la detección automática del navegador.

### Requirement 13: Progressive Web App (PWA)

**User Story:** As a usuario, I want poder instalar la aplicación en mi dispositivo y utilizarla con funcionalidades offline básicas, so that tenga una experiencia similar a una aplicación nativa.

#### Acceptance Criteria

1. THE SPA SHALL registrar un ServiceWorker que gestione la caché de los recursos estáticos de la aplicación (HTML, CSS, JavaScript, imágenes, fuentes).
2. THE SPA SHALL incluir un fichero WebAppManifest (manifest.json) con la siguiente información: nombre de la aplicación, nombre corto, descripción, iconos en múltiples resoluciones (192x192 y 512x512 como mínimo), color de tema, color de fondo y modo de visualización standalone.
3. WHEN el navegador detecta el ServiceWorker y el WebAppManifest válidos, THE SPA SHALL ser instalable en el dispositivo del usuario a través del mecanismo nativo del navegador (prompt de instalación "Add to Home Screen").
4. WHILE el dispositivo del usuario no tiene conexión a internet, THE SPA SHALL mostrar los recursos estáticos previamente cacheados por el ServiceWorker y presentar un mensaje informativo indicando la ausencia de conectividad.
5. WHEN la conexión a internet se restablece, THE SPA SHALL recuperar automáticamente la funcionalidad completa y sincronizar las peticiones pendientes si las hubiera.
6. THE ServiceWorker SHALL implementar una estrategia de caché "stale-while-revalidate" para los recursos estáticos, sirviendo la versión cacheada mientras descarga la actualización en segundo plano.
7. WHEN una nueva versión de la aplicación está disponible, THE ServiceWorker SHALL notificar al usuario y ofrecer la opción de actualizar la aplicación.
8. THE SPA SHALL utilizar el módulo @angular/service-worker proporcionado por Angular para la gestión del ServiceWorker.


### Requirement 14: Gestión de perfiles (CRUD)

**User Story:** As a administrador, I want gestionar los perfiles del sistema (crear, consultar, modificar y eliminar), so that pueda definir conjuntos de acciones reutilizables para asignar a los usuarios.

#### Acceptance Criteria

1. THE ProfileService SHALL exponer un endpoint para crear un nuevo perfil aceptando un ProfileDTO con el campo id nulo y los datos: nombre (obligatorio, único), descripción (opcional) y lista de acciones asignadas (de 0 a N acciones, sin duplicados). El sistema genera el identificador del perfil.
2. THE ProfileService SHALL exponer un endpoint para obtener la lista de perfiles con soporte de paginación y filtros por nombre mediante un objeto ProfileCriteria, incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
3. THE ProfileService SHALL exponer un endpoint para obtener los datos de un perfil concreto por su identificador, incluyendo la lista de acciones asignadas, devolviendo un ProfileDTO.
4. THE ProfileService SHALL exponer un endpoint para actualizar los datos de un perfil existente aceptando un ProfileDTO con el campo id poblado (identificando al perfil a actualizar), actualizando: nombre, descripción, lista de acciones asignadas sin duplicados.
5. THE ProfileService SHALL exponer un endpoint para eliminar un perfil existente.
6. WHEN se intenta crear un perfil con un nombre que ya existe, THE ProfileService SHALL devolver un error 409 Conflict.
7. WHEN se intenta eliminar un perfil que tiene usuarios asignados, THE ProfileService SHALL devolver un error 409 Conflict con un mensaje indicando que el perfil está en uso.
8. WHEN se intenta acceder a un perfil que no existe, THE ProfileService SHALL devolver un error 404 Not Found.
9. WHEN se intenta crear o actualizar un perfil con una acción duplicada en la lista de acciones, THE ProfileService SHALL devolver un error 400 Bad Request indicando que la lista de acciones contiene duplicados.

### Requirement 15: Consulta y edición de acciones

**User Story:** As a administrador, I want consultar y editar las acciones (permisos) del sistema, so that pueda revisar y actualizar la información descriptiva de los permisos granulares que controlan el acceso a cada funcionalidad.

#### Acceptance Criteria

1. THE ActionService SHALL exponer un endpoint para obtener la lista de acciones con soporte de paginación y filtros por código, nombre y tipo mediante un objeto ActionCriteria, incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
2. THE ActionService SHALL exponer un endpoint para obtener los datos de una acción concreta por su identificador, incluyendo los campos: código, tipo, nombre y descripción, devolviendo un ActionDTO.
3. THE ActionService SHALL exponer un endpoint para actualizar los datos de una acción existente aceptando un ActionDTO con el campo id poblado (identificando la acción a actualizar), actualizando: nombre, descripción y tipo.
4. WHEN se intenta acceder a una acción que no existe, THE ActionService SHALL devolver un error 404 Not Found.
5. THE ActionService SHALL rechazar cualquier solicitud de eliminación de acciones, devolviendo un error 405 Method Not Allowed.
6. THE ActionService SHALL rechazar cualquier solicitud de creación de acciones, devolviendo un error 405 Method Not Allowed.

### Requirement 16: Modelo de datos de acción

**User Story:** As a desarrollador, I want un modelo de datos de acción bien definido en la base de datos, so that pueda gestionar los permisos granulares del sistema de forma consistente y tipada.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de acciones con los siguientes campos: identificador (autogenerado), código (único, obligatorio), tipo (obligatorio, enum con valores READ, WRITE, EXECUTE), nombre (obligatorio), descripción (opcional), fecha de creación y fecha de última modificación.
2. THE SPA SHALL crear el esquema de la tabla de acciones mediante una migración Liquibase versionada.
3. THE SPA SHALL definir el campo tipo como un enum de base de datos con los valores permitidos: READ, WRITE, EXECUTE.
4. WHEN se intenta insertar una acción con un código que ya existe, THE SPA SHALL rechazar la operación con un error de violación de restricción de unicidad.
5. THE SPA SHALL incluir en la migración Liquibase una carga de datos inicial (seed data) con las siguientes 14 acciones predefinidas del sistema:

   | Código                   | Tipo      | Nombre                                    |
   |--------------------------|-----------|-------------------------------------------|
   | `DASHBOARD_READ`         | READ      | Visualizar el panel principal (Dashboard) |
   | `REPORT_EXECUTE`         | EXECUTE   | Ejecutar informes                         |
   | `INTERFACES_READ`        | READ      | Acceder al módulo de Interfaces           |
   | `USER_READ`              | READ      | Consultar usuarios                        |
   | `USER_WRITE`             | WRITE     | Crear, editar o eliminar usuarios         |
   | `PROFILE_READ`           | READ      | Consultar perfiles                        |
   | `PROFILE_WRITE`          | WRITE     | Crear, editar o eliminar perfiles         |
   | `ACTION_READ`            | READ      | Consultar acciones del sistema            |
   | `SYSTEM_PARAMETER_READ`  | READ      | Consultar parámetros del sistema          |
   | `SYSTEM_PARAMETER_WRITE` | WRITE     | Modificar parámetros del sistema          |
   | `SYSTEM_LOG_READ`        | READ      | Consultar registros de auditoría          |
   | `CLUSTER_NODE_READ`      | READ      | Consultar nodos del clúster               |
   | `CLUSTER_NODE_WRITE`     | WRITE     | Modificar la configuración de nodos       |
   | `CLUSTER_LOCK_READ`      | READ      | Consultar bloqueos del clúster            |

6. THE SPA SHALL garantizar que las acciones predefinidas existen en la tabla tras la ejecución de las migraciones, de forma que el sistema de autorización funcione correctamente desde el primer arranque.

### Requirement 17: Modelo de datos de perfil

**User Story:** As a desarrollador, I want un modelo de datos de perfil bien definido en la base de datos, so that pueda gestionar los perfiles y su relación con las acciones de forma consistente.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de perfiles con los siguientes campos: identificador (autogenerado), nombre (único, obligatorio), descripción (opcional), fecha de creación y fecha de última modificación.
2. THE SPA SHALL gestionar la tabla intermedia de relación perfil-acción (join table) con el nombre `profile2action`, siguiendo la convención de nomenclatura `<Entidad1>2<Entidad2>` para tablas intermedias. La tabla contendrá los campos: identificador del perfil (referencia a la tabla de perfiles) e identificador de la acción (referencia a la tabla de acciones).
3. THE SPA SHALL definir una restricción de unicidad compuesta en la tabla intermedia `profile2action` sobre los campos identificador del perfil e identificador de la acción, garantizando que una misma acción no pueda asignarse dos veces al mismo perfil.
4. THE SPA SHALL crear el esquema de la tabla de perfiles y de la tabla intermedia `profile2action` mediante migraciones Liquibase versionadas.
5. THE SPA SHALL aplicar la convención de nomenclatura `<Entidad1>2<Entidad2>` (en snake_case) para todas las tablas intermedias de relaciones muchos-a-muchos del sistema.
5. WHEN se intenta insertar un perfil con un nombre que ya existe, THE SPA SHALL rechazar la operación con un error de violación de restricción de unicidad.
6. WHEN se intenta insertar un registro duplicado en la tabla intermedia `profile2action`, THE SPA SHALL rechazar la operación con un error de violación de restricción de unicidad compuesta.

### Requirement 18: Generación y consulta de informes

**User Story:** As a usuario autenticado, I want acceder a los informes que tengo asignados, configurar sus filtros y consultar los resultados paginados, so that pueda obtener datos consolidados y estructurados para análisis, supervisión y toma de decisiones.

#### Acceptance Criteria

1. WHEN el usuario accede a la sección de Informes desde el menú, THE SPA SHALL mostrar una pantalla de listado con los informes permitidos para el usuario autenticado, determinados por la relación user2report (tabla intermedia entre usuario e informe).
2. THE ReportService SHALL exponer un endpoint para obtener la lista de informes asignados al usuario autenticado, consultando la relación user2report asociada al identificador del usuario.
3. THE SPA SHALL mostrar en cada fila del listado de informes un botón "Ejecutar" que permita al usuario navegar a la pantalla de ejecución del informe seleccionado.
4. WHEN el usuario pulsa el botón "Ejecutar" de un informe, THE SPA SHALL navegar a una pantalla independiente de ejecución de informe que presente un formulario con los filtros específicos de dicho informe.
5. THE ReportService SHALL exponer un endpoint para obtener la definición de filtros de un informe específico, devolviendo la lista de campos de filtro con su nombre, tipo de dato y si es obligatorio u opcional.
6. WHEN el usuario rellena los filtros y pulsa el botón "Filtrar", THE ReportService SHALL ejecutar el informe aplicando los filtros proporcionados y devolver los datos del informe en formato estructurado con soporte de paginación del lado del servidor.
7. THE SPA SHALL mostrar los resultados del informe en la misma pantalla de ejecución, debajo del formulario de filtros, en formato tabular con paginación del lado del servidor (mismo patrón que el resto de vistas de listado de la aplicación).
8. WHEN el usuario solicita ejecutar un informe sin proporcionar los filtros obligatorios, THE ReportService SHALL devolver un error 400 Bad Request indicando los filtros requeridos.
9. WHEN el usuario no tiene el informe asignado en la relación user2report e intenta acceder a la ejecución de dicho informe, THE ReportService SHALL devolver un error 403 Forbidden.

### Requirement 19: Exportación de informes

**User Story:** As a usuario autenticado, I want exportar los resultados de un informe en diferentes formatos, so that pueda descargar y compartir la información fuera de la aplicación.

#### Acceptance Criteria

1. THE SPA SHALL mostrar en la pantalla de resultados del informe opciones de exportación en los formatos: PDF, Excel (XLSX), CSV y TXT.
2. THE ReportService SHALL exponer un endpoint para exportar los resultados de un informe en formato PDF.
3. THE ReportService SHALL exponer un endpoint para exportar los resultados de un informe en formato Excel (XLSX).
4. THE ReportService SHALL exponer un endpoint para exportar los resultados de un informe en formato CSV.
5. THE ReportService SHALL exponer un endpoint para exportar los resultados de un informe en formato TXT.
6. WHEN el usuario solicita exportar un informe, THE ReportService SHALL aplicar los mismos filtros utilizados en la ejecución actual del informe en pantalla.
7. WHEN la exportación se completa, THE SPA SHALL iniciar la descarga del fichero generado en el navegador del usuario.
8. IF la generación del fichero de exportación falla, THEN THE ReportService SHALL devolver un error 500 Internal Server Error con un mensaje descriptivo.

### Requirement 20: Gestión de parámetros generales (CRUD)

**User Story:** As a administrador, I want gestionar los parámetros generales de operación de la aplicación (crear, consultar, modificar y eliminar), so that pueda ajustar el comportamiento del sistema sin necesidad de despliegue.

#### Acceptance Criteria

1. THE ParameterService SHALL exponer un endpoint para crear un nuevo parámetro aceptando un ParameterDTO con el campo id nulo y los datos: código (obligatorio, único), descripción (opcional), valor (obligatorio) y tipo (obligatorio, enum: STRING, INTEGER, BOOLEAN, DATE). El sistema genera el identificador del parámetro.
2. THE ParameterService SHALL exponer un endpoint para obtener la lista de parámetros del sistema con soporte de paginación y filtros por código, descripción y tipo mediante un objeto ParameterCriteria, incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
3. THE ParameterService SHALL exponer un endpoint para obtener los datos de un parámetro concreto por su código, devolviendo un ParameterDTO.
4. THE ParameterService SHALL exponer un endpoint para actualizar los datos de un parámetro existente aceptando un ParameterDTO con el campo id poblado (identificando al parámetro a actualizar), actualizando: descripción, valor y tipo.
5. THE ParameterService SHALL exponer un endpoint para eliminar un parámetro existente.
6. WHEN se intenta crear un parámetro con un código que ya existe, THE ParameterService SHALL devolver un error 409 Conflict.
7. WHEN se intenta actualizar un parámetro con un valor que no es compatible con el tipo definido (por ejemplo, un texto en un parámetro de tipo INTEGER), THE ParameterService SHALL devolver un error 400 Bad Request con un mensaje indicando la incompatibilidad de tipo.
8. WHEN se intenta acceder a un parámetro que no existe, THE ParameterService SHALL devolver un error 404 Not Found.
9. THE ParameterService SHALL registrar en el AuditLog cada creación, modificación y eliminación de un parámetro, incluyendo el valor anterior (si aplica), el valor nuevo y el usuario que realizó el cambio.

### Requirement 21: Trazabilidad y auditoría del sistema (solo lectura)

**User Story:** As a administrador, I want consultar los registros de actividad del sistema, so that pueda supervisar el comportamiento de la aplicación, investigar incidencias y garantizar la trazabilidad de todas las operaciones realizadas por los usuarios.

**Nota importante:** Este requisito se refiere exclusivamente al sistema de auditoría a nivel de aplicación, que registra la actividad de los usuarios en una tabla dedicada (audit_log). NO se refiere a los campos de timestamps en las entidades (created_at, last_modified_at), que existen por separado con otro propósito. El registro de auditoría se implementa de forma no invasiva mediante AOP (aspectos) u otra tecnología transversal que no contamine el código de negocio.

#### Acceptance Criteria

1. THE AuditService SHALL registrar automáticamente mediante AOP (aspectos) cada operación relevante del sistema sin añadir código de auditoría en los servicios de negocio. Las operaciones registradas son: CREATE (creación de un registro de cualquier entidad), UPDATE (modificación de un atributo de una entidad, incluyendo idealmente los valores anteriores y nuevos), DELETE (eliminación de un registro de cualquier entidad) y EXECUTE (ejecución de una acción de tipo execute, como pulsar un botón de ejecución).
2. THE AuditService SHALL registrar para cada operación auditada los siguientes datos: timestamp (fecha y hora exacta), username (usuario que realizó la operación), operation_type (CREATE, UPDATE, DELETE o EXECUTE), section (módulo/sección del sistema donde se realizó la operación: SECURITY, REPORTS, INTERFACES, CLUSTER, SYSTEM), entity_id (identificador del registro afectado, opcional), entity_name (tipo de entidad afectada) y detail (texto opcional con información adicional, como los valores antiguos/nuevos en modificaciones).
3. THE AuditService SHALL exponer un endpoint para consultar los registros de auditoría con soporte de paginación y filtros por: rango de fechas (desde/hasta), usuario (quién realizó la operación), tipo de operación (CREATE, UPDATE, DELETE, EXECUTE) y sección/módulo (SECURITY, REPORTS, INTERFACES, CLUSTER, SYSTEM), incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
4. THE SPA SHALL presentar los registros de auditoría en formato tabular con soporte de paginación, ordenación y filtros, en modo solo lectura.
5. THE AuditService SHALL garantizar que los registros de auditoría sean inmutables (no se pueden modificar ni eliminar a través de la API ni a través de ningún proceso de la aplicación). La tabla audit_log es append-only.
6. WHEN el volumen de datos del log supera el período de retención configurado, THE AuditService SHALL archivar los registros antiguos según la política de retención definida en los parámetros del sistema.
7. THE AuditService SHALL exponer únicamente endpoints de consulta (GET). La creación, modificación y eliminación de registros de auditoría no está disponible a través de la API de usuario; el registro se realiza de forma automática por el sistema mediante AOP.
8. THE AuditService SHALL ser independiente de los campos de timestamps de las entidades (created_at, last_modified_at). Dichos campos existen con un propósito diferente (trazabilidad a nivel de registro) y no sustituyen ni son sustituidos por el sistema de auditoría.

### Requirement 22: Supervisión de interfaces y servicios integrados (solo lectura)

**User Story:** As a administrador, I want consultar el estado de las interfaces y servicios integrados con la aplicación, so that pueda detectar problemas de conectividad y garantizar la disponibilidad de las integraciones.

#### Acceptance Criteria

1. THE InterfaceService SHALL exponer un endpoint para obtener la lista de interfaces registradas en el sistema con su estado actual (activa, inactiva, en error).
2. THE InterfaceService SHALL exponer un endpoint para obtener la definición detallada de una interfaz concreta (nombre, descripción, URL del servicio, protocolo, frecuencia de verificación).
3. THE InterfaceService SHALL exponer un endpoint para consultar la trazabilidad de una interfaz específica: logs de actividad con soporte de paginación y filtros por rango de fechas y resultado (éxito, error), incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
4. THE SPA SHALL presentar un panel de supervisión de interfaces mostrando el estado consolidado de todas las interfaces con indicadores visuales (verde para activa, rojo para error, gris para inactiva).
5. WHEN una interfaz cambia de estado, THE InterfaceService SHALL registrar el cambio en el AuditLog con la fecha, el estado anterior y el estado nuevo.
6. WHEN se intenta acceder a una interfaz que no existe, THE InterfaceService SHALL devolver un error 404 Not Found.
7. THE InterfaceService SHALL exponer únicamente endpoints de consulta (GET). La creación, modificación y eliminación de interfaces no está disponible a través de la API de usuario.

### Requirement 23: Consulta y edición de nodos del cluster

**User Story:** As a administrador, I want consultar el estado de los nodos del cluster y poder designar cuál actúa como maestro, so that pueda supervisar las instancias de la aplicación y gestionar la alta disponibilidad.

#### Acceptance Criteria

1. THE ClusterService SHALL exponer un endpoint para obtener la lista de nodos del cluster con los siguientes datos por cada nodo: estado (ALIVE, DEAD), hostname, ip, master, memoriaUsada, memoriaLibre, memoriaTotal, fecha de arranque y fecha de última actualización.
2. THE ClusterService SHALL exponer un endpoint para obtener los datos detallados de un nodo concreto por su identificador, incluyendo todos los campos de la entidad.
3. THE ClusterService SHALL exponer un endpoint para actualizar únicamente el campo master de un nodo existente.
4. WHEN se establece un nodo como master (master=true), THE ClusterService SHALL garantizar que solo un nodo puede ser maestro en el sistema, desactivando automáticamente el flag master del nodo que previamente lo tenía.
5. THE SPA SHALL presentar un panel de supervisión de nodos mostrando el estado consolidado de todas las instancias con indicadores visuales de disponibilidad (verde para ALIVE, rojo para DEAD) e indicador del nodo maestro.
6. THE SPA SHALL presentar todos los campos del nodo como solo lectura excepto el campo master, que será editable por el administrador.
7. WHEN se intenta acceder a un nodo que no existe, THE ClusterService SHALL devolver un error 404 Not Found.
8. THE ClusterService SHALL rechazar cualquier solicitud de creación de nodos, devolviendo un error 405 Method Not Allowed.
9. THE ClusterService SHALL rechazar cualquier solicitud de eliminación de nodos, devolviendo un error 405 Method Not Allowed.

### Requirement 24: Consulta de bloqueos del cluster (solo lectura)

**User Story:** As a administrador, I want consultar las estadísticas de bloqueos del cluster, so that pueda supervisar qué tareas producen bloqueos, su frecuencia y sus tiempos de ejecución.

#### Acceptance Criteria

1. THE ClusterService SHALL exponer un endpoint para obtener la lista de bloqueos (ClusterBlock) con soporte de paginación y filtros por nombre de tarea, incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
2. THE ClusterService SHALL exponer un endpoint para obtener los datos detallados de un bloqueo concreto por su identificador, incluyendo todos los campos: nombre, fecha de inicio, tiempo medio, tiempo mínimo, tiempo máximo y total.
3. THE SPA SHALL presentar la lista de bloqueos en modo solo lectura, sin opciones de creación, edición ni eliminación.
4. WHEN se intenta acceder a un bloqueo que no existe, THE ClusterService SHALL devolver un error 404 Not Found.
5. THE ClusterService SHALL exponer únicamente endpoints de consulta (GET) para los bloqueos. La creación, modificación y eliminación de bloqueos no está disponible a través de la API de usuario; los registros se gestionan exclusivamente por el sistema.

### Requirement 25: Comportamiento estándar de vistas de listado

**User Story:** As a usuario autenticado, I want que todas las vistas que presenten listas o tablas de datos en la aplicación sigan un comportamiento consistente, so that pueda paginar, filtrar, exportar y gestionar los registros de forma uniforme.

#### Acceptance Criteria

1. THE SPA SHALL presentar toda tabla o lista de datos con soporte de paginación del lado del servidor.
2. THE SPA SHALL proporcionar filtros de búsqueda por cada uno de los campos visibles en la tabla, permitiendo al usuario refinar los resultados mostrados.
3. THE SPA SHALL incluir en cada vista de listado un botón de exportación a CSV que descargue todos los registros que coincidan con los filtros aplicados.
4. WHEN el usuario pulsa el botón de exportación a CSV, THE SPA SHALL generar y descargar un fichero CSV con las columnas visibles y los datos filtrados.
5. WHEN el usuario interactúa con los controles de paginación (cambio de página), aplica o modifica filtros, o pulsa el botón de exportación, THE SPA SHALL mostrar una notificación de progreso (según lo definido en el Requirement 11) mientras la operación está en curso.
6. WHILE el usuario tiene la acción de creación asignada en su perfil, THE SPA SHALL mostrar un botón "Crear" en las vistas de listado de entidades que soporten creación (usuarios, perfiles, parámetros).
7. WHILE el usuario tiene la acción de edición asignada en su perfil, THE SPA SHALL mostrar una opción "Editar" en cada fila del listado de entidades que soporten edición (usuarios, perfiles, parámetros, acciones, nodos del cluster).
8. WHILE el usuario tiene la acción de eliminación asignada en su perfil, THE SPA SHALL mostrar una opción "Borrar" en cada fila del listado de entidades que soporten eliminación (usuarios, perfiles), solicitando confirmación antes de ejecutar la acción.
9. THE SPA SHALL mostrar una opción "Ver Detalle" en cada fila del listado que permita consultar la información completa del registro.
10. WHILE el usuario no tiene la acción requerida para crear, editar o borrar registros, THE SPA SHALL ocultar las opciones correspondientes y presentar la vista de listado en modo solo lectura.
11. THE SPA SHALL presentar las vistas de listado de Acciones y Nodos del cluster únicamente con las opciones "Ver Detalle" y "Editar" (sin botón "Crear" ni opción "Borrar").
12. THE SPA SHALL presentar las vistas de listado de Bloqueos del cluster, Trazabilidad/Auditoría e Interfaces únicamente con la opción "Ver Detalle" (sin opciones de Crear, Editar ni Borrar).
13. THE SPA SHALL requerir que todo servicio del backend que soporte paginación exponga, además del método findByCriteria(criteria, pageable) para obtener la página de resultados, un método countByCriteria(criteria) que devuelva el número total de registros que coinciden con los criterios de filtrado aplicados, permitiendo al frontend calcular la paginación completa (total de páginas y navegación).

### Requirement 26: Modelo de datos de auditoría

**User Story:** As a desarrollador, I want un modelo de datos de auditoría bien definido en la base de datos, so that pueda almacenar de forma estructurada e inmutable todos los registros de actividad generados por el sistema de auditoría AOP.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de auditoría con el nombre `audit_log` y los siguientes campos: id (BIGINT, autogenerado, clave primaria), timestamp (TIMESTAMP, obligatorio, fecha y hora de la operación), username (VARCHAR, obligatorio, usuario que realizó la operación), operation_type (VARCHAR, obligatorio, enum con valores: CREATE, UPDATE, DELETE, EXECUTE), section (VARCHAR, obligatorio, módulo/sección del sistema con valores: SECURITY, REPORTS, INTERFACES, CLUSTER, SYSTEM), entity_id (VARCHAR, opcional, identificador del registro afectado), entity_name (VARCHAR, obligatorio, nombre del tipo de entidad afectada) y detail (TEXT, opcional, información adicional como los valores anteriores/nuevos en modificaciones).
2. THE SPA SHALL crear el esquema de la tabla `audit_log` mediante una migración Liquibase versionada.
3. THE SPA SHALL garantizar que la tabla `audit_log` sea append-only: no se permite la ejecución de operaciones UPDATE ni DELETE sobre los registros de esta tabla. La inmutabilidad se refuerza tanto a nivel de aplicación (el AuditService no expone operaciones de escritura) como a nivel de base de datos (restricciones o políticas que impidan la modificación o eliminación de registros).
4. THE SPA SHALL definir un índice compuesto sobre los campos timestamp y username para optimizar las consultas de auditoría filtradas por rango de fechas y usuario.
5. THE SPA SHALL definir un índice sobre el campo operation_type para optimizar las consultas filtradas por tipo de operación.
6. THE SPA SHALL definir un índice sobre el campo section para optimizar las consultas filtradas por sección/módulo.

### Requirement 27: Gestión de zonas horarias y almacenamiento en UTC

**User Story:** As a usuario, I want que la aplicación almacene todas las fechas en UTC y me las muestre convertidas a mi zona horaria local, so that pueda consultar la información temporal de forma coherente independientemente de mi ubicación geográfica.

#### Acceptance Criteria

1. THE SPA SHALL configurar el backend (JVM y base de datos) para operar internamente en UTC, almacenando todos los campos de tipo fecha y hora (timestamps) en UTC sin excepción.
2. THE SPA SHALL transmitir todas las fechas y horas en las respuestas de la API REST en formato ISO 8601 con el sufijo UTC (Z), por ejemplo: `2024-01-15T10:30:00Z`.
3. WHEN el frontend recibe una fecha en formato UTC desde la API, THE SPA SHALL convertir y mostrar dicha fecha en la zona horaria local del navegador del usuario, obtenida a través de `Intl.DateTimeFormat().resolvedOptions().timeZone`.
4. WHEN el frontend envía una fecha al backend (por ejemplo en filtros de búsqueda por rango de fechas), THE SPA SHALL convertir la fecha de la zona horaria local del usuario a UTC antes de enviarla en la petición.
5. THE SPA SHALL aplicar esta conversión de zona horaria de forma consistente en toda la interfaz: listados, detalles, formularios, informes, logs de auditoría y cualquier otro componente que muestre información temporal.
6. THE SPA SHALL utilizar un servicio o pipe centralizado en Angular para la conversión y formateo de fechas, evitando lógica de conversión dispersa en los componentes.
7. THE SPA SHALL configurar la conexión a PostgreSQL con el tipo de dato `TIMESTAMP WITH TIME ZONE` (timestamptz) para los campos de fecha y hora, garantizando el almacenamiento correcto en UTC.

### Requirement 28: Modelo de datos de parámetro

**User Story:** As a desarrollador, I want un modelo de datos de parámetro bien definido en la base de datos, so that pueda gestionar los parámetros de configuración del sistema de forma consistente y tipada.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de parámetros con los siguientes campos: identificador (autogenerado), código (único, obligatorio, tipo VARCHAR), descripción (opcional, tipo VARCHAR), valor (obligatorio, tipo VARCHAR, almacena el valor del parámetro como cadena independientemente de su tipo lógico), tipo (obligatorio, enum con valores: STRING, INTEGER, BOOLEAN, DATE), fecha de creación y fecha de última modificación.
2. THE SPA SHALL crear el esquema de la tabla de parámetros mediante una migración Liquibase versionada.
3. THE SPA SHALL definir el campo tipo como un enum de base de datos con los valores permitidos: STRING, INTEGER, BOOLEAN, DATE.
4. WHEN se intenta insertar un parámetro con un código que ya existe, THE SPA SHALL rechazar la operación con un error de violación de restricción de unicidad.
5. THE ParameterService SHALL validar que el campo valor sea compatible con el tipo definido antes de persistir el registro: para INTEGER el valor debe ser un número entero válido, para BOOLEAN debe ser "true" o "false", para DATE debe ser una fecha en formato ISO 8601, y para STRING cualquier valor es aceptado.

### Requirement 29: Modelo de datos de nodo del cluster

**User Story:** As a desarrollador, I want un modelo de datos de nodo del cluster bien definido en la base de datos, so that pueda registrar y supervisar las instancias de la aplicación en entornos de alta disponibilidad.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de nodos del cluster (CLUSTER_NODE) con los siguientes campos: identificador (autogenerado), estado (obligatorio, enum con valores: ALIVE, DEAD), hostname (obligatorio, tipo VARCHAR, nombre de la máquina del sistema operativo), ip (obligatorio, tipo VARCHAR, dirección IP de la máquina), master (obligatorio, tipo BOOLEAN, indica si el nodo actúa como maestro), memoriaUsada (obligatorio, tipo BIGINT, memoria usada por la aplicación en bytes), memoriaLibre (obligatorio, tipo BIGINT, memoria libre en bytes), memoriaTotal (obligatorio, tipo BIGINT, memoria total en bytes), fecha de arranque (opcional, tipo TIMESTAMP WITH TIME ZONE, última vez que la instancia fue arrancada) y fecha de última actualización (opcional, tipo TIMESTAMP WITH TIME ZONE, último chequeo de que la instancia está funcionando).
2. THE SPA SHALL crear el esquema de la tabla de nodos del cluster mediante una migración Liquibase versionada.
3. THE SPA SHALL definir el campo estado como un enum de base de datos con los valores permitidos: ALIVE, DEAD.
4. THE SPA SHALL garantizar mediante restricción de base de datos o lógica de aplicación que solo un nodo puede tener el campo master con valor true en cualquier momento.
5. THE SPA SHALL garantizar que los registros de nodos del cluster son creados y actualizados exclusivamente por el propio sistema (la propia instancia de la aplicación al arrancar y periódicamente), nunca por la API de usuario. La API de usuario solo permite modificar el campo master.
6. THE SPA SHALL utilizar el campo last_modified_at (gestionado automáticamente por Spring Data JPA según el Requirement 34) como referencia temporal para determinar si un nodo ha excedido el timeout de heartbeat (5 minutos / 300000 ms), marcándolo como DEAD en caso afirmativo.

### Requirement 30: Autoregistro y heartbeat del nodo del cluster

**User Story:** As a desarrollador, I want que cada instancia de la aplicación se registre automáticamente en el cluster al arrancar y envíe un heartbeat periódico con detección de nodos muertos y elección automática de maestro, so that el sistema de supervisión refleje en todo momento qué instancias están activas y el cluster mantenga siempre un nodo maestro operativo.

#### Acceptance Criteria

1. WHEN la aplicación arranca y no existe un registro en la tabla de nodos del cluster con el hostname de la máquina actual, THE ClusterService SHALL crear automáticamente un nuevo registro con: hostname (identificador de la instancia), ip de la máquina, estado ALIVE, master false, datos de memoria actuales, fecha de arranque con la fecha y hora actual y fecha de última actualización con la fecha y hora actual.
2. WHEN la aplicación arranca y ya existe un registro en la tabla de nodos del cluster con el hostname de la máquina actual, THE ClusterService SHALL actualizar el registro existente con: estado ALIVE, ip actual, datos de memoria actuales y fecha de arranque con la fecha y hora actual.
3. THE SPA SHALL ejecutar una tarea en background (scheduled task / HeartbeatWorker) que cada 30 segundos actualice el registro del nodo en la tabla de nodos del cluster con: estado ALIVE, datos de memoria actuales (memoriaUsada, memoriaLibre, memoriaTotal) y fecha de última actualización con la fecha y hora actual.
4. THE SPA SHALL utilizar el hostname del sistema operativo como identificador único de la instancia para localizar su registro en la tabla de nodos del cluster.
5. THE SPA SHALL configurar el intervalo del heartbeat (30 segundos por defecto) como un parámetro configurable a través de los parámetros del sistema o de la configuración de la aplicación.
6. WHEN el HeartbeatWorker ejecuta su ciclo, THE ClusterService SHALL adquirir un lock sobre el recurso "NODOS" antes de procesar la lógica de heartbeat, garantizando exclusión mutua entre instancias concurrentes.
7. WHEN el HeartbeatWorker detecta que el campo last_modified_at de un nodo supera los 5 minutos (300000 milisegundos) respecto al momento actual, THE ClusterService SHALL marcar dicho nodo como DEAD actualizando su campo estado.
8. WHEN el HeartbeatWorker detecta que no existe ningún nodo con estado ALIVE y master true en el cluster, THE ClusterService SHALL promover automáticamente al nodo actual como maestro (master = true).
9. IF la aplicación arranca y no encuentra su propio registro en la tabla de nodos del cluster por hostname, THEN THE ClusterService SHALL registrar un log de nivel FATAL indicando una condición operativa crítica.
10. THE SPA SHALL implementar el HeartbeatWorker como una clase abstracta que defina puntos de extensión (métodos abstractos) para que los módulos consumidores implementen la reacción ante nodos muertos detectados y la lógica de primera invocación tras el arranque.

### Requirement 31: Modelo de datos de bloqueo del cluster (ClusterBlock)

**User Story:** As a desarrollador, I want un modelo de datos de bloqueo del cluster bien definido en la base de datos, so that pueda registrar y consultar las estadísticas de bloqueos producidos por las tareas del sistema.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de bloqueos del cluster (ClusterBlock) con los siguientes campos: identificador (autogenerado), nombre (obligatorio, único, tipo VARCHAR, nombre de la tarea que provoca el bloqueo), fecha de inicio (obligatorio, tipo TIMESTAMP WITH TIME ZONE, fecha de inicio del bloqueo actual), tiempo medio (obligatorio, tipo BIGINT, tiempo medio en milisegundos que ha durado un bloqueo de esta tarea), tiempo mínimo (obligatorio, tipo BIGINT, tiempo mínimo en milisegundos que ha durado un bloqueo de esta tarea), tiempo máximo (obligatorio, tipo BIGINT, tiempo máximo en milisegundos que ha durado un bloqueo de esta tarea) y total (obligatorio, tipo BIGINT, número total de bloqueos que ha producido esa tarea).
2. THE SPA SHALL crear el esquema de la tabla de bloqueos del cluster mediante una migración Liquibase versionada.
3. WHEN se intenta insertar un bloqueo con un nombre que ya existe, THE SPA SHALL rechazar la operación con un error de violación de restricción de unicidad.
4. THE SPA SHALL garantizar que los registros de la tabla ClusterBlock son creados y actualizados exclusivamente por el propio sistema (las tareas que adquieren bloqueos), nunca por la API de usuario.
5. THE SPA SHALL definir una clave foránea en la tabla CLUSTER_BLOCK desde el campo nombre (name) hacia el campo nombre (name) de la tabla CLUSTER_TASK, garantizando que no pueda existir un registro de bloqueo para una tarea que no esté registrada en la tabla CLUSTER_TASK.

### Requirement 32: Trazabilidad de operaciones de interfaces (solo lectura)

**User Story:** As a administrador, I want consultar el registro de todas las operaciones realizadas por las interfaces con sistemas externos, so that pueda monitorizar el tráfico entrante y saliente, diagnosticar problemas y verificar el correcto funcionamiento de las integraciones.

#### Acceptance Criteria

1. THE InterfaceService SHALL registrar automáticamente cada operación realizada por una interfaz con un sistema externo, ya sea de entrada (recepción de datos) o de salida (envío de datos), sin intervención del código de negocio.
2. THE InterfaceService SHALL exponer un endpoint para consultar los registros de operaciones de interfaces con soporte de paginación y filtros por: rango de fechas, tipo de operación (IN, OUT), interfaz y estado de la respuesta (éxito, error), incluyendo un método countByCriteria(criteria) que devuelva el total de registros que coinciden con los filtros aplicados.
3. THE InterfaceService SHALL exponer un endpoint para obtener el detalle de una operación concreta por su identificador, incluyendo todos los campos: fecha y hora, tipo de operación, interfaz, payload de la petición, payload de la respuesta y estado.
4. THE SPA SHALL presentar los registros de operaciones de interfaces en formato tabular con soporte de paginación, ordenación y filtros, en modo solo lectura.
5. THE InterfaceService SHALL exponer únicamente endpoints de consulta (GET) para los registros de operaciones de interfaces. La creación, modificación y eliminación no está disponible a través de la API de usuario; el registro se realiza de forma automática por el sistema.
6. WHEN se intenta acceder a un registro de operación de interfaz que no existe, THE InterfaceService SHALL devolver un error 404 Not Found.

### Requirement 33: Modelo de datos de trazabilidad de interfaces (InterfaceLog)

**User Story:** As a desarrollador, I want un modelo de datos de trazabilidad de interfaces bien definido en la base de datos, so that pueda almacenar de forma estructurada todas las operaciones realizadas con sistemas externos.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de trazabilidad de interfaces (InterfaceLog) con los siguientes campos: identificador (autogenerado), timestamp (obligatorio, tipo TIMESTAMP WITH TIME ZONE, fecha y hora de la operación), operation_type (obligatorio, enum con valores: IN, OUT, indica si la operación es de entrada o salida), interface_name (obligatorio, tipo VARCHAR, nombre de la interfaz por la cual se ha realizado la operación), request_payload (opcional, tipo TEXT, payload de la petición realizada o operación ejecutada), response_payload (opcional, tipo TEXT, payload de la respuesta recibida) y status (obligatorio, tipo VARCHAR, indica si la respuesta es correcta o incorrecta, valores: SUCCESS, ERROR).
2. THE SPA SHALL crear el esquema de la tabla InterfaceLog mediante una migración Liquibase versionada.
3. THE SPA SHALL definir el campo operation_type como un enum de base de datos con los valores permitidos: IN, OUT.
4. THE SPA SHALL definir un índice compuesto sobre los campos timestamp e interface_name para optimizar las consultas filtradas por rango de fechas e interfaz.
5. THE SPA SHALL definir un índice sobre el campo status para optimizar las consultas filtradas por estado de la respuesta.
6. THE SPA SHALL garantizar que los registros de la tabla InterfaceLog son creados exclusivamente por el sistema de forma automática y son inmutables (append-only, no se permiten operaciones UPDATE ni DELETE).

### Requirement 34: Convención de almacenamiento de timestamps en base de datos

**User Story:** As a desarrollador, I want que todos los campos de fecha y hora en la base de datos utilicen un tipo con zona horaria y que todas las entidades incluyan campos estándar de trazabilidad a nivel de registro, so that se garantice la precisión temporal en entornos multi-timezone y se disponga de infraestructura uniforme para saber cuándo se creó y modificó cada registro.

#### Acceptance Criteria

1. THE SPA SHALL utilizar el tipo TIMESTAMP WITH TIME ZONE (timestamptz) de PostgreSQL para todos los campos de base de datos que almacenen valores de fecha y hora, sin excepción.
2. THE SPA SHALL incluir en todas las entidades los campos created_at (obligatorio, tipo TIMESTAMP WITH TIME ZONE, fecha y hora de creación del registro) y last_modified_at (obligatorio, tipo TIMESTAMP WITH TIME ZONE, fecha y hora de la última modificación del registro).
3. THE SPA SHALL gestionar los campos created_at y last_modified_at de forma automática mediante el mecanismo de auditoría de Spring Data JPA (@CreatedDate, @LastModifiedDate), sin intervención del código de negocio.
4. THE SPA SHALL exponer los campos created_at y last_modified_at como campos de solo lectura en la API REST. Las peticiones de creación o modificación que incluyan valores para estos campos son ignoradas por el sistema.
5. THE SPA SHALL asignar el valor de created_at únicamente en el momento de la inserción del registro; el campo es inmutable tras la creación.
6. THE SPA SHALL actualizar el valor de last_modified_at de forma automática cada vez que el registro sea modificado.
7. THE SPA SHALL definir los campos created_at y last_modified_at en las migraciones Liquibase de cada tabla con restricción NOT NULL y valor por defecto CURRENT_TIMESTAMP.
8. THE SPA SHALL diferenciar los campos created_at y last_modified_at (trazabilidad a nivel de registro) del sistema de auditoría AuditLog (trazabilidad a nivel de operación de usuario). Ambos mecanismos son complementarios y tienen propósitos distintos.

### Requirement 35: Convención de estructura de URLs para la Frontend API

**User Story:** As a desarrollador, I want que los endpoints de la API consumidos exclusivamente por el frontend (template-dashboard) sigan una jerarquía de URLs que refleje la estructura de módulos funcionales de la aplicación, so that la organización de la API sea coherente con la navegación del usuario y facilite el mantenimiento y la comprensión del sistema.

#### Acceptance Criteria

1. THE SPA SHALL organizar los endpoints de la Frontend API (consumidos exclusivamente por template-dashboard) bajo una estructura de URLs que refleje la jerarquía de módulos funcionales de la aplicación, utilizando el prefijo `/api/v1/` como base.
2. THE AuthService SHALL mantener los endpoints de autenticación en la ruta `/api/v1/auth/` sin cambios, dado que la autenticación es un módulo transversal independiente de la estructura funcional de administración.
3. THE UserService SHALL exponer los endpoints de gestión de usuarios en la ruta `/api/v1/administration/security/users/`, incluyendo el endpoint de perfil del usuario autenticado en `/api/v1/administration/security/users/me`.
4. THE ProfileService SHALL exponer los endpoints de gestión de perfiles en la ruta `/api/v1/administration/security/profiles/`.
5. THE ActionService SHALL exponer los endpoints de gestión de acciones en la ruta `/api/v1/administration/security/actions/`.
6. THE ParameterService SHALL exponer los endpoints de gestión de parámetros en la ruta `/api/v1/administration/parameters/`.
7. THE AuditService SHALL exponer los endpoints de consulta de registros de auditoría del sistema en la ruta `/api/v1/administration/audit/`.
8. THE InterfaceService SHALL exponer los endpoints de configuración y supervisión de interfaces en la ruta `/api/v1/interfaces/configuration/`, como módulo funcional de primer nivel independiente de administración.
9. THE InterfaceService SHALL exponer los endpoints de consulta de trazabilidad de operaciones de interfaces (InterfaceLog / Monitor) en la ruta `/api/v1/interfaces/monitor/`.
10. THE ClusterService SHALL exponer los endpoints de gestión de nodos del cluster en la ruta `/api/v1/administration/cluster/nodes/`.
11. THE ClusterService SHALL exponer los endpoints de consulta de bloqueos del cluster en la ruta `/api/v1/administration/cluster/blocks/`.
12. THE ReportService SHALL exponer los endpoints de gestión de informes en la ruta `/api/v1/reports/`, como módulo funcional de primer nivel independiente de administración.
13. THE SPA SHALL aplicar esta convención de estructura de URLs únicamente a la Frontend API (consumida por template-dashboard). Las APIs de integración destinadas a sistemas externos pueden seguir convenciones diferentes según sus necesidades.

### Requirement 36: Modelo de datos de tarea del cluster (ClusterTask)

**User Story:** As a desarrollador, I want un modelo de datos de tarea del cluster bien definido en la base de datos, so that pueda configurar qué tareas son ejecutables en el cluster, cuántos nodos pueden ejecutar cada tarea simultáneamente y cuántos nodos mínimos deben estar activos para permitir su ejecución.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de tareas del cluster (CLUSTER_TASK) con los siguientes campos: id (autogenerado, clave primaria), name (obligatorio, único, tipo VARCHAR, nombre identificador de la tarea), description (opcional, tipo VARCHAR, descripción funcional de la tarea), nodes (obligatorio, tipo INTEGER, número máximo de nodos que deben ejecutar esta tarea simultáneamente) y minNodes (obligatorio, tipo INTEGER, número mínimo de nodos con estado ALIVE requeridos en el cluster para permitir la ejecución de esta tarea).
2. THE SPA SHALL crear el esquema de la tabla CLUSTER_TASK mediante una migración Liquibase versionada.
3. THE SPA SHALL definir una restricción de unicidad sobre el campo name de la tabla CLUSTER_TASK, garantizando que cada nombre de tarea sea único en el sistema.
4. THE SPA SHALL garantizar que el campo nodes contenga un valor mayor o igual a 1, representando al menos un nodo ejecutor permitido.
5. THE SPA SHALL garantizar que el campo minNodes contenga un valor mayor o igual a 1, representando al menos un nodo ALIVE requerido para permitir la ejecución.
6. THE SPA SHALL utilizar el campo nodes para gobernar el escalado horizontal por tarea: cuando nodes es 1, solo un nodo ejecuta la tarea; cuando nodes es mayor a 1, múltiples nodos pueden ejecutar la tarea concurrentemente con protección de lock.
7. THE SPA SHALL utilizar el campo minNodes como condición de arranque: una tarea no se ejecuta si el número de nodos ALIVE en el cluster es inferior al valor de minNodes definido para dicha tarea.

### Requirement 37: Modelo de datos de asignación de tareas del cluster (ClusterJob)

**User Story:** As a desarrollador, I want un modelo de datos de asignación de tareas a nodos bien definido en la base de datos, so that pueda configurar qué nodos están autorizados a ejecutar cada tarea, con qué prioridad y si están habilitados.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de asignación de tareas del cluster (CLUSTER_JOB) con clave primaria compuesta (ClusterJobPK) formada por: clusterNode (obligatorio, clave foránea a la tabla CLUSTER_NODE) y clusterTask (obligatorio, clave foránea a la tabla CLUSTER_TASK). Campos adicionales: priority (obligatorio, tipo INTEGER, prioridad de ejecución del nodo para esta tarea, donde un valor menor indica mayor prioridad) y enabled (obligatorio, tipo BOOLEAN, indica si la asignación está activa y el nodo puede ejecutar la tarea).
2. THE SPA SHALL crear el esquema de la tabla CLUSTER_JOB mediante una migración Liquibase versionada, incluyendo las restricciones de clave foránea hacia CLUSTER_NODE y CLUSTER_TASK.
3. THE SPA SHALL definir la clave primaria compuesta de CLUSTER_JOB sobre los campos clusterNode y clusterTask, garantizando que un nodo solo puede tener una asignación por tarea.
4. THE SPA SHALL utilizar el campo priority para definir el orden de preferencia entre nodos candidatos a ejecutar una misma tarea: el nodo con menor valor de priority tiene preferencia sobre los demás.
5. THE SPA SHALL utilizar el campo enabled como condición necesaria para que un nodo pueda ejecutar una tarea: un nodo con enabled = false no ejecuta la tarea independientemente de su prioridad.
6. WHEN se elimina un registro de CLUSTER_NODE referenciado por registros de CLUSTER_JOB, THE SPA SHALL aplicar la política de integridad referencial definida (CASCADE o restricción), impidiendo inconsistencias en la matriz de asignación.
7. WHEN se elimina un registro de CLUSTER_TASK referenciado por registros de CLUSTER_JOB, THE SPA SHALL aplicar la política de integridad referencial definida (CASCADE o restricción), impidiendo inconsistencias en la matriz de asignación.

### Requirement 38: Gobierno de ejecución de tareas clusterizadas (AbstractClusterWorker)

**User Story:** As a desarrollador, I want un mecanismo de gobierno que determine si el nodo actual debe ejecutar una tarea clusterizada basándose en la configuración de tareas, la autorización del nodo, la disponibilidad del cluster y la prioridad, so that las tareas se distribuyan de forma controlada y solo se ejecuten cuando las condiciones del cluster lo permiten.

#### Acceptance Criteria

1. WHEN una tarea clusterizada se activa en el nodo actual, THE AbstractClusterWorker SHALL obtener la configuración de la tarea (ClusterTask) por su nombre desde la tabla CLUSTER_TASK. Si no existe una definición única para el nombre de tarea, la ejecución se aborta.
2. WHEN la configuración de la tarea ha sido obtenida, THE AbstractClusterWorker SHALL verificar que el nodo actual tiene una asignación habilitada (enabled = true) en la tabla CLUSTER_JOB para dicha tarea. Si el nodo no está autorizado o no está habilitado, la ejecución se aborta.
3. WHEN el nodo está autorizado para la tarea, THE AbstractClusterWorker SHALL verificar que el número de nodos con estado ALIVE en el cluster es mayor o igual al campo minNodes definido en la configuración de la tarea. Si no se cumple esta condición, la ejecución se aborta.
4. WHEN las condiciones de disponibilidad se cumplen, THE AbstractClusterWorker SHALL calcular si el nodo actual debe ejecutar la tarea basándose en: el número de nodos configurados para la tarea (campo nodes de ClusterTask), la prioridad del nodo actual en CLUSTER_JOB, el estado ALIVE de los nodos con mayor prioridad (menor valor de priority) y el campo enabled de dichos nodos.
5. WHEN el AbstractClusterWorker determina que el nodo actual debe ejecutar la tarea, THE AbstractClusterWorker SHALL invocar el método handleExecute de la implementación concreta de la tarea.
6. WHILE la configuración de la tarea permite ejecución en múltiples nodos simultáneamente (nodes > 1), THE AbstractClusterWorker SHALL proteger la ejecución adquiriendo un lock por nombre de tarea antes de invocar handleExecute, garantizando la coordinación entre nodos concurrentes.
7. WHEN la ejecución de handleExecute finaliza (con éxito o con error), THE AbstractClusterWorker SHALL liberar el lock adquirido por nombre de tarea.
8. THE AbstractClusterWorker SHALL ignorar nodos con estado DEAD al calcular los candidatos a ejecutar la tarea, considerando únicamente nodos con estado ALIVE y enabled = true en CLUSTER_JOB.

### Requirement 39: Servicio de locks del cluster (ClusterLockService)

**User Story:** As a desarrollador, I want un servicio centralizado de locks del cluster que proporcione exclusión mutua tanto a nivel intra-instancia como inter-instancia, so that las tareas clusterizadas y los recursos compartidos se protejan contra ejecución concurrente entre hilos y entre nodos.

#### Acceptance Criteria

1. THE ClusterLockService SHALL exponer una operación para adquirir un lock identificado por nombre (nombre de tarea o nombre de recurso), bloqueando el acceso concurrente al recurso protegido.
2. THE ClusterLockService SHALL exponer una operación para liberar un lock identificado por nombre, actualizando las métricas de bloqueo en la tabla ClusterBlock (tiempo medio, tiempo mínimo, tiempo máximo, total de bloqueos y fecha de inicio).
3. THE ClusterLockService SHALL exponer una operación para verificar si existen locks activos para un nombre de recurso dado.
4. THE ClusterLockService SHALL implementar exclusión mutua intra-instancia (entre hilos del mismo nodo) utilizando el mecanismo synchronized de Java, garantizando que un solo hilo por instancia accede al recurso protegido.
5. THE ClusterLockService SHALL implementar exclusión mutua inter-instancia (entre nodos del cluster) utilizando un mecanismo de lock basado en SQL específico del dialecto de base de datos, garantizando que un solo nodo ejecuta la sección protegida.
6. THE ClusterLockService SHALL utilizar la hora de la base de datos (no la hora local de la JVM) para registrar los tiempos de bloqueo, evitando problemas de clock drift entre nodos del cluster.
7. WHEN se libera un lock, THE ClusterLockService SHALL actualizar el registro correspondiente en la tabla ClusterBlock con: el tiempo transcurrido desde la adquisición, recalculando el tiempo medio, actualizando el tiempo mínimo y máximo si corresponde, e incrementando el contador total de bloqueos.
8. IF un lock no puede ser adquirido porque otro nodo o hilo lo tiene activo, THEN THE ClusterLockService SHALL bloquear la ejecución del hilo solicitante hasta que el lock sea liberado o aplicar la política de timeout definida.


### Requirement 40: Convención de DTO y Criteria para entidades del dominio

**User Story:** As a desarrollador, I want que todas las entidades del dominio sigan una convención uniforme de DTO para transferencia de datos y Criteria para filtrado en consultas paginadas, so that se elimine la proliferación de objetos Request específicos y se mantenga una API de servicios consistente y predecible.

#### Acceptance Criteria

1. THE SPA SHALL definir una clase DTO (Data Transfer Object) para cada entidad del dominio: UserDTO, ProfileDTO, ActionDTO, ParameterDTO, ReportDTO, AuditLogDTO, InterfaceDTO, InterfaceLogDTO, ClusterNodeDTO, ClusterBlockDTO, ClusterTaskDTO y ClusterJobDTO.
2. THE SPA SHALL definir una clase Criteria para cada entidad que soporte consultas paginadas con filtros: UserCriteria, ProfileCriteria, ActionCriteria, ParameterCriteria, AuditCriteria, InterfaceLogCriteria, ClusterBlockCriteria.
3. WHEN se invoca el método create de un servicio, THE SPA SHALL aceptar el DTO de la entidad correspondiente con el campo de clave primaria (id) establecido a null. El sistema genera el identificador del registro de forma automática.
4. WHEN se invoca el método update de un servicio, THE SPA SHALL aceptar el DTO de la entidad correspondiente con el campo de clave primaria (id) poblado, identificando el registro a actualizar.
5. THE SPA SHALL prohibir la creación de objetos de tipo CreateXxxRequest o UpdateXxxRequest cuando existe un DTO correspondiente para la entidad. Los DTOs se utilizan directamente para operaciones de creación (id=null) y actualización (id poblado).
6. THE SPA SHALL permitir la creación de objetos Request únicamente cuando no existe una entidad de dominio correspondiente (por ejemplo, LoginRequest para autenticación, donde no existe una entidad Login).
7. THE SPA SHALL permitir la creación de objetos Response dedicados cuando la respuesta no corresponde directamente a una entidad del dominio (por ejemplo, TokenResponse para la respuesta de autenticación).
8. THE SPA SHALL utilizar los objetos Criteria como parámetro de entrada en los métodos findByCriteria(criteria, pageable) y countByCriteria(criteria) de cada servicio, encapsulando los filtros aplicables a las consultas paginadas.
