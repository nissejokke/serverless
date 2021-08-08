import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { UserInfo } from "../common/jwt.ts";
import { createUserJwt } from "../common/jwt.ts";

export async function userRefreshJwt(ctx: RouterContext<RouteParams, Record<string, unknown>>): Promise<void> {
    const { userId, email } = ctx.state.userInfo as UserInfo;

    if (!userId) throw new Error('userId required');
    ctx.response.body = { jwt: await createUserJwt({ userId, email }) };
}