import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { FileTransaction } from '../src/lib/file-transaction.js';

describe('FileTransaction', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-file-transaction-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    it('restores overwritten files and removes created files on rollback', async () => {
        const transaction = new FileTransaction();
        const existingPath = path.join(tmpDir, 'src', 'existing.ts');
        const createdPath = path.join(tmpDir, 'src', 'created.ts');

        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');
        await transaction.writeFile(createdPath, 'created');

        expect(await fs.readFile(existingPath, 'utf-8')).toBe('changed');
        expect(await fs.pathExists(createdPath)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(existingPath, 'utf-8')).toBe('original');
        expect(await fs.pathExists(createdPath)).toBe(false);
    });

    it('restores removed directories on rollback', async () => {
        const transaction = new FileTransaction();
        const targetDir = path.join(tmpDir, 'components', 'button');
        const targetFile = path.join(targetDir, 'Button.vue');

        await fs.ensureDir(targetDir);
        await fs.writeFile(targetFile, '<template>Button</template>', 'utf-8');

        await transaction.remove(targetDir);

        expect(await fs.pathExists(targetDir)).toBe(false);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(targetFile, 'utf-8')).toBe('<template>Button</template>');
    });

    it('removes directories created through ensureDir on rollback', async () => {
        const transaction = new FileTransaction();
        const createdDir = path.join(tmpDir, 'src', 'components', 'ui');

        await transaction.ensureDir(createdDir);

        expect(await fs.pathExists(createdDir)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.pathExists(createdDir)).toBe(false);
    });

    it('keeps changes after commit and makes rollback a no-op', async () => {
        const transaction = new FileTransaction();
        const targetPath = path.join(tmpDir, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await transaction.commit();

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readJson(targetPath)).toEqual({ style: 'brutalism' });
    });
});
