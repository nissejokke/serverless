#!/bin/sh
# source: https://github.com/denoland/deno_docker/blob/main/_entry.sh
set -e

echo "$CLIENT_CODE" > func.ts

case "$1" in
    bundle | cache | compile | completions | coverage | doc | eval | fmt | help | info | install | lint | lsp | repl | run | test | types | upgrade )
    exec deno "$@";;
esac

exec "$@"