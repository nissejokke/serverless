// import { serve } from "https://deno.land/std@0.100.0/http/server.ts";
import handler from './func.ts';

// export type HandlerFunction = (req: Deno.RequestEvent, conn?: Deno.HttpConn) => Promise<void>;

// const server = serve({ port: 1993 });
// console.log(`Client ${Deno.env.get('HOSTNAME')} listening on 1993`);

// for await (const req of server) {
//     console.log(`[${new Date().toISOString()}] Req incoming ${Deno.env.get('HOSTNAME')}: ${req.url}`);
//     handler(req);
// }

const port = 1993;

const server = Deno.listen({ port });
console.log(`Client listening on ${port}`);

async function handle(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const requestEvent of httpConn) {    
    handler({ req: requestEvent, conn }).catch(err => {
        const res = new Response(`Unhandled exception: ${err.message}`, { status: 500 });
        requestEvent.respondWith(res);
    });
  }
}

for await (const conn of server) {
  handle(conn).catch(err => {
    console.error(`Handle error: ${err.message}`);
    // Should a response be made here if an error occurs?
  });
}