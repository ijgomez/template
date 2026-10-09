-- Script de inicializacion ejecutado solo la primera vez que se crea el volumen de datos.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'template_admin') THEN
    CREATE ROLE template_admin LOGIN PASSWORD 'template_admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'template_user') THEN
    CREATE ROLE template_user LOGIN PASSWORD 'template_user';
  END IF;
END
$$;

CREATE TABLESPACE openproject_data_tbs
  OWNER administrador
  LOCATION '/var/lib/postgresql/tablespaces/openproject_data';

CREATE TABLESPACE openproject_index_tbs
  OWNER administrador
  LOCATION '/var/lib/postgresql/tablespaces/openproject_index';

CREATE DATABASE openproject
  OWNER administrador
  TABLESPACE openproject_data_tbs;

ALTER DATABASE openproject SET default_tablespace = 'openproject_data_tbs';



CREATE SCHEMA IF NOT EXISTS template AUTHORIZATION administrador;
ALTER SCHEMA template OWNER TO administrador;

CREATE TABLESPACE template_data_tbs
  OWNER administrador
  LOCATION '/var/lib/postgresql/tablespaces/template_data';

CREATE TABLESPACE template_index_tbs
  OWNER administrador
  LOCATION '/var/lib/postgresql/tablespaces/template_index';

ALTER DATABASE template SET default_tablespace = 'template_data_tbs';

GRANT CREATE ON SCHEMA template TO template_admin;
GRANT USAGE ON SCHEMA template TO template_admin;
GRANT USAGE ON SCHEMA template TO template_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA template TO template_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA template TO template_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA template TO template_admin;

ALTER DEFAULT PRIVILEGES FOR ROLE administrador IN SCHEMA template
  GRANT ALL PRIVILEGES ON TABLES TO template_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE administrador IN SCHEMA template
  GRANT ALL PRIVILEGES ON SEQUENCES TO template_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE administrador IN SCHEMA template
  GRANT ALL PRIVILEGES ON FUNCTIONS TO template_admin;

GRANT CREATE ON TABLESPACE template_data_tbs TO template_admin;
GRANT CREATE ON TABLESPACE template_index_tbs TO template_admin;
