FROM postgres:14.2-alpine

# tablespace
RUN mkdir -pv /var/lib/postgresql/data/template_data
RUN mkdir -pv /var/lib/postgresql/data/template_index

COPY ./config/init.sql /docker-entrypoint-initdb.d/