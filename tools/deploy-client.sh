#!/bin/sh

cat $2 |curl --data-binary @- -X POST http://kube/func/\?name\=$1