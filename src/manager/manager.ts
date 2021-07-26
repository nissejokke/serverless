import { Application, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { funcCreate } from "./func_create.ts";
import { funcDelete } from "./func_delete.ts";

const app = new Application();
const router = new Router()

router
  .get("/", (ctx) => {
    ctx.response.body = "Manage functions";
  })
  .delete("/func/:name", funcDelete)
  .post("/func", funcCreate);

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
