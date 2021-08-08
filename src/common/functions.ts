import { client } from "./db.ts";

export interface FuncId {
    functionId: string;
    userId: string;
}

export interface CreateFunc extends FuncId {
    code: string;
}

export interface UpdateFunc extends FuncId {
    code: string;
}

export interface Func extends FuncId {
    lastAccessed: Date;
    lastUpdated: Date;
    code: string;
}

/**
 * Get single function from DB
 * @param func 
 * @returns 
 */
export async function getFunction(func: FuncId): Promise<Func> {
    const { functionId, userId } = func;
    const result = await client.query(`SELECT functionId, userId, lastAccessed, lastUpdated, code FROM Functions WHERE functionId = ? AND BINARY userId = ?`, [functionId, userId]);
    return result[0];
}

/**
 * Creates function in DB
 * @param func 
 */
export async function createFunction(func: CreateFunc): Promise<void> {
    const { functionId, userId, code } = func;
    await client.execute(`INSERT INTO Functions (functionId, userId, lastUpdated, code) VALUES (?, ?, ?, ?)`, [functionId, userId, new Date(), code]);
}

/**
 * Sets lastAccessed field to current date
 * @param func 
 */
export async function accessFunction(func: FuncId): Promise<void> {
    const { functionId, userId } = func;
    await client.execute(`UPDATE Functions SET lastAccessed = ? WHERE functionId = ? AND BINARY userId = ?`, [new Date(), functionId, userId]);
}

/**
 * Sets lastUpdated field to current date
 * @param func 
 */
export async function updateFunction(func: UpdateFunc): Promise<void> {
    const { functionId, userId, code } = func;
    await client.execute(`UPDATE Functions SET lastUpdated = ?, code = ? WHERE functionId = ? AND BINARY userId = ?`, [new Date(), code, functionId, userId]);
}

/**
 * Deletes function from DB
 * @param func 
 */
export async function deleteFunction(func: FuncId): Promise<void> {
    const { functionId, userId } = func;
    await client.execute(`DELETE FROM Functions WHERE functionId = ? AND BINARY userId = ?`, [functionId, userId]);
}

/**
 * Gets users functions
 * @param userId 
 * @returns 
 */
export function getFunctions(userId: string): Promise<Func[]> {
    return client.query(`SELECT functionId, userId, lastAccessed, lastUpdated, code FROM Functions WHERE BINARY userId = ?`, [userId]);
}
