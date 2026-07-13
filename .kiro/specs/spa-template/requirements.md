# Requirements Document

## Introduction

Este documento define los requisitos para la aplicación SPA (Single Page Application) y PWA (Progressive Web App) que sirve como plantilla base para generar nuevos proyectos. La plantilla integra un backend Java/Spring Boot con un frontend Angular, proporcionando las funcionalidades transversales necesarias en toda aplicación empresarial: autenticación, autorización basada en perfiles y acciones, gestión de usuarios, navegación, un layout responsivo y adaptativo, soporte offline e instalabilidad en dispositivos, y una interfaz multi-idioma que se adapta automáticamente al Locale del usuario. La aplicación se organiza en dos módulos funcionales principales: Informes (generación, consulta y exportación de datos consolidados) y Administración (seguridad con usuarios, perfiles y acciones; parámetros generales; trazabilidad y auditoría; supervisión de interfaces; y gestión del cluster). El objetivo es que cualquier nuevo proyecto pueda partir de esta base con las piezas fundamentales ya resueltas.

## Glossary

- **SPA**: Single Page Application — aplicación web que se ejecuta en una sola página y actualiza el contenido dinámicamente sin recargar el navegador.
- **PWA**: Progressive Web App — aplicación web que utiliza tecnologías modernas (Service Worker, Web App Manifest) para ofrecer una experiencia similar a una aplicación nativa, incluyendo instalación en el dispositivo y funcionamiento offline.
- **ServiceWorker**: Script que el navegador ejecuta en segundo plano, separado de la página web, que permite funcionalidades como caché de recursos, sincronización en segundo plano y notificaciones push.
- **WebAppManifest**: Fichero JSON (manifest.json) que proporciona al navegador información sobre la aplicación (nombre, iconos, colores, modo de visualización) para permitir su instalación en el dispositivo.
- **RWD**: Responsive Web Design — enfoque de diseño web que utiliza media queries, grids fluidos y unidades relativas para que la interfaz se adapte al tamaño de la ventana del navegador.
- **AdaptiveDesign**: Enfoque de diseño que adapta el contenido, la navegación y la experiencia del usuario en función del tipo de dispositivo (escritorio, tablet, móvil), ofreciendo layouts y comportamientos optimizados para cada contexto.
- **Locale**: Identificador que combina el idioma y la región del usuario (p. ej. es-ES, en-US), utilizado para determinar el idioma de la interfaz.
- **Dashboard**: Página principal de la aplicación tras el login, que muestra un resumen de la información relevante para el usuario autenticado.
- **AuthModule**: Módulo del frontend responsable de gestionar la autenticación (login, logout, refresh de tokens).
- **AuthService**: Servicio del backend que gestiona la autenticación de usuarios y la emisión de tokens JWT.
- **UserService**: Servicio del backend que gestiona las operaciones CRUD sobre los usuarios del sistema.
- **ProfileService**: Servicio del backend que gestiona las operaciones CRUD sobre los perfiles (roles) del sistema, incluyendo la asignación de acciones a cada perfil.
- **ActionService**: Servicio del backend que gestiona la consulta y edición de las acciones (permisos) del sistema. Las acciones no pueden ser creadas ni eliminadas por los usuarios.
- **ReportService**: Servicio del backend que gestiona la generación, consulta y exportación de informes de la aplicación.
- **ParameterService**: Servicio del backend que gestiona los parámetros generales de operación de la aplicación.
- **AuditService**: Servicio del backend que gestiona el registro y consulta de la trazabilidad y auditoría del sistema (logs de actividad y errores).
- **InterfaceService**: Servicio del backend que gestiona la consulta y supervisión del estado, definición y trazabilidad de las interfaces y servicios integrados. Expone únicamente operaciones de lectura.
- **ClusterService**: Servicio del backend que gestiona la consulta y edición de los nodos del cluster y la consulta de bloqueos en entornos de alta disponibilidad. Los nodos no pueden ser eliminados y los bloqueos solo pueden ser consultados.
- **LayoutComponent**: Componente Angular que define la estructura visual de la aplicación (header, sidebar, content area, footer).
- **Guard**: Mecanismo de Angular que protege rutas comprobando el estado de autenticación o los permisos del usuario.
- **Interceptor**: Componente de Angular que intercepta las peticiones HTTP para adjuntar el token JWT y gestionar errores de autenticación.
- **Profile**: Conjunto nombrado de acciones (permisos) que se asigna a los usuarios para determinar su nivel de acceso dentro del sistema. Equivale al concepto de "rol" con acciones granulares asociadas.
- **Action**: Permiso individual y granular que autoriza el acceso a una funcionalidad específica del sistema. Las acciones se agrupan en perfiles.
- **JWT**: JSON Web Token — estándar para transmitir información de autenticación de forma segura entre el frontend y el backend.
- **Report**: Documento generado a partir de datos de la aplicación, que presenta información consolidada y estructurada para análisis, supervisión y toma de decisiones.
- **Parameter**: Valor de configuración general que controla el comportamiento operativo de la aplicación y puede ser modificado por un administrador sin necesidad de despliegue.
- **AuditLog**: Registro cronológico de las actividades y errores del sistema que permite la trazabilidad de las operaciones realizadas por los usuarios.
- **Interface**: Punto de integración entre la aplicación y un servicio externo, cuyo estado y actividad puede ser supervisado por los administradores.
- **Node**: Instancia individual de la aplicación en un entorno de alta disponibilidad (cluster).
- **Lock**: Mecanismo de bloqueo utilizado para coordinar el acceso exclusivo a recursos compartidos entre los nodos del cluster.

## Requirements

### Requirement 1: Login de usuario

**User Story:** As a usuario, I want autenticarme en la aplicación con mis credenciales, so that pueda acceder a las funcionalidades protegidas.

#### Acceptance Criteria

1. WHEN el usuario envía credenciales válidas (email y contraseña), THE AuthService SHALL autenticar al usuario y devolver un access token JWT y un refresh token.
2. WHEN el usuario envía credenciales inválidas, THE AuthService SHALL devolver un error 401 Unauthorized con un mensaje descriptivo.
3. WHEN el AuthModule recibe un access token válido, THE AuthModule SHALL almacenar el token en memoria y redirigir al usuario al Dashboard.
4. WHILE el usuario no está autenticado, THE Guard SHALL redirigir cualquier intento de acceso a rutas protegidas hacia la página de login.

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

1. THE UserService SHALL exponer un endpoint para crear un nuevo usuario con los datos: nombre, email, contraseña y perfil asignado.
2. THE UserService SHALL exponer un endpoint para obtener la lista de usuarios con soporte de paginación y filtros por nombre, email y perfil.
3. THE UserService SHALL exponer un endpoint para obtener los datos de un usuario concreto por su identificador.
4. THE UserService SHALL exponer un endpoint para actualizar los datos de un usuario existente (nombre, email, perfil asignado).
5. THE UserService SHALL exponer un endpoint para eliminar un usuario existente.
6. WHEN se intenta crear un usuario con un email que ya existe, THE UserService SHALL devolver un error 409 Conflict.
7. WHEN se intenta acceder a un usuario que no existe, THE UserService SHALL devolver un error 404 Not Found.

### Requirement 5: Autorización basada en perfiles y acciones

**User Story:** As a administrador, I want que el sistema restrinja el acceso a funcionalidades según el perfil y las acciones asignadas al usuario, so that cada usuario solo acceda a lo que le corresponde.

#### Acceptance Criteria

1. THE AuthService SHALL incluir el perfil y las acciones del usuario en el payload del token JWT.
2. WHILE el usuario tiene un perfil con acciones de administración, THE SPA SHALL mostrar todas las opciones de navegación incluyendo el módulo de Administración.
3. WHILE el usuario tiene un perfil sin acciones de administración, THE SPA SHALL mostrar únicamente las opciones de navegación correspondientes a las acciones asignadas a su perfil.
4. WHEN un usuario sin la acción requerida intenta acceder a un recurso protegido, THE AuthService SHALL devolver un error 403 Forbidden.
5. WHEN un usuario sin la acción requerida intenta navegar a una ruta restringida en el frontend, THE Guard SHALL redirigir al usuario al Dashboard.
6. THE SPA SHALL evaluar las acciones del usuario para determinar la visibilidad de cada elemento de navegación y funcionalidad en la interfaz.

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
   - Informes
   - Administración
     - Seguridad
       - Usuarios
       - Perfiles
       - Acciones
     - Parámetros
     - Auditoría
     - Interfaces
     - Cluster
       - Nodos
       - Bloqueos
6. THE SPA SHALL presentar los elementos del menú con capacidad de expandir y colapsar los sub-niveles (Administración, Seguridad, Cluster).
7. WHILE el usuario no tiene la acción requerida para acceder a una sección del menú, THE SPA SHALL ocultar dicha sección del menú de navegación.

### Requirement 8: Modelo de datos de usuario

**User Story:** As a desarrollador, I want un modelo de datos de usuario bien definido en la base de datos, so that pueda gestionar la información de los usuarios de forma consistente.

#### Acceptance Criteria

1. THE SPA SHALL gestionar la tabla de usuarios con los siguientes campos: identificador (autogenerado), nombre, email (único), contraseña (hash BCrypt), perfil asignado (referencia a la tabla de perfiles), fecha de creación y fecha de última modificación.
2. THE SPA SHALL crear el esquema de la tabla de usuarios mediante una migración Liquibase versionada.
3. WHEN se crea un nuevo usuario, THE UserService SHALL almacenar la contraseña utilizando el algoritmo BCrypt con un strength mínimo de 12.

### Requirement 9: Página de perfil del usuario

**User Story:** As a usuario autenticado, I want consultar y modificar mis datos de perfil, so that pueda mantener mi información actualizada.

#### Acceptance Criteria

1. THE SPA SHALL mostrar una página de perfil accesible para cualquier usuario autenticado con sus datos: nombre y email.
2. WHEN el usuario modifica sus datos de perfil y confirma, THE UserService SHALL actualizar los datos del usuario en la base de datos.
3. WHEN el usuario intenta modificar su email a uno que ya existe en el sistema, THE UserService SHALL devolver un error 409 Conflict.

### Requirement 10: Configuración por entorno

**User Story:** As a desarrollador, I want que la aplicación soporte múltiples entornos de configuración, so that pueda desplegar la misma aplicación en local, desarrollo, integración, QA y producción con configuraciones específicas.

#### Acceptance Criteria

1. THE SPA SHALL externalizar toda la configuración específica de entorno (URL de API, timeouts, parámetros de seguridad) en ficheros de propiedades por entorno.
2. THE SPA SHALL soportar los perfiles de compilación Maven (local, dist, test) para generar artefactos específicos según el entorno de destino.
3. THE SPA SHALL utilizar los ficheros `environment.ts` de Angular para configurar variables específicas del frontend por entorno (desarrollo y producción como mínimo).

### Requirement 11: Notificaciones al usuario

**User Story:** As a usuario, I want recibir feedback visual sobre el resultado de mis acciones, so that sepa si una operación se completó correctamente o hubo un error.

#### Acceptance Criteria

1. WHEN una operación se completa exitosamente (crear, actualizar, eliminar), THE SPA SHALL mostrar una notificación de tipo éxito visible durante 5 segundos.
2. WHEN una operación falla, THE SPA SHALL mostrar una notificación de tipo error con el mensaje descriptivo del error visible durante 8 segundos.
3. THE SPA SHALL permitir al usuario cerrar manualmente cualquier notificación antes de que expire.

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

1. THE ProfileService SHALL exponer un endpoint para crear un nuevo perfil con los datos: nombre, descripción y lista de acciones asignadas.
2. THE ProfileService SHALL exponer un endpoint para obtener la lista de perfiles con soporte de paginación y filtros por nombre y estado.
3. THE ProfileService SHALL exponer un endpoint para obtener los datos de un perfil concreto por su identificador, incluyendo la lista de acciones asignadas.
4. THE ProfileService SHALL exponer un endpoint para actualizar los datos de un perfil existente (nombre, descripción, lista de acciones asignadas).
5. THE ProfileService SHALL exponer un endpoint para eliminar un perfil existente.
6. WHEN se intenta crear un perfil con un nombre que ya existe, THE ProfileService SHALL devolver un error 409 Conflict.
7. WHEN se intenta eliminar un perfil que tiene usuarios asignados, THE ProfileService SHALL devolver un error 409 Conflict con un mensaje indicando que el perfil está en uso.
8. WHEN se intenta acceder a un perfil que no existe, THE ProfileService SHALL devolver un error 404 Not Found.

### Requirement 15: Consulta y edición de acciones

**User Story:** As a administrador, I want consultar y editar las acciones (permisos) del sistema, so that pueda revisar y actualizar la información descriptiva de los permisos granulares que controlan el acceso a cada funcionalidad.

#### Acceptance Criteria

1. THE ActionService SHALL exponer un endpoint para obtener la lista de acciones con soporte de paginación y filtros por código y nombre.
2. THE ActionService SHALL exponer un endpoint para obtener los datos de una acción concreta por su identificador.
3. THE ActionService SHALL exponer un endpoint para actualizar los datos de una acción existente (nombre, descripción).
4. WHEN se intenta acceder a una acción que no existe, THE ActionService SHALL devolver un error 404 Not Found.
5. THE ActionService SHALL rechazar cualquier solicitud de eliminación de acciones, devolviendo un error 405 Method Not Allowed.

### Requirement 16: Generación y consulta de informes

**User Story:** As a usuario autenticado, I want generar y consultar informes de la aplicación, so that pueda obtener datos consolidados y estructurados para análisis, supervisión y toma de decisiones.

#### Acceptance Criteria

1. THE ReportService SHALL exponer un endpoint para obtener la lista de informes disponibles para el usuario autenticado, filtrados según las acciones de su perfil.
2. THE ReportService SHALL exponer un endpoint para generar un informe específico aceptando parámetros de filtro (rango de fechas, criterios de búsqueda específicos del informe).
3. WHEN el usuario solicita generar un informe, THE ReportService SHALL aplicar los filtros proporcionados y devolver los datos del informe en formato estructurado.
4. THE SPA SHALL presentar los datos del informe en pantalla en formato tabular con soporte de paginación y ordenación por columnas.
5. WHEN el usuario solicita generar un informe sin proporcionar filtros obligatorios, THE ReportService SHALL devolver un error 400 Bad Request indicando los filtros requeridos.
6. WHEN el usuario no tiene la acción requerida para acceder a un informe, THE ReportService SHALL devolver un error 403 Forbidden.

### Requirement 17: Exportación de informes

**User Story:** As a usuario autenticado, I want exportar los informes en diferentes formatos, so that pueda descargar y compartir la información fuera de la aplicación.

#### Acceptance Criteria

1. THE ReportService SHALL exponer un endpoint para exportar un informe generado en formato PDF.
2. THE ReportService SHALL exponer un endpoint para exportar un informe generado en formato CSV.
3. THE ReportService SHALL exponer un endpoint para exportar un informe generado en formato Excel (XLSX).
4. WHEN el usuario solicita exportar un informe, THE ReportService SHALL aplicar los mismos filtros utilizados en la generación del informe en pantalla.
5. WHEN la exportación se completa, THE SPA SHALL iniciar la descarga del fichero en el navegador del usuario.
6. IF la generación del fichero de exportación falla, THEN THE ReportService SHALL devolver un error 500 Internal Server Error con un mensaje descriptivo.

### Requirement 18: Gestión de parámetros generales

**User Story:** As a administrador, I want definir y modificar los parámetros generales de operación de la aplicación, so that pueda ajustar el comportamiento del sistema sin necesidad de despliegue.

#### Acceptance Criteria

1. THE ParameterService SHALL exponer un endpoint para obtener la lista de parámetros del sistema con soporte de paginación y filtros por clave y categoría.
2. THE ParameterService SHALL exponer un endpoint para obtener el valor de un parámetro concreto por su clave.
3. THE ParameterService SHALL exponer un endpoint para actualizar el valor de un parámetro existente.
4. WHEN se intenta actualizar un parámetro con un valor que no cumple las restricciones de validación definidas para ese parámetro, THE ParameterService SHALL devolver un error 400 Bad Request con un mensaje indicando la restricción incumplida.
5. WHEN se intenta acceder a un parámetro que no existe, THE ParameterService SHALL devolver un error 404 Not Found.
6. THE ParameterService SHALL registrar en el AuditLog cada modificación de un parámetro, incluyendo el valor anterior, el valor nuevo y el usuario que realizó el cambio.

### Requirement 19: Trazabilidad y auditoría del sistema (solo lectura)

**User Story:** As a administrador, I want consultar los registros de actividad y errores del sistema, so that pueda supervisar el comportamiento de la aplicación, investigar incidencias y garantizar la trazabilidad de las operaciones.

#### Acceptance Criteria

1. THE AuditService SHALL registrar automáticamente cada operación relevante del sistema (login, logout, creación, modificación y eliminación de entidades) con los datos: fecha y hora, usuario, acción realizada, entidad afectada y resultado (éxito o error).
2. THE AuditService SHALL exponer un endpoint para consultar los logs de actividad con soporte de paginación y filtros por rango de fechas, usuario, tipo de acción y entidad.
3. THE AuditService SHALL exponer un endpoint para consultar los logs de errores con soporte de paginación y filtros por rango de fechas, severidad y componente.
4. THE SPA SHALL presentar los logs de auditoría en formato tabular con soporte de paginación, ordenación y búsqueda, en modo solo lectura.
5. THE AuditService SHALL garantizar que los registros de auditoría sean inmutables (no se pueden modificar ni eliminar a través de la API).
6. WHEN el volumen de datos del log supera el período de retención configurado, THE AuditService SHALL archivar los registros antiguos según la política de retención definida en los parámetros del sistema.
7. THE AuditService SHALL exponer únicamente endpoints de consulta (GET). La creación, modificación y eliminación de registros de auditoría no está disponible a través de la API de usuario; el registro se realiza de forma automática por el sistema.

### Requirement 20: Supervisión de interfaces y servicios integrados (solo lectura)

**User Story:** As a administrador, I want consultar el estado de las interfaces y servicios integrados con la aplicación, so that pueda detectar problemas de conectividad y garantizar la disponibilidad de las integraciones.

#### Acceptance Criteria

1. THE InterfaceService SHALL exponer un endpoint para obtener la lista de interfaces registradas en el sistema con su estado actual (activa, inactiva, en error).
2. THE InterfaceService SHALL exponer un endpoint para obtener la definición detallada de una interfaz concreta (nombre, descripción, URL del servicio, protocolo, frecuencia de verificación).
3. THE InterfaceService SHALL exponer un endpoint para consultar la trazabilidad de una interfaz específica: logs de actividad con soporte de paginación y filtros por rango de fechas y resultado (éxito, error).
4. THE SPA SHALL presentar un panel de supervisión de interfaces mostrando el estado consolidado de todas las interfaces con indicadores visuales (verde para activa, rojo para error, gris para inactiva).
5. WHEN una interfaz cambia de estado, THE InterfaceService SHALL registrar el cambio en el AuditLog con la fecha, el estado anterior y el estado nuevo.
6. WHEN se intenta acceder a una interfaz que no existe, THE InterfaceService SHALL devolver un error 404 Not Found.
7. THE InterfaceService SHALL exponer únicamente endpoints de consulta (GET). La creación, modificación y eliminación de interfaces no está disponible a través de la API de usuario.

### Requirement 21: Consulta y edición de nodos del cluster

**User Story:** As a administrador, I want consultar y editar la configuración de los nodos del cluster, so that pueda supervisar el estado de las instancias y ajustar su configuración para garantizar la alta disponibilidad de la aplicación.

#### Acceptance Criteria

1. THE ClusterService SHALL exponer un endpoint para obtener la lista de nodos del cluster con su estado actual (activo, inactivo, en mantenimiento) y datos de último heartbeat.
2. THE ClusterService SHALL exponer un endpoint para obtener los datos detallados de un nodo concreto (identificador, nombre, dirección IP, puerto, estado, fecha de registro, fecha de último heartbeat).
3. THE ClusterService SHALL exponer un endpoint para actualizar la configuración de un nodo existente (nombre, estado).
4. THE SPA SHALL presentar un panel de supervisión de nodos mostrando el estado consolidado de todas las instancias con indicadores visuales de disponibilidad.
5. WHEN un nodo no envía heartbeat dentro del intervalo configurado, THE ClusterService SHALL marcar el nodo como inactivo y registrar el evento en el AuditLog.
6. WHEN se intenta acceder a un nodo que no existe, THE ClusterService SHALL devolver un error 404 Not Found.
7. THE ClusterService SHALL rechazar cualquier solicitud de eliminación de nodos, devolviendo un error 405 Method Not Allowed.

### Requirement 22: Consulta de bloqueos del cluster (solo lectura)

**User Story:** As a administrador, I want consultar los bloqueos activos en el cluster, so that pueda supervisar la coordinación entre nodos y verificar el estado de los recursos compartidos.

#### Acceptance Criteria

1. THE ClusterService SHALL exponer un endpoint para obtener la lista de bloqueos activos con soporte de paginación y filtros por nodo propietario y recurso bloqueado.
2. THE ClusterService SHALL exponer un endpoint para obtener los datos detallados de un bloqueo concreto (identificador, recurso bloqueado, nodo propietario, fecha de adquisición, fecha de expiración).
3. THE SPA SHALL presentar la lista de bloqueos activos en modo solo lectura, sin opciones de liberación manual ni modificación.
4. WHEN se intenta acceder a un bloqueo que no existe o ya ha expirado, THE ClusterService SHALL devolver un error 404 Not Found.
5. THE ClusterService SHALL exponer únicamente endpoints de consulta (GET) para los bloqueos. La liberación manual de bloqueos no está disponible a través de la API de usuario.

### Requirement 23: Comportamiento estándar de vistas de listado

**User Story:** As a usuario autenticado, I want que todas las vistas que presenten listas o tablas de datos en la aplicación sigan un comportamiento consistente, so that pueda paginar, filtrar, exportar y gestionar los registros de forma uniforme.

#### Acceptance Criteria

1. THE SPA SHALL presentar toda tabla o lista de datos con soporte de paginación del lado del servidor.
2. THE SPA SHALL proporcionar filtros de búsqueda por cada uno de los campos visibles en la tabla, permitiendo al usuario refinar los resultados mostrados.
3. THE SPA SHALL incluir en cada vista de listado un botón de exportación a CSV que descargue todos los registros que coincidan con los filtros aplicados.
4. WHEN el usuario pulsa el botón de exportación a CSV, THE SPA SHALL generar y descargar un fichero CSV con las columnas visibles y los datos filtrados.
5. WHILE el usuario tiene la acción de creación asignada en su perfil, THE SPA SHALL mostrar un botón "Crear" en las vistas de listado de entidades que soporten creación (usuarios, perfiles, parámetros).
6. WHILE el usuario tiene la acción de edición asignada en su perfil, THE SPA SHALL mostrar una opción "Editar" en cada fila del listado de entidades que soporten edición (usuarios, perfiles, parámetros, acciones, nodos del cluster).
7. WHILE el usuario tiene la acción de eliminación asignada en su perfil, THE SPA SHALL mostrar una opción "Borrar" en cada fila del listado de entidades que soporten eliminación (usuarios, perfiles), solicitando confirmación antes de ejecutar la acción.
8. THE SPA SHALL mostrar una opción "Ver Detalle" en cada fila del listado que permita consultar la información completa del registro.
9. WHILE el usuario no tiene la acción requerida para crear, editar o borrar registros, THE SPA SHALL ocultar las opciones correspondientes y presentar la vista de listado en modo solo lectura.
10. THE SPA SHALL presentar las vistas de listado de Acciones y Nodos del cluster únicamente con las opciones "Ver Detalle" y "Editar" (sin botón "Crear" ni opción "Borrar").
11. THE SPA SHALL presentar las vistas de listado de Bloqueos del cluster, Trazabilidad/Auditoría e Interfaces únicamente con la opción "Ver Detalle" (sin opciones de Crear, Editar ni Borrar).
