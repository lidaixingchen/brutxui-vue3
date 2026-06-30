import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { diffLines } from 'diff';
import type { BrutalistConfig, DiffResult, FileDiff, RegistryItem, DiffOptions } from '../lib/types.js';
import { getItem } from '../lib/registry.js';
import { readConfigSafe, CliError } from '../lib/index.js';
import { resolveAliasPath, resolveImportAlias } from '../lib/project.js';
import { logger } from '../lib/logger.js';

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function matchFileByPath(registryPath: string, localRelativePath: string): boolean {
    const normalizedRegistry = registryPath.replace(/\\/g, '/');
    const normalizedLocal = localRelativePath.replace(/\\/g, '/');

    return normalizedRegistry.endsWith('/' + normalizedLocal) ||
           normalizedRegistry === normalizedLocal;
}

function generateUnifiedDiff(
    filePath: string,
    oldContent: string,
    newContent: string
): string {
    const normalizedOld = normalizeLineEndings(oldContent);
    const normalizedNew = normalizeLineEndings(newContent);

    const changes = diffLines(normalizedOld, normalizedNew);
    const diffLines_: string[] = [];
    diffLines_.push(`--- registry/${filePath}`);
    diffLines_.push(`+++ local/${filePath}`);

    for (const part of changes) {
        const lines = part.value.split('\n').filter((line, i, arr) => !(i === arr.length - 1 && line === ''));
        for (const line of lines) {
            if (part.added) {
                diffLines_.push(`+${line}`);
            } else if (part.removed) {
                diffLines_.push(`-${line}`);
            } else {
                diffLines_.push(` ${line}`);
            }
        }
    }

    return diffLines_.join('\n');
}

function getInstalledComponents(cwd: string, config: BrutalistConfig): string[] {
    const componentsPath = resolveAliasPath(config.aliases.components, cwd);

    if (!fs.existsSync(componentsPath)) {
        return [];
    }

    const dirs = fs.readdirSync(componentsPath, { withFileTypes: true });
    return dirs
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
}

function getLocalComponentFiles(
    cwd: string,
    config: BrutalistConfig,
    componentName: string
): Array<{ relativePath: string; absolutePath: string }> {
    const componentsPath = resolveAliasPath(config.aliases.components, cwd);
    const componentPath = path.join(componentsPath, componentName);

    if (!fs.existsSync(componentPath)) {
        return [];
    }

    const files: Array<{ relativePath: string; absolutePath: string }> = [];

    function walkDir(dir: string, relativeBase: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(relativeBase, entry.name);

            if (entry.isDirectory()) {
                walkDir(fullPath, relativePath);
            } else {
                files.push({ relativePath, absolutePath: fullPath });
            }
        }
    }

    walkDir(componentPath, '');
    return files;
}

async function diffComponent(
    cwd: string,
    config: BrutalistConfig,
    componentName: string,
    registryOverride?: string
): Promise<DiffResult> {
    let registryItem: RegistryItem | null = null;

    try {
        registryItem = await getItem(componentName, registryOverride);
    } catch {
        registryItem = null;
    }

    if (!registryItem) {
        return {
            component: componentName,
            status: 'not-installed',
            files: [],
        };
    }

    const localFiles = getLocalComponentFiles(cwd, config, componentName);
    const fileDiffs: FileDiff[] = [];

    for (const registryFile of registryItem.files) {
        const localFile = localFiles.find((f) => matchFileByPath(registryFile.path, f.relativePath));

        if (!localFile) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'added',
            });
            continue;
        }

        if (!fs.existsSync(localFile.absolutePath)) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'added',
            });
            continue;
        }

        const localContent = fs.readFileSync(localFile.absolutePath, 'utf-8');
        const normalizedRegistryContent = resolveImportAlias(registryFile.content, config);

        if (normalizeLineEndings(localContent) === normalizeLineEndings(normalizedRegistryContent)) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'unchanged',
            });
        } else {
            fileDiffs.push({
                path: registryFile.path,
                status: 'modified',
                patch: generateUnifiedDiff(
                    registryFile.path,
                    normalizedRegistryContent,
                    localContent
                ),
            });
        }
    }

    for (const localFile of localFiles) {
        const isInRegistry = registryItem.files.some((f) => matchFileByPath(f.path, localFile.relativePath));

        if (!isInRegistry) {
            fileDiffs.push({
                path: localFile.relativePath,
                status: 'removed',
            });
        }
    }

    const hasChanges = fileDiffs.some((f) => f.status !== 'unchanged');

    return {
        component: componentName,
        status: hasChanges ? 'modified' : 'up-to-date',
        files: fileDiffs,
    };
}

function printDiffReport(results: DiffResult[]): void {
    logger.newLine();
    logger.bold(' Component Diff Report');
    logger.newLine();

    const modified = results.filter((r) => r.status === 'modified');
    const upToDate = results.filter((r) => r.status === 'up-to-date');
    const notInstalled = results.filter((r) => r.status === 'not-installed');

    if (modified.length > 0) {
        logger.log(chalk.yellow(`  🔄 MODIFIED (${modified.length})`));
        for (const result of modified) {
            const changedFiles = result.files.filter((f) => f.status !== 'unchanged').length;
            logger.log(`    — ${result.component}    (${changedFiles} file${changedFiles !== 1 ? 's' : ''} changed)`);

            for (const file of result.files) {
                if (file.status === 'modified' && file.patch) {
                    logger.newLine();
                    const patchLines = file.patch.split('\n');
                    for (const line of patchLines) {
                        if (line.startsWith('+')) {
                            logger.log(chalk.green(`    ${line}`));
                        } else if (line.startsWith('-')) {
                            logger.log(chalk.red(`    ${line}`));
                        } else {
                            logger.dim(`    ${line}`);
                        }
                    }
                }
            }
        }
        logger.newLine();
    }

    if (upToDate.length > 0) {
        logger.log(chalk.green(`  ✅ UP-TO-DATE (${upToDate.length})`));
        for (const result of upToDate) {
            logger.log(`    — ${result.component}`);
        }
        logger.newLine();
    }

    if (notInstalled.length > 0) {
        logger.log(chalk.gray(`  ❓ NOT IN REGISTRY (${notInstalled.length})`));
        for (const result of notInstalled) {
            logger.log(`    — ${result.component} (local only)`);
        }
        logger.newLine();
    }

    logger.log(`  Summary: ${chalk.yellow(`${modified.length} modified`)}, ${chalk.green(`${upToDate.length} up-to-date`)}, ${chalk.gray(`${notInstalled.length} local-only`)}`);
    logger.newLine();
}

export async function diff(options: DiffOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if (options.silent) {
        logger.setSilent(true);
    }

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.');
    }

    const targetComponents = options.components?.length
        ? options.components
        : getInstalledComponents(cwd, config);

    if (targetComponents.length === 0) {
        logger.info('No components found to compare.');
        return;
    }

    const results = await Promise.all(
        targetComponents.map(component => diffComponent(cwd, config, component, options.registry))
    );

    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        printDiffReport(results);
    }
}
