import { Client } from 'https://deno.land/x/mysql@v2.9.0/mod.ts';
import { nanoid, customAlphabet } from "https://deno.land/x/nanoid@v3.0.0/mod.ts"
// import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
// import { create, getNumericDate } from "https://deno.land/x/djwt@v2.2/mod.ts"
import { createHash } from "https://deno.land/std@0.103.0/hash/mod.ts";
import { createUserJwt } from "./jwt.ts";

export interface User {
    userId: string;
    email: string;
}

export interface CreateUser {
    email: string;
    password: string;
}

export interface LoginUser {
    userId?: string;
    email?: string;
    password: string;
}

interface UserRow {
    userId: string;
    email: string;
    password: string;
    salt: string;
}

const client = await new Client().connect({
    hostname: "mysql",
    username: "root",
    db: "serverless",
    poolSize: 3, // connection limit
    password: "db password",
});

function generateUserId(): string {
    let userId: string;
    const nanoid2 = customAlphabet("1234567890abcdefghijklmnopqrstuvxyz-", 10);
    do {
        userId = nanoid2();
    } while (!/^\w.*\w$/g.test(userId));
    return userId;
}

export async function createUser(user: CreateUser): Promise<void> {
    const { email, password } = user;
    const salt = nanoid(16);
    const userId = generateUserId();
    const hasher = createHash("sha3-512");
    hasher.update(password + salt);
    const hash = hasher.toString("base64");
    // bcrypt cant be used, issue with workers: https://github.com/timonson/djwt/issues/48
    // const salt = await bcrypt.genSalt(12);
    // const hash = await bcrypt.hash(password, salt);

    // TODO: Handle userId collisions
    await client.execute(`INSERT INTO Users (userId, email, password, salt) VALUES (?, ?, ?, ?)`, [userId, email, hash, salt])
}

/**
 * Verify user credentials and generate jwt
 * @param credentials 
 * @returns jwt
 */
export async function loginUser(credentials: LoginUser): Promise<string> {
    const { userId, email, password } = credentials;
    let user: UserRow | null = null;
    if (userId) {
        const users = await client.query(`SELECT * FROM Users WHERE userId = ?`, [userId]);
        user = users[0];
    }
    else {
        const users = await client.query(`SELECT * FROM Users WHERE email = ?`, [email]);
        user = users[0];
    }
    
    // const hash = await bcrypt.hash(password, user!.salt);
    // const validPassword = await bcrypt.compare(password, hash);
    const hasher = createHash("sha3-512");
    hasher.update(password + user!.salt);
    const hash = hasher.toString("base64");

    const validPassword = user!.password === hash;
    if (!validPassword) {
        throw new Error('Invalid user or password');
    }

    const jwt = await createUserJwt({ userId: user!.userId, email: user!.email });
    return jwt;
}