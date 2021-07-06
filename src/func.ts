

export default async function request(requestEvent:Deno.RequestEvent): Promise<void> {
    const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
        "user-agent",
      ) ?? "Unknown"}`;

      // The requestEvent's `.respondWith()` method is how we send the response
      // back to the client.
      requestEvent.respondWith(
        new Response(body, {
          status: 200,
        }),
      );
}
