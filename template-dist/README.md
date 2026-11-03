# template-dist

Scripts de compilación, empaquetado y despliegue de la plataforma Template.

## Estructura

```
template-dist/
├── linux/              ← Scripts para Linux/macOS
│   ├── environment.sh  ← Carga y validación de variables de entorno
│   ├── build.sh        ← Compilación completa vía Maven
│   ├── package.sh      ← Generación de artefactos desplegables
│   ├── generate-sql.sh ← Genera SQL desde changesets de Liquibase
│   └── deploy.sh       ← Despliegue (placeholder)
├── windows/            ← Scripts para Windows
│   ├── environment.bat ← Carga y validación de variables de entorno
│   ├── build.bat       ← Compilación completa vía Maven
│   ├── package.bat     ← Generación de artefactos desplegables
│   ├── generate-sql.bat ← Genera SQL desde changesets de Liquibase
│   └── deploy.bat      ← Despliegue (placeholder)
└── README.md
```

## Prerequisitos

- **Java 21** (JDK)
- **Maven 3.9+**

## Scripts disponibles

Todos los scripts cargan al inicio su script de entorno de plataforma:
- Linux/macOS: `template-dist/linux/environment.sh`
- Windows: `template-dist/windows/environment.bat`

Estos scripts permiten definir variables opcionales por usuario en:
- Linux/macOS: `template-dist/linux/environment/<usuario>.conf.sh`
- Windows: `template-dist/windows/environment/<usuario>.conf.bat`

Variables soportadas:
- `JAVA_HOME`
- `MAVEN_HOME`
- `MAVEN_OPTS`
- `MAVEN_USER_SETTINGS`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Si defines `DB_URL` con una base PostgreSQL accesible, el script `generate-sql` genera el SQL completo del modelo desde los changesets reales de Liquibase; sin esa configuración usa `offline:postgresql` como fallback.

### build

Compila la solución completa desde Maven (incluyendo frontend según la configuración del proyecto). Ejecuta los tests del backend como parte del ciclo `install`.

| Plataforma | Comando |
|------------|---------|
| Linux/macOS | `./template-dist/linux/build.sh` |
| Windows | `template-dist\windows\build.bat` |

Operaciones realizadas:
1. Maven: `mvn clean install` (compila backend y frontend, ejecuta tests y genera artefactos en repositorio local)

### package

Genera los artefactos de distribución listos para desplegar.

| Plataforma  | Comando                             |
|-------------|-------------------------------------|
| Linux/macOS | `./template-dist/linux/package.sh`  |
| Windows     | `template-dist\windows\package.bat` |

Operaciones realizadas:
1. Maven: `mvn clean package -P dist -DskipTests` (genera WAR con perfil de distribución y empaqueta frontend según configuración Maven)

Artefactos generados:
- Backend: `template/webapp/target/*.war`

### deploy

Placeholder para la automatización del despliegue. Este script debe ser personalizado según la infraestructura y el entorno de destino.

| Plataforma  | Comando                                      |
|-------------|----------------------------------------------|
| Linux/macOS | `./template-dist/linux/deploy.sh [entorno]`  |
| Windows     | `template-dist\windows\deploy.bat [entorno]` |

El parámetro `entorno` es opcional (por defecto: `dev`). Valores posibles: `dev`, `int`, `qa`, `pro`.

### generate-sql

Genera un fichero SQL a partir de los changesets de Liquibase del módulo `domain` usando `liquibase:updateSQL`.

| Plataforma  | Comando |
|-------------|---------|
| Linux/macOS | `./template-dist/linux/generate-sql.sh [master\|local] [ruta-salida.sql]` |
| Windows     | `template-dist\windows\generate-sql.bat [master\|local] [ruta-salida.sql]` |

Parámetros:
1. `master|local` (opcional, por defecto `master`)
   - `master` → `db/changelog/db.changelog-master.xml`
   - `local` → `db/changelog/db.changelog-local.xml`
2. `ruta-salida.sql` (opcional)
   - Linux/macOS por defecto: `template-dist/sql/template-<perfil>.sql`
   - Windows por defecto: `template-dist\sql\template-<perfil>.sql`

Notas:
- Si defines `DB_URL`, `DB_USERNAME` y `DB_PASSWORD`, el script genera el SQL completo del modelo real contra la base PostgreSQL configurada.
- Si no hay base configurada, usa URL offline de PostgreSQL (`offline:postgresql`) como fallback para generar el SQL a partir de los changesets.
- Si defines `MAVEN_USER_SETTINGS` en el script de entorno, se usa automáticamente en la ejecución Maven.

## Uso

### Linux/macOS

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x template-dist/linux/*.sh

# Compilar
./template-dist/linux/build.sh

# Empaquetar para distribución
./template-dist/linux/package.sh

# Desplegar (placeholder)
./template-dist/linux/deploy.sh pro

# Generar SQL desde Liquibase
./template-dist/linux/generate-sql.sh master
./template-dist/linux/generate-sql.sh local ./template-dist/sql/template-local.sql
```

### Windows

```cmd
REM Compilar
template-dist\windows\build.bat

REM Empaquetar para distribución
template-dist\windows\package.bat

REM Desplegar (placeholder)
template-dist\windows\deploy.bat pro

REM Generar SQL desde Liquibase
template-dist\windows\generate-sql.bat master
template-dist\windows\generate-sql.bat local template-dist\sql\template-local.sql
```

## Notas

- Todos los scripts se ejecutan desde la raíz del workspace.
- Los scripts detectan automáticamente la ruta relativa del backend (`template/`), desde donde Maven ejecuta la compilación completa.
- En caso de error, los scripts abortan la ejecución mostrando un mensaje descriptivo.
- El script `deploy` es un placeholder con secciones TODO que deben ser implementadas según la infraestructura de despliegue específica del proyecto.
