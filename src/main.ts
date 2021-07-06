import { serve } from "https://deno.land/std@0.100.0/http/server.ts";
import handler from './func2.ts';

const server = serve({ port: 1993 });
console.log("http://localhost:1993/");
for await (const req of server) {
  // req.respond({ body: "Hello World\n" });
  handler(req);
}