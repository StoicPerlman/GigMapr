FROM keymetrics/pm2-docker-alpine:latest

RUN mkdir -p /opt/GigMapr
WORKDIR /opt/GigMapr

COPY package.json /opt/GigMapr/package.json
COPY bower.json /opt/GigMapr/bower.json

RUN npm install

# Bower install needs allow_root because build runs as root
RUN npm install -g bower
RUN echo '{ "allow_root": true, "directory" : "public/bower_components" }' > /root/.bowerrc
RUN bower install

COPY . /opt/GigMapr

EXPOSE 3000

CMD pm2 start bin/www --name "GigMapr" --no-daemon
