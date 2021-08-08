import { create, verify, getNumericDate, Payload, decode } from "https://deno.land/x/djwt@v2.2/mod.ts"

const jwtSecret = Deno.env.get('JWT_SECRET');

export interface UserInfo { 
    userId: string; 
    email: string; 
}

export interface UserJwtInfo extends UserInfo, Payload { }

export async function decodeUserJwt(jwt:string): Promise<UserJwtInfo> {
    const [,payload] = await decode(jwt);
    return payload as UserJwtInfo;
}

export async function validateUserJwt(jwt:string): Promise<UserJwtInfo> {
    const payload = await verify(jwt, jwtSecret!, "HS512");
    return payload as UserJwtInfo;
}

export async function createUserJwt(user: UserInfo): Promise<string> {
    const jwt = await create({ alg: "HS512", typ: "JWT" }, { userId: user!.userId, email: user!.email, exp: getNumericDate(60 * 60 * 24 * 7 * 3 /** Three weeks */) }, jwtSecret!);
    return jwt;
}

