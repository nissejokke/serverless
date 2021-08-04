// deno-lint-ignore require-await
export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  const body = Deno.env.toObject();

  req.respondWith(
    new Response(JSON.stringify(body), {
      status: 200
    })
  );
}
