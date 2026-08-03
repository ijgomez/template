# Instalación del software

## Introducción

Esta guía describe el software necesario para trabajar con la plataforma Template y los pasos para instalarlo en una máquina de desarrollo.

---

## Software necesario

| Software       | Versión mínima | Descripción                               | Obligatorio |
|----------------|----------------|-------------------------------------------|:-----------:|
| JDK            | 21             | Java Development Kit                      | Sí          |
| Maven          | 3.9+           | Gestión de dependencias y build (backend) | Sí          |
| Node.js        | 22 LTS         | Runtime para herramientas frontend        | Sí          |
| npm            | 12+            | Gestor de paquetes frontend               | Sí          |
| Angular CLI    | 22             | Herramienta de línea de comandos Angular  | Sí          |
| PostgreSQL     | 18             | Base de datos relacional                  | Sí (*)      |
| Git            | 2.40+          | Control de versiones                      | Sí          |
| Python         | 3.12+          | Runtime para herramientas de desarrollo   | Sí          |
| pip            | 23+            | Gestor de paquetes Python                 | Sí          |
| uv             | 0.7+           | Gestor de paquetes Python moderno         | No (**)     |
| Serena         | 1.6+           | MCP toolkit para asistencia de código     | Sí          |
| Docker         | 24+            | Contenedorización                         | No          |
| Docker Compose | 2.20+          | Orquestación de contenedores              | No          |

(*) PostgreSQL puede instalarse localmente o ejecutarse mediante Docker.

(**) `uv` es una alternativa moderna a `pip` más rápida. Se puede usar `pip` o `uv` indistintamente para instalar Serena.

---

## Instalación por componente

### JDK 21

Descargar e instalar la distribución de OpenJDK recomendada:

- [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=21)
- [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21)

Configurar las variables de entorno:

```bash
# Linux / macOS
export JAVA_HOME=/ruta/al/jdk-21
export PATH=$JAVA_HOME/bin:$PATH

# Windows (PowerShell — como administrador)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "Machine")
[Environment]::SetEnvironmentVariable("Path", "$env:JAVA_HOME\bin;$env:Path", "Machine")
```

### Maven 3.9+

Descargar desde [Apache Maven](https://maven.apache.org/download.cgi) y configurar:

```bash
# Linux / macOS
export MAVEN_HOME=/ruta/al/maven
export PATH=$MAVEN_HOME/bin:$PATH

# Windows (PowerShell — como administrador)
[Environment]::SetEnvironmentVariable("MAVEN_HOME", "C:\Program Files\Apache\maven", "Machine")
[Environment]::SetEnvironmentVariable("Path", "$env:MAVEN_HOME\bin;$env:Path", "Machine")
```

Opcionalmente se puede instalar mediante un gestor de paquetes:

```bash
# macOS (Homebrew)
brew install maven

# Linux (sdkman)
sdk install maven
```

### Node.js 22 y npm

Descargar desde [Node.js](https://nodejs.org/) la versión LTS 22.

Alternativamente:

```bash
# macOS (Homebrew)
brew install node@22

# Linux (nvm — recomendado)
nvm install 22
nvm use 22

# Windows (winget)
winget install OpenJS.NodeJS.LTS
```

npm se incluye con Node.js.

### Angular CLI 22

Instalar globalmente una vez configurado Node.js:

```bash
npm install -g @angular/cli@22
```

### PostgreSQL 18

#### Instalación local

- [Descargas oficiales](https://www.postgresql.org/download/)
- En Windows: usar el instalador de EnterpriseDB.
- En macOS: `brew install postgresql@18`
- En Linux: seguir las instrucciones del repositorio oficial de PostgreSQL.

#### Alternativa: Docker

Si se prefiere no instalar PostgreSQL localmente, se puede usar el contenedor Docker incluido en el proyecto (ver [configuración](configuration.md)).

### Git 2.40+

- [Descargas oficiales](https://git-scm.com/downloads)
- En macOS: viene preinstalado o `brew install git`
- En Windows: usar [Git for Windows](https://gitforwindows.org/)

Habilitar Git LFS (necesario para el proyecto):

```bash
git lfs install
```

### Python 3.12+ y pip

Python es necesario para ejecutar herramientas de desarrollo como Serena.

#### Windows

Descargar desde [python.org](https://www.python.org/downloads/) e instalar marcando la opción **"Add Python to PATH"** durante la instalación.

Alternativamente:

```powershell
winget install Python.Python.3.12
```

Verificar que el directorio de scripts del usuario está en el PATH:

```powershell
# Comprobar la ubicación de scripts
python -m site --user-site
# Normalmente: C:\Users\<usuario>\AppData\Roaming\Python\Python312\Scripts

# Añadir al PATH del usuario si no está incluido
$scriptsDir = (python -m site --user-base) + "\Scripts"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$scriptsDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$scriptsDir", "User")
}
```

#### macOS

```bash
# Homebrew (recomendado)
brew install python@3.12

# pip se incluye con Python. Verificar:
python3 -m ensurepip --upgrade
```

pip se instala junto con Python. Si necesitas actualizarlo:

```bash
# Windows
python -m pip install --upgrade pip

# macOS / Linux
python3 -m pip install --upgrade pip
```

### uv (opcional)

`uv` es un gestor de paquetes Python extremadamente rápido que puede reemplazar a `pip`. Es opcional pero recomendado.

#### Windows

```powershell
# Opción 1: Instalador oficial
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Opción 2: Con pip
pip install uv

# Opción 3: Con winget
winget install astral-sh.uv
```

#### macOS

```bash
# Opción 1: Homebrew (recomendado)
brew install uv

# Opción 2: Instalador oficial
curl -LsSf https://astral.sh/uv/install.sh | sh

# Opción 3: Con pip
pip3 install uv
```

### Serena 1.6+

Serena es el toolkit MCP que proporciona asistencia de código con análisis semántico (LSP) al IDE. Se instala como paquete Python.

#### Instalación con pip

```bash
# Windows
pip install --user serena-agent

# macOS / Linux
pip3 install --user serena-agent
```

#### Instalación con uv (alternativa)

Si se tiene `uv` instalado, no es necesario instalar Serena explícitamente. El `mcp.json` del proyecto puede configurarse para usar `uvx`, que descarga y ejecuta Serena automáticamente:

```bash
# No requiere instalación previa; uvx lo gestiona al arrancar el servidor MCP.
uvx serena start-mcp-server --project . --context ide-assistant
```

#### Verificar la instalación

```bash
serena --version   # Debe mostrar Serena 1.6+
```

Si tras instalar con `pip install --user` el comando `serena` no se encuentra, asegúrate de que el directorio de scripts de Python del usuario está en el PATH (ver sección de Python más arriba).

### Docker y Docker Compose (opcional)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS — incluye Docker Compose)
- [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

Docker Compose viene incluido en Docker Desktop. En Linux puede ser necesario instalarlo por separado:

```bash
# Linux
sudo apt install docker-compose-plugin
```

---

## Verificar la instalación

Ejecutar los siguientes comandos para comprobar que todo está correctamente instalado:

```bash
java -version          # Debe mostrar Java 21+
mvn -version           # Debe mostrar Maven 3.9+
node -v                # Debe mostrar v22+
npm -v                 # Debe mostrar 12+
ng version             # Debe mostrar Angular CLI 22+
python --version       # Debe mostrar Python 3.12+ (en macOS: python3 --version)
pip --version          # Debe mostrar pip 23+ (en macOS: pip3 --version)
serena --version       # Debe mostrar Serena 1.6+
psql --version         # Debe mostrar PostgreSQL 18+
git --version          # Debe mostrar 2.40+
git lfs version        # Debe mostrar git-lfs instalado
uv --version           # Opcional: uv 0.7+
docker --version       # Opcional: Docker 24+
docker compose version # Opcional: Docker Compose 2.20+
```

---

## Clonar el repositorio

Una vez instalado todo el software:

```bash
git clone https://github.com/ijgomez/template.git
cd template
```

El repositorio contiene todos los componentes del proyecto organizados según la [estructura del proyecto](../01-introduction/project-structure.md).

---

## Siguiente paso

Con el software instalado y el repositorio clonado, continuar con la [configuración del entorno de desarrollo](configuration.md).
