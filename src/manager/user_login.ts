import { helpers } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { loginUser } from '../common/users.ts';

export async function userLogin(ctx: RouterContext<RouteParams, Record<string, unknown>>): Promise<void> {
    const query = helpers.getQuery(ctx, { mergeParams: true });
    const { email, userId } = query;
    const password = await (await ctx.request.body({ type: 'text' })).value;

    if (!email && !userId) throw new Error('email or userId required');
    if (!password) throw new Error('password required');

    try {
        const jwt = await loginUser({ email, userId, password });
        ctx.response.body = { jwt };
    }
    catch (err) {
        console.error(`Login failed: ${err.message}`);
        const err2 = new Error('Login failed') as any;
        err2.status = 401;
        throw err2;
    }
}