import { Application, helpers, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";

const app = new Application();
const router = new Router();

/**
 * Validate function name
 * @param name 
 * @returns 
 */
function validateFuncName(name?: string) {
  if (!name) throw new Error('name required');
  if (!/^[\w\d_-]+$/.test(name)) throw new Error('name can only contain alpha numerical, dash and underscore');
  return name;
}

/**
 * Run command
 * @param cmd 
 * @returns 
 */
async function run(cmd: string[] | [URL, ...string[]]): Promise<{ stdout: string, stderr: string }> {
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

router
  .get("/", (ctx) => {
    ctx.response.body = "Manage functions";
  })
  .delete("/func/:name", async (ctx) => {
    const name = ctx.params.name;
    console.log(`Deleting func ${name}`);
    validateFuncName(name);
    const p1 = run(['kubectl', 'delete', 'deployment', `${name}-app`]);
    const p2 = run(['kubectl', 'delete', 'svc', `${name}-service`]);
    const p3 = run(['kubectl', 'delete', 'hpa', `${name}-scaler`]);

    const res = await Promise.all([
      p1,
      p2,
      p3
    ]);
    console.log(res[0].stdout);
    console.log(res[1].stdout);
    console.log(res[2].stdout);
    if (res[0].stderr) console.error(res[0].stderr);
    if (res[1].stderr) console.error(res[1].stderr);
    if (res[2].stderr) console.error(res[2].stderr);
    const error = Boolean(res[0].stderr) || Boolean(res[1].stderr) || Boolean(res[1].stderr);
    ctx.response.status = error ? 500 : 200;
    ctx.response.body = { success: !error };
  })
  .post("/func", async (ctx) => {
    const name = helpers.getQuery(ctx, { mergeParams: true }).name;
    const code = await (await ctx.request.body({ type: 'text' })).value;

    validateFuncName(name);
    if (!code) throw new Error('code required');
    if (['_manager'].includes(name.toLowerCase())) throw new Error('reserved name');

    // code validation disabled for now, it might be a problem that the manager downloads all kinds of code from everywhere

    // validate code by compiling
    // console.log('Saving code in temp file');
    // console.log(code);
    // const codeFile = await Deno.makeTempFile() + '.ts';
    // await Deno.writeFile(codeFile, new TextEncoder().encode(code), { create: true, append: false });
    // console.log('Compiling');

    // const { diagnostics } = await Deno.emit(codeFile, { compilerOptions: { lib: ["deno.unstable", "deno.window"] } });
    // Deno.remove(codeFile);

    // if (diagnostics.length) {
    //   const diagnosticsResult = Deno.formatDiagnostics(diagnostics);
    //   console.warn('Compilation failed:');
    //   console.warn(diagnosticsResult);
    //   // deno-lint-ignore no-control-regex
    //   throw new Error(`Compilation failed: ${diagnosticsResult.replace(/\x1b\[[0-9;]*m/g, '')}`);
    // }

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
  targetCPUUtilizationPercentage: 65
`;

    const file = await Deno.makeTempFile();
    await Deno.writeFile(file, new TextEncoder().encode(yaml), { create: true, append: false });
    console.log('Yaml written');
    const result = await run(['kubectl', 'apply', '-f', file]);
    console.log('kubectl apply run');
    await Deno.remove(file);
    console.log(result.stdout);
    if (result.stderr)
        console.error(result.stderr);
    const isUnchanged = result.stdout.includes('-app unchanged');
    const isCreated = result.stdout.includes('-app created');

    ctx.response.body = { created: isCreated, unchanged: isUnchanged };
    ctx.response.status = result.stderr ? 500 : 200;
  });

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.response.status = err.status || 500;
        ctx.response.body = { error: { message: err.message } };
    }
});
app.use(router.routes());
app.use(router.allowedMethods());

async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  console.log(req.request.url);
  const res = await app.handle(req.request);
  if (res) {
    req.respondWith(res);
  }
}

const port = 4001;

const server = Deno.listen({ port });
console.log(`Client listening on ${port}`);

async function handle(conn: Deno.Conn) {
  for await (const event of Deno.serveHttp(conn)) {
    if (event.request.headers.get('user-agent') === 'Probe' && new URL(event.request.url).pathname.endsWith('/healthz'))
        event.respondWith(new Response());
    else
        handler({ req: event, conn }).catch(err => {
            const res = new Response(`Unhandled exception: ${err.message}`, { status: 500 });
            event.respondWith(res);
        });
  }
}

for await (const conn of server) {
  handle(conn).catch(err => {
    console.error(`Handle error: ${err.message}`);
    // Should a response be made here if an error occurs?
  });
}
