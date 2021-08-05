import { helpers } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { RouterContext, RouteParams } from "https://deno.land/x/oak@v8.0.0/router.ts";
import { HttpError } from "../common/errors.ts";
import { createUser } from '../common/users.ts';

export async function userCreate(ctx: RouterContext<RouteParams, Record<string, unknown>>): Promise<void> {
    const query = helpers.getQuery(ctx, { mergeParams: true });
    const email = query.email;
    const password = await (await ctx.request.body({ type: 'text' })).value;

    if (!email) throw new Error('email required');
    if (!password) throw new Error('password required');

    try {
      await createUser({ email, password });
      ctx.response.body = 'User created, use \`func login\` to login user';
    }
    catch (err) {
      console.error(err);
      throw new HttpError('Failed to create user', 500);
    }
  }