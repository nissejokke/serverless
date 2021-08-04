import { accessFunction } from "./common/functions.ts";
import { getKubernetesResourceName } from "./common/kubernetes.ts";

const port = 4000;

const server = Deno.listen({ port });
console.log(`Router listening on ${port}`);
const functionAccessTimeouts = new Map();

async function handle(conn: Deno.Conn) {
  for await (const event of Deno.serveHttp(conn)) {
    try {
      const url = new URL(event.request.url);
      const [, userId, funcName, ...rest] = url.pathname.split('/');
      const clientUrl = rest.join('/') + url.search;

      // health check
      if (event.request.headers.get('user-agent') === 'Probe' && new URL(event.request.url).pathname === '/healthz')
        event.respondWith(new Response());
      // proxy to client
      else if (userId && funcName) {
        const name = getKubernetesResourceName(userId, funcName);
        const proxyUrl = `http://${name}-service:1993/${clientUrl}`;
        console.log(`[${new Date().toISOString()}] ${userId} -> ${funcName}/${clientUrl}`);
        let proxyRes: Response | null = null;
        let attempt = 0;
        let clientIsInStartup = false;

        // proxy to client and handle client not being up yet
        do {
          try {
            if (clientIsInStartup) {
              console.log('Chill for a second');
              await new Promise(r => setTimeout(r, 1000));
            }
            proxyRes = await fetch(proxyUrl, { headers: event.request.headers, method: event.request.method });
          }
          catch (err) {
            console.error('Proxy error:', err.message);
            clientIsInStartup = err.message.includes('Connection reset by peer (os error 104)');
            if (!clientIsInStartup) throw err;
          }
        } while (clientIsInStartup && ++attempt < 20);
        
        // write last access to db
        const timeoutKey = funcName + '-' + userId;
        let timeout: ReturnType<typeof setTimeout> = functionAccessTimeouts.get(timeoutKey);
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          accessFunction({ functionId: funcName, userId: userId })
          .then(() => console.log('Function accessed'))
          .catch(err => console.error(`Error from accessFunction: ${err.message}`));
        }, 3000);
        functionAccessTimeouts.set(timeoutKey, timeout);

        // respond
        event.respondWith(proxyRes!);
      }
      else {
        console.log(`Not found:`, url.pathname + url.search);
        const res = new Response('Not found. Missing userId and/or function name', { status: 404 });
        event.respondWith(res);
      }
    }
    catch (err) {
      const isConnectionRefusedError = err.message.includes('error trying to connect: tcp connect error: Connection refused');
      const isUnknownService = err.message.includes('dns error: failed to lookup address information');

      console.error(`Request event error: ${err.message} ${err.status}`);
      let res: Response;
      if (isConnectionRefusedError)
        res = new Response('Service unavailable', { status: 503 });
      else if (isUnknownService)
        res = new Response('Not found', { status: 404 });
      else
        res = new Response('Error', { status: 500 });
      event.respondWith(res);
    }
  }
}

for await (const conn of server) {
  handle(conn).catch(err => {
    console.error(`Handle error: ${err.message}`);
    // Should a response be made here if an error occurs?
  });
}