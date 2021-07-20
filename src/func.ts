import { ServerRequest } from "https://deno.land/std@0.100.0/http/server.ts";

// deno-lint-ignore require-await
export default async function handler(req: ServerRequest): Promise<void> {
  req.respond({
    body: "",
  });
}
