import { ServerRequest } from "https://deno.land/std@0.100.0/http/server.ts";

const values = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["Hearts", "Diamonds", "Spades", "Clubs"];

// deno-lint-ignore require-await
export default async function handler(req: ServerRequest): Promise<void> {
    try {
        const url = new URL('http://client.com' + req.url);

        if (url.pathname === '/draw') {
            const randomValue = Math.floor(Math.random() * values.length);
            const randomSuit = Math.floor(Math.random() * suits.length);
            const cardValue = values[randomValue];
            const cardSuit = suits[randomSuit];
            const body = cardSuit + ' ' + cardValue;
            req.respond({
                body: body
            });
        }
        else
            req.respond({
                body: 'Action not found, try /draw',
                status: 404
            })

    }
    catch (err) {
        req.respond({
            body: err.message,
            status: 500
        });
    }
}