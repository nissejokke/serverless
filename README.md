# Serverless Deno function hosting

Serverless hosting of Deno typescript code running in docker using kubernetes.

- Deploys typescript functions in under 20 seconds
- Runs isolated in docker
- Auto scales depending on load
- Cli and http apies to manage functions

For more info:
http://svrless.net
    
## Under the hood

Request -> Router -> Client 

Router receives request and determines which app to forward to. Each app has it's own kubernetes service which can have multiple pods depending on load. Function code is injected as parameter to pre built docker image.

1. Router maps request to client app name. For example: /useragent is mapped to kubernetes service useragent-service (which pipes to useragent-app pods)
2. Request is proxied to useragent-service
3. useragent-service uses one of more pods depending on load

## Technologies

- Docker
- Kubernetes
   - Deployments, services, pods
   - Ingress
   - Horizontal auto scalers
   - Network policies
   - Persistent volumes
- Deno
- Hard coded Digital Ocean hosting only for now
- Mysql
- Jwt's for authentication

## Limit functions from accessing resources

Deno security model limits access to certain parts of the system (docker container). Deno is run with the following flags: --allow-net --allow-read=/temp --allow-write=/temp --unstable. This limits the function from accessing for example env variables. Deno process is run as custom user which has access only to current directory limiting it from accessing for example /etc/hosts.

Access to mysql database is only allowed from role manager (serverless-manager and serverless-router) using Network Policy.

Perhaps there is a possibility to access kube dns and discover info about other clients, need to be investigated.

## Prerequisite

When testing with minikube

    minikube delete
    minikube start --vm=true
    minikube addons enable ingress
    eval $(minikube docker-env)

    # Get minikube ip
    minikube ip

Kubernetes, kubectl

## Setup

    docker build -f client.Dockerfile -t nissejokke/serverless_client:latest . && docker push nissejokke/serverless_client:latest

    docker build -f router.Dockerfile -t nissejokke/serverless_router:latest . && docker push nissejokke/serverless_router:latest
    
    docker build -f manager.Dockerfile -t nissejokke/serverless_manager:latest . && docker push nissejokke/serverless_manager:latest

    kubectl apply -f kubernetes.yaml
    kubectl apply -f metric-server.yaml
    kubectl apply -f mysql.yaml

    # Set these envs on serverless-manager:
    # - KUBE_CERTIFICATE_AUTH
    # - KUBE_DOCTL_AUTH
    # - DIGITALOCEAN_ACCESS_TOKEN
    # - JWT_SECRET
    # - DB_PASSWORD

    kubectl edit deployments.apps serverless-manager

    # Set these envs on serverless-router:
    # - DB_PASSWORD

    kubectl edit deployments.apps serverless-router

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

- Remove/sleep pods not being used
- Https