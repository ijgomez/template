FROM alpine:3.21 AS postgres-driver
ARG POSTGRESQL_JDBC_VERSION=42.7.7
RUN apk add --no-cache ca-certificates curl \
    && curl --fail --location --silent --show-error \
       "https://repo.maven.apache.org/maven2/org/postgresql/postgresql/${POSTGRESQL_JDBC_VERSION}/postgresql-${POSTGRESQL_JDBC_VERSION}.jar" \
       --output /tmp/postgresql.jar

FROM quay.io/wildfly/wildfly:latest-jdk21
USER root

RUN mkdir -p /opt/jboss/wildfly/modules/system/layers/base/org/postgresql/main
COPY --from=postgres-driver /tmp/postgresql.jar /opt/jboss/wildfly/modules/system/layers/base/org/postgresql/main/postgresql.jar
COPY --chmod=644 postgresql-module.xml /opt/jboss/wildfly/modules/system/layers/base/org/postgresql/main/module.xml
COPY --chmod=644 register-postgresql-driver.cli /tmp/register-postgresql-driver.cli
RUN jar tf /opt/jboss/wildfly/modules/system/layers/base/org/postgresql/main/postgresql.jar >/dev/null \
    && /opt/jboss/wildfly/bin/jboss-cli.sh --file=/tmp/register-postgresql-driver.cli \
    && rm /tmp/register-postgresql-driver.cli \
    && chown -R jboss:root /opt/jboss/wildfly/modules/system/layers/base/org/postgresql /opt/jboss/wildfly/standalone

COPY --chmod=755 docker-entrypoint.sh /opt/jboss/wildfly/bin/docker-entrypoint.sh

USER jboss
EXPOSE 8080 9990
CMD ["/opt/jboss/wildfly/bin/docker-entrypoint.sh"]
