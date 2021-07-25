const port = 4000;

const server = Deno.listen({ port });
console.log(`Router listening on ${port}`);

async function handle(conn: Deno.Conn) {
  // This "upgrades" a network connection into an HTTP connection.
  const httpConn = Deno.serveHttp(conn);
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const event of httpConn) {     

    try {
      const url = new URL(event.request.url);
      const [, name, ...rest] = url.pathname.split('/');
      const clientUrl = rest.join('/') + url.search;

      if (event.request.headers.get('user-agent') === 'Probe' && new URL(event.request.url).pathname === '/healthz')
        event.respondWith(new Response());
      else if (name) {
        const proxyUrl = `http://${name}-service:1993/${clientUrl}`;
        console.log(`[${new Date().toISOString()}] -> ${name}/${clientUrl}`);
        const proxy = await fetch(proxyUrl, { headers: event.request.headers, method: event.request.method });
        event.respondWith(proxy);
      }
      else {
        console.log(`Not found:`, url.pathname + url.search);
        const res = new Response('Not found. Missing function name', { status: 404 });
        event.respondWith(res);
      }
    }
    catch (err) {
      const isConnectionRefusedError = err.message.includes('error trying to connect: tcp connect error: Connection refused');
      console.error(`Request event error: ${err.message} ${err.status}`);
      let res: Response;
      if (isConnectionRefusedError)
        res = new Response('Service unavailable', { status: 503 });
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