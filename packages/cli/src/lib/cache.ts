import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';

const CACHE_DIR = path.join(os.homedir(), '.brutx-vue', 'cache');
const DEFAULT_TTL = 3600000;

function getCacheKey(name: string, source: string): string {
    return crypto
        .createHash('sha256')
        .update(`${source}/${name}`)
        .digest('hex')
        .slice(0, 16);
}

function getCacheFilePath(name: string, source: string): string {
    return path.join(CACHE_DIR, `${getCacheKey(name, source)}.json`);
}

function isCacheDisabled(): boolean {
    return process.env.BRUTX_NO_CACHE === '1';
}

export async function getCached<T>(name: string, source: string, ttl: number = DEFAULT_TTL): Promise<T | null> {
    if (isCacheDisabled()) return null;

    const filePath = getCacheFilePath(name, source);

    try {
        if (!(await fs.pathExists(filePath))) return null;

        const raw = await fs.readJson(filePath) as { data?: T; timestamp?: unknown };

        if (typeof raw.timestamp !== 'number' || Date.now() - raw.timestamp > ttl) {
            await fs.remove(filePath);
            return null;
        }

        return raw.data ?? null;
    } catch {
        return null;
    }
}

export async function setCache<T>(name: string, source: string, data: T): Promise<void> {
    if (isCacheDisabled()) return;

    const filePath = getCacheFilePath(name, source);
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(filePath, { data, timestamp: Date.now() });
}

export async function clearCache(): Promise<void> {
    if (await fs.pathExists(CACHE_DIR)) {
        await fs.remove(CACHE_DIR);
    }
}
