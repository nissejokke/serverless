# Serverless deno function hosting experiment

Serverless hosting of Deno typescript code running in docker using kubernetes.

- Deploys function in under 20s
- Runs isolated in docker
- Auto scales depending on load
- Cli and http apies to manage functions

For more info:
http://svrless.net
    
# Under the hood

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
    curl --data-binary @examples/useragent.ts -X POST -H "Authorization: Bearer xxx" http://svrless.net/func\?name\=useragent

    # Call with:
    curl http://svrless.net/fn/xxxxx/useragent

## Deleting functions

    curl -X DELETE -H "Authorization: Bearer xxx" http://svrless.net/func/useragent

## Auto scaling

Auto scaling rules are created with each function. Create manuall using:

kubectl autoscale deployment load-app --cpu-percent=75 --min=1 --max=10

## Before production

Remove - --kubelet-insecure-tls in metric-server.yaml

## Resources

https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-on-digitalocean-kubernetes-using-helm

## Good to know

Scaled coredns and cilium-operator from 2 to 1 replicas
Also lowered cpu request

## TODO

- Func log
- Remove/sleep pods not being used
- Https