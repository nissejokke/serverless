// deno-lint-ignore require-await
export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  let x = 0.0001;
  for (let i = 0; i <= 1000000; i++) {
    x += Math.sqrt(x);
  }

  req.respondWith(
    new Response(x.toString(), {
      status: 200,
    })
  );
}
