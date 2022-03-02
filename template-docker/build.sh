#!/bin/bash
set -e

docker build -t nginx-base:latest ./nginx

docker build -t tomcat-base:latest ./tomcat

docker build -t postgresql-base:latest ./postgresql