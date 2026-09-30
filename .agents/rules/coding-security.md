# Reglas de Seguridad

Aplica a todos los módulos backend y frontend (`**/*.{java,ts,html,scss}`).

## Principios y Convenciones

- Nunca expongas credenciales, secretos, tokens o contraseñas en código fuente ni ficheros de configuración versionados.
- Validación estricta y sanitización de todas las entradas de usuario tanto en cliente como en servidor.
- Control de acceso basado en roles (RBAC) y autorización a nivel de servicio y endpoint.
- Protección contra vulnerabilidades OWASP Top 10 (SQL Injection, XSS, CSRF, IDOR, etc.).
- Gestión de sesiones y tokens JWT segura (tiempos de expiración adecuados, firma robusta).
- Sigue la guía oficial: [template-docs/04-development/coding-guidelines/security.md](file:///Users/ijgomez/Documents/workspace/template/template-docs/04-development/coding-guidelines/security.md).
