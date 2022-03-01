FROM alpine:latest
USER root

## Los archivos descargados se ubicaran en /tmp para ser borrados al final
WORKDIR /tmp

## Actualizando alpine
RUN apk update &&  apk upgrade

## Instalar openjdk alpine
RUN apk fetch openjdk8-jre
RUN apk add openjdk8-jre

## Descargar tomcat 9
RUN wget https://downloads.apache.org/tomcat/tomcat-9/v9.0.59/bin/apache-tomcat-9.0.59.tar.gz

## Instalar tomcat
RUN tar -zxvf /tmp/apache-tomcat-9.0.59.tar.gz -C /usr/local
RUN cd /usr/local && mv apache-tomcat-9.0.59 tomcat

## Eliminar instaladores descargados
RUN cd /tmp && rm *

## Exponer puerto
EXPOSE 8080

## Iniciar tomcat
CMD sh /usr/local/tomcat/bin/catalina.sh start && tail -f /usr/local/tomcat/logs/catalina.out
