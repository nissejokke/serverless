const port = 4000;

const server = Deno.listen({ port });
console.log(`Router listening on ${port}`);
let instances = 1;
let instance = 1;

async function updateInstances() {
  let i;
  for (i = 2; i < 10; i++) {
    try {
      const res = await fetch(`http://serverless_client_${i}:1993`, {
        method: 'HEAD'
      });
      if (!res.ok) break;
    }
    catch {
      break;
    }
  }
  instances = i - 1;
  return instances;
}

// deno-lint-ignore require-await
async function getInstance(hostname: string): Promise<string> {
  instance += 1;
  if (instance > instances) instance = 1;
  return `http://serverless_client_${instance}:1993`;
}

console.log('Discovering instances..');
await updateInstances();
console.log(`Found ${instances} instances`);

// setInterval(updateInstances, 10000);

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

        const proxy = await fetch(instance, { headers: requestEvent.request.headers, method: requestEvent.request.method });

        const res = new Response(proxy.body);
        requestEvent.respondWith(res);

    }
  })();
}