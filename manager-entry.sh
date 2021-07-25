#!/bin/sh
# source: https://github.com/denoland/deno_docker/blob/main/_entry.sh
set -e

sed -i 's@KUBE_CERTIFICATE_AUTH@'"$KUBE_CERTIFICATE_AUTH"'@g' ~/.kube/config
sed -i 's@KUBE_SERVER@'"$KUBE_SERVER"'@g' ~/.kube/config
sed -i 's@KUBE_DOCTL_AUTH@'"$KUBE_DOCTL_AUTH"'@g' ~/.kube/config
doctl auth init

case "$1" in
    bundle | cache | compile | completions | coverage | doc | eval | fmt | help | info | install | lint | lsp | repl | run | test | types | upgrade )
    exec deno "$@";;
esac

exec "$@"