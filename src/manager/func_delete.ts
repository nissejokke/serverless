import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { deleteFunction } from "../common/functions.ts";
import { UserInfo } from "../common/jwt.ts";
import { getServiceConfig, run, validateFuncName } from "./helpers.ts";

export async function funcDelete(ctx: RouterContext<RouteParams, Record<string, unknown>>) {
  validateFuncName(ctx.params.name);
    const funcName = ctx.params.name!;
    const { userId } = ctx.state.userInfo as UserInfo;

    console.log(`Deleting func ${userId} ${funcName}`);

    const yaml = getServiceConfig(userId, funcName, '');
    const file = await Deno.makeTempFile();
    await Deno.writeFile(file, new TextEncoder().encode(yaml), { create: true, append: false });
    console.log('Yaml written');
    const { stdout, stderr } = await run(['kubectl', 'delete', '-f', file]);
    Deno.remove(file);
    console.log(stdout);
    console.error(stderr);
    
    const error = Boolean(stderr);
    if (!error)
      await deleteFunction({ functionId: funcName, userId });
    ctx.response.status = error ? 500 : 200;
    ctx.response.body = { success: !error };
  }