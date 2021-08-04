import { Client } from 'https://deno.land/x/mysql@v2.9.0/mod.ts';

export const client = await new Client().connect({
    hostname: "mysql",
    username: "root",
    db: "serverless",
    poolSize: 3, // connection limit
    password: "db password",
});

export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  const data = await client.query(`SELECT functionId, userId, lastAccessed, lastUpdated FROM Functions`, []);
  // const request = await fetch('http://svrless.net/fn/mMa2D0/json2xml');
  // const data = await request.text();

  req.respondWith(
    new Response(JSON.stringify(data), {
      status: 200
    })
  );
}
