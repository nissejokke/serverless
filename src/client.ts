import { serve } from "https://deno.land/std@0.100.0/http/server.ts";
import handler from './func.ts';

const server = serve({ port: 1993 });
console.log("Client listening on 1993");

for await (const req of server) {
  if (req.method === 'HEAD')
    req.respond({ body: '' });
  else {
    console.log("Req incomming");
    handler(req);
    // const url = Deno.env.get('CLIENT_CODE_URL') as string;
    // console.log("url=" + url);
    // const client = await import(url);
    // // console.log(client);
    // client.default(req);
  }
}
