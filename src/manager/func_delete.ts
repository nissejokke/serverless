import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { getServiceConfig, run, validateFuncName } from "./helpers.ts";

export async function funcDelete(ctx: RouterContext<RouteParams, Record<string, unknown>>) {
  validateFuncName(ctx.params.name);
    const name = ctx.params.name!;
    console.log(`Deleting func ${name}`);

    const yaml = getServiceConfig(name, '');
    const file = await Deno.makeTempFile();
    await Deno.writeFile(file, new TextEncoder().encode(yaml), { create: true, append: false });
    console.log('Yaml written');
    const { stdout, stderr } = await run(['kubectl', 'delete', '-f', file]);
    Deno.remove(file);
    console.log(stdout);
    console.error(stderr);
    
    const error = Boolean(stderr);
    ctx.response.status = error ? 500 : 200;
    ctx.response.body = { success: !error };
  }