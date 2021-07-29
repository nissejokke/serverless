
import { parse } from "https://deno.land/std@v0.103.0/flags/mod.ts";
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.103.0/path/mod.ts";
import { open } from "https://deno.land/x/opener@v1.0.1/mod.ts";

const args = parse(Deno.args);
const [command, subcommand, ...restCommands] = args._;
const cliName = 'svrless';

switch (command) {
    case 'func': {
        switch (subcommand) {
            case 'create':
                if (args.name && args.path) {
                    const res = await fetch(`http://kube/func?${new URLSearchParams(args)}`, {
                        method: 'POST',
                        body: new TextDecoder('utf-8').decode(Deno.readFileSync(args.path)) 
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
                    const res = await fetch(`http://kube/func/${args.name}`, {
                        method: 'DELETE' 
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
        console.log(`Available commands:\n  func        Handle functions`);

}