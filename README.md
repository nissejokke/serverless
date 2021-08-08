# Serverless Deno function hosting

Serverless hosting of Deno typescript code running in docker using kubernetes.

- Deploys typescript functions in under 20 seconds
- Runs isolated in Docker
- Auto scales depending on load
- Cli and http apies to manage functions

For more info:
https://svrless.net
    
## Under the hood

Request -> Router -> Client 

Router receives request and determines which app to forward to. Each app has it's own kubernetes service which can have multiple pods depending on load. Function code is injected as parameter to pre built docker image.

1. Router maps request to client app name. For example: /xxx/useragent (user/function name) is mapped to kubernetes service xxx-useragent-service (which pipes to xxx-useragent-app pods)
2. Request is proxied to xxx-useragent-service
3. xxx-useragent-service uses one of more pods depending on load

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

Only role manager can call clients.

Clients use only external DNS to make it hander to discover information about other clients.

There might be a possibility to do DNS requests against cluster's core dns ip to lookup service adresses. For example nslookup 10.245.150.16 equivalent in Deno code would get the service dns name. This could be mitigated by using names of services which cannot be translatable to svrless.net urls, thought this would require storing a random id in a database and fetch that id before proxying to client - which increases complexity and decreases performance.

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

    # install nginx ingress and cert-manager using helm:
    https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-on-digitalocean-kubernetes-using-helm

    # Create cert using openssl, enter keys in cert.yaml, described here: https://cert-manager.io/docs/configuration/ca/
    kubectl apply -f cert.yaml
    kubectl apply -f production-issuer.yaml

## Creating and running functions

    # Creates a function named "useragent" with code from examples/useragent.ts
    curl --data-binary @examples/useragent.ts -X POST -H "Authorization: Bearer xxx" https://svrless.net/func\?name\=useragent

    # Call with:
    curl https://svrless.net/fn/xxxxx/useragent

## Deleting functions

    curl -X DELETE -H "Authorization: Bearer xxx" https://svrless.net/func/useragent

## Auto scaling

Auto scaling rules are created with each function. Create manuall using:

kubectl autoscale deployment load-app --cpu-percent=75 --min=1 --max=10

## Before production

Remove - --kubelet-insecure-tls in metric-server.yaml

## Resources

- https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-on-digitalocean-kubernetes-using-helm
- https://kubernetes.io/blog/2015/10/some-things-you-didnt-know-about-kubectl_28/

## Good to know

Scaled coredns and cilium-operator from 2 to 1 replicas
Also lowered cpu request

## TODO

- Remove/sleep pods not being used
