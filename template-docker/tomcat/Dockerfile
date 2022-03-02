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

## Remove installer downloaded
RUN cd /tmp && rm *

## Export ports
EXPOSE 8080

## Start tomcat
CMD sh /usr/local/tomcat/bin/catalina.sh start && tail -f /usr/local/tomcat/logs/catalina.out
