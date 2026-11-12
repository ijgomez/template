-- Inicialización del PostgreSQL de Testcontainers: replica lo que hace
-- template-docker/postgres/init.sql (esquema 'template' y tablespaces de datos e índices).
-- Los tablespaces 'in-place' (LOCATION '') evitan tener que crear directorios en el contenedor.
SET allow_in_place_tablespaces = on;
CREATE TABLESPACE template_data_tbs LOCATION '';
CREATE TABLESPACE template_index_tbs LOCATION '';
CREATE SCHEMA IF NOT EXISTS template;
-- Las consultas SQL de los tests (JdbcTemplate) no cualifican el esquema.
DO $$ BEGIN
  EXECUTE format('ALTER DATABASE %I SET search_path TO template, public', current_database());
END $$;
