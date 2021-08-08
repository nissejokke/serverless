
import { parse } from "https://deno.land/std@0.103.0/flags/mod.ts";
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.103.0/path/mod.ts";
import { open } from "https://deno.land/x/opener@v1.0.1/mod.ts";
import { decodeUserJwt } from "../common/jwt.ts";
import { promptSecret, writeJwtToUserDir } from "./helpers.ts";

const args = parse(Deno.args);
const [command, subcommand, ...restCommands] = args._;
const cliName = 'svrless';

async function getJwt(): Promise<string> {
    try {
        return await Deno.readTextFile(Deno.env.get("HOME") + '/.svrless/jwt');
    }
    catch (err) {
        throw new Error(`Not logged in: failed to read ~/.svrless/jwt: ${err.message}`);
    }
}

/**
 * Runs after command which requires login
 */
async function postAction() {
    // update jwt
    const res = await fetch(`https://svrless.net/api/user/refresh-jwt`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + (await getJwt()),
        }
    });
    const result = await res.json();
    if (result.jwt) {
        await writeJwtToUserDir(result.jwt);
    }
}

switch (command) {
    case 'user': {
        switch (subcommand) {
            case 'show': {
                const jwt = await getJwt();
                const data = await decodeUserJwt(jwt);
                console.log('Logged in as:')
                console.log(`User id: ${data.userId}`);
                console.log(`Email: ${data.email}`);
                break;
            }
            case 'register':
                if (args.email) {
                    let password: string;
                    if (!args.password) 
                        password = await promptSecret('Enter password: ') ?? '';
                    else
                        password = args.password;

                    if (!password) throw new Error('password required');

                    const res = await fetch(`https://svrless.net/register?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: password
                    });
                    if (res.status === 200) {
                        const res = await fetch(`https://svrless.net/login?${new URLSearchParams(args)}`, {
                            method: 'POST',
                            body: password
                        });
                        const result = await res.json();
                        if (result.jwt) {
                            await writeJwtToUserDir(result.jwt);
                            console.log('Authenticated. Token written to ~/.svrless/jwt');
                        }
                        else
                            console.error(result);
                    }
                    else
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
                    if (!args.password)
                        password = await promptSecret('Enter password: ') ?? '';
                    else
                        password = args.password;

                    if (!password) throw new Error('password required');

                    const res = await fetch(`https://svrless.net/login?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: password
                    });
                    const result = await res.json();
                    if (result.jwt) {
                        await writeJwtToUserDir(result.jwt);
                        console.log('Authenticated. Token written to ~/.svrless/jwt');
                    }
                    else
                        console.error(result);
                }
                else {
                    console.log(`\`${cliName} user login\` is for logging in user. Writes token to home directory.\n`);
                    console.log(`Usage: \n  ${cliName} user login [flags]\n`);
                    console.log(`Available flags:\n  --email        Users email\n  --userId       UserId\n  --password     Password or leave out to enter in prompt`);
                    console.log(`Email or userId is required`);
                }
                break;
            }
            default:
                console.log(`The commands under \`${cliName} user\` are for handling users and logins\n\nUsage: ${cliName} user [command]`);
                console.log(`\nAvailable commands:`);
                console.log(`  show`);
                console.log(`  register`);
                console.log(`  login`);
        }
        break;
    }
    case 'func': {
        switch (subcommand) {
            case 'list': {
                const res = await fetch(`https://svrless.net/api/func`, {
                    headers: {
                        Authorization: 'Bearer ' + (await getJwt()),
                    }
                });
                const data = await res.json();
                if (args.json)
                    console.log(data);
                else {
                    console.log('--json for json');
                    console.table(data);
                }
                await postAction();
                break;
            }
            case 'log': {
                if (args.name) {
                    const res = await fetch(`https://svrless.net/api/func/${args.name}/log`, {
                        headers: {
                            Authorization: 'Bearer ' + (await getJwt()),
                        }
                    });
                    const data = await res.text();
                    console.log(data);
                    await postAction();
                }
                else {
                    console.log(`\`${cliName} func log\` is for getting internal log from function\n`);
                    console.log(`Usage: \n  ${cliName} func log [flags]\n`);
                    console.log(`Available flags:\n  --name        Name of function`);
                }
                break;
            }
            case 'deploy':
                if (args.name && args.source) {
                    const res = await fetch(`https://svrless.net/api/func?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: new TextDecoder('utf-8').decode(Deno.readFileSync(args.source)),
                        headers: {
                            Authorization: 'Bearer ' + (await getJwt()),
                        }
                    });
                    console.log(await res.json());
                    await postAction()
                }
                else {
                    console.log(`\`${cliName} func deploy\` is for deploying functions\n`);
                    console.log(`Usage: \n  ${cliName} func deploy [flags]\n`);
                    console.log(`Available flags:\n  --name        Name of function\n  --source      Path to source code file`);
                }
                break;
            case 'delete':
                if (args.name) {
                    const res = await fetch(`https://svrless.net/api/func/${args.name}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: 'Bearer ' + (await getJwt()),
                        }
                    });
                    console.log(await res.json());
                    await postAction();
                }
                else {
                    console.log(`\`${cliName} func delete\` is for deleting functions\n`);
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
                console.log(`  list`);
                console.log(`  log`);
                console.log(`  deploy`);
                console.log(`  delete`);
                console.log(`  run`);
        }
        break;
    }
    default:
        console.log(`${cliName} is a command line interface (CLI) for svrless.net service\n`);
        console.log(`Usage: \n  ${cliName} [command]\n`);
        console.log(`Available commands:`);
        console.log(`  func        Handle functions`);
        console.log(`  user        Handler users and logins`);

}