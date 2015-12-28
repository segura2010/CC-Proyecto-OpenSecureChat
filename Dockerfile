
# OS
FROM ubuntu:14.04

MAINTAINER A. Segura <alberto.segura.delgado@gmail.com>

# MongoDB Installation:
# Import MongoDB public GPG key AND create a MongoDB list file
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list

RUN apt-get update
RUN apt-get install -y mongodb-org --force-yes

RUN apt-get install -y mongodb-org=3.0.1 mongodb-org-server=3.0.1 mongodb-org-shell=3.0.1 mongodb-org-mongos=3.0.1 mongodb-org-tools=3.0.1 --force-yes

# Create the MongoDB data directory
RUN mkdir -p /data/db

# You can expose port 27017 from the container to the host
# EXPOSE 27017



# Install Redis
RUN apt-get install -y redis-server --force-yes

# You can expose port 6379 from the container to the host
# EXPOSE 6379


# Install Git, NodeJS and npm
RUN apt-get install -y git git-core --force-yes
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y nodejs npm

# Install OpenSSH (if you deploy the container)
# RUN apt-get install -y openssh-server --force-yes
# EXPOSE 22

# fix bug..
RUN npm config set registry http://registry.npmjs.org/


# VOLUMES for Redis and MongoDB
VOLUME ["/data"]

# Start services

# MongoDB
RUN /usr/bin/mongod &

# Redis
RUN /usr/bin/redis-server &

# Download lastest version of OSC
RUN git clone -b production https://github.com/segura2010/CC-Proyecto-OpenSecureChat.git

WORKDIR "/CC-Proyecto-OpenSecureChat"

EXPOSE 3000

RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN npm cache clean
RUN npm install
RUN npm install grunt-cli -g
RUN npm install bower -g
RUN grunt setup
CMD ["/bin/bash", "docker_start.sh"]
