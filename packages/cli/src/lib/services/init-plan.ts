import path from 'node:path';
import semver from 'semver';
import {
    BASE_DEPENDENCIES,
    COMPONENT_DEPENDENCIES,
    SHARED_DEPENDENCIES,
} from '../constants.js';
import { detectPackageManager } from '../env-detector.js';
import type { FileSystemAdapter } from '../fs/index.js';
import { logger } from '../logger.js';
import { getInstallCommand, installPackages } from '../package-manager.js';
import { runProcess } from '../run-process.js';
import type { PackageManager } from '../types.js';
import { planProjectInitializationFiles } from './init-service.js';

const PACKAGE_MANIFEST = 'package.json';
const PNPM_WORKSPACE_MANIFEST = 'pnpm-workspace.yaml';

interface DependencyTarget {
    cwd: string;
    packages: readonly string[];
}

interface DependencyStep extends DependencyTarget {
    packageManager: PackageManager;
    missing: string[];
    action: 'add' | 'install' | 'keep';
    pnpmWorkspaceRoot: boolean;
}

interface PackageManifest {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
}

function matchesInstalledVersion(dependency: string, specifier: string, installed: PackageManifest): boolean {
    if (typeof specifier !== 'string') return false;
    const isAlias = specifier.startsWith('npm:');
    const isWorkspace = specifier.startsWith('workspace:');
    const value = isAlias || isWorkspace ? specifier.slice(specifier.indexOf(':') + 1) : specifier;
    const aliasSeparator = isAlias || isWorkspace ? value.lastIndexOf('@') : -1;
    const name = aliasSeparator > 0 ? value.slice(0, aliasSeparator) : isAlias ? value : dependency;
    const spec = aliasSeparator > 0 ? value.slice(aliasSeparator + 1) : isAlias ? '' : value;
    if (isWorkspace && ['*', '^', '~'].includes(spec)) return installed.name === name;
    const range = spec && semver.validRange(spec);

    if (!range) return isAlias ? installed.name === name : Boolean(installed.name);
    return installed.name === name && Boolean(installed.version && semver.satisfies(installed.version, range));
}

async function hasInstalledPackage(
    cwd: string,
    dependency: string,
    specifier: string,
    fs: FileSystemAdapter,
): Promise<boolean> {
    let dir = cwd;
    while (true) {
        const packageDir = path.join(dir, 'node_modules', dependency);
        if (await fs.pathExists(packageDir)) {
            const installed = await fs.readJson<PackageManifest>(path.join(packageDir, PACKAGE_MANIFEST)).catch(() => null);
            return installed !== null && matchesInstalledVersion(dependency, specifier, installed);
        }
        const parent = path.dirname(dir);
        if (parent === dir) return false;
        dir = parent;
    }
}

async function planDependencies(
    target: DependencyTarget,
    workspaceRoot: string | null,
    fs: FileSystemAdapter,
): Promise<DependencyStep> {
    const { cwd, packages } = target;
    const manifestPath = path.join(cwd, PACKAGE_MANIFEST);
    const manifest = await fs.pathExists(manifestPath) ? await fs.readJson<PackageManifest>(manifestPath) : {};
    const declared = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.optionalDependencies };
    const missing = packages.filter(dependency => !(dependency in declared));
    const detected = await detectPackageManager(cwd, fs);
    const inPnpmWorkspace = workspaceRoot !== null && await fs.pathExists(path.join(workspaceRoot, PNPM_WORKSPACE_MANIFEST));
    const packageManager = detected === 'npm' && inPnpmWorkspace ? 'pnpm' : detected;
    const step = { ...target, packageManager, missing, pnpmWorkspaceRoot: inPnpmWorkspace && workspaceRoot === cwd };

    if (missing.length > 0) return { ...step, action: 'add' };

    const pnp = packageManager === 'yarn' && await fs.pathExists(path.join(workspaceRoot ?? cwd, '.pnp.cjs'));
    const installed = pnp || (await Promise.all(packages.map(dependency =>
        hasInstalledPackage(cwd, dependency, declared[dependency], fs)
    ))).every(Boolean);
    return { ...step, action: installed ? 'keep' : 'install' };
}

type InitFileOptions = Parameters<typeof planProjectInitializationFiles>[0];

export async function planInitialization(
    options: InitFileOptions,
    workspaceRoot: string | null,
    fs: FileSystemAdapter,
) {
    const { cwd } = options;
    const targets: DependencyTarget[] = workspaceRoot && workspaceRoot !== cwd
        ? [
            { cwd: workspaceRoot, packages: SHARED_DEPENDENCIES },
            { cwd, packages: COMPONENT_DEPENDENCIES },
        ]
        : [{ cwd, packages: BASE_DEPENDENCIES }];

    const [files, dependencies] = await Promise.all([
        planProjectInitializationFiles(options),
        Promise.all(targets.map(target => planDependencies(target, workspaceRoot, fs))),
    ]);
    return { files, dependencies };
}

export function describeDependencyStep(step: DependencyStep): string {
    const { packageManager, missing, pnpmWorkspaceRoot, action } = step;
    if (action === 'install') return `${packageManager} install`;
    if (action === 'keep') return step.packages.join(', ');
    if (packageManager === 'pnpm' && pnpmWorkspaceRoot) return `pnpm add -w -- ${missing.join(' ')}`;
    return getInstallCommand(packageManager, missing);
}

export async function applyDependencyStep(step: DependencyStep): Promise<void> {
    const { packageManager, missing, pnpmWorkspaceRoot, action, cwd } = step;
    if (action === 'keep') return;
    if (action === 'add' && !(packageManager === 'pnpm' && pnpmWorkspaceRoot)) {
        await installPackages(packageManager, missing, cwd);
        return;
    }

    const args = action === 'install' ? ['install'] : ['add', '-w', '--', ...missing];
    await runProcess(packageManager, args, {
        cwd,
        stdio: 'pipe',
        onStdout: line => logger.log(line),
        onStderr: line => logger.log(line),
    });
}
