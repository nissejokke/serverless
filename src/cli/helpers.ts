
export async function ask(question: string): Promise<string> {
    const buf = new Uint8Array(1024);
    await Deno.stdout.write(new TextEncoder().encode(question + " "));
    const n = <number>await Deno.stdin.read(buf);
    return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

  export async function promptSecret(message : string) : Promise<string | null> {
	Deno.stdout.write(new TextEncoder().encode(message));
	Deno.setRaw(0, true);

	let input = "";
	while (true) {
		const data = new Uint8Array(1);
		const nread = await Deno.stdin.read(data);
		if (!nread) {
			break;
		}

		const string = new TextDecoder().decode(data.slice(0, nread));

		for (const char of string) {
			switch (char) {
				case "\u0003":
				case "\u0004":
					Deno.setRaw(Deno.stdin.rid, false);
					return null;

				case "\r":
				case "\n":
					Deno.setRaw(Deno.stdin.rid, false);
					return input;

				case "\u0008":
					input = input.slice(0, input.length - 1);
					break;

				default:
					input += char;
					break;
			}
		}
	}

	return null;
}

export async function writeJwtToUserDir(jwt: string): Promise<void> {
    try {
        await Deno.mkdir(Deno.env.get("HOME") + '/.svrless/');
    }
    catch {
        // do nothing
    }
    await Deno.writeTextFile(Deno.env.get("HOME") + '/.svrless/jwt', jwt, { create: true });
}