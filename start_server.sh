#!/usr/bin/env bash
docker-compose up -d db

docker exec -it hygieiacluster_db_1 bash
mongo 127.0.0.1/admin
use dashboarddb
db.createUser({user: "dashboarduser", pwd: "dbpassword", roles: [{role: "readWrite", db: "dashboarddb"}]})

docker-compose up -d api
docker-compose up -d ui
