import { ServerRequest } from "https://deno.land/std@0.100.0/http/server.ts";

const values = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["Hearts", "Diamonds", "Spades", "Clubs"];

// deno-lint-ignore require-await
export default async function handler(req: ServerRequest): Promise<void> {
    const headers = new Headers();
    headers.set('content-type', 'application/json');

    try {
        const url = new URL('http://client.com' + req.url);

        if (url.pathname === '/draw') {
            const randomValue = Math.floor(Math.random() * values.length);
            const randomSuit = Math.floor(Math.random() * suits.length);
            const cardValue = values[randomValue];
            const cardSuit = suits[randomSuit];
            req.respond({
                headers: headers,
                body: JSON.stringify({ card: { suit: cardSuit, value: cardValue }}),
            });
        }
        else
            req.respond({
                headers,
                status: 404,
                body: JSON.stringify({ message: 'Action not found, try /draw'}),
            })

    }
    catch (err) {
        req.respond({
            headers,
            status: 500,
            body: JSON.stringify({ message: err.message }),
        });
    }
}