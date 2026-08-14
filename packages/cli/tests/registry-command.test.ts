import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { registryAdd, registryRemove, registryList } from '../src/commands/registry.js';

describe('registry command (基础设施闭环 P1 源管理)', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-reg-cmd-'));
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
    });

    async function writeConfig(raw: Record<string, unknown>): Promise<void> {
        await fs.writeJson(path.join(tmpDir, 'components.json'), raw);
    }

    async function readConfig(): Promise<Record<string, unknown>> {
        return await fs.readJson(path.join(tmpDir, 'components.json')) as Record<string, unknown>;
    }

    it('adds a registry source to components.json registries', async () => {
        await writeConfig({ $version: 1, style: 'brutalism', tailwind: {}, aliases: {} });
        await registryAdd('https://mirror.example.com', { cwd: tmpDir });
        const raw = await readConfig();
        expect(raw.registries).toEqual(['https://mirror.example.com']);
    });

    it('does not duplicate an existing registry source', async () => {
        await writeConfig({ $version: 1, registries: ['https://mirror.example.com'] });
        await registryAdd('https://mirror.example.com', { cwd: tmpDir });
        const raw = await readConfig();
        expect(raw.registries).toEqual(['https://mirror.example.com']);
    });

    it('appends additional sources without losing existing ones', async () => {
        await writeConfig({ $version: 1, registries: ['https://primary.example.com'] });
        await registryAdd('https://mirror.example.com', { cwd: tmpDir });
        const raw = await readConfig();
        expect(raw.registries).toEqual(['https://primary.example.com', 'https://mirror.example.com']);
    });

    it('removes a registry source from components.json', async () => {
        await writeConfig({ $version: 1, registries: ['https://a.example.com', 'https://b.example.com'] });
        await registryRemove('https://a.example.com', { cwd: tmpDir });
        const raw = await readConfig();
        expect(raw.registries).toEqual(['https://b.example.com']);
    });

    it('deletes registries field when removing the last custom source (restore default)', async () => {
        await writeConfig({ $version: 1, registries: ['https://a.example.com'] });
        await registryRemove('https://a.example.com', { cwd: tmpDir });
        const raw = await readConfig();
        expect(raw.registries).toBeUndefined();
    });

    it('throws CONFIG_NOT_FOUND when components.json is missing', async () => {
        await expect(registryAdd('https://x.example.com', { cwd: tmpDir })).rejects.toMatchObject({
            code: 'CONFIG_NOT_FOUND',
        });
    });

    it('throws when components.json contains malformed JSON', async () => {
        await fs.writeFile(path.join(tmpDir, 'components.json'), '{ "invalid_json": ');
        await expect(registryAdd('https://x.example.com', { cwd: tmpDir })).rejects.toThrow(
            /Failed to parse components\.json/,
        );
    });

    it('throws when components.json is not an object', async () => {
        await fs.writeFile(path.join(tmpDir, 'components.json'), '["not", "an", "object"]');
        await expect(registryAdd('https://x.example.com', { cwd: tmpDir })).rejects.toThrow(
            'Invalid components.json: expected an object.',
        );
    });

    it('throws on empty URL for add', async () => {
        await writeConfig({ $version: 1 });
        await expect(registryAdd('   ', { cwd: tmpDir })).rejects.toThrow();
    });

    describe('registryList (基础设施闭环 P1/P2)', () => {
        it('lists default sources without a config', async () => {
            // stub fetch 避免真实网络探测
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
            } as Response);
            await registryList({ cwd: tmpDir, json: true });
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('releases/latest/download'),
            );
            fetchSpy.mockRestore();
        });

        it('does not probe network in offline mode (reports skipped)', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
                throw new Error('network should not be touched');
            });
            await registryList({ cwd: tmpDir, json: true, offline: true });
            expect(fetchSpy).not.toHaveBeenCalled();
            fetchSpy.mockRestore();
        });

        it('respects BRUTX_OFFLINE=1 env for offline mode', async () => {
            process.env.BRUTX_OFFLINE = '1';
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
                throw new Error('network should not be touched');
            });
            try {
                await registryList({ cwd: tmpDir, json: true });
                expect(fetchSpy).not.toHaveBeenCalled();
            } finally {
                delete process.env.BRUTX_OFFLINE;
                fetchSpy.mockRestore();
            }
        });
    });
});
