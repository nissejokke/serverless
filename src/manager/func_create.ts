import { helpers } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { createFunction, updateFunction } from "../common/functions.ts";
import { UserInfo } from "../common/jwt.ts";
import { getFunctionUrl } from "../common/kubernetes.ts";
import { getServiceConfig, run, validateFuncName } from "./helpers.ts";

export async function funcCreate(ctx: RouterContext<RouteParams, Record<string, unknown>>): Promise<void> {
    const funcName = helpers.getQuery(ctx, { mergeParams: true }).name;
    const code = await (await ctx.request.body({ type: 'text' })).value;
    const { userId } = ctx.state.userInfo as UserInfo;

    validateFuncName(funcName);
    if (!code) throw new Error('code required');
    if (['_manager'].includes(funcName.toLowerCase())) throw new Error('reserved name');

    // code validation disabled for now, it might be a problem that the manager downloads all kinds of code from everywhere

    // validate code by compiling
    // console.log('Saving code in temp file');
    // console.log(code);
    // const codeFile = await Deno.makeTempFile() + '.ts';
    // await Deno.writeFile(codeFile, new TextEncoder().encode(code), { create: true, append: false });
    // console.log('Compiling');

    // const { diagnostics } = await Deno.emit(codeFile, { compilerOptions: { lib: ["deno.unstable", "deno.window"] } });
    // Deno.remove(codeFile);

    // if (diagnostics.length) {
    //   const diagnosticsResult = Deno.formatDiagnostics(diagnostics);
    //   console.warn('Compilation failed:');
    //   console.warn(diagnosticsResult);
    //   // deno-lint-ignore no-control-regex
    //   throw new Error(`Compilation failed: ${diagnosticsResult.replace(/\x1b\[[0-9;]*m/g, '')}`);
    // }

    const yaml = getServiceConfig(userId, funcName, code);
    const file = await Deno.makeTempFile();
    await Deno.writeFile(file, new TextEncoder().encode(yaml), { create: true, append: false });
    console.log('Yaml written');
    const result = await run(['kubectl', 'apply', '-f', file]);
    console.log('kubectl apply run');
    await Deno.remove(file);
    console.log(result.stdout);
    if (result.stderr)
        console.error(result.stderr);
    const url = getFunctionUrl(funcName, userId);
    const isUnchanged = result.stdout.includes('-app unchanged');
    const isCreated = result.stdout.includes('-app created');

    if (isCreated)
        await createFunction({ functionId: funcName, userId });
    else
        await updateFunction({ functionId: funcName, userId });

    ctx.response.body = { created: isCreated, unchanged: isUnchanged, url };
    ctx.response.status = result.stderr ? 500 : 200;
  }