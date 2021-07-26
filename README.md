# Serverless deno function hosting experiment (work in progress)

Serverless hosting of Deno typescript code running in docker using kubernetes.

- Deploys function in under 20s
- Runs isolated in docker
- Auto scales depending on load
- Http apies to manage functions

## How it works

Request -> Router -> Client 

Router receives request and determines which app to forward to. Each app has it's own kubernetes service which can have multiple pods depending on load. Function code is injected as parameter to pre built docker image.

1. Router maps request to client app name. For example: /useragent is mapped to kubernetes service useragent-service (which pipes to useragent-app pods)
2. Request is proxied to useragent-service
3. useragent-service uses one of more pods depending on load

## Prerequisite

    minikube delete
    minikube start --vm=true
    minikube addons enable ingress
    eval $(minikube docker-env)

## Setup

    docker build -f client.Dockerfile -t nissejokke/serverless_client:latest . && docker push nissejokke/serverless_client:latest
    docker build -f router.Dockerfile -t nissejokke/serverless_router:latest . && docker push nissejokke/serverless_router:latest
    docker build -f manager.Dockerfile -t nissejokke/serverless_manager:latest . && docker push nissejokke/serverless_manager:latest

    kubectl apply -f kubernetes.yaml
    kubectl apply -f metric-server.yaml

    # minikube ip
    # host kube in hosts in following examples

## Creating and running functions

    # Creates a function named "useragent" with code from examples/useragent.ts
    curl --data-binary @examples/useragent.ts -X POST http://kube/func\?name\=useragent

    # Call with:
    curl http://kube/fn/useragent

    # Draws a random playing card
    curl --data-binary @examples/cards.ts -X POST http://kube/func\?name\=cards

    # Call with
    curl http://kube/fn/cards/draw

    # Simulates loads for auto scaling testing
    curl --data-binary @examples/load.ts -X POST http://kube/func\?name\=load
    curl http://kube/fn/load

    # Http framework test
    curl --data-binary @examples/http.ts -X POST http://kube/func\?name\=http
    curl http://kube/fn/http/book/1

## Deleting functions

    curl -X DELETE http://kube/func/useragent
    curl -X DELETE http://kube/func/cards
    curl -X DELETE http://kube/func/load
    curl -X DELETE http://kube/func/http

# Auto scaling

Auto scaling rules are created with each function. Create manuall using:

kubectl autoscale deployment load-app --cpu-percent=75 --min=1 --max=10

# Before production

Remove - --kubelet-insecure-tls in metric-server.yaml

# Resources

https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-on-digitalocean-kubernetes-using-helm

# Good to know

Scaled coredns and cilium-operator from 2 to 1 replicas
Also lowered cpu request