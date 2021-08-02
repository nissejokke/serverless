#!/bin/sh

cat $2 |curl --data-binary @- -X POST http://svrless.net/func/\?name\=$1