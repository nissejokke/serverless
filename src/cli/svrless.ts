
import { parse } from "https://deno.land/std@0.103.0/flags/mod.ts";
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.103.0/path/mod.ts";
import { open } from "https://deno.land/x/opener@v1.0.1/mod.ts";
import Ask from "https://deno.land/x/ask@1.0.6/mod.ts";

const args = parse(Deno.args);
const [command, subcommand, ...restCommands] = args._;
const cliName = 'svrless';

switch (command) {
    case 'user': {
        switch (subcommand) {
            case 'register':
                if (args.email) {
                    let password: string;
                    if (!args.password) {
                        const ask = new Ask();
                        password = (await ask.input({
                            name: "password",
                            message: "Password:",
                        })).password!;
                    }
                    else
                        password = args.password;

                    if (!password) throw new Error('password required');

                    const res = await fetch(`http://svrless.net/register?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: password
                    });
                    console.log(await res.text());
                }
                else {
                    console.log(`\`${cliName} user register\` is for registering a new user\n`);
                    console.log(`Usage: \n  ${cliName} user register [flags]\n`);
                    console.log(`Available flags:\n  --email        Users email\n  --password       Password or leave out to enter in prompt`);
                }
                break;
            case 'login': {
                if (args.email || args.userId) {
                    let password: string;
                    if (!args.password) {
                        const ask = new Ask();
                        password = (await ask.input({
                            name: "password",
                            message: "Password:",
                        })).password!;
                    }
                    else
                        password = args.password;

                    if (!password) throw new Error('password required');

                    const res = await fetch(`http://svrless.net/login?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: password
                    });
                    const result = await res.json();
                    if (result.jwt) {
                        try {
                            await Deno.mkdir(Deno.env.get("HOME") + '/.svrless/');
                        }
                        catch {
                            // do nothing
                        }
                        await Deno.writeTextFile(Deno.env.get("HOME") + '/.svrless/jwt', result.jwt, { create: true });
                        console.log('Authenticated. Token written to ~/.svrless/jwt');
                    }
                    else
                        console.error(result);
                }
                else {
                    console.log(`\`${cliName} user login\` is for logging in user. Writes token to home directory.\n`);
                    console.log(`Usage: \n  ${cliName} user login [flags]\n`);
                    console.log(`Available flags:\n  --email        Users email\n  --userId     UserId\n  --password       Password or leave out to enter in prompt`);
                    console.log(`Email or userId is required`);
                }
                break;
            }
            default:
                console.log(`The commands under \`${cliName} user\` are for handling users\n\nUsage: ${cliName} user [command]`);
                console.log(`\nAvailable commands:`);
                console.log(`  register`);
                console.log(`  login`);
        }
        break;
    }
    case 'func': {
        switch (subcommand) {
            case 'create':
                if (args.name && args.path) {
                    const res = await fetch(`http://svrless.net/func?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: new TextDecoder('utf-8').decode(Deno.readFileSync(args.path)),
                        headers: {
                            Authorization: 'Bearer ' + (await Deno.readTextFile(Deno.env.get("HOME") + '/.svrless/jwt')),
                        }
                    });
                    console.log(await res.json());
                }
                else {
                    console.log(`${cliName} func create is for creating functions\n`);
                    console.log(`Usage: \n  ${cliName} func create [flags]\n`);
                    console.log(`Available flags:\n  --name        Name of function\n  --path       Path to code file`);
                }
                break;
            case 'delete':
                if (args.name) {
                    const res = await fetch(`http://svrless.net/func/${args.name}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: 'Bearer ' + (await Deno.readTextFile(Deno.env.get("HOME") + '/.svrless/jwt')),
                        }
                    });
                    console.log(await res.json());
                }
                else {
                    console.log(`${cliName} func create is for deleting functions\n`);
                    console.log(`Usage: \n  ${cliName} func delete [flags]\n`);
                    console.log(`Available flags:\n  --name        Name of function to delete`);
                }
                break;
            case 'run': {
                const path = restCommands[0] as string;
                if (path) {
                    const dir = await Deno.makeTempDir();
                    const clientPath = join(dirname(fromFileUrl(import.meta.url)), '../client.ts');
                    await Deno.copyFile(clientPath, join(dir, 'client.ts'));
                    await Deno.copyFile(path, join(dir, 'func.ts'));
                    const process = Deno.run({
                        cmd: ['deno', 'run', '--allow-net', '--allow-env', '--allow-read=/temp', '--allow-write=/temp', '--unstable', 'client.ts'],
                        cwd: dir
                    });
                    
                    await new Promise(r => setTimeout(r, 1000));
                    if (args.open)
                        open('http://localhost:1993');
                    await process.status();
                }
                else {
                    console.log(`\`${cliName} run\` is for running and testing function locally\n`);
                    console.log(`Usage: \n  ${cliName} func run [function code file path] [flags]\n`);
                    console.log(`Available flags:`)
                    console.log(`\n  --open        Open url in browser`);
                }
                break;
            }
            default:
                console.log(`The commands under \`${cliName} func\` are for handling functions\n\nUsage: ${cliName} func [command]`);
                console.log(`\nAvailable commands:`);
                console.log(`  create`);
                console.log(`  delete`);
                console.log(`  run`);
        }
        break;
    }
    default:
        console.log(`${cliName} is a command line interface (CLI) for serverless service\n`);
        console.log(`Usage: \n  ${cliName} [command]\n`);
        console.log(`Available commands:`);
        console.log(`  func        Handle functions`);
        console.log(`  user        Handler login and users`);

}