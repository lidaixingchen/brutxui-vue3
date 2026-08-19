import path from 'node:path';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import type { CompiledRegistryResult } from '../compiler/types.js';

export const INDEX_FILENAME = 'index.json';
export const MANIFEST_FILENAME = 'registry-manifest.json';
export const SBOM_FILENAME = 'registry-sbom.json';

export interface EmitOptions {
    cleanStale?: boolean;
    spaces?: number;
}

export interface EmitResult {
    writtenCount: number;
    cleanedCount: number;
}

export class DiskEmitter {
    constructor(private fs: FileSystemAdapter) {}

    public async emit(
        result: CompiledRegistryResult,
        outputDir: string,
        options: EmitOptions = {}
    ): Promise<EmitResult> {
        const spaces = options.spaces ?? 2;
        await this.fs.ensureDir(outputDir);
        let writtenCount = 0;

        // 1. 写入所有 item JSON
        for (const [name, item] of result.items.entries()) {
            const itemPath = path.join(outputDir, `${name}.json`);
            await this.fs.writeJson(itemPath, item, { spaces });
            writtenCount++;
        }

        // 2. 写入 index.json
        const indexPath = path.join(outputDir, INDEX_FILENAME);
        await this.fs.writeJson(indexPath, result.index, { spaces });
        writtenCount++;

        // 3. 写入 registry-manifest.json
        const manifestPath = path.join(outputDir, MANIFEST_FILENAME);
        await this.fs.writeJson(manifestPath, result.manifest, { spaces });
        writtenCount++;

        // 4. 写入 registry-sbom.json
        const sbomPath = path.join(outputDir, SBOM_FILENAME);
        await this.fs.writeJson(sbomPath, result.sbom, { spaces });
        writtenCount++;

        // 5. 扫描并清理过期文件
        let cleanedCount = 0;
        if (options.cleanStale !== false) {
            const activeFileNames = new Set([
                ...Array.from(result.items.keys()).map(name => `${name}.json`),
                INDEX_FILENAME,
                MANIFEST_FILENAME,
                SBOM_FILENAME,
            ]);
            cleanedCount = await this.removeStaleFiles(outputDir, activeFileNames);
        }

        return {
            writtenCount,
            cleanedCount,
        };
    }

    private async removeStaleFiles(outputDir: string, activeFileNames: Set<string>): Promise<number> {
        try {
            const entries = await this.fs.readdir(outputDir, { withFileTypes: true });
            const staleFiles = entries
                .filter(entry => entry.isFile() && entry.name.endsWith('.json') && !activeFileNames.has(entry.name))
                .map(entry => path.join(outputDir, entry.name));

            await Promise.all(staleFiles.map(filePath => this.fs.remove(filePath)));
            return staleFiles.length;
        } catch {
            return 0;
        }
    }
}
