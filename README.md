# Building

docker build -t serverless:latest . 

# Running

deno run --allow-net --unstable src/router.ts
docker-compose up

curl http://localhost:1990

# Running just client

docker-compose up

or 

docker run -p 1993:1993 -v $(pwd)/src:/app serverless:latest

curl http://localhost:1993

# How it works

Request -> Router -> Instance 

Router service determines which instance to forward request to. The serverless app could be on one or more instances depending on load. The serverless app could use redis to store which instances an app is on or as a start just in text file / memory.
