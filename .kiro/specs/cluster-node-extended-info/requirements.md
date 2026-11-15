# Requirements Document

## Introduction

Esta funcionalidad amplía la información de la entidad `ClusterNode` (tabla `cluster_node`) con tres nuevos atributos que describen los recursos y la configuración del nodo: número de procesadores, espacio del sistema de ficheros (Filesystem) y propiedades de la JVM y del entorno.

Estado actual investigado:

- `ClusterNode` (módulo `domain`) contiene `id`, `status`, `hostname`, `ip`, `master`, `usedMemory`, `freeMemory`, `totalMemory`, `startedAt` y `lastModifiedAt`. `ClusterNodeDTO` es un `record` con los mismos campos.
- `ClusterService` (módulo `core`) rellena los datos del nodo local en `registerNode()` (alta o re-registro al arrancar) y `heartbeat()` (cada 30 s, invocado por `HeartbeatWorker` del módulo `cluster`). La conversión a DTO se hace en `toNodeDTO`.
- `ClusterController` (módulo `webapp`) expone `GET /nodes` (lista) y `GET /nodes/{id}` (detalle), ambos devolviendo `ClusterNodeDTO`.
- El dashboard Angular usa la interfaz `ClusterNode` (`core/models/cluster.model.ts`), la pantalla de lista `node-list` y el formulario de solo lectura `node-form` en `features/cluster/pages`. Los textos están en `assets/i18n/es.json` y `en.json`.
- El esquema se versiona con Liquibase XML en `domain/src/main/resources/db/changelog`, con la tabla creada en `20250112-create-cluster-node-table.xml` y datos semilla locales en `20250118-seed-local-cluster-node.xml`.

Los nuevos atributos se muestran únicamente en el formulario de detalle del nodo y no en la lista de nodos.

Política de actualización: el número de procesadores y las propiedades de la JVM y del entorno se calculan y persisten únicamente al registrar el nodo (`registerNode()`), que ocurre al arrancar la instancia. El Heartbeat conserva los valores almacenados sin recalcularlos. El espacio del Filesystem se actualiza tanto en el registro como en cada Heartbeat.

## Glossary

- **Cluster_Node**: Entidad JPA `ClusterNode` que representa un nodo del clúster, persistida en la tabla `cluster_node`.
- **Cluster_Node_DTO**: Objeto de transferencia `ClusterNodeDTO` que expone los datos de un Cluster_Node por la API REST.
- **Cluster_Service**: Servicio `ClusterService` del módulo `core` que registra el nodo local, actualiza su latido y convierte entidades a DTO.
- **Heartbeat**: Ciclo periódico ejecutado por `HeartbeatWorker` que invoca `heartbeat()` sobre el Cluster_Service.
- **Cluster_Controller**: Controlador REST `ClusterController` del módulo `webapp` que expone los endpoints `/nodes`.
- **Node_List_Endpoint**: Endpoint `GET /nodes` que devuelve todos los nodos.
- **Node_Detail_Endpoint**: Endpoint `GET /nodes/{id}` que devuelve un nodo concreto.
- **Node_Form**: Pantalla de detalle de solo lectura `node-form` del dashboard Angular.
- **Node_List**: Pantalla de lista `node-list` del dashboard Angular.
- **Schema_Migration**: Changelog Liquibase en formato XML ubicado en el módulo `domain`.
- **Processor_Count**: Número de procesadores disponibles para la JVM del nodo, obtenido con `Runtime.availableProcessors()`.
- **Filesystem_Space**: Espacio del sistema de ficheros del nodo, compuesto por espacio total, espacio libre y espacio utilizable, expresados en bytes.
- **JVM_Properties**: Conjunto de pares clave-valor de las propiedades de sistema de la JVM del nodo (`System.getProperties()`).
- **Environment_Properties**: Conjunto de pares clave-valor de las variables de entorno del nodo (`System.getenv()`).
- **Sensitive_Key**: Clave de propiedad cuyo nombre contiene, sin distinguir mayúsculas de minúsculas, alguna de las cadenas `password`, `passwd`, `secret`, `token`, `key`, `credential` o `jwt`.
- **Masked_Value**: Valor constante `******` que sustituye al valor real de una Sensitive_Key.

## Requirements

### Requirement 1: Persistencia del número de procesadores

**User Story:** As a administrador del sistema, I want conocer el número de procesadores de cada nodo, so that pueda evaluar la capacidad de cómputo del clúster.

#### Acceptance Criteria

1. THE Cluster_Node SHALL almacenar el Processor_Count como un entero positivo de 32 bits (valor mínimo 1) en la columna `processors` de la tabla `cluster_node`.
2. WHEN el Cluster_Service registra el nodo local al arrancar la instancia, THE Cluster_Service SHALL asignar al Cluster_Node el Processor_Count obtenido de `Runtime.availableProcessors()` y persistirlo en la misma operación de registro.
3. WHEN se ejecuta un Heartbeat, THE Cluster_Service SHALL conservar el Processor_Count almacenado del nodo local sin recalcularlo ni reescribirlo, de modo que el valor de la columna `processors` sea idéntico antes y después del Heartbeat.
4. WHEN el Cluster_Service consulta un Cluster_Node, THE Cluster_Node_DTO SHALL incluir el campo `processors` con el mismo valor entero que el Processor_Count persistido del nodo.
5. IF `Runtime.availableProcessors()` devuelve un valor menor que 1 durante el registro del nodo, THEN THE Cluster_Service SHALL conservar el último Processor_Count persistido del nodo, o, si el nodo aún no tiene valor, rechazar el registro con un error que indique que el número de procesadores no es válido, y no persistir ningún cambio en el Cluster_Node afectado.
6. IF el Cluster_Node existente en base de datos tiene la columna `processors` sin valor (nulo), THEN THE Cluster_Node_DTO SHALL incluir el campo `processors` con valor nulo, sin generar error, hasta que el siguiente registro del nodo local, que se produce al arrancar la instancia, persista un Processor_Count válido.

### Requirement 2: Persistencia del espacio del Filesystem

**User Story:** As a administrador del sistema, I want conocer el espacio de disco de cada nodo, so that pueda detectar nodos con riesgo de quedarse sin almacenamiento.

#### Acceptance Criteria

1. THE Cluster_Node SHALL almacenar el espacio total, el espacio libre y el espacio utilizable del Filesystem como enteros largos, en bytes, en las columnas `fs_total_space`, `fs_free_space` y `fs_usable_space` de la tabla `cluster_node`, aceptando valores nulos y valores en el rango de 0 a 9.223.372.036.854.775.807 (Long.MAX_VALUE).
2. WHEN el Cluster_Service registra el nodo local, THE Cluster_Service SHALL asignar al Cluster_Node los valores de `getTotalSpace()`, `getFreeSpace()` y `getUsableSpace()` de la partición que contiene el directorio de trabajo de la aplicación, y persistirlos en la misma operación de registro.
3. WHEN se ejecuta un Heartbeat, THE Cluster_Service SHALL actualizar los tres valores de Filesystem_Space del nodo local con las lecturas obtenidas en esa ejecución y persistirlos antes de que finalice el Heartbeat.
4. IF la lectura del Filesystem_Space produce una excepción durante el registro del nodo local, THEN THE Cluster_Service SHALL registrar un mensaje de nivel `WARN` que identifique el nodo y la causa de la excepción, asignar nulo a los tres valores y completar el registro sin propagar la excepción.
5. IF la lectura del Filesystem_Space produce una excepción durante un Heartbeat, THEN THE Cluster_Service SHALL registrar un mensaje de nivel `WARN` que identifique el nodo y la causa de la excepción, asignar nulo a los tres valores y completar el Heartbeat, incluida la actualización de la marca de actividad del nodo, sin propagar la excepción.
6. THE Cluster_Node_DTO SHALL incluir los campos `fsTotalSpace`, `fsFreeSpace` y `fsUsableSpace` de tipo entero largo con valor nulo permitido, con los mismos valores en bytes que el Cluster_Node, sin conversión de unidades.

### Requirement 3: Persistencia de las propiedades de la JVM y del entorno

**User Story:** As a administrador del sistema, I want consultar las propiedades de la JVM y las variables de entorno de cada nodo, so that pueda diagnosticar diferencias de configuración entre nodos.

#### Acceptance Criteria

1. THE Cluster_Node SHALL almacenar las JVM_Properties y las Environment_Properties como texto JSON de un objeto clave-valor, en las columnas `jvm_properties` y `environment_properties` de la tabla `cluster_node`, con capacidad para al menos 1 MiB (1.048.576 caracteres) de texto cada una.
2. WHEN el Cluster_Service registra el nodo local al arrancar la instancia, THE Cluster_Service SHALL asignar al Cluster_Node las JVM_Properties y las Environment_Properties del proceso actual, con todas las entradas de clave y valor de tipo texto.
3. WHEN el Cluster_Service registra un nodo ya existente con el mismo `hostname`, THE Cluster_Service SHALL sustituir íntegramente las JVM_Properties y las Environment_Properties almacenadas por las del proceso actual, sin conservar claves del valor anterior que no existan en el proceso actual.
4. WHEN se ejecuta un Heartbeat, THE Cluster_Service SHALL conservar las JVM_Properties y las Environment_Properties almacenadas sin recalcularlas ni reescribirlas, de modo que el contenido de ambas columnas sea idéntico antes y después del Heartbeat.
5. THE Cluster_Node_DTO SHALL incluir los campos `jvmProperties` y `environmentProperties` como mapas de clave de tipo texto a valor de tipo texto.
6. IF la serialización de las JVM_Properties o de las Environment_Properties a JSON produce una excepción, THEN THE Cluster_Service SHALL registrar un mensaje de nivel `WARN` que identifique la propiedad afectada (JVM_Properties o Environment_Properties), dejar en nulo únicamente la columna correspondiente, persistir el resto de los datos del Cluster_Node y completar el registro sin propagar la excepción.
7. IF el JSON serializado de las JVM_Properties o de las Environment_Properties supera 1 MiB (1.048.576 caracteres), THEN THE Cluster_Service SHALL registrar un mensaje de nivel `WARN` que identifique la propiedad afectada, dejar en nulo únicamente la columna correspondiente y completar el registro sin interrumpirlo.
8. WHEN se lee un Cluster_Node cuya columna `jvm_properties` o `environment_properties` es nula o contiene un JSON no válido, THE Cluster_Node_DTO SHALL devolver un mapa vacío en el campo correspondiente sin lanzar excepción.

### Requirement 4: Protección de valores sensibles

**User Story:** As a responsable de seguridad, I want que los secretos del entorno no se almacenen ni se expongan, so that la consulta de las propiedades del nodo no filtre credenciales.

#### Acceptance Criteria

1. WHEN el Cluster_Service construye las JVM_Properties o las Environment_Properties para su almacenamiento, THE Cluster_Service SHALL sustituir por el Masked_Value el valor de toda propiedad cuya clave contenga, sin distinguir mayúsculas de minúsculas, alguna de las subcadenas `password`, `passwd`, `secret`, `token`, `key`, `credential` o `jwt` (Sensitive_Key).
2. WHEN el Cluster_Service enmascara una propiedad, THE Cluster_Service SHALL conservar el nombre de su clave idéntico carácter a carácter, incluidas las mayúsculas y minúsculas originales.
3. WHEN el Cluster_Service enmascara un conjunto de propiedades, THE Cluster_Service SHALL conservar sin modificar el valor de toda propiedad cuya clave no sea una Sensitive_Key.
4. WHEN el Cluster_Service enmascara una propiedad cuyo valor es nulo o una cadena vacía y cuya clave es una Sensitive_Key, THE Cluster_Service SHALL sustituir el valor por el Masked_Value (`******`).
5. THE Cluster_Node SHALL almacenar únicamente propiedades enmascaradas, de modo que ningún valor original de una Sensitive_Key se persista en la base de datos.
6. IF el enmascaramiento de las JVM_Properties o de las Environment_Properties falla, THEN THE Cluster_Service SHALL abortar el almacenamiento de dicho conjunto, SHALL NOT persistir ningún valor original de una Sensitive_Key y SHALL registrar un error que indique el fallo sin incluir valores de propiedades.
7. FOR ALL conjuntos de propiedades, aplicar el enmascaramiento sobre un conjunto ya enmascarado SHALL producir un resultado idéntico al de aplicarlo una sola vez (idempotencia).
8. THE Cluster_Service SHALL conservar el mismo número de claves en un conjunto de propiedades antes y después del enmascaramiento, incluido el conjunto vacío (0 claves).

### Requirement 5: Exposición en la API REST solo en el detalle

**User Story:** As a desarrollador frontend, I want que los nuevos atributos solo viajen en el detalle del nodo, so that la lista de nodos se mantenga ligera y rápida.

#### Acceptance Criteria

1. WHEN se invoca el Node_Detail_Endpoint con el identificador de un nodo existente, THE Cluster_Controller SHALL devolver el Cluster_Node_DTO con `processors`, `fsTotalSpace`, `fsFreeSpace`, `fsUsableSpace`, `jvmProperties` y `environmentProperties` informados con los últimos valores almacenados para ese nodo, sin transformarlos.
2. WHEN se invoca el Node_List_Endpoint, THE Cluster_Controller SHALL devolver cada Cluster_Node_DTO con `jvmProperties` y `environmentProperties` en nulo.
3. WHEN se invoca el Node_List_Endpoint, THE Cluster_Controller SHALL devolver cada Cluster_Node_DTO con `processors`, `fsTotalSpace`, `fsFreeSpace` y `fsUsableSpace` en nulo.
4. IF se invoca el Node_Detail_Endpoint con un identificador inexistente, THEN THE Cluster_Controller SHALL responder con el mismo error de entidad no encontrada que devuelve antes del cambio, sin devolver ningún Cluster_Node_DTO y sin modificar los datos almacenados.
5. IF un nodo existente no tiene almacenado valor para alguno de los nuevos atributos, THEN THE Cluster_Controller SHALL devolver ese atributo en nulo en el Node_Detail_Endpoint y responder con éxito.
6. THE Cluster_Controller SHALL mantener sin cambios el nombre, el tipo y el valor de los campos existentes del Cluster_Node_DTO en el Node_Detail_Endpoint y en el Node_List_Endpoint.
7. IF la petición al Node_Detail_Endpoint no está autenticada o el usuario carece de la autorización exigida antes del cambio, THEN THE Cluster_Controller SHALL rechazar la petición con el mismo error de autenticación o autorización que devuelve antes del cambio, sin devolver datos del nodo.

### Requirement 6: Migración del esquema con Liquibase

**User Story:** As a desarrollador, I want que el cambio de esquema se aplique con Liquibase, so that todos los entornos queden sincronizados de forma versionada.

#### Acceptance Criteria

1. WHEN Liquibase ejecuta el changeset de la Schema_Migration sobre una base de datos en la que `cluster_node` no tiene ninguna de las seis columnas, THE Schema_Migration SHALL añadir a `cluster_node` las columnas `processors` (INTEGER), `fs_total_space` (BIGINT), `fs_free_space` (BIGINT), `fs_usable_space` (BIGINT), `jvm_properties` (TEXT) y `environment_properties` (TEXT), todas con valor NULL permitido y sin valor por defecto.
2. THE Schema_Migration SHALL residir en un único fichero XML nuevo dentro de `domain/src/main/resources/db/changelog/migrations/v1.0.0`, incluido en `db.changelog-master.xml` inmediatamente después de la inclusión del fichero que crea `cluster_node`.
3. THE Schema_Migration SHALL declarar `schemaName="${schemaName}"` en cada cambio que opere sobre `cluster_node`.
4. IF alguna de las seis columnas ya existe en `cluster_node` cuando se evalúa la precondición, THEN THE Schema_Migration SHALL omitir la creación de esa columna mediante `onFail="MARK_RAN"`, sin devolver error y sin alterar los datos ni la definición de la columna existente.
5. WHEN se ejecuta el bloque `rollback` de la Schema_Migration, THE Schema_Migration SHALL eliminar las seis columnas añadidas y dejar en `cluster_node` únicamente las columnas previas a la migración.
6. WHEN Liquibase aplica la Schema_Migration sobre una tabla `cluster_node` con N filas (N ≥ 0), THE Schema_Migration SHALL conservar las N filas con los valores previos de sus columnas sin cambios, y las seis columnas nuevas SHALL valer NULL en esas filas.
7. WHEN Liquibase aplica la Schema_Migration sobre PostgreSQL 18 y sobre la base de datos H2 usada en las pruebas, THE Schema_Migration SHALL finalizar sin errores y dejar las seis columnas con los tipos indicados en el criterio 1, o su equivalente nativo en cada motor.

### Requirement 7: Visualización en el formulario del dashboard

**User Story:** As a administrador del sistema, I want ver los nuevos datos en el formulario del nodo, so that pueda consultar sus recursos y su configuración.

#### Acceptance Criteria

1. WHEN el administrador abre el Node_Form de un nodo, THE Node_Form SHALL mostrar en modo solo lectura el número de procesadores del nodo como un número entero mayor o igual que 1.
2. WHEN el administrador abre el Node_Form de un nodo, THE Node_Form SHALL mostrar en modo solo lectura el espacio total y el espacio libre del Filesystem en GB con exactamente dos decimales (1 GB = 1.073.741.824 bytes), y el porcentaje de espacio libre con exactamente un decimal en el rango de 0,0 % a 100,0 %.
3. WHEN el administrador abre el Node_Form de un nodo, THE Node_Form SHALL mostrar las JVM_Properties y las Environment_Properties en dos secciones independientes, cada una como tabla de dos columnas (clave y valor) ordenada ascendentemente por clave sin distinguir mayúsculas de minúsculas.
4. WHERE una sección de propiedades dispone de filtro, WHEN el usuario introduce texto en el filtro, THE Node_Form SHALL mostrar en un máximo de 300 ms únicamente las propiedades de esa sección cuya clave o valor contiene el texto, sin distinguir mayúsculas de minúsculas, y sin alterar la otra sección.
5. IF el filtro de una sección no coincide con ninguna propiedad, THEN THE Node_Form SHALL mostrar en esa sección un mensaje indicando que no hay coincidencias y conservar el texto del filtro.
6. IF un valor de Filesystem_Space o el Processor_Count es nulo, THEN THE Node_Form SHALL mostrar el carácter `-` en el campo correspondiente, y IF el espacio total es nulo o igual a 0, THEN THE Node_Form SHALL mostrar `-` también en el porcentaje de espacio libre.
7. IF las JVM_Properties o las Environment_Properties son nulas o vacías, THEN THE Node_Form SHALL mostrar en la sección correspondiente un mensaje indicando que no hay propiedades disponibles, sin mostrar la tabla ni el filtro de esa sección.
8. WHEN el administrador abre el Node_Form de un nodo, THE Node_Form SHALL obtener los datos del nodo mediante el Node_Detail_Endpoint.
9. IF el Node_Detail_Endpoint devuelve un error o no responde en 30 segundos, THEN THE Node_Form SHALL mostrar un mensaje de error indicando que no se pudieron cargar los datos del nodo, sin mostrar valores parciales ni obsoletos en las nuevas secciones.
10. THE Node_Form SHALL ofrecer todas las etiquetas y mensajes de las nuevas secciones en español e inglés mediante claves definidas en `assets/i18n/es.json` y `assets/i18n/en.json`, con las mismas claves en ambos ficheros.
11. THE Node_Form SHALL cumplir el nivel WCAG 2.2 AA en las nuevas secciones, con una etiqueta asociada programáticamente a cada campo, cabeceras de columna (`th` con ámbito de columna) en cada tabla, y un contraste mínimo de 4,5:1 en el texto.

### Requirement 8: Exclusión de la lista del dashboard

**User Story:** As a usuario del dashboard, I want que la lista de nodos mantenga su aspecto actual, so that la pantalla no se sobrecargue con datos de detalle.

#### Acceptance Criteria

1. THE Node_List SHALL mostrar exactamente el mismo conjunto y el mismo orden de columnas que mostraba antes de introducir el Processor_Count, el Filesystem_Space, las JVM_Properties y las Environment_Properties.
2. THE Node_List SHALL omitir el Processor_Count, el Filesystem_Space, las JVM_Properties y las Environment_Properties en columnas, tarjetas y filtros.
3. THE interfaz TypeScript `ClusterNode` SHALL declarar `processors`, `fsTotalSpace`, `fsFreeSpace`, `fsUsableSpace`, `jvmProperties` y `environmentProperties` como campos opcionales.
4. IF la respuesta de la API para un nodo no incluye alguno de los campos `processors`, `fsTotalSpace`, `fsFreeSpace`, `fsUsableSpace`, `jvmProperties` o `environmentProperties`, THEN THE Node_List SHALL mostrar ese nodo con las mismas columnas, sin error en la consola del navegador y sin mensaje de error visible al usuario.
5. WHEN la respuesta de la API para un nodo incluye los campos `processors`, `fsTotalSpace`, `fsFreeSpace`, `fsUsableSpace`, `jvmProperties` y `environmentProperties`, THE Node_List SHALL mostrar la misma fila que mostraría si esos campos estuvieran ausentes.

### Requirement 9: Pruebas y trazabilidad

**User Story:** As a desarrollador, I want pruebas automáticas de los nuevos atributos, so that los cambios futuros no rompan su comportamiento.

#### Acceptance Criteria

1. THE Cluster_Service SHALL disponer de pruebas unitarias que verifiquen, tanto para un nodo nuevo como para un nodo existente, que `registerNode()` carga los valores de `processors`, de Filesystem_Space, de JVM_Properties y de Environment_Properties, y que cada prueba falla si alguno de esos cuatro atributos queda sin cargar o con un valor distinto del obtenido del entorno de ejecución.
2. THE Cluster_Service SHALL disponer de pruebas unitarias que verifiquen que, tras una invocación de `heartbeat()`, Filesystem_Space refleja los valores actuales del entorno de ejecución y `processors`, JVM_Properties y Environment_Properties conservan exactamente los valores previos, sin añadir, eliminar ni modificar claves ni valores.
3. THE Cluster_Service SHALL disponer de una prueba basada en propiedades del enmascaramiento de Sensitive_Key que, con un mínimo de 100 casos generados aleatoriamente que incluyan mapas vacíos, verifique que aplicar el enmascaramiento dos veces produce el mismo resultado que aplicarlo una vez (idempotencia) y que el mapa resultante contiene el mismo número de claves que el mapa de entrada.
4. THE Cluster_Controller SHALL disponer de pruebas que verifiquen que la respuesta del Node_List_Endpoint no contiene ninguno de los nuevos campos y que la respuesta del Node_Detail_Endpoint contiene todos ellos.
5. THE Node_Form SHALL disponer de pruebas unitarias que verifiquen la visualización de cada uno de los nuevos campos con valor informado, el filtrado de propiedades que muestra únicamente las entradas que coinciden con el texto del filtro, y que un valor nulo o ausente en cualquiera de los nuevos campos no provoca error de renderizado.
6. WHEN el Cluster_Service procesa un cambio de los nuevos atributos del nodo local, THE Cluster_Service SHALL registrar la misma auditoría de registro de nodo que existía antes de este cambio y no SHALL crear ninguna entrada de auditoría adicional por cada Heartbeat.
7. THE Cluster_Service SHALL disponer de una prueba unitaria que verifique que, tras 10 invocaciones consecutivas de `heartbeat()` sobre el nodo local, el número de entradas de auditoría creadas es igual al número previo a dichas invocaciones.
