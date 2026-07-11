import fs from 'fs-extra';
import path from 'path';
import type { BrutalistConfig, InstalledComponentInfo, InstalledComponentManifest } from './types.js';
import { readManifest } from './manifest.js';
import { resolveAliasPath } from './project.js';

async function scanComponentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string, base: string): Promise<void> {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            const relative = base ? `${base}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                await walk(fullPath, relative);
            } else {
                files.push(relative);
            }
        }
    }

    await walk(dir, '');
    return files;
}

async function extractDependencies(componentDir: string): Promise<string[]> {
    const deps = new Set<string>();
    const files = await scanComponentFiles(componentDir);

    for (const file of files) {
        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

        const content = await fs.readFile(path.join(componentDir, file), 'utf-8');
        const importRegex = /from\s+['"]([^'"./][^'"]*)['"]/g;
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(content)) !== null) {
            const pkg = match[1];
            if (pkg.startsWith('@') && pkg.includes('/')) {
                deps.add(pkg.split('/').slice(0, 2).join('/'));
            } else {
                deps.add(pkg.split('/')[0]);
            }
        }
    }

    return [...deps].sort();
}

async function getScannedComponentNames(componentsPath: string): Promise<string[]> {
    if (!await fs.pathExists(componentsPath)) {
        return [];
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    return dirs
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name)
        .sort();
}

function createManifestInfo(entry: InstalledComponentManifest): InstalledComponentInfo {
    return {
        name: entry.name,
        files: entry.files,
        fileCount: entry.files.length,
        dependencies: entry.dependencies,
        category: entry.category,
        examples: entry.examples,
        status: entry.status,
        replacement: entry.replacement,
        registryDependencies: entry.registryDependencies,
        registrySource: entry.registrySource,
        installedIntegrity: entry.integrity,
        installedAt: entry.installedAt,
        manifestFiles: entry.files,
        managed: true,
    };
}

export async function getInstalledComponentNames(cwd: string, config: BrutalistConfig): Promise<string[]> {
    const manifest = await readManifest(cwd).catch(() => null);
    const manifestNames = Object.keys(manifest?.components ?? {});
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const scannedNames = await getScannedComponentNames(componentsPath);

    return [...new Set([...manifestNames, ...scannedNames])].sort();
}

export async function getInstalledComponentInfos(cwd: string, config: BrutalistConfig): Promise<InstalledComponentInfo[]> {
    const manifest = await readManifest(cwd).catch(() => null);
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentNames = await getInstalledComponentNames(cwd, config);
    const infos: InstalledComponentInfo[] = [];

    for (const name of componentNames) {
        const componentDir = path.join(componentsPath, name);
        const manifestEntry = manifest?.components[name];

        if (!await fs.pathExists(componentDir)) {
            if (manifestEntry) {
                infos.push(createManifestInfo(manifestEntry));
            }
            continue;
        }

        const files = await scanComponentFiles(componentDir);
        const hasVueFile = files.some(f => f.endsWith('.vue'));

        if (files.length === 0 || !hasVueFile) {
            if (manifestEntry) {
                infos.push(createManifestInfo(manifestEntry));
            }
            continue;
        }

        const dependencies = await extractDependencies(componentDir);

        infos.push({
            name,
            files,
            fileCount: files.length,
            dependencies: manifestEntry?.dependencies ?? dependencies,
            category: manifestEntry?.category,
            examples: manifestEntry?.examples,
            status: manifestEntry?.status,
            replacement: manifestEntry?.replacement,
            registryDependencies: manifestEntry?.registryDependencies,
            registrySource: manifestEntry?.registrySource,
            installedIntegrity: manifestEntry?.integrity,
            installedAt: manifestEntry?.installedAt,
            manifestFiles: manifestEntry?.files,
            managed: manifestEntry !== undefined,
        });
    }

    return infos.sort((a, b) => a.name.localeCompare(b.name));
}
