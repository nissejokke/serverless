import { ServerRequest } from "https://deno.land/std@0.100.0/http/server.ts";

// deno-lint-ignore require-await
export default async function handler(req: ServerRequest): Promise<void> {
    const body = `Your user-agent is:\n\n${req.headers.get(
        "user-agent",
      ) ?? "Unknown"}`;

      // const file = await Deno.open('./tiger.mp4');

      // await req.respond({
      //     body: file,
      //     status: 200
      // });

      req.respond({
        body: body
      });

      // file.close();
      // // The requestEvent's `.respondWith()` method is how we send the response
      // // back to the client.
      // await requestEvent.respondWith(
      //   new Response(body, {
      //     status: 200,
      //   }),
      // );
}
