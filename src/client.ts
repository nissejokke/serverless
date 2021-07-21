import { serve } from "https://deno.land/std@0.100.0/http/server.ts";
import handler from './func.ts';

const server = serve({ port: 1993 });
console.log(`Client ${Deno.env.get('HOSTNAME')} listening on 1993`);

for await (const req of server) {
    console.log(`Req incoming ${Deno.env.get('HOSTNAME')}: ${req.url}`);
    handler(req);
}
