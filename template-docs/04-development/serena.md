# Integración con Serena

Guía de uso de la integración con Serena, un servidor MCP (Model Context Protocol) que proporciona inteligencia de código avanzada mediante Language Server Protocol (LSP) para asistentes de IA.

## Requisitos previos

- **Serena** instalada en el sistema (`pip install serena` o `pipx install serena`).
- **Proyecto configurado** en Serena (fichero `.serena/project.yml` en la raíz del proyecto).
- **Servidor MCP de Serena** configurado en Kiro (fichero `.kiro/settings/mcp.json` del workspace).

## Versión instalada

| Componente | Versión |
|------------|---------|
| Serena     | 1.6.1   |

## Configuración del proyecto

### Fichero de proyecto (`.serena/project.yml`)

El proyecto ya tiene configurado Serena con los siguientes parámetros principales:

```yaml
project_name: "template"
languages:
  - java
  - angular
encoding: "utf-8"
ignore_all_files_in_gitignore: true
ls_workspace_folders:
  - "."
```

### Configuración MCP en Kiro (`.kiro/settings/mcp.json`)

Para conectar Serena como servidor MCP en el workspace:

```json
{
  "mcpServers": {
    "serena": {
      "command": "serena",
      "args": [
        "start-mcp-server",
        "--project",
        "/Users/ijgomez/Documents/workspace/template",
        "--context",
        "ide-assistant"
      ]
    }
  }
}
```

### Configuración global (`~/.config/serena/serena_config.yml`)

La configuración global define el backend de lenguaje (LSP por defecto), timeouts, modos base y rutas de proyectos registrados. No requiere modificación salvo para cambios avanzados.

## Capacidades

| Capacidad                     | Descripción                                                                  |
|-------------------------------|------------------------------------------------------------------------------|
| Navegación de código          | Ir a definición, buscar referencias, encontrar implementaciones              |
| Búsqueda de símbolos          | Buscar clases, métodos, funciones por nombre en todo el proyecto             |
| Diagnósticos                  | Obtener errores y warnings del compilador/linter en tiempo real              |
| Refactoring semántico         | Renombrar símbolos con actualización automática de todas las referencias     |
| Edición estructural           | Insertar, reemplazar o eliminar símbolos manteniendo la coherencia del código|
| Memorias de proyecto          | Almacenar y recuperar conocimiento del proyecto para futuras sesiones        |
| Ejecución de comandos         | Ejecutar comandos shell dentro del contexto del proyecto                     |

## Herramientas disponibles (MCP)

### Navegación y búsqueda

| Herramienta              | Uso                                                                         |
|--------------------------|-----------------------------------------------------------------------------|
| `find_symbol`            | Busca símbolos (clases, métodos, etc.) por nombre en todo el proyecto       |
| `find_declaration`       | Encuentra la definición/declaración de un símbolo                           |
| `find_referencing_symbols`| Encuentra todos los lugares que referencian un símbolo                     |
| `find_implementations`   | Encuentra implementaciones de una interfaz o clase abstracta                |
| `find_file`              | Busca ficheros por nombre o patrón                                          |
| `search_for_pattern`     | Busca un patrón (texto/regex) en el proyecto                                |

### Inspección de código

| Herramienta              | Uso                                                                         |
|--------------------------|-----------------------------------------------------------------------------|
| `get_symbols_overview`   | Obtiene un resumen de los símbolos de nivel superior en un fichero           |
| `get_diagnostics_for_file`| Obtiene errores, warnings y hints para un fichero                          |
| `read_file`              | Lee el contenido de un fichero del proyecto                                 |
| `list_dir`               | Lista ficheros y directorios                                                |

### Edición de código

| Herramienta              | Uso                                                                         |
|--------------------------|-----------------------------------------------------------------------------|
| `replace_content`        | Reemplaza contenido en un fichero (literal o regex)                         |
| `replace_in_files`       | Reemplaza un patrón en múltiples ficheros con preview (dry-run)             |
| `replace_symbol_body`    | Reemplaza la definición completa de un símbolo                              |
| `insert_before_symbol`   | Inserta contenido antes de un símbolo                                       |
| `insert_after_symbol`    | Inserta contenido después de un símbolo                                     |
| `rename_symbol`          | Renombra un símbolo en todo el proyecto (refactoring semántico)             |
| `safe_delete_symbol`     | Elimina un símbolo solo si no tiene referencias                             |
| `create_text_file`       | Crea o sobrescribe un fichero                                               |

### Gestión de memorias

| Herramienta              | Uso                                                                         |
|--------------------------|-----------------------------------------------------------------------------|
| `write_memory`           | Escribe información persistente del proyecto para futuras sesiones           |
| `read_memory`            | Lee una memoria almacenada previamente                                      |
| `list_memories`          | Lista todas las memorias disponibles del proyecto                           |
| `edit_memory`            | Edita una memoria existente con búsqueda y reemplazo                        |
| `delete_memory`          | Elimina una memoria                                                         |
| `rename_memory`          | Renombra o mueve una memoria                                                |

### Utilidades

| Herramienta              | Uso                                                                         |
|--------------------------|-----------------------------------------------------------------------------|
| `execute_shell_command`  | Ejecuta un comando en el contexto del proyecto                              |
| `onboarding`             | Realiza el onboarding inicial del proyecto                                  |
| `get_current_config`     | Muestra la configuración activa del agente                                  |
| `activate_project`       | Activa un proyecto registrado                                               |
| `initial_instructions`   | Muestra las instrucciones de uso de Serena                                  |

## Contextos disponibles

Los contextos definen el prompt del sistema y el comportamiento de Serena según el cliente:

| Contexto          | Uso recomendado                                    |
|-------------------|----------------------------------------------------|
| `ide-assistant`   | Integración con IDEs (Kiro, VS Code)               |
| `desktop-app`     | Aplicación de escritorio (Claude Desktop)          |
| `claude-code`     | CLI de Claude Code                                 |
| `codex`           | OpenAI Codex CLI                                   |
| `vscode`          | Extensión de VS Code                               |
| `agent`           | Agentes autónomos genéricos                        |

Para este proyecto, se recomienda usar `ide-assistant` al integrarse con Kiro.

## Modos disponibles

Los modos modifican el comportamiento del servidor:

| Modo             | Descripción                                                    |
|------------------|----------------------------------------------------------------|
| `interactive`    | Modo interactivo (permite pedir confirmación al usuario)       |
| `editing`        | Habilita herramientas de edición de código                     |
| `planning`       | Modo planificación (sin ejecución de cambios)                  |
| `onboarding`     | Activa el proceso de onboarding del proyecto                   |
| `no-onboarding`  | Desactiva el onboarding                                        |
| `no-memories`    | Desactiva el sistema de memorias                               |
| `one-shot`       | Para tareas de una sola respuesta                              |

Por defecto, el proyecto usa los modos `interactive` + `editing`.

## Memorias del proyecto

Las memorias son ficheros Markdown almacenados en `.serena/memories/` que persisten conocimiento del proyecto entre sesiones.

### Uso recomendado

- Documentar decisiones arquitectónicas recurrentes.
- Registrar patrones de código específicos del proyecto.
- Almacenar instrucciones de build, test o deploy que el asistente necesita recordar.
- Guardar el resultado del onboarding para referencia futura.

### Organización

Los nombres de memoria pueden incluir `/` para organizarse por temas:

```
architecture/module-dependencies
build/maven-profiles
testing/integration-setup
```

### Onboarding

El primer paso recomendado es ejecutar el onboarding, que analiza la estructura del proyecto y genera memorias iniciales:

```
Usar la herramienta `onboarding` de Serena para identificar la estructura del proyecto.
```

## Flujo de trabajo habitual

### 1. Investigar código existente

```
1. get_symbols_overview → visión general de un fichero
2. find_symbol → localizar una clase o método específico
3. find_referencing_symbols → entender quién usa un símbolo
4. find_implementations → ver implementaciones concretas
```

### 2. Modificar código con seguridad

```
1. get_diagnostics_for_file → verificar estado actual
2. replace_symbol_body / replace_content → aplicar cambio
3. get_diagnostics_for_file → verificar que no se introdujeron errores
```

### 3. Refactoring

```
1. find_referencing_symbols → evaluar impacto
2. rename_symbol → renombrar en todo el proyecto
3. get_diagnostics_for_file → validar resultado
```

## Estructura de ficheros de Serena en el proyecto

```
template/
  .serena/
    project.yml          # Configuración del proyecto
    project.local.yml    # Configuración local (no versionado)
    memories/            # Memorias persistentes del proyecto
    cache/               # Cache del índice LSP
```

## Comandos CLI de referencia

| Comando                                  | Descripción                                    |
|------------------------------------------|------------------------------------------------|
| `serena --version`                       | Mostrar versión instalada                      |
| `serena project create <path>`           | Crear configuración para un nuevo proyecto     |
| `serena project health-check`            | Verificar salud del proyecto                   |
| `serena project index`                   | Indexar símbolos del proyecto                  |
| `serena memories list`                   | Listar memorias del proyecto activo            |
| `serena memories read <nombre>`          | Leer una memoria                               |
| `serena context list`                    | Listar contextos disponibles                   |
| `serena mode list`                       | Listar modos disponibles                       |
| `serena start-mcp-server --project <p>`  | Arrancar el servidor MCP                       |

## Solución de problemas

| Problema                              | Causa                                          | Solución                                                                |
|---------------------------------------|------------------------------------------------|-------------------------------------------------------------------------|
| Servidor MCP no conecta               | Serena no instalada o no en PATH               | Verificar con `which serena` y `serena --version`                       |
| Símbolos no encontrados               | Índice desactualizado o language server caído   | Ejecutar `serena project index` para reindexar                          |
| Diagnósticos vacíos                   | Language server no soporta el fichero           | Verificar que el lenguaje está en `languages` de `project.yml`          |
| Memorias no persisten                 | Directorio `.serena/memories/` sin permisos     | Verificar permisos del directorio                                       |
| Respuestas truncadas                  | Resultado excede `default_max_tool_answer_chars`| Ajustar el valor en `serena_config.yml` o usar filtros más específicos  |
| Timeout en herramientas               | Operación LSP lenta                            | Aumentar `tool_timeout` en configuración                                |
| Angular LSP no arranca                | Falta `npm install` en el proyecto             | Ejecutar `npm install` en el directorio del frontend                    |

## Referencias

- [Documentación oficial de Serena](https://oraios.github.io/serena/)
- [Repositorio en GitHub](https://github.com/oraios/serena)
- [Configuración de proyectos](https://oraios.github.io/serena/02-usage/050_configuration.html)
- [Lenguajes soportados](https://oraios.github.io/serena/01-about/020_programming-languages.html)
- [Dashboard](https://oraios.github.io/serena/02-usage/060_dashboard.html)
- [Lista de herramientas](https://oraios.github.io/serena/01-about/035_tools.html)
