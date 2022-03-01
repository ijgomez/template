FROM postgres:14.2-alpine

# tablespace
RUN mkdir -pv /var/lib/postgresql/data/TEMPLATE_DATA
RUN mkdir -pv /var/lib/postgresql/data/TEMPLATE_INDEX

COPY ./config/init.sql /docker-entrypoint-initdb.d/