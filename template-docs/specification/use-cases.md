# Casos de uso

## UC-GSR-01: Buscar y abrir un registro desde el header

- **Actor:** usuario autenticado.
- **Precondición:** sesión iniciada; el usuario tiene permiso de lectura sobre al menos una entidad buscable.
- **Flujo principal:**
  1. El usuario escribe al menos 2 caracteres en el buscador global.
  2. El sistema espera 300 ms y consulta en paralelo las entidades permitidas (usuarios, parámetros, interfaces).
  3. El sistema muestra el popup de resultados agrupados por tipo.
  4. El usuario selecciona un resultado con clic o con teclado (↑/↓ y Enter).
  5. El sistema navega al detalle y cierra el popup.
- **Flujos alternativos:**
  - Sin coincidencias: se muestra el mensaje de resultados vacíos.
  - Una entidad falla: se muestran las demás y el grupo afectado indica el error (degradación elegante).
  - *Ver todos*: se abre el listado de la entidad con el filtro aplicado desde la URL.
  - `Escape`, clic fuera o campo vacío: se cierra el popup.
- **Postcondición:** el usuario ve el detalle o el listado filtrado del registro elegido.
- **Documentación:** [Buscador global](../02-functional/global-search/global-search.md).
