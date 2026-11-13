# Template Docker

`template-docker` levanta en local PostgreSQL, dos nodos WildFly detrás de Apache, OpenProject y Mailpit mediante Docker Compose.

## Requisitos

- Docker Engine con Docker Compose.
- `bash` y `openssl` para ejecutar `compose.sh` y generar credenciales si faltan.

## Configuración y secretos

Al ejecutar `./compose.sh start` o `./compose.sh reset`, el script prepara los ficheros locales que no existan:

- `.env`: copia de `.env.example`, con la configuración no secreta.
- `secrets/credentials.env`: un único fichero ignorado por Git con `postgres_password`, `wildfly_admin_password`, `openproject_admin_password` y `openproject_secret_key_base`.

Las tres contraseñas se generan aleatoriamente con 256 bits de entropía y contienen minúscula, mayúscula, número y símbolo. La clave de OpenProject se genera con 256 bits aleatorios en hexadecimal. Si los ficheros ya existen, el script no los sobrescribe.

Compose monta `credentials.env` como `/run/secrets/credentials` solo en los servicios que lo necesitan. PostgreSQL y WildFly leen sus claves desde ese fichero; OpenProject también obtiene de ahí las credenciales requeridas. No añadas contraseñas a Dockerfiles, a `.env` ni al repositorio. Restringe el acceso local a `secrets/credentials.env` y protege sus copias de seguridad.

Para revisar la configuración de puertos, edita `.env`. Las contraseñas se cambian editando `secrets/credentials.env`; para rotarlas en servicios ya inicializados, actualiza también la contraseña correspondiente en PostgreSQL o en la aplicación y reinicia los servicios afectados.

## Uso

Arrancar todos los servicios:

```bash
./compose.sh start
```

El script ejecuta `docker compose up -d --build`.

Ver logs:

```bash
docker compose logs -f
docker compose logs -f postgres
docker compose logs -f wildfly-1
docker compose logs -f wildfly-2
docker compose logs -f apache
```

Detener y quitar los contenedores, conservando los volúmenes:

```bash
./compose.sh stop
```

Reinicializar servicios y borrar los volúmenes de datos:

```bash
./compose.sh reset
```

`reset` elimina PostgreSQL y los datos persistentes de OpenProject; úsalo solo si quieres empezar de cero. Los ficheros `.env` y `secrets/credentials.env` permanecen en el host.

## Puertos publicados

| Servicio | Puerto del host | Puerto del contenedor | Uso |
|---|---:|---:|---|
| PostgreSQL | `5432` | `5432` | Base de datos |
| Apache | `8000` | `80` | Balanceador y entrada HTTP |
| Apache | `4430` | `443` | Balanceador y entrada HTTPS |
| WildFly 1 | `8081` | `8080` | HTTP directo para depuración |
| WildFly 1 | `9991` | `9990` | Consola de administración |
| WildFly 2 | `8082` | `8080` | HTTP directo para depuración |
| WildFly 2 | `9992` | `9990` | Consola de administración |
| OpenProject | `8088` | `80` | Gestión de proyectos |
| Mailpit SMTP | `1025` | `1025` | Correo de pruebas |
| Mailpit UI | `8025` | `8025` | Interfaz de mensajes capturados |

Apache reparte el tráfico entre `wildfly-1:8080` y `wildfly-2:8080` dentro de la red Compose; los puertos publicados del host no son los puertos internos. El balanceador usa round-robin y la aplicación se considera stateless. El acceso recomendado es `http://localhost:8000` o `https://localhost:4430` (certificado autofirmado); los nodos también están disponibles directamente en `http://localhost:8081` y `http://localhost:8082`.

## Servicios

### PostgreSQL

- Imagen construida desde `postgres/Dockerfile`, basada en PostgreSQL 18.
- Persiste los datos en el volumen `postgres-data`; `PGDATA` es `/var/lib/postgresql/18/docker`.
- Inicializa las bases `template` y `openproject`, roles de plantilla y tablespaces al crear el volumen por primera vez.
- Los scripts de inicialización solo se ejecutan durante la primera inicialización del volumen. Editarlos no modifica un clúster ya creado.

### WildFly y datasource PostgreSQL

- Los dos nodos usan la imagen `template-wildfly:latest`, construida desde WildFly JDK 21.
- El Dockerfile descarga el driver JDBC de PostgreSQL directamente con `curl`, valida el JAR y lo instala como módulo `org.postgresql`; no usa una etapa adicional de Alpine ni Maven.
- La construcción elimina el datasource `ExampleDS` y el driver `h2`, registra el driver PostgreSQL y crea `PostgreSQLDS`.
- El datasource está disponible en JNDI como `java:/jdbc/PostgreSQLDS`, apunta a la base `template` por defecto y obtiene la contraseña desde `secrets/credentials.env`.
- `statistics-enabled=true` activa las estadísticas del pool. La configuración permite validar conexiones y espera a que PostgreSQL esté saludable antes de arrancar.
- Para consultar estadísticas runtime con la CLI de WildFly, el recurso es `/subsystem=datasources/data-source=PostgreSQLDS/statistics=pool:read-resource(include-runtime=true)`.
- Los nodos arrancan como instancias `standalone`; el balanceo HTTP lo hace Apache. La coordinación o clustering de la aplicación depende de la configuración propia de la aplicación.
- El entrypoint limpia el historial XML residual de la etapa de construcción antes de iniciar, para evitar el error `WFLYCTL0056` al archivar `standalone_xml_history/current`.

### Apache

- Imagen basada en `httpd:2.4`, configurada con `mod_proxy_balancer` y balanceo `byrequests`.
- Publica el puerto HTTP `8000` y el HTTPS `4430` por defecto y espera a que los dos servicios WildFly estén creados.
- Termina TLS en el puerto 443 con un certificado autofirmado generado en el Dockerfile (sólo pruebas; en producción montar uno real) y reenvía a los nodos por HTTP interno con `X-Forwarded-Proto: https`.
- Los backends son los nombres DNS de Compose con el puerto interno `8080`.
- La configuración incluye `/balancer-manager` y `/server-status`, restringidos a rangos locales privados.

### OpenProject

- Imagen personalizada basada en `openproject/openproject:17`.
- Conecta a la base PostgreSQL `openproject` y persiste sus recursos en `openproject-assets`.
- Publica HTTP en el puerto `8088` por defecto y espera a que PostgreSQL esté saludable.
- El entrypoint lee los secretos desde el fichero compartido y configura `ServerName localhost` para Apache interno.

### Mailpit

- Servidor SMTP de pruebas; captura mensajes localmente y no los entrega a destinatarios reales.
- SMTP disponible en `localhost:1025`; interfaz web en `http://localhost:8025`.
- Acepta autenticación SMTP sin validación, por lo que es solo para desarrollo local.

## Variables de entorno

`.env.example` documenta las variables no secretas:

- PostgreSQL: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PORT`.
- WildFly: `WILDFLY_HTTP_PORT`, `WILDFLY_MANAGEMENT_PORT`, `WILDFLY2_HTTP_PORT`, `WILDFLY2_MANAGEMENT_PORT`, `WILDFLY_ADMIN_USER`.
- PostgreSQL JDBC: `POSTGRES_JDBC_URL` (opcional; por defecto apunta al servicio `postgres` y a `POSTGRES_DB`).
- Apache: `APACHE_HTTP_PORT`, `APACHE_HTTPS_PORT`.
- OpenProject: `OPENPROJECT_PORT`, `OPENPROJECT_HOST_NAME`, `OPENPROJECT_DB`, `OPENPROJECT_HTTPS`.
- Mailpit: `MAIL_SMTP_PORT`, `MAIL_UI_PORT`.

Las contraseñas y `SECRET_KEY_BASE` no se configuran en `.env`; se guardan en `secrets/credentials.env`.
