import { helpers } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { getFunction } from "../common/functions.ts";
import { UserInfo } from "../common/jwt.ts";
import { getKubernetesResourceName } from "../common/kubernetes.ts";
import { run, validateFuncName } from "./helpers.ts";
import { HttpError } from "../common/errors.ts";

export async function funcLog(ctx: RouterContext<RouteParams, Record<string, unknown>>): Promise<void> {
    const funcName = ctx.params.name!;
    const { userId } = ctx.state.userInfo as UserInfo;

    try {
        validateFuncName(funcName);
        const func = await getFunction({ functionId: funcName, userId });
        if (!func) throw new HttpError('Function not found', 404);

        const name = getKubernetesResourceName(userId, funcName);
        const result = await run(['kubectl', 'logs', '-l', `app=${name}-app`]);
        ctx.response.body = result.stdout;
    }
    catch (err) {
        throw new HttpError(`Failed to get log: ${err.message}`, err.status);
    }
}