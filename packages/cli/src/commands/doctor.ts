import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { BrutalistConfig, CheckResult, DoctorOptions } from '../lib/types.js';
import { readConfig } from '../lib/registry.js';
import { resolveAliasPath } from '../lib/project.js';
import { SCHEMA_URL, BASE_DEPENDENCIES, BRUTALIST_CSS_STYLES, UTILS_TEMPLATE } from '../lib/constants.js';
import { logger } from '../lib/logger.js';

const UTILS_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;

async function readConfigSafe(cwd: string): Promise<BrutalistConfig | null> {
    try {
        return await readConfig(cwd);
    } catch {
        return null;
    }
}

function checkConfigExists(cwd: string, config: BrutalistConfig | null): CheckResult {
    if (!config) {
        return {
            name: 'components.json exists',
            status: 'error',
            message: 'components.json not found. Run `brutx-vue init` first.',
        };
    }
    return {
        name: 'components.json exists',
        status: 'pass',
        message: 'components.json found.',
    };
}

function checkSchema(config: BrutalistConfig): CheckResult {
    if (!config.$schema) {
        return {
            name: '$schema field present',
            status: 'warn',
            message: '$schema field is missing.',
            fixDescription: 'Add $schema URL',
        };
    }
    return {
        name: '$schema field present',
        status: 'pass',
        message: '$schema field is present.',
    };
}

function checkStyle(config: BrutalistConfig): CheckResult {
    if (!config.style) {
        return {
            name: 'style field present',
            status: 'warn',
            message: 'style field is missing.',
            fixDescription: 'Set style to "brutalism"',
        };
    }
    return {
        name: 'style field present',
        status: 'pass',
        message: `style is "${config.style}".`,
    };
}

function checkTailwindCss(cwd: string, config: BrutalistConfig): CheckResult {
    const cssPath = resolveAliasPath(config.tailwind.css, cwd);

    if (!fs.existsSync(cssPath)) {
        return {
            name: 'tailwind.css points to real file',
            status: 'error',
            message: `CSS file not found: ${config.tailwind.css}`,
        };
    }

    const content = fs.readFileSync(cssPath, 'utf-8');
    if (!content.includes('--brutal-bg')) {
        return {
            name: 'tailwind.css contains BrutxUI tokens',
            status: 'error',
            message: `CSS file exists but missing BrutxUI tokens: ${config.tailwind.css}`,
            fixDescription: 'Inject BrutxUI CSS tokens',
        };
    }

    return {
        name: 'tailwind.css contains BrutxUI tokens',
        status: 'pass',
        message: 'CSS file contains BrutxUI tokens.',
    };
}

function checkAliases(cwd: string, config: BrutalistConfig): CheckResult[] {
    const results: CheckResult[] = [];

    const componentsPath = resolveAliasPath(config.aliases.components, cwd);
    results.push({
        name: `aliases.components → ${config.aliases.components}`,
        status: fs.existsSync(componentsPath) ? 'pass' : 'warn',
        message: fs.existsSync(componentsPath)
            ? 'Directory exists.'
            : 'Directory does not exist.',
        fixDescription: 'Create directory',
    });

    const utilsPath = resolveAliasPath(config.aliases.utils, cwd);
    const utilsExists = UTILS_EXTENSIONS.some((ext) => fs.existsSync(utilsPath + ext));

    results.push({
        name: `aliases.utils → ${config.aliases.utils}`,
        status: utilsExists ? 'pass' : 'error',
        message: utilsExists ? 'File exists.' : 'File does not exist.',
        fixDescription: 'Create utils file',
    });

    return results;
}

function checkDependencies(cwd: string): CheckResult[] {
    const results: CheckResult[] = [];

    let packageJson: Record<string, Record<string, string>> = {};
    try {
        packageJson = fs.readJsonSync(path.join(cwd, 'package.json'));
    } catch {
        return results;
    }

    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    const requiredDeps = BASE_DEPENDENCIES.filter((dep) => dep !== '@lucide/vue');
    const optionalDeps = ['@lucide/vue'];

    for (const dep of requiredDeps) {
        const installed = dep in allDeps;
        results.push({
            name: `${dep} installed`,
            status: installed ? 'pass' : 'error',
            message: installed
                ? `${allDeps[dep]} installed.`
                : `Missing dependency. Run: pnpm add ${dep}`,
        });
    }

    for (const dep of optionalDeps) {
        const installed = dep in allDeps;
        results.push({
            name: `${dep} installed (optional)`,
            status: installed ? 'pass' : 'warn',
            message: installed
                ? `${allDeps[dep]} installed.`
                : `Optional dependency not installed (needed for icon components).`,
        });
    }

    return results;
}

function checkUtilsFunction(cwd: string, config: BrutalistConfig): CheckResult {
    const utilsPath = resolveAliasPath(config.aliases.utils, cwd);
    const utilsFile = UTILS_EXTENSIONS.find((ext) => fs.existsSync(utilsPath + ext));

    if (!utilsFile) {
        return {
            name: 'cn() function exists',
            status: 'error',
            message: 'Utils file not found.',
            fixDescription: 'Create utils file with cn() function',
        };
    }

    const content = fs.readFileSync(utilsPath + utilsFile, 'utf-8');
    if (!content.includes('export function cn') && !content.includes('export const cn')) {
        return {
            name: 'cn() function exists',
            status: 'error',
            message: 'cn() function not found in utils file.',
            fixDescription: 'Add cn() function to utils file',
        };
    }

    return {
        name: 'cn() function exists',
        status: 'pass',
        message: 'cn() function found.',
    };
}

function checkComponentIntegrity(cwd: string, config: BrutalistConfig): CheckResult[] {
    const results: CheckResult[] = [];
    const componentsPath = resolveAliasPath(config.aliases.components, cwd);

    if (!fs.existsSync(componentsPath)) {
        return results;
    }

    try {
        const dirs = fs.readdirSync(componentsPath, { withFileTypes: true });
        for (const dir of dirs) {
            if (dir.isDirectory()) {
                const componentPath = path.join(componentsPath, dir.name);
                const files = fs.readdirSync(componentPath);
                const hasFiles = files.length > 0;

                results.push({
                    name: `component ${dir.name}`,
                    status: hasFiles ? 'pass' : 'warn',
                    message: hasFiles
                        ? `${files.length} files found.`
                        : 'Component directory is empty.',
                });
            }
        }
    } catch (error) {
        // Log error in debug mode but don't fail the check
        logger.debug(`Error reading component directory: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
}

function printReport(checks: CheckResult[]): void {
    logger.newLine();
    logger.bold(' Brutx-Vue Doctor');
    logger.newLine();

    const passed = checks.filter((c) => c.status === 'pass').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;
    const errors = checks.filter((c) => c.status === 'error').length;

    for (const check of checks) {
        let icon: string;
        if (check.status === 'pass') {
            icon = chalk.green('✅');
        } else if (check.status === 'warn') {
            icon = chalk.yellow('⚠️');
        } else {
            icon = chalk.red('❌');
        }
        logger.log(`  ${icon} ${check.name} — ${check.message}`);

        if (check.status !== 'pass' && check.fixDescription) {
            logger.dim(`     → Fix: ${check.fixDescription}`);
        }
    }

    logger.newLine();
    logger.log(`  Summary: ${chalk.green(`${passed} passed`)}, ${chalk.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`)}, ${chalk.red(`${errors} error${errors !== 1 ? 's' : ''}`)}`);
    logger.newLine();
}

async function applyFixes(checks: CheckResult[], options: DoctorOptions): Promise<void> {
    const fixable = checks.filter((c) => c.status !== 'pass' && c.fixDescription);

    if (fixable.length === 0) {
        logger.info('No fixable issues found.');
        return;
    }

    if (!options.yes && !options.silent) {
        logger.warn(`Found ${fixable.length} fixable issue${fixable.length !== 1 ? 's' : ''}. Use --yes to auto-fix.`);
        return;
    }

    const cwd = options.cwd ?? process.cwd();
    const config = await readConfigSafe(cwd);

    if (!config) return;

    for (const check of fixable) {
        try {
            if (check.name === '$schema field present') {
                config.$schema = SCHEMA_URL;
                logger.success('Added $schema field.');
            }

            if (check.name === 'style field present') {
                config.style = 'brutalism';
                logger.success('Set style to "brutalism".');
            }

            if (check.name === 'tailwind.css contains BrutxUI tokens') {
                const cssPath = resolveAliasPath(config.tailwind.css, cwd);
                const existing = fs.readFileSync(cssPath, 'utf-8');
                fs.writeFileSync(cssPath, existing + '\n' + BRUTALIST_CSS_STYLES, 'utf-8');
                logger.success('Injected BrutxUI CSS tokens.');
            }

            if (check.name.startsWith('aliases.components')) {
                const componentsPath = resolveAliasPath(config.aliases.components, cwd);
                fs.ensureDirSync(componentsPath);
                logger.success('Created components directory.');
            }

            if (check.name.startsWith('aliases.utils →') && check.status === 'error') {
                const utilsPath = resolveAliasPath(config.aliases.utils, cwd);
                fs.writeFileSync(utilsPath + '.ts', UTILS_TEMPLATE, 'utf-8');
                logger.success('Created utils file.');
            }

            if (check.name === 'cn() function exists') {
                const utilsPath = resolveAliasPath(config.aliases.utils, cwd);
                const utilsFile = UTILS_EXTENSIONS.find((ext) => fs.existsSync(utilsPath + ext));

                if (utilsFile) {
                    const existing = fs.readFileSync(utilsPath + utilsFile, 'utf-8');
                    fs.writeFileSync(utilsPath + utilsFile, existing + '\n' + UTILS_TEMPLATE, 'utf-8');
                    logger.success('Added cn() function.');
                }
            }
        } catch (error) {
            logger.error(`Failed to fix: ${check.name}`);
            logger.error(error instanceof Error ? error.message : String(error));
        }
    }

    // Write updated config
    try {
        const configPath = path.join(cwd, 'components.json');
        fs.writeJsonSync(configPath, config, { spaces: 2 });
        logger.success('Updated components.json.');
    } catch (error) {
        logger.error('Failed to write updated config file.');
        logger.error(error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export async function doctor(options: DoctorOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if (options.silent) {
        logger.setSilent(true);
    }

    const config = await readConfigSafe(cwd);
    const checks: CheckResult[] = [];

    checks.push(checkConfigExists(cwd, config));

    if (config) {
        checks.push(checkSchema(config));
        checks.push(checkStyle(config));
        checks.push(checkTailwindCss(cwd, config));
        checks.push(...checkAliases(cwd, config));
        checks.push(...checkDependencies(cwd));
        checks.push(checkUtilsFunction(cwd, config));
        checks.push(...checkComponentIntegrity(cwd, config));
    }

    if (options.json) {
        process.stdout.write(JSON.stringify(checks, null, 2) + '\n');
    } else {
        printReport(checks);
    }

    if (options.fix) {
        await applyFixes(checks, options);
    }

    const hasErrors = checks.some((c) => c.status === 'error');
    if (hasErrors) {
        process.exit(1);
    }
}
