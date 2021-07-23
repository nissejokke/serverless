// deno-lint-ignore require-await
export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  const body = `Your user-agent is:\n\n${
    req.request.headers.get("user-agent") ?? "Unknown"
  }`;

  req.respondWith(
    new Response(body, {
      status: 200,
    })
  );
}
