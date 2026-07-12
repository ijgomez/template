# Lista de verificacion para PR

## Alcance y arquitectura

- [ ] La funcionalidad esta en el modulo correcto.
- [ ] Se mantiene la organizacion por feature.
- [ ] No se introdujo logica de negocio en controladores.

## API y contratos

- [ ] Endpoint bajo /api/v1/.
- [ ] Se usan DTOs, no entidades JPA.
- [ ] Codigos HTTP y errores siguen el contrato.

## Seguridad

- [ ] Endpoint protegido con politica de acceso adecuada.
- [ ] No hay secretos en codigo, logs o respuestas.
- [ ] CORS y autenticacion siguen configuracion central.

## Datos y migraciones

- [ ] Migracion Liquibase incluida si hay cambios de esquema.
- [ ] Changeset con precondiciones y rollback.
- [ ] Version y labels correctos.

## Build y pruebas

- [ ] Build Maven exitosa.
- [ ] Tests backend relevantes ejecutados.
- [ ] Cobertura y calidad revisadas cuando aplique.

## Documentacion

- [ ] Se actualizaron documentos tecnicos impactados.
- [ ] Cambios no funcionales explicados en la PR.
