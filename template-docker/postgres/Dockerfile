FROM postgres:18

ENV POSTGRES_DB=template \
  POSTGRES_USER=administrador \
  POSTGRES_PASSWORD=administrador \
    PGDATA=/var/lib/postgresql/18/docker

COPY init-tablespaces.sh /docker-entrypoint-initdb.d/00-init-tablespaces.sh
COPY init.sql /docker-entrypoint-initdb.d/10-init.sql

VOLUME ["/var/lib/postgresql"]

EXPOSE 5432

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1
