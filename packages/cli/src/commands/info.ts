import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { BrutalistConfig, InfoOptions, RegistryItem } from '../lib/types.js';
import { getItem } from '../lib/registry.js';
import { readConfigSafe, CliError, DEFAULT_REGISTRY_URL, withOfflineScope } from '../lib/index.js';
import { resolveAliasPath } from '../lib/project.js';
import { logger } from '../lib/logger.js';

interface ComponentInfoResult {
    name: string;
    registryItem: RegistryItem | null;
    localFiles: string[];
    source: string;
    status: 'installed' | 'not-installed' | 'not-found' | 'registry-unreachable';
}

async function getLocalFiles(cwd: string, config: BrutalistConfig, componentName: string): Promise<string[]> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentPath = path.join(componentsPath, componentName);

    if (!await fs.pathExists(componentPath)) {
        return [];
    }

    const files: string[] = [];

    async function walk(dir: string, base: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relative = base ? `${base}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                await walk(fullPath, relative);
            } else {
                files.push(relative);
            }
        }
    }

    await walk(componentPath, '');
    return files;
}

async function getComponentInfo(
    cwd: string,
    config: BrutalistConfig,
    componentName: string,
    registryOverride?: string
): Promise<ComponentInfoResult> {
    const source = registryOverride ?? DEFAULT_REGISTRY_URL;
    let registryItem: RegistryItem | null = null;
    let registryFetchError: Error | null = null;

    try {
        registryItem = await getItem(componentName, source);
    } catch (error) {
        registryItem = null;
        registryFetchError = error instanceof Error ? error : new Error(String(error));
    }

    const localFiles = await getLocalFiles(cwd, config, componentName);

    let status: ComponentInfoResult['status'];
    if (registryItem && localFiles.length > 0) {
        status = 'installed';
    } else if (registryItem && localFiles.length === 0) {
        status = 'not-installed';
    } else if (!registryItem && registryFetchError && localFiles.length > 0) {
        status = 'registry-unreachable';
    } else if (!registryItem && registryFetchError) {
        status = 'registry-unreachable';
    } else if (localFiles.length > 0) {
        status = 'installed';
    } else {
        status = 'not-found';
    }

    return {
        name: componentName,
        registryItem,
        localFiles,
        source,
        status,
    };
}

function printInfo(result: ComponentInfoResult): void {
    logger.newLine();

    logger.bold(`Component: ${result.name}`);
    logger.log(`  Source: ${result.source}`);

    if (result.registryItem) {
        const files = result.registryItem.files.map(f => f.path.split('/').pop() ?? f.path);
        logger.log(`  Registry Files: ${files.join(', ')} (${files.length} file${files.length !== 1 ? 's' : ''})`);

        const deps = result.registryItem.dependencies;
        logger.log(`  Dependencies: ${deps && deps.length > 0 ? deps.join(', ') : chalk.dim('none')}`);

        const regDeps = result.registryItem.registryDependencies;
        logger.log(`  Registry Dependencies: ${regDeps && regDeps.length > 0 ? regDeps.join(', ') : chalk.dim('none')}`);
    } else {
        logger.log(`  Registry: ${chalk.dim('not available')}`);
    }

    if (result.localFiles.length > 0) {
        logger.log(`  Local Files: ${result.localFiles.join(', ')} (${result.localFiles.length} file${result.localFiles.length !== 1 ? 's' : ''})`);
    }

    const statusColor = result.status === 'installed'
        ? chalk.green
        : result.status === 'not-installed'
            ? chalk.yellow
            : result.status === 'registry-unreachable'
                ? chalk.red
                : chalk.dim;
    logger.log(`  Status: ${statusColor(result.status)}`);

    logger.newLine();
}

export async function info(component: string, options: InfoOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    logger.setSilent(options.silent ?? false);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        await infoInner(component, options, cwd);
    } finally {
        restoreOffline();
    }
}

async function infoInner(component: string, options: InfoOptions, cwd: string): Promise<void> {
    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
    }

    const result = await getComponentInfo(cwd, config, component, options.registry);

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    printInfo(result);
}
