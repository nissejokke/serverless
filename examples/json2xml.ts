/**
 * Converts json value to xml
 * @example curl http://localhost:1993/?query=date&locale=sv-SE&url=http://date.jsontest.com
 * @param param0 
 */

export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
    const url = new URL(req.request.url);
    const source = url.searchParams.get('url')!;
    const query = url.searchParams.get('query')!;
    const locale = url.searchParams.get('locale') ?? 'en-GB';

    if (!source || !query) throw new Error('url and query required');
    const request = await fetch(source);
    let json = await request.json();
    
    query.split('/').forEach(val => {
        json = json[val];
    });
    if (typeof json === 'number')
        json = json.toLocaleString(locale, { minimumFractionDigits: 2 });
  
    // TODO: xml encode value
    req.respondWith(
      new Response(`<data>${json}</data>`, {
        status: 200,
        headers: {
            'content-type': 'application/xml'
        }
      })
    );
  }
  