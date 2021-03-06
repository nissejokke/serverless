import { Application, Router, send } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { funcCreate } from "./manager/func_create.ts";
import { funcDelete } from "./manager/func_delete.ts";
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.103.0/path/mod.ts";
import { userCreate } from "./manager/user_create.ts";
import { userLogin } from "./manager/user_login.ts";
import { validateUserJwt } from "./common/jwt.ts";
import { funcList } from "./manager/func_list.ts";
import { funcLog } from "./manager/func_log.ts";
import { userRefreshJwt } from "./manager/user_refresh_jwt.ts";

const app = new Application();
const path = dirname(fromFileUrl(import.meta.url));

const router = new Router();
router
  .get("/", async (ctx) => {
    const localpath = join(dirname(fromFileUrl(import.meta.url)), 'manager/static/index.html');
    ctx.response.body = new TextDecoder('utf-8').decode(await Deno.readFile(localpath));
  })
  .post("/login", userLogin)
  .post("/register", userCreate)
  .get("/static/:file", async (context) => {
    await send(context, context.params.file!, {
      root: join(path, `/manager/static`),
      index: "index.html",
    });
  });

app.use(async (ctx, next) => {
  try {
      await next();
  } catch (err) {
      console.error(`Route error ${ctx.request.url}:`, err.message);
      ctx.response.status = err.status || 500;
      ctx.response.body = { error: { message: err.message } };
  }
});
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (ctx, next) => {
  try {
      if (ctx.request.url.pathname.startsWith('/api')) {
        const authHeader = ctx.request.headers.get('Authorization') || '';
        const jwt = authHeader.substring('Bearer'.length + 1);
        console.log('Validating', jwt);
        if (!jwt) throw new Error('Authorization Bearing header missing');
        const userInfo = await validateUserJwt(jwt);
        console.log('UserInfo from jwt', userInfo);
        ctx.state.userInfo = userInfo;
      }
      await next();
  } catch (err) {
      console.error('Jwt validation error', err.message);
      ctx.response.status = err.status || 401;
      ctx.response.body = { error: { message: err.message } };
  }
});

const loggedInRoutes = new Router();
loggedInRoutes
  .get("/api/func", funcList)
  .delete("/api/func/:name", funcDelete)
  .post("/api/func", funcCreate)
  .get("/api/func/:name/log", funcLog)
  .post("/api/user/refresh-jwt", userRefreshJwt);

app.use(loggedInRoutes.routes());
app.use(loggedInRoutes.allowedMethods());

async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  console.log(req.request.url);
  const res = await app.handle(req.request);
  if (res) {
    req.respondWith(res);
  }
}

const port = 4001;

const server = Deno.listen({ port });
console.log(`Manager listening on ${port}`);

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
