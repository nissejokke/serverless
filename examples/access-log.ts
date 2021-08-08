export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  const log = `${new Date().toISOString()}\t${req.request.headers.get("user-agent") ?? "Unknown"}`;
  console.log(log);

  let counter: number;
  try {
    counter = parseInt(await Deno.readTextFile('/tmp/counter.log'));
  }
  catch {
    counter = 0;
  }

  counter += 1;
  await Deno.writeTextFile('/tmp/counter.log', counter.toString(), { create: true, append: false })

  req.respondWith(
    new Response(counter.toString(), {
      status: 200
    })
  );
}
  