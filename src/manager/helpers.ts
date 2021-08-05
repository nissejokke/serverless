import { getKubernetesResourceName } from "../common/kubernetes.ts";

/**
 * Validate function name
 * @param name 
 * @returns 
 */
 export function validateFuncName(name?: string) {
    if (!name) throw new Error('name required');
    if (!/^[\w\d-]+$/.test(name)) throw new Error('name can only contain alpha numerical, dash and underscore');
    return name;
  }


/**
 * Run command
 * @param cmd 
 * @returns 
 */
export async function run(cmd: string[] | [URL, ...string[]]): Promise<{ stdout: string, stderr: string }> {
    const p = Deno.run({ 
      cmd,
      stdout: "piped",
      stderr: "piped"  
    });
    await p.status();
    const errorString = new TextDecoder().decode(await p.stderrOutput());
    const outStr = new TextDecoder().decode(await p.output());
    p.close();
    return { stdout: outStr, stderr: errorString };
}

/**
 * Service config yaml for function
 * @param name 
 * @param code 
 * @returns 
 */
export function getServiceConfig(userId: string, funcName: string, code: string): string {
  const name = getKubernetesResourceName(userId, funcName);
  const codeTabbed = code.split('\n').join('\n' + '              ');
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
        role: client
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
          livenessProbe:
            httpGet:
              path: /healthz
              port: 1993
              httpHeaders:
              - name: User-Agent
                value: Probe
            initialDelaySeconds: 3
            periodSeconds: 3
          startupProbe:
            httpGet:
              path: /healthz
              port: 1993
              httpHeaders:
              - name: User-Agent
                value: Probe
            failureThreshold: 30
            periodSeconds: 10
          env:
          - name: CLIENT_CODE
            value: |
              ${codeTabbed}
      dnsConfig:
        nameservers:
          - 8.8.8.8
          - 8.8.4.4
      dnsPolicy: None
      
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

---

kind: HorizontalPodAutoscaler
apiVersion: autoscaling/v1
metadata:
  name: ${name}-scaler
  namespace: default
spec:
  minReplicas: 1
  maxReplicas: 5
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}-app
  targetCPUUtilizationPercentage: 70
`;
  return yaml;
}
