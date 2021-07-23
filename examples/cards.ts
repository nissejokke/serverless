
const values = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["Hearts", "Diamonds", "Spades", "Clubs"];

// deno-lint-ignore require-await
export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
    const headers = new Headers();
    headers.set('content-type', 'application/json');

    try {
        const url = new URL(req.request.url);

        if (url.pathname === '/draw') {
            const randomValue = Math.floor(Math.random() * values.length);
            const randomSuit = Math.floor(Math.random() * suits.length);
            const cardValue = values[randomValue];
            const cardSuit = suits[randomSuit];
            req.respondWith(
                new Response(JSON.stringify({ card: { suit: cardSuit, value: cardValue }}), {
                    headers: headers,
                    status: 200,
                })
            );
        }
        else
            req.respondWith(new Response(JSON.stringify({ message: 'Action not found, try /draw'}), {
                headers,
                status: 404,
            }))

    }
    catch (err) {
        req.respondWith(
            new Response(JSON.stringify({ message: err.message }), {
                headers,
                status: 500,
            })
        );
    }
}
