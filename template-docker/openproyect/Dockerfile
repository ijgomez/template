# SonarQube docker:S6471 - Se requiere iniciar como root para que el entrypoint
# de OpenProject pueda gestionar permisos de volúmenes y supervisord.
# Los procesos de la aplicación reducen privilegios automáticamente a "openproject" via gosu.
FROM openproject/openproject:17

ENV OPENPROJECT_HTTPS=false \
    OPENPROJECT_HOST__NAME=localhost:8088 \
    SECRET_KEY_BASE=44b7c614a9de2fb7325a7cab4b94fe9efeb541c1c1275c7ca816e950d0e02d24eced99de0ec51cacf65bee4e8982fe2c8bc4673296a7678ece415fcbccdcbf54 \
    OPENPROJECT_RAILS__CACHE__STORE=memcache

VOLUME ["/var/openproject/assets"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health_checks/default || exit 1