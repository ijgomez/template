# Estructura del Proyecto y Entornos

## Módulos del Proyecto

- `template/`: Proyecto agregador y POM padre.
- `commons/`: Utilidades transversales independientes de la lógica de negocio.
- `cluster/`: Servicios de alta disponibilidad, coordinación e infraestructura.
- `domain/`: Modelo de dominio, entidades JPA y persistencia.
- `core/`: Lógica de negocio, servicios de aplicación y casos de uso.
- `ws/`: API backend y servicios web.
- `webapp/`: Capa web, integración y controladores HTTP.
- `dashboard/`: Frontend Angular.
- `template-docs/`: Documentación técnica, funcional y de arquitectura.
- `template-docker/`: Despliegue con contenedores Docker y compose.
- `template-dist/`: Artefactos de distribución empaquetados.

Documentación detallada de estructura: [template-docs/01-introduction/project-structure.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/01-introduction/project-structure.md).

## Entornos y Perfiles de Compilación

- **Entornos de ejecución:** `local`, `dev`, `int`, `qa`, `pro`.
- **Perfiles Maven:** `local`, `dist`, `test`.
- Alineación y configuración: [template-docs/04-development/environments.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/environments.md).
