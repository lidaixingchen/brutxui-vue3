import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { BrutalistConfig, ListOptions, InstalledComponentInfo } from '../lib/types.js';
import { readConfigSafe, CliError, readManifest } from '../lib/index.js';
import { resolveAliasPath } from '../lib/project.js';
import { getItem } from '../lib/registry.js';
import { logger } from '../lib/logger.js';

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
    const files = await fs.readdir(componentDir, { withFileTypes: true });

    for (const file of files) {
        if (!file.isFile()) continue;
        const ext = path.extname(file.name);
        if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

        const content = await fs.readFile(path.join(componentDir, file.name), 'utf-8');
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

async function getComponentInfos(cwd: string, config: BrutalistConfig): Promise<InstalledComponentInfo[]> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const manifest = await readManifest(cwd).catch(() => null);

    if (!await fs.pathExists(componentsPath)) {
        return [];
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    const componentDirs = dirs.filter(d => d.isDirectory());
    const infos: InstalledComponentInfo[] = [];

    for (const dir of componentDirs) {
        const componentDir = path.join(componentsPath, dir.name);
        const files = await scanComponentFiles(componentDir);

        if (files.length === 0) continue;

        const hasVueFile = files.some(f => f.endsWith('.vue'));
        if (!hasVueFile) continue;

        const dependencies = await extractDependencies(componentDir);
        const manifestEntry = manifest?.components[dir.name];

        infos.push({
            name: dir.name,
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

async function attachUpdateInfo(
    infos: InstalledComponentInfo[],
    registryOverride: string | undefined,
    useCache: boolean
): Promise<InstalledComponentInfo[]> {
    return Promise.all(infos.map(async (info) => {
        if (!info.installedIntegrity) {
            return info;
        }

        const source = registryOverride ?? info.registrySource;
        if (!source) {
            return info;
        }

        try {
            const latest = await getItem(info.name, source, useCache);
            return {
                ...info,
                latestIntegrity: latest.integrity,
                updateAvailable: latest.integrity !== info.installedIntegrity,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                ...info,
                updateCheckError: message,
            };
        }
    }));
}

function formatSource(source: string | undefined): string {
    if (!source) {
        return 'local';
    }

    try {
        return new URL(source).host;
    } catch {
        return source;
    }
}

function formatStatus(info: InstalledComponentInfo): string {
    if (!info.status || info.status === 'stable') {
        return 'stable';
    }
    return info.replacement ? `${info.status} -> ${info.replacement}` : info.status;
}

function formatCategory(info: InstalledComponentInfo): string {
    return info.category ?? 'local';
}

function formatUpdate(info: InstalledComponentInfo): string {
    if (info.updateCheckError) return 'unknown';
    if (info.updateAvailable === true) return 'available';
    if (info.updateAvailable === false) return 'current';
    return 'not checked';
}

function printTable(infos: InstalledComponentInfo[], showUpdates: boolean): void {
    logger.newLine();
    logger.bold('Installed Components');
    logger.newLine();

    const nameWidth = Math.max(10, ...infos.map(i => i.name.length)) + 2;
    const filesWidth = 8;
    const categoryWidth = Math.max(10, ...infos.map(i => formatCategory(i).length)) + 2;
    const statusWidth = Math.max(10, ...infos.map(i => formatStatus(i).length)) + 2;
    const sourceWidth = Math.max(10, ...infos.map(i => formatSource(i.registrySource).length)) + 2;
    const updateWidth = showUpdates ? Math.max(10, ...infos.map(i => formatUpdate(i).length)) + 2 : 0;
    const updateHeader = showUpdates ? 'Update'.padEnd(updateWidth) : '';
    const updateSeparator = showUpdates ? '─'.repeat(updateWidth) : '';
    const header = `  ${'Name'.padEnd(nameWidth)}${'Files'.padEnd(filesWidth)}${'Category'.padEnd(categoryWidth)}${'Status'.padEnd(statusWidth)}${'Source'.padEnd(sourceWidth)}${updateHeader}Dependencies`;
    const separator = `  ${'─'.repeat(nameWidth)}${'─'.repeat(filesWidth)}${'─'.repeat(categoryWidth)}${'─'.repeat(statusWidth)}${'─'.repeat(sourceWidth)}${updateSeparator}${'─'.repeat(20)}`;

    logger.log(header);
    logger.log(separator);

    for (const info of infos) {
        const depsStr = info.dependencies.length > 0
            ? info.dependencies.join(', ')
            : chalk.dim('none');
        const source = formatSource(info.registrySource);
        const sourceStr = info.registrySource ? source : chalk.dim(source);
        const category = formatCategory(info);
        const categoryStr = info.category ? category : chalk.dim(category);
        const status = formatStatus(info);
        const statusStr = info.status && info.status !== 'stable' ? chalk.yellow(status) : status;
        const update = formatUpdate(info);
        const updateStr = info.updateAvailable ? chalk.yellow(update) : update;
        const updateColumn = showUpdates ? updateStr.padEnd(updateWidth) : '';
        logger.log(`  ${info.name.padEnd(nameWidth)}${String(info.fileCount).padEnd(filesWidth)}${categoryStr.padEnd(categoryWidth)}${statusStr.padEnd(statusWidth)}${sourceStr.padEnd(sourceWidth)}${updateColumn}${depsStr}`);
    }

    logger.newLine();
    logger.info(`  ${infos.length} component(s) installed`);
    logger.newLine();
}

export async function list(options: ListOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if ((options as Record<string, unknown>).cache === false) {
        process.env.BRUTX_NO_CACHE = '1';
    }

    logger.setSilent(options.silent ?? false);

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.');
    }

    let infos = await getComponentInfos(cwd, config);

    if (infos.length === 0) {
        logger.info('No installed components found.');
        return;
    }

    if (options.checkUpdates) {
        infos = await attachUpdateInfo(infos, options.registry, options.cache !== false);
    }

    if (options.json) {
        console.log(JSON.stringify(infos, null, 2));
        return;
    }

    printTable(infos, options.checkUpdates === true);
}
