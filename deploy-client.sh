#!/bin/sh

cat $2 |curl --data-binary @- -X POST http://kube/_manager/func/\?name\=$1