# Descripción del Producto

Este documento define los requisitos para la aplicación SPA (Single Page Application) y PWA (Progressive Web App) que sirve como plantilla base para generar nuevos proyectos. La plantilla integra un backend Java/Spring Boot con un frontend Angular, proporcionando las funcionalidades transversales necesarias en toda aplicación empresarial: autenticación, autorización basada en perfiles y acciones, gestión de usuarios, navegación, un layout responsivo y adaptativo, soporte offline e instalabilidad en dispositivos, y una interfaz multiidioma que se adapta automáticamente al Locale del usuario. La aplicación se organiza en tres módulos funcionales principales: Informes (generación, consulta y exportación de datos consolidados), Interfaces (monitor de actividad de integraciones y configuración de interfaces con sistemas externos) y Administración (seguridad con usuarios, perfiles y acciones; parámetros generales; auditoría del sistema; y gestión del cluster). El objetivo es que cualquier nuevo proyecto pueda partir de esta base con las piezas fundamentales ya resueltas.


---

# Requisitos Funcionales — Autenticación y Gestión de Sesión

Los requisitos funcionales de autenticación y gestión de sesión (login y emisión de tokens, persistencia y recuperación automática de sesión, renovación del access token, logout, rotación y revocación del refresh token y configuración externalizable) se especifican en el documento funcional dedicado:

- [Autenticación y Gestión de Sesión](../02-functional/login/authentication.md) (`RF-AUT-*` / `RNF-AUT-*`)

Documentos funcionales relacionados:

- [Login (pantalla de inicio de sesión)](../02-functional/login/login.md)

# Requisitos Funcionales — Buscador global

Los requisitos del buscador global del header (búsqueda transversal en usuarios, parámetros e interfaces, popup de resultados agrupados, navegación al detalle, degradación elegante y accesibilidad con patrón Combobox ARIA) se especifican en el documento funcional dedicado:

- [Buscador global](../02-functional/global-search/global-search.md) (`RF-GSR-*` / `RNF-GSR-*`)

Especificación de origen: [requirements](../../.kiro/specs/global-search/requirements.md) y [design](../../.kiro/specs/global-search/design.md).
