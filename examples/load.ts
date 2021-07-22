import { ServerRequest } from "https://deno.land/std@0.100.0/http/server.ts";

// deno-lint-ignore require-await
export default async function handler(req: ServerRequest): Promise<void> {
    let x = 0.0001;
    for (let i = 0; i <= 1000000; i++) {
      x += Math.sqrt(x);
    }

    req.respond({
        body: x.toString()
    });
}