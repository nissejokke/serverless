// deno-lint-ignore require-await
export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
    console.log(`${new Date().toISOString()}\t${req.request.headers.get("user-agent") ?? "Unknown"}`);
  
    req.respondWith(
      new Response('', {
        status: 200
      })
    );
  }
  