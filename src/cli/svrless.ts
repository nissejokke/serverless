
import { parse } from "https://deno.land/std@v0.103.0/flags/mod.ts";

const args = parse(Deno.args);
const [command, subcommand] = args._;
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
            default:
                console.log(`The commands under \`${cliName} func\` are for handling functions\n\nUsage: ${cliName} func [command]`);
                console.log(`\nAvailable commands:`);
                console.log(`  create`);
                console.log(`  delete`);
        }
        break;
    }
    default:
        console.log(`${cliName} is a command line interface (CLI) for serverless service\n`);
        console.log(`Usage: \n  ${cliName} [command]\n`);
        console.log(`Available commands:\n  func        Handle functions`);

}