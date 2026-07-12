# Guia de Ingenieria

## Objetivo

Asegurar que cualquier desarrollo nuevo en este template sea consistente, mantenible y desplegable sin friccion.

## Lista de implementacion

### 1. Diseno de funcionalidad

- Definir la feature y ubicarla en el modulo correcto.
- Confirmar el contrato REST bajo /api/v1/.
- Definir DTOs de entrada y salida.

### 2. Desarrollo backend

- Implementar el controlador sin logica de negocio.
- Delegar al servicio correspondiente.
- Usar repositorio con filtros por criterios paginados cuando corresponda.
- Aplicar validaciones de entrada con Bean Validation.

### 3. Seguridad

- Confirmar la regla de acceso para cada endpoint nuevo.
- Anadir autorizacion a nivel de metodo si aplica.
- Verificar que no se exponen datos sensibles en respuesta ni en logs.

### 4. Base de datos

- Crear migracion Liquibase en la carpeta de version correcta.
- Incluir labels de version.
- Incluir precondiciones y rollback.

### 5. Frontend

- Implementar consumo de API desde servicio.
- Mantener modelos TypeScript alineados con DTOs backend.
- Usar variables de environment para toda configuracion.

### 6. Calidad

- Ejecutar tests de backend.
- Ejecutar tests de frontend cuando exista modulo.
- Revisar cobertura y reglas de calidad.

## Definicion de terminado

- Build exitosa.
- Tests relevantes en verde.
- Sin violaciones evidentes de seguridad o convenciones.
- Documentacion tecnica minima actualizada.
