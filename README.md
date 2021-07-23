# Serverless hosting experiment (work in progress)

Serverless hosting of Deno typescript code running in docker using kubernetes.

## How it works

Request -> Router -> Client 

Router receives request and determines which app to forward to. Each app is it's own kubernetes service which can have multiple pods depending on load.

1. Request url is mapped to client app name. For example: /useragent is mapped to kubernetes service useragent-service (which pipes to useragent-app pods)
2. Request is proxied to useragent-service
3. useragent-service uses one of more pods

## Prerequisite

    minikube delete
    minikube start --vm=true
    minikube addons enable ingress
    eval $(minikube docker-env)
    sudo npm i -g zx

## Setup

    docker build -f client.Dockerfile -t serverless_client:latest . 
    docker build -f router.Dockerfile -t serverless_router:latest . 
    kubectl apply -f kubernetes.yaml
    kubectl apply -f metric-server.yaml

## Running

    minikube ip

    ./deploy-client.mjs useragent examples/useragent.ts
    curl http://{ip}/useragent

    ./deploy-client.mjs cards examples/cards.ts
    curl http://{ip}/cards/draw

    # Simulates loads for auto scaling testing
    ./deploy-client.mjs load examples/load.ts
    curl http://{ip}/load

# Auto scaling

kubectl autoscale deployment load-app --cpu-percent=75 --min=1 --max=10

# Before production

Remove - --kubelet-insecure-tls in metric-server.yaml

# Resources

https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-on-digitalocean-kubernetes-using-helm

# Good to know

Scaled coredns and cilium-operator to 1 replicas