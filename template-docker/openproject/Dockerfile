# SonarQube docker:S6471 - OpenProject necesita iniciar como root para gestionar volúmenes.
FROM openproject/openproject:17

ENV OPENPROJECT_HTTPS=false \
    OPENPROJECT_HOST__NAME=localhost:8088 \
    OPENPROJECT_RAILS__CACHE__STORE=memcache

COPY --chmod=644 servername.conf /etc/apache2/conf-enabled/zz-servername.conf
COPY --chmod=755 docker-entrypoint-secrets.sh /usr/local/bin/docker-entrypoint-secrets.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-secrets.sh"]

VOLUME ["/var/openproject/assets"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health_checks/default || exit 1
