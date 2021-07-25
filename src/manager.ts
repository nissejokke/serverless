import { Application, helpers, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";

const app = new Application();
const router = new Router();

router
  .get("/", (context) => {
    context.response.body = "Manage functions";
  })
  .post("/func", async (context) => {
    const name = helpers.getQuery(context, { mergeParams: true }).name;
    const code = await (await context.request.body({ type: 'text' })).value;

    if (!name) throw new Error('name required');
    if (!code) throw new Error('code required');
    if (!/^[\w\d_-]+$/.test(name)) throw new Error('name can only contain alpha numerical, dash and underscore');
    
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
`;

    const file = await Deno.makeTempFile();
    await Deno.writeFile(file, new TextEncoder().encode(yaml), { create: true, append: false });
    console.log('Yaml written');
    const p = Deno.run({ 
        cmd: ['kubectl', 'apply', '-f', file],
        stdout: "piped",
        stderr: "piped"  
    });
    await p.status();
    const rawError = await p.stderrOutput();
    const errorString = new TextDecoder().decode(rawError);
    const outStr = new TextDecoder().decode(await p.output());
    console.log('kubectl apply run');
    p.close();
    await Deno.remove(file);
    console.log(outStr);
    if (errorString)
        console.error(errorString);

    const isUnchanged = outStr.includes('-app unchanged');
    const isCreated = outStr.includes('-app created');

    context.response.body = { created: isCreated, changed: !isUnchanged };
    context.response.status = errorString ? 500 : 200;
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
