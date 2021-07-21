# Serverless hosting experiment (work in progress)

Serverless hosting of Deno typescript code running in docker using kubernetes.

## How it works

Request -> Router -> Client 

Router receives request and determines which app to forward to. Each app is it's own kubernetes service which can have multiple pods depending on load.

1. Request url is mapped to client app name. For example: /useragent is mapped to kubernetes service useragent-service (which pipes to useragent-app pods)
2. Request is proxied to useragent-service
3. useragent-service uses one of more pods

## Setup

    minikube delete
    minikube start --vm=true
    minikube addons enable ingress
    eval $(minikube docker-env)
    sudo npm i -g zx

## Building

    docker build -f client.Dockerfile -t serverless_client:latest . 
    docker build -f router.Dockerfile -t serverless_router:latest . 

## Running

    minikube ip
    kubectl apply -f kubernetes.yaml

    ./deploy-client.mjs useragent examples/useragent.ts
    curl http://{ip}/useragent

    ./deploy-client.mjs cards examples/cards.ts
    curl http://{ip}/cards/draw

## Running just client

    docker run -p 1993:1993 -v $(pwd)/src:/app serverless_client:latest

    curl http://localhost:1993

