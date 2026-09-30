# Reglas de Codificación — Maven

Aplica a la gestión de dependencias y configuración de builds (`**/pom.xml`).

## Principios y Convenciones

- El `pom.xml` padre en `template/` gestiona las versiones (`dependencyManagement` y `pluginManagement`).
- Los submódulos solo declaran `groupId` y `artifactId` sin duplicar versiones si ya están gestionadas en el padre.
- No introducir dependencias circulares o acoplamientos innecesarios entre módulos.
- Mantener los perfiles de compilación (`local`, `dist`, `test`) organizados según la guía.
- Sigue la guía oficial: [template-docs/04-development/coding-guidelines/maven.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/maven.md).
