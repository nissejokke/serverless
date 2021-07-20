const port = 4000;

const server = Deno.listen({ port });
console.log(`Router listening on ${port}`);

// console.log(Deno.env.toObject());

// deno-lint-ignore require-await
async function getInstance(hostname: string): Promise<string> {
  return `http://${Deno.env.get('SERVERLESS_SERVICE_SERVICE_HOST')}:${Deno.env.get('SERVERLESS_SERVICE_SERVICE_PORT')}`;
}

for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // in its own async function.
  (async () => {
    // This "upgrades" a network connection into an HTTP connection.
    const httpConn = Deno.serveHttp(conn);
    // Each request sent over the HTTP connection will be yielded as an async
    // iterator from the HTTP connection.
    for await (const requestEvent of httpConn) {     

        const instance = await getInstance(requestEvent.request.headers.get('host')!);
        console.log(instance);

        const proxy = await fetch(instance, { headers: requestEvent.request.headers, method: requestEvent.request.method });

        const res = new Response(proxy.body);
        requestEvent.respondWith(res);

    }
  })();
}