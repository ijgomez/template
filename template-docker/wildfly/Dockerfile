FROM quay.io/wildfly/wildfly:latest-jdk21

COPY --chmod=755 docker-entrypoint.sh /opt/jboss/wildfly/bin/docker-entrypoint.sh

EXPOSE 8080 9990

CMD ["/opt/jboss/wildfly/bin/docker-entrypoint.sh"]
