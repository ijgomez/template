FROM httpd:2.4

# Certificado autofirmado para HTTPS (sólo pruebas; en producción montar uno real)
RUN openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
       -subj "/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,DNS:template-apache" \
       -keyout /usr/local/apache2/conf/server.key \
       -out /usr/local/apache2/conf/server.crt \
    && chmod 600 /usr/local/apache2/conf/server.key

COPY --chmod=644 httpd.conf /usr/local/apache2/conf/httpd.conf

EXPOSE 80 443
