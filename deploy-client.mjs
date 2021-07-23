#!/usr/bin/env zx

const [scriptName, name, codeFileName] = argv._;

try {

  if (!name) throw new Error('name required');
  if (!/^[\w\d_-]+$/.test(name)) throw new Error('name can only contain alpha numerical, dash and underscore');
  if (!codeFileName) throw new Error('code file name required');
  
  const codeRaw = (await $`cat ${codeFileName}`).stdout;
  const code = codeRaw.split('\n').join('\n' + '              ');

  const yaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${name}-app
  template:
    metadata:
      labels:
        app: ${name}-app
    spec:
      containers:
        - name: serverless-app
          image: nissejokke/serverless_client:latest
          imagePullPolicy: Always
          resources:
            limits:
              cpu: 250m
            requests:
              cpu: 5m
          env:
          - name: CLIENT_CODE
            value: |
              ${code}

---

kind: Service
apiVersion: v1
metadata:
  name: ${name}-service
spec:
  selector:
    app: ${name}-app
  ports:
    - port: 1993
`;

  await $`mkdir -p .deployments/`;
  await fs.writeFile(`.deployments/${name}.yaml`, yaml, 'utf-8');
  await $`kubectl apply -f .deployments/${name}.yaml`;
  // await $`kubectl autoscale deployment ${name}-app --cpu-percent=50 --min=1 --max=2`;
  // await $`kubectl get hpa`;
  // not working:
  // await $`kubectl rollout status -w deployments/${name}-app`;
}
catch (err) {
  console.error(err.message);
  console.error('');
  console.error(`Usage: ${scriptName} <name> <file path to code>`);
}
