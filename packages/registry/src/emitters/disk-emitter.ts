import path from 'node:path';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import type { CompiledRegistryResult } from '../compiler/types.js';

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
        const indexPath = path.join(outputDir, 'index.json');
        await this.fs.writeJson(indexPath, result.index, { spaces });
        writtenCount++;

        // 3. 写入 registry-manifest.json
        const manifestPath = path.join(outputDir, 'registry-manifest.json');
        await this.fs.writeJson(manifestPath, result.manifest, { spaces });
        writtenCount++;

        // 4. 写入 registry-sbom.json
        const sbomPath = path.join(outputDir, 'registry-sbom.json');
        await this.fs.writeJson(sbomPath, result.sbom, { spaces });
        writtenCount++;

        // 5. 扫描并清理过期文件
        let cleanedCount = 0;
        if (options.cleanStale !== false) {
            const activeFileNames = new Set([
                ...Array.from(result.items.keys()).map(name => `${name}.json`),
                'index.json',
                'registry-manifest.json',
                'registry-sbom.json',
            ]);
            cleanedCount = await this.removeStaleFiles(outputDir, activeFileNames);
        }

        return {
            writtenCount,
            cleanedCount,
        };
    }

    private async removeStaleFiles(outputDir: string, activeFileNames: Set<string>): Promise<number> {
        let cleaned = 0;
        try {
            const entries = await this.fs.readdir(outputDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.json')) {
                    if (!activeFileNames.has(entry.name)) {
                        await this.fs.remove(path.join(outputDir, entry.name));
                        cleaned++;
                    }
                }
            }
        } catch {
            // 目录不存在或读取失败忽略
        }
        return cleaned;
    }
}
