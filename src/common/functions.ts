import { client } from "./db.ts";

export interface FuncId {
    functionId: string;
    userId: string;
}

export interface Func extends FuncId {
    lastAccessed: Date;
    lastUpdated: Date;
}

export async function createFunction(func: FuncId): Promise<void> {
    const { functionId, userId } = func;
    await client.execute(`INSERT INTO Functions (functionId, userId, lastUpdated) VALUES (?, ?, ?)`, [functionId, userId, new Date()]);
}

export async function accessFunction(func: FuncId): Promise<void> {
    const { functionId, userId } = func;
    await client.execute(`UPDATE Functions SET lastAccessed = ? WHERE functionId = ? AND userId = ?`, [new Date(), functionId, userId]);
}

export async function updateFunction(func: FuncId): Promise<void> {
    const { functionId, userId } = func;
    await client.execute(`UPDATE Functions SET lastUpdated = ? WHERE functionId = ? AND userId = ?`, [new Date(), functionId, userId]);
}

export async function deleteFunction(func: FuncId): Promise<void> {
    const { functionId, userId } = func;
    await client.execute(`DELETE FROM Functions WHERE functionId = ? AND userId = ?`, [functionId, userId]);
}

export function getFunctions(userId: string): Promise<Func[]> {
    return client.query(`SELECT functionId, userId, lastAccessed, lastUpdated FROM Functions WHERE userId = ?`, [userId]);
}
