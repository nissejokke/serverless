import request from './func.ts';

const port = 1993;

const server = Deno.listen({ port });
console.log(`Client listening on ${port}`);

for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // in its own async function.
  (async () => {
    // This "upgrades" a network connection into an HTTP connection.
    const httpConn = Deno.serveHttp(conn);
    // Each request sent over the HTTP connection will be yielded as an async
    // iterator from the HTTP connection.
    for await (const requestEvent of httpConn) {     
      request(requestEvent);
    }
  })();
}