FROM alpine:latest
USER root

## The downloaded files will be placed in /tmp to be deleted at the end.
WORKDIR /tmp

## Update Operative System
RUN apk update &&  apk upgrade

## Install openjdk alpine
RUN apk fetch openjdk12
RUN apk add openjdk12

## Download tomcat 9
RUN wget https://downloads.apache.org/tomcat/tomcat-9/v9.0.59/bin/apache-tomcat-9.0.59.tar.gz

## Install tomcat
RUN tar -zxvf /tmp/apache-tomcat-9.0.59.tar.gz -C /usr/local
RUN cd /usr/local && mv apache-tomcat-9.0.59 tomcat

## Driver PostgreSQL
RUN wget https://jdbc.postgresql.org/download/postgresql-42.3.3.jar
RUN mv /tmp/postgresql-42.3.3.jar /usr/local/tomcat/lib

## Copy file confg
COPY ./config/server.xml /usr/local/tomcat/conf/server.xml
COPY ./config/logging.properties /usr/local/tomcat/conf/logging.properties
COPY ./config/tomcat-users.xml /usr/local/tomcat/conf/tomcat-users.xml

COPY ./config/context.xml /usr/local/tomcat/webapps/manager/META-INF/context.xml
COPY ./config/context.xml /usr/local/tomcat/webapps/host-manager/META-INF/context.xml

## Remove installer downloaded
RUN rm -rf /tmp

## Export ports
EXPOSE 8080

## Start tomcat
CMD sh /usr/local/tomcat/bin/catalina.sh start && tail -f /usr/local/tomcat/logs/catalina.out
