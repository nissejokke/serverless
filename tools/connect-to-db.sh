#!/bin/bash

kubectl exec -it $(kubectl get pods --selector=app=mysql -o jsonpath='{.items[*].metadata.name}') -- mysql -p
