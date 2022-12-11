FROM nginx:alpine

# COPY config/index.html /usr/share/nginx/html/index.html
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf

COPY ./ssl/* /etc/ssl/certs

EXPOSE 80
EXPOSE 443

VOLUME [ "/var/log/nginx" ]