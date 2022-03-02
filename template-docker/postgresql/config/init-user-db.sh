#!/bin/bash
set -e

mkdir -pv /var/lib/postgresql/data/template_data
mkdir -pv /var/lib/postgresql/data/template_index

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER template_admin with encrypted password 'template_admin';
    CREATE USER template_user with encrypted password 'template_user';

    CREATE DATABASE template;
    GRANT ALL PRIVILEGES ON DATABASE template TO template_admin;

    CREATE TABLESPACE template_data OWNER template_admin LOCATION '/var/lib/postgresql/data/template_data';
    CREATE TABLESPACE template_index OWNER template_admin LOCATION '/var/lib/postgresql/data/template_index';

EOSQL