FROM postgres:18

RUN apt-get update \
    && apt-get install -y --no-install-recommends pgagent \
    && rm -rf /var/lib/apt/lists/*

ENV PGDATA=/var/lib/postgresql/18/docker

COPY --chmod=755 docker-entrypoint-secrets.sh /usr/local/bin/docker-entrypoint-secrets.sh
COPY --chmod=755 init-tablespaces.sh /docker-entrypoint-initdb.d/00-init-tablespaces.sh
COPY --chmod=644 init.sql /docker-entrypoint-initdb.d/10-init.sql

VOLUME ["/var/lib/postgresql"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-secrets.sh"]

EXPOSE 5432

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1
