-- Script de inicializacion ejecutado solo la primera vez que se crea el volumen de datos.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'administrador') THEN
    CREATE ROLE administrador LOGIN PASSWORD 'administrador';
  END IF;

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

CREATE TABLESPACE template_data_tbs
  OWNER template_admin
  LOCATION '/var/lib/postgresql/tablespaces/template_data';

CREATE TABLESPACE template_index_tbs
  OWNER template_admin
  LOCATION '/var/lib/postgresql/tablespaces/template_index';

CREATE EXTENSION IF NOT EXISTS pgagent;

SELECT 'CREATE DATABASE openproject OWNER administrador TABLESPACE openproject_data_tbs'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'openproject')\gexec
ALTER DATABASE openproject SET default_tablespace = 'openproject_data_tbs';

CREATE SCHEMA IF NOT EXISTS template AUTHORIZATION template_admin;
ALTER SCHEMA template OWNER TO template_admin;
ALTER DATABASE template SET default_tablespace = 'template_data_tbs';
ALTER ROLE template_admin SET default_tablespace = 'template_data_tbs';
ALTER ROLE template_user SET default_tablespace = 'template_data_tbs';
-- search_path de los usuarios de la aplicación, solo al conectarse a la BD 'template':
-- las sentencias sin esquema explícito se resuelven en el esquema 'template'.
ALTER ROLE template_admin IN DATABASE template SET search_path TO template, public;
ALTER ROLE template_user IN DATABASE template SET search_path TO template, public;

GRANT CONNECT ON DATABASE template TO template_admin;
GRANT CONNECT ON DATABASE template TO template_user;
GRANT CREATE ON SCHEMA template TO template_admin;
GRANT USAGE ON SCHEMA template TO template_admin;
GRANT USAGE ON SCHEMA template TO template_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA template TO template_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA template TO template_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA template TO template_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA template TO template_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA template TO template_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA template TO template_user;

ALTER DEFAULT PRIVILEGES FOR ROLE template_admin IN SCHEMA template
  GRANT ALL PRIVILEGES ON TABLES TO template_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE template_admin IN SCHEMA template
  GRANT ALL PRIVILEGES ON SEQUENCES TO template_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE template_admin IN SCHEMA template
  GRANT ALL PRIVILEGES ON FUNCTIONS TO template_admin;

ALTER DEFAULT PRIVILEGES FOR ROLE template_admin IN SCHEMA template
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO template_user;
ALTER DEFAULT PRIVILEGES FOR ROLE template_admin IN SCHEMA template
  GRANT USAGE, SELECT ON SEQUENCES TO template_user;
ALTER DEFAULT PRIVILEGES FOR ROLE template_admin IN SCHEMA template
  GRANT EXECUTE ON FUNCTIONS TO template_user;

GRANT CREATE ON TABLESPACE template_data_tbs TO template_admin;
GRANT CREATE ON TABLESPACE template_index_tbs TO template_admin;
