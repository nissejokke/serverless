import handler from './func.ts';

const port = 1993;

const server = Deno.listen({ port });
console.log(`Client listening on ${port}`);

async function handle(conn: Deno.Conn) {
  for await (const event of Deno.serveHttp(conn)) {
    if (event.request.headers.get('user-agent') === 'Probe' && new URL(event.request.url).pathname === '/healthz')
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