# template-dist

Scripts de compilación, empaquetado y despliegue de la plataforma Template.

## Estructura

```
template-dist/
├── linux/              ← Scripts para Linux/macOS
│   ├── build.sh        ← Compilación del backend y frontend
│   ├── package.sh      ← Generación de artefactos desplegables
│   └── deploy.sh       ← Despliegue (placeholder)
├── windows/            ← Scripts para Windows
│   ├── build.bat       ← Compilación del backend y frontend
│   ├── package.bat     ← Generación de artefactos desplegables
│   └── deploy.bat      ← Despliegue (placeholder)
└── README.md
```

## Prerequisitos

- **Java 21** (JDK)
- **Maven 3.9+**
- **Node.js 20+**
- **Angular CLI 22** (`npm install -g @angular/cli`)

## Scripts disponibles

### build

Compila el backend (Maven) y el frontend (Angular). Ejecuta los tests del backend como parte del ciclo `install`.

| Plataforma | Comando |
|------------|---------|
| Linux/macOS | `./template-dist/linux/build.sh` |
| Windows | `template-dist\windows\build.bat` |

Operaciones realizadas:
1. Backend: `mvn clean install` (compila, ejecuta tests y genera artefactos en repositorio local)
2. Frontend: `npm install` + `ng build` (instala dependencias y compila)

### package

Genera los artefactos de distribución listos para desplegar.

| Plataforma | Comando |
|------------|---------|
| Linux/macOS | `./template-dist/linux/package.sh` |
| Windows | `template-dist\windows\package.bat` |

Operaciones realizadas:
1. Backend: `mvn clean package -P dist -DskipTests` (genera WAR con perfil de distribución)
2. Frontend: `npm install` + `ng build --configuration production` (build optimizado de producción)

Artefactos generados:
- Backend: `template/webapp/target/*.war`
- Frontend: `template-dashboard/dist/`

### deploy

Placeholder para la automatización del despliegue. Este script debe ser personalizado según la infraestructura y el entorno de destino.

| Plataforma | Comando |
|------------|---------|
| Linux/macOS | `./template-dist/linux/deploy.sh [entorno]` |
| Windows | `template-dist\windows\deploy.bat [entorno]` |

El parámetro `entorno` es opcional (por defecto: `dev`). Valores posibles: `dev`, `int`, `qa`, `pro`.

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
```

### Windows

```cmd
REM Compilar
template-dist\windows\build.bat

REM Empaquetar para distribución
template-dist\windows\package.bat

REM Desplegar (placeholder)
template-dist\windows\deploy.bat pro
```

## Notas

- Todos los scripts se ejecutan desde la raíz del workspace.
- Los scripts detectan automáticamente las rutas relativas al backend (`template/`) y al frontend (`template-dashboard/`).
- En caso de error, los scripts abortan la ejecución mostrando un mensaje descriptivo.
- El script `deploy` es un placeholder con secciones TODO que deben ser implementadas según la infraestructura de despliegue específica del proyecto.
