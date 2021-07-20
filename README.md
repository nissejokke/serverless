# Serverless hosting experiment (work in progress)

Users can host their Deno typescript code as a serverless function with autoscaling.

## How it works

Request -> Router -> Client 

Router receives request and determines which app to forward to. Each app is its own kubernetes service which can have multiple pods depending on load.

## Setup

minikube delete
minikube start --vm=true
minikube addons enable ingress
eval $(minikube docker-env)

## Building

docker build -f client.Dockerfile -t serverless_client:latest . 
docker build -f router.Dockerfile -t serverless_router:latest . 

## Running

kubectl apply -f kubernetes.yaml

minikube ip
curl http://{ip}:4000

## Running just client

docker run -p 1993:1993 -v $(pwd)/src:/app serverless_client:latest

curl http://localhost:1993

