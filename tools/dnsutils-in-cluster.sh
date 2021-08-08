#!/bin/bash

kubectl run -i --tty busybox --image=tutum/dnsutils --restart=Never -- /bin/bash