import { nanoid, customAlphabet } from "https://deno.land/x/nanoid@v3.0.0/mod.ts"
// import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
// import { create, getNumericDate } from "https://deno.land/x/djwt@v2.2/mod.ts"
import { createHash } from "https://deno.land/std@0.103.0/hash/mod.ts";
import { createUserJwt } from "./jwt.ts";
import { client } from "./db.ts";
import { HttpError } from "./errors.ts";

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

function generateUserId(): string {
    let userId: string;
    const nanoid2 = customAlphabet("1234567890abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUXYZ", 6);
    do {
        userId = nanoid2();
    } while (!/^\w.*\w$/ig.test(userId));
    return userId;
}

export function normalizeEmail(email?: string): string {
    return (email ?? '').toLowerCase().trim();
}

export async function createUser(user: CreateUser): Promise<void> {
    const { password } = user;
    const email = normalizeEmail(user.email);
    const salt = nanoid(16);
    const hasher = createHash("sha3-512");
    hasher.update(password + salt);
    const hash = hasher.toString("base64");
    // bcrypt cant be used, issue with workers: https://github.com/timonson/djwt/issues/48
    // const salt = await bcrypt.genSalt(12);
    // const hash = await bcrypt.hash(password, salt);

    do {
        const userId = generateUserId();
        try {
            await client.execute(`INSERT INTO Users (userId, email, password, salt) VALUES (?, ?, ?, ?)`, [userId, email, hash, salt]);
            return;
        }
        catch (err) {
            if (err.message.includes('Duplicate entry') && err.message.includes('for key \'PRIMARY\''))
                continue;
            if (err.message.includes('Duplicate entry') && err.message.includes('for key \'Index_UsersEmail\''))
                throw new HttpError(`Email address "${email}" already exists`, 409);
        }
    } while (true);
}

/**
 * Verify user credentials and generate jwt
 * @param credentials 
 * @returns jwt
 */
export async function loginUser(credentials: LoginUser): Promise<string> {
    const { userId, password } = credentials;
    const email = normalizeEmail(credentials.email);
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