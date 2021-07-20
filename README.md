# How it works

Request -> Router -> Client 

Router receives request and determines which instance to forward to. The serverless app could be on one or more instances depending on load.


# Building

docker build -f client.Dockerfile -t serverless_client:latest . 
docker build -f router.Dockerfile -t serverless_router:latest . 

# Running

kubectl apply -f kubernetes.yaml

curl http://localhost:4000

# Running just client

docker run -p 1993:1993 -v $(pwd)/src:/app serverless_client:latest

curl http://localhost:1993

# Useful commands

eval $(minikube docker-env)
minikube delete
minikube start --vm=true
minikube addons enable ingress