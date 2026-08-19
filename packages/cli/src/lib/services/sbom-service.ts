import path from 'path';
import { createRequire } from 'module';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { ProjectContext } from '../project-context.js';
import { readManifest } from '../manifest.js';
import { CliError } from '../error.js';

export interface ProjectSbomOptions {
    cwd?: string;
    outputPath?: string;
    context?: ProjectContext;
    fs?: FileSystemAdapter;
}

export interface ProjectSbomComponent {
    'bom-ref': string;
    type: 'application' | 'library';
    name: string;
    version?: string;
    hashes?: Array<{ alg: 'SHA-256'; content: string }>;
    dependencies?: string[];
}

export interface ProjectSbomResult {
    targetPath: string;
    componentCount: number;
    specVersion: string;
    sbom: Record<string, unknown>;
}

function getCliVersion(): string {
    try {
        const require = createRequire(import.meta.url);
        const pkg = require('../../../package.json') as { version?: string };
        return pkg.version ?? '0.0.0';
    } catch {
        try {
            const require = createRequire(import.meta.url);
            const pkg = require('../../package.json') as { version?: string };
            return pkg.version ?? '0.0.0';
        } catch {
            return '0.0.0';
        }
    }
}

/**
 * 生成用户项目 CycloneDX 1.5 SBOM 物料清单。
 * 全面依托 ProjectContext 与 FileSystemAdapter，支持磁盘与内存沙箱。
 */
export async function generateProjectSbom(options: ProjectSbomOptions = {}): Promise<ProjectSbomResult> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const projectContext = options.context ?? await ProjectContext.loadUninitialized(cwd, {
        fs: options.fs,
        optionalConfig: true,
    });

    const manifest = await readManifest(cwd, projectContext.fs);
    if (!manifest || Object.keys(manifest.components).length === 0) {
        throw new CliError(
            'No installed components found. Run `brutx-vue add <component>` first.',
            { code: 'CONFIG_NOT_FOUND' }
        );
    }

    const components: ProjectSbomComponent[] = [];
    const seenNpmDeps = new Set<string>();

    for (const [name, entry] of Object.entries(manifest.components)) {
        components.push({
            'bom-ref': `brutx:${name}`,
            type: 'application',
            name,
            version: entry.version ?? 'latest',
            hashes: entry.integrity
                ? [{ alg: 'SHA-256' as const, content: Buffer.from(entry.integrity.replace(/^sha256-/, ''), 'base64').toString('hex') }]
                : undefined,
            dependencies: [
                ...entry.dependencies.map((dep: string) => `npm:${dep}`),
                ...entry.registryDependencies.map((dep: string) => `brutx:${dep}`),
            ],
        });

        for (const dep of entry.dependencies) {
            if (!seenNpmDeps.has(dep)) {
                seenNpmDeps.add(dep);
            }
        }
    }

    for (const dep of [...seenNpmDeps].sort()) {
        components.push({
            'bom-ref': `npm:${dep}`,
            type: 'library',
            name: dep,
        });
    }

    components.sort((a, b) => a['bom-ref'].localeCompare(b['bom-ref']));

    const sbom = {
        $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
        bomFormat: 'CycloneDX',
        specVersion: '1.5',
        version: 1,
        metadata: {
            timestamp: new Date().toISOString(),
            tools: [
                {
                    vendor: 'brutx-vue',
                    name: 'sbom-service',
                    version: getCliVersion(),
                },
            ],
            component: {
                'bom-ref': 'brutx:project',
                type: 'application',
                name: 'user-project',
            },
        },
        components,
    };

    const targetPath = path.resolve(cwd, options.outputPath ?? 'brutx-sbom.json');
    await projectContext.fs.ensureDir(path.dirname(targetPath));
    await projectContext.fs.writeJson(targetPath, sbom, { spaces: 2 });

    return {
        targetPath,
        componentCount: components.length,
        specVersion: '1.5',
        sbom,
    };
}
