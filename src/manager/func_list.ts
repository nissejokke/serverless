import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { getFunctions } from "../common/functions.ts";
import { UserInfo } from "../common/jwt.ts";
import { getFunctionUrl } from "../common/kubernetes.ts";

export async function funcList(ctx: RouterContext<RouteParams, Record<string, unknown>>): Promise<void> {
    const { userId } = ctx.state.userInfo as UserInfo;

    if (!userId) throw new Error('userId required');

    const functions = await getFunctions(userId);
    const list = functions.map(func => ({ name: func.functionId, lastAccessed: func.lastAccessed, lastUpdated: func.lastUpdated, url: getFunctionUrl(func.functionId, func.userId) })); 

    ctx.response.body = list;
}