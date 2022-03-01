CREATE USER template_admin;

CREATE DATABASE template;
GRANT ALL PRIVILEGES ON DATABASE template TO template_admin;

CREATE TABLESPACE template_data OWNER template_admin LOCATION '/data/template_data';
CREATE TABLESPACE template_index OWNER template_admin LOCATION '/data/template_index';
