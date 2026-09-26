# Modelo de Datos

## Introducción

El modelo de datos de **Template** define la estructura lógica de la información gestionada por la plataforma.

Su diseño persigue los siguientes objetivos:

- Representar el dominio funcional de forma clara y consistente.
- Favorecer la reutilización de entidades comunes.
- Facilitar la evolución del modelo.
- Mantener la independencia entre la lógica de negocio y la persistencia.

El acceso al modelo se realiza mediante **JPA/Hibernate**, mientras que la evolución del esquema físico se gestiona mediante **Liquibase**.

---

# Principios de diseño

El modelo de datos se basa en los siguientes principios:

- Normalización de la información.
- Identificadores únicos para todas las entidades.
- Relaciones explícitas entre entidades.
- Separación entre entidades persistentes y DTO.
- Auditoría de cambios.
- Evolución controlada mediante migraciones.

---

# Encuadre en la arquitectura

Las entidades representan el modelo **persistente** de la aplicación y son la base de la capa de dominio (`domain`). Su relación con el resto de capas (servicios, mappers, repositorios y DTO) forma parte de la arquitectura por capas del backend, descrita en [backend.md](backend.md#arquitectura-por-capas). Este documento se centra exclusivamente en el modelo de datos.

---

# Organización

Las entidades se agrupan por módulos funcionales.

```text
domain/

├── common/

├── security/

├── administration/

├── reports/

├── cluster/

└── ...
```

Cada módulo contiene únicamente las entidades relacionadas con su ámbito funcional.

---

# Entidades comunes

Estas son las entidades persistentes del núcleo de Template, agrupadas por dominio funcional. Todas ellas residen en el módulo `domain` (`org.myorganization.template.domain.entity`).

| Dominio        | Entidad JPA    | Tabla            | Descripción                                                    |
|----------------|----------------|------------------|----------------------------------------------------------------|
| Seguridad      | `User`         | `users`          | Usuario del sistema con datos de autenticación y perfil        |
| Seguridad      | `Profile`      | `profile`        | Perfil de seguridad que agrupa acciones                        |
| Seguridad      | `Action`       | `action`         | Acción (permiso) asignable a perfiles                          |
| Seguridad      | `RefreshToken` | `refresh_token`  | Token de refresco opaco asociado a un usuario                  |
| Administración | `Parameter`    | `parameter`      | Parámetro de configuración del sistema, tipado                 |
| Administración | `AuditLog`     | `audit_log`      | Entrada inmutable de auditoría (append-only)                   |
| Informes       | `Report`       | `report`         | Informe asignable a usuarios para ejecución/exportación        |
| Interfaces     | `Interface`    | `interface`      | Interfaz externa monitorizada por el sistema                   |
| Interfaces     | `InterfaceLog` | `interface_log`  | Entrada inmutable de operación de interfaz (append-only)       |
| Cluster        | `ClusterNode`  | `cluster_node`   | Nodo del cluster con estado y métricas de memoria              |
| Cluster        | `ClusterTask`  | `cluster_task`   | Definición de una tarea del cluster                            |
| Cluster        | `ClusterJob`   | `cluster_job`    | Asignación de una tarea a un nodo (clave compuesta)            |
| Cluster        | `ClusterBlock` | `cluster_block`  | Registro de bloqueo (lock) de una tarea con métricas           |

### Tablas de unión

Las relaciones N:M se materializan mediante entidades intermedias:

| Entidad JPA      | Tabla            | Relación que resuelve   |
|------------------|------------------|-------------------------|
| `User2Report`    | `user2report`    | Usuario ↔ Informe       |
| `Profile2Action` | `profile2action` | Perfil ↔ Acción         |

> **Nota**: la mayoría de entidades de negocio extienden `BaseEntity` (id + `created_at` + `last_modified_at`). Las entidades de tipo log (`AuditLog`, `InterfaceLog`) y las del cluster (`ClusterNode`, `ClusterTask`, `ClusterJob`, `ClusterBlock`) no extienden `BaseEntity` y gestionan sus propios campos de tiempo. Ver detalle en la sección [Auditoría](#auditoría).

La representación funcional de estas entidades (atributos de dominio y relaciones) se encuentra en [data-model.md](../../specification/data-model.md).

> **Idioma y Notificación**: aunque son funcionalidades transversales de la plataforma, **no** disponen de entidad persistente propia en el modelo actual. Los idiomas se gestionan mediante ficheros de recursos i18n en el frontend y las notificaciones mediante un framework basado en eventos. Ver [data-model.md](../../specification/data-model.md) para más detalle.

---

# Identificadores

Todas las entidades disponen de un identificador único generado por secuencia. `BaseEntity` centraliza el identificador para las entidades que la extienden:

```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE)
@Column(name = "id")
private Long id;
```

Las entidades que no extienden `BaseEntity` declaran su propio `@Id` con la misma estrategia de secuencia (algunas con un `@SequenceGenerator` explícito). La entidad `ClusterJob` usa una **clave primaria compuesta** (`@EmbeddedId`) al ser una tabla de asignación nodo–tarea.

---

# Relaciones

El modelo admite relaciones entre entidades utilizando las asociaciones estándar de JPA.

- One To One
- One To Many
- Many To One
- Many To Many

Todas las relaciones deben modelarse de forma explícita y documentarse cuando formen parte del dominio funcional.

---

# Herencia

Cuando varias entidades compartan información común, podrá utilizarse herencia.

Ejemplo:

```text
BaseEntity

↑

Usuario

Perfil

Parámetro
```

La estrategia de herencia dependerá de las necesidades funcionales de cada módulo.

---

# Auditoría

Las entidades pueden incorporar información de auditoría.

Habitualmente:

- Fecha de creación.
- Usuario creador.
- Fecha de modificación.
- Usuario modificador.

Esta información permite realizar el seguimiento de los cambios efectuados sobre los datos.

---

# Eliminación lógica

Cuando sea necesario conservar el histórico de la información, las entidades podrán implementar eliminación lógica mediante un indicador de estado.

De esta forma los registros permanecen almacenados aunque dejen de estar activos.

---

# Enumerados

Los valores constantes del dominio deberán modelarse mediante enumeraciones.

Ejemplos:

- Estado
- Tipo
- Prioridad
- Nivel

Esto mejora la legibilidad del código y evita valores literales.

---

# Acceso y exposición de las entidades

Las entidades JPA nunca se exponen directamente mediante las API: cada entidad se accede a través de su repositorio y se expone mediante DTO específicos. Este flujo (`Repository → Service → Mapper → DTO → API`) y las responsabilidades de repositorios, mappers y DTO se detallan en [backend.md](backend.md#responsabilidad-de-las-capas).

---

# Convenciones

Todas las entidades desarrolladas sobre Template deben seguir las siguientes normas:

- Una entidad por fichero.
- Nombre en singular.
- Identificador único.
- Relaciones bidireccionales únicamente cuando sean necesarias.
- No incluir lógica de negocio.
- Utilizar tipos adecuados para cada atributo.
- Documentar relaciones complejas.

Las convenciones de nomenclatura se describen en **coding-guidelines.md**.

---

# Evolución del modelo

La evolución del modelo de datos se realiza exclusivamente mediante Liquibase.

Cada modificación del esquema debe ir acompañada de:

- Su correspondiente changelog.
- La actualización de la documentación.
- Las pruebas necesarias para validar la migración.

---

# Buenas prácticas

Durante el desarrollo deben respetarse las siguientes recomendaciones:

- Mantener entidades pequeñas y cohesionadas.
- Evitar relaciones innecesariamente complejas.
- Utilizar carga perezosa cuando sea posible.
- Evitar consultas N+1.
- No utilizar entidades como DTO.
- Mantener el modelo alineado con el dominio funcional.

---

# Documentación relacionada

Para ampliar la información sobre el modelo de datos consultar:

- [data-model.md](../../specification/data-model.md) — modelo de datos desde el punto de vista funcional (entidades de dominio y relaciones).
- [backend.md](backend.md)
- [liquibase.md](liquibase.md)
- [api.md](api.md)
- [coding-guidelines.md](../../04-development/coding-guidelines.md)

---

# Resumen

El modelo de datos de Template proporciona una representación consistente del dominio de la aplicación, separando claramente la persistencia de la lógica de negocio y de las API.

Su organización modular, junto con el uso de JPA/Hibernate y Liquibase, facilita la evolución controlada del modelo y garantiza la mantenibilidad de la plataforma a largo plazo.