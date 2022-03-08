# Template-Docker

## Run each container separately

Run Nginx:
`docker run -dit -p 80:80 --rm --name nginx-master nginx-base:latest`

Run Tomcat
`docker run -dit -p 8080:8080 --rm --name tomcat-master tomcat-base:latest`

## Run

Create and start containers: `up.sh`

Stop and remove containers, networks, volumes: `down.sh`

Starts existing containers for a service: `start.sh`

Stops running containers without removing them: `stop.sh`
