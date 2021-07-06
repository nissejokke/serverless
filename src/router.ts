const port = 1990;

const server = Deno.listen({ port });
console.log(`Router listening on ${port}`);

async function getInstance(hostname: string): Promise<string> {
    return 'http://localhost:1993';
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

        const proxy = await fetch(instance, { headers: requestEvent.request.headers, method: requestEvent.request.method });

        const res = new Response(proxy.body);
        requestEvent.respondWith(res);

    }
  })();
}