#!/bin/bash -x

BASEDIR=`dirname $0`
cd ${BASEDIR}

docker compose down

sleep 3
rm -Rf ./docker/postgres/data

docker compose up -d --build

sleep 20

# cp -n .env.example .env

docker compose exec node bash -c "npm run migrate"
docker compose exec node bash -c "npm run seed"

echo "Demo site for SaaSus Platform has bees deployed!"
echo "Go and Log in from the login page you have set up in SaaSus platform"
