import { installLockedConsumer } from '../../../scripts/testing/consumer-lock.mjs';
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    loadCandidateArtifacts,
    packCandidateArtifacts,
    ProcessTreeManager,
    rmWithRetry,
    summarizeCandidateArtifacts,
} from '../../../scripts/testing/consumer-artifacts.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPackageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(cliPackageRoot, '../..');
const localRegistryDir = path.join(repoRoot, 'packages/registry/registry');

const ALL_CONSUMER_IDS = Object.freeze(['U1', 'C1', 'C3']);
const DEFAULT_CONSUMER_IDS = Object.freeze(['U1', 'C1']);
const INTERNAL_SELECTION_HELPERS = Object.freeze([
    'useClearableSelection',
    'useSelectableTrigger',
    'useSelectionDisplayText',
    'useTransferPanelSelection',
]);
const SIGNAL_EXIT_CODES = Object.freeze({
    SIGINT: 130,
    SIGTERM: 143,
});
const CONSUMER_VERSIONS = Object.freeze({
    vue: '3.5.35',
    classVarianceAuthority: '0.7.1',
    clsx: '2.1.1',
    tailwindMerge: '3.6.0',
    vueUseCore: '14.3.0',
    typesPrismjs: '1.26.6',
    typesWebBluetooth: '0.0.21',
    vueComponentTypeHelpers: '3.3.3',
    vitePluginVue: '6.0.7',
    rekaUi: '2.9.9',
    lucideVue: '1.17.0',
    tailwindVite: '4.3.0',
    tailwindcss: '4.3.0',
    vite: '8.0.16',
    vueTsc: '3.3.3',
    typescript: '6.0.3',
    tanstackVueVirtual: '3.13.30',
    emblaCarouselVue: '8.6.0',
    prismjs: '1.30.0',
    vCalendar: '3.1.2',
    veeValidate: '4.15.1',
});
const C1_PUBLIC_INDEX_EXPECTATIONS = Object.freeze({
    button: ['export { default as Button }', 'export { buttonVariants }'],
    combobox: ['export { default as Combobox }', 'export type { ComboboxOption }'],
    'tree-select': [
        'export { default as TreeSelect }',
        'export { default as TreeSelectNode }',
        'export type { SelectionMode }',
        'export type { TreeNode }',
    ],
    transfer: ['export { default as Transfer }', 'export type { TransferDataItem }'],
});
const CONSUMER_NPMRC = 'ignore-scripts=true\nconfirmModulesPurge=false\nlink-workspace-packages=false\nprefer-workspace-packages=false\n';

const processManager = new ProcessTreeManager();

process.on('SIGINT', async () => {
    await processManager.cleanupAll();
    process.exit(SIGNAL_EXIT_CODES.SIGINT);
});
process.on('SIGTERM', async () => {
    await processManager.cleanupAll();
    process.exit(SIGNAL_EXIT_CODES.SIGTERM);
});

function consumerEnv(overrides = {}) {
    return {
        ...process.env,
        NODE_PATH: '',
        CI: 'true',
        npm_config_ignore_scripts: 'true',
        npm_config_confirm_modules_purge: 'false',
        pnpm_config_enable_global_virtual_store: 'false',
        pnpm_config_verify_deps_before_run: 'warn',
        ...overrides,
    };
}

function execWithLogging(cmd, options = {}) {
    try {
        return execSync(cmd, {
            ...options,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
    } catch (error) {
        const stdout = error?.stdout ? error.stdout.toString() : '';
        const stderr = error?.stderr ? error.stderr.toString() : '';
        throw new Error(`Command failed: ${cmd}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`, { cause: error });
    }
}

function writeJson(filePath, value) {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function writeText(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
}

function assertFile(filePath, message = `Expected file was not found: ${filePath}`) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new Error(message);
    }
}

function assertNonEmptyFile(filePath, message = `Expected non-empty file was not found: ${filePath}`) {
    assertFile(filePath, message);
    if (fs.statSync(filePath).size === 0) {
        throw new Error(message);
    }
}

function assertContains(content, expected, message = `Expected content to contain: ${expected}`) {
    if (!content.includes(expected)) {
        throw new Error(message);
    }
}

function isWithin(parentPath, candidatePath) {
    const relative = path.relative(parentPath, candidatePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertNoWorktreePackageLinks(consumerDir) {
    const nodeModulesDir = path.join(consumerDir, 'node_modules');
    if (!fs.existsSync(nodeModulesDir)) return;

    const assertLinkTarget = (entryPath, scope) => {
        const targetPath = fs.realpathSync(entryPath);
        if (isWithin(path.join(repoRoot, 'packages'), targetPath)) {
            throw new Error(`Consumer dependency ${scope} resolves to a workspace package: ${targetPath}`);
        }
    };

    const inspectEntries = (directory, scope) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isSymbolicLink()) {
                assertLinkTarget(entryPath, `${scope}/${entry.name}`);
            }
        }
    };

    inspectEntries(nodeModulesDir, 'node_modules');
    const pnpmStoreDir = path.join(nodeModulesDir, '.pnpm');
    if (!fs.existsSync(pnpmStoreDir)) return;
    for (const packageEntry of fs.readdirSync(pnpmStoreDir, { withFileTypes: true })) {
        if (!packageEntry.isDirectory()) continue;
        const packageNodeModulesDir = path.join(pnpmStoreDir, packageEntry.name, 'node_modules');
        if (fs.existsSync(packageNodeModulesDir)) {
            inspectEntries(packageNodeModulesDir, `node_modules/.pnpm/${packageEntry.name}/node_modules`);
        }
    }
}

function parseConsumerArguments(args = []) {
    if (!Array.isArray(args)) {
        throw new Error('Consumer arguments must be an array.');
    }

    let runAll = false;
    let filter;
    let artifactsPath;

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (argument === '--all') {
            if (runAll) {
                throw new Error('Duplicate --all option.');
            }
            runAll = true;
            continue;
        }

        if (argument === '--filter' || argument.startsWith('--filter=')) {
            if (filter !== undefined) {
                throw new Error('Duplicate --filter option.');
            }
            const value = argument === '--filter' ? args[++index] : argument.slice('--filter='.length);
            if (value === undefined || value.trim().length === 0 || value.startsWith('--')) {
                throw new Error('--filter requires a non-empty consumer id.');
            }
            const normalizedValue = value.trim().toUpperCase();
            if (!ALL_CONSUMER_IDS.includes(normalizedValue)) {
                throw new Error(`Unknown consumer filter "${value}". Expected one of: ${ALL_CONSUMER_IDS.join(', ')}.`);
            }
            filter = normalizedValue;
            continue;
        }

        if (argument === '--artifacts' || argument.startsWith('--artifacts=')) {
            if (artifactsPath !== undefined) {
                throw new Error('Duplicate --artifacts option.');
            }
            const value = argument === '--artifacts' ? args[++index] : argument.slice('--artifacts='.length);
            if (value === undefined || value.trim().length === 0 || value.startsWith('--')) {
                throw new Error('--artifacts requires a candidate directory or candidate-manifest.json path.');
            }
            artifactsPath = value;
            continue;
        }

        throw new Error(`Unknown consumer option or positional argument: ${argument}`);
    }

    if (runAll && filter !== undefined) {
        throw new Error('--all and --filter cannot be used together.');
    }

    const tests = filter !== undefined
        ? [filter]
        : runAll
            ? [...ALL_CONSUMER_IDS]
            : [...DEFAULT_CONSUMER_IDS];

    if (tests.length === 0) {
        throw new Error('No consumer matrices selected.');
    }

    return Object.freeze({
        runAll,
        filter,
        artifactsPath,
        tests: Object.freeze(tests),
    });
}

export function selectConsumerTests(args = []) {
    return [...parseConsumerArguments(args).tests];
}

export { parseConsumerArguments };

function registryUrl(directory = localRegistryDir) {
    return `file://${directory.replace(/\\/g, '/')}`;
}

function packageVersions() {
    return {
        vue: CONSUMER_VERSIONS.vue,
        '@vitejs/plugin-vue': CONSUMER_VERSIONS.vitePluginVue,
        '@tailwindcss/vite': CONSUMER_VERSIONS.tailwindVite,
        tailwindcss: CONSUMER_VERSIONS.tailwindcss,
        vite: CONSUMER_VERSIONS.vite,
    };
}

function assertExpectedTypecheckFailure(cwd, sourcePath, expectedMessages) {
    let failed = false;
    try {
        execWithLogging(
            `pnpm exec tsc --ignoreConfig --noEmit --skipLibCheck false --module ESNext --moduleResolution bundler --target ES2022 --strict --types vite/client,web-bluetooth "${sourcePath}"`,
            { cwd, env: consumerEnv() }
        );
    } catch (error) {
        failed = true;
        for (const expectedMessage of expectedMessages) {
            if (!error.message.includes(expectedMessage)) {
                throw new Error(
                    `Expected TypeScript diagnostic was not found: ${expectedMessage}\nActual output:\n${error.message}`,
                    { cause: error }
                );
            }
        }
    }
    if (!failed) {
        throw new Error(`Expected TypeScript failure for ${sourcePath}, but the command passed.`);
    }
}

function runU1NegativeImports(tempConsumerDir) {
    const negativeDir = path.join(tempConsumerDir, 'negative');
    fs.mkdirSync(negativeDir, { recursive: true });

    const rootPath = path.join(negativeDir, 'root-helper.ts');
    writeText(
        rootPath,
        `import { ${INTERNAL_SELECTION_HELPERS.join(', ')} } from 'brutx-ui-vue';\n`
    );
    assertExpectedTypecheckFailure(
        tempConsumerDir,
        rootPath,
        INTERNAL_SELECTION_HELPERS.map(helper => helper === 'useClearableSelection'
            ? `'"brutx-ui-vue"' has no exported member named '${helper}'.`
            : `Module '"brutx-ui-vue"' has no exported member '${helper}'.`)
    );

    const subpathPath = path.join(negativeDir, 'subpath-helper.ts');
    writeText(
        subpathPath,
        INTERNAL_SELECTION_HELPERS
            .map(helper => `import { ${helper} } from 'brutx-ui-vue/${helper}';`)
            .join('\n') + '\n'
    );
    assertExpectedTypecheckFailure(
        tempConsumerDir,
        subpathPath,
        INTERNAL_SELECTION_HELPERS.map(helper => `Cannot find module 'brutx-ui-vue/${helper}' or its corresponding type declarations.`)
    );
}

function writeU1Consumer(tempConsumerDir) {
    const srcDir = path.join(tempConsumerDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    writeJson(path.join(tempConsumerDir, 'tsconfig.json'), {
        compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            skipLibCheck: false,
            noEmit: true,
            types: ['vite/client', 'web-bluetooth'],
        },
        include: ['src/**/*.ts', 'src/**/*.vue'],
    });

    writeText(
        path.join(tempConsumerDir, 'vite.config.ts'),
        `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [vue(), tailwindcss()],
});
`
    );
    writeText(path.join(srcDir, 'style.css'), '@import "tailwindcss";\n@import "brutx-ui-vue/style.css";\n');
    writeText(path.join(srcDir, 'env.d.ts'), '/// <reference types="vite/client" />\n');
    writeText(
        path.join(srcDir, 'main.ts'),
        `import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

createApp(App).mount('#app');
`
    );
    writeText(
        path.join(srcDir, 'consumer-types.ts'),
        `import { Button, Loading } from 'brutx-ui-vue';
import type {
    CascaderOption,
    ComboboxOption,
    ComponentProps,
    TransferDataItem,
    TreeNode,
} from 'brutx-ui-vue';
import { Button as ButtonFromSubpath } from 'brutx-ui-vue/button';
import { Loading as LoadingFromSubpath } from 'brutx-ui-vue/loading';
import { Combobox } from 'brutx-ui-vue/combobox';
import type { ComboboxOption as ComboboxOptionFromSubpath } from 'brutx-ui-vue/combobox';
import { Cascader } from 'brutx-ui-vue/cascader';
import type { CascaderOption as CascaderOptionFromSubpath } from 'brutx-ui-vue/cascader';
import { TreeSelect } from 'brutx-ui-vue/tree-select';
import type { TreeNode as TreeNodeFromSubpath } from 'brutx-ui-vue/tree-select';
import { Transfer } from 'brutx-ui-vue/transfer';
import type { TransferDataItem as TransferDataItemFromSubpath } from 'brutx-ui-vue/transfer';
import { useLocale } from 'brutx-ui-vue/useLocale';
import { useTheme } from 'brutx-ui-vue/useTheme';
import { useToast } from 'brutx-ui-vue/useToast';

const rootComboboxOptions: ComboboxOption[] = [{ value: 'one', label: 'One' }];
const subpathComboboxOptions: ComboboxOptionFromSubpath[] = rootComboboxOptions;
const rootCascaderOptions: CascaderOption<{ source: string }>[] = [{
    value: 'root',
    label: 'Root',
    data: { source: 'consumer' },
}];
const subpathCascaderOptions: CascaderOptionFromSubpath<{ source: string }>[] = rootCascaderOptions;
const rootTreeNodes: TreeNode<{ source: string }>[] = [{
    id: 'root',
    label: 'Root',
    data: { source: 'consumer' },
}];
const subpathTreeNodes: TreeNodeFromSubpath<{ source: string }>[] = rootTreeNodes;
const rootTransferData: TransferDataItem[] = [{ key: 'one', label: 'One' }];
const subpathTransferData: TransferDataItemFromSubpath[] = rootTransferData;

type ButtonProps = ComponentProps<typeof Button>;
type LoadingProps = ComponentProps<typeof Loading>;
type ComboboxProps = ComponentProps<typeof Combobox>;
type CascaderProps = ComponentProps<typeof Cascader>;
type TreeSelectProps = ComponentProps<typeof TreeSelect>;
type TransferProps = ComponentProps<typeof Transfer>;

const buttonProps: Partial<ButtonProps> = { variant: 'default', loading: false };
const loadingProps: Partial<LoadingProps> = { loading: true, text: 'Loading' };
const comboboxProps: Partial<ComboboxProps> = { options: subpathComboboxOptions };
const cascaderProps: Partial<CascaderProps> = { options: subpathCascaderOptions };
const treeSelectProps: Partial<TreeSelectProps> = { nodes: subpathTreeNodes };
const transferProps: Partial<TransferProps> = { data: subpathTransferData, modelValue: ['one'] };

export const consumerTypeProbe = {
    ButtonFromSubpath,
    LoadingFromSubpath,
    useLocale,
    useTheme,
    useToast,
    buttonProps,
    loadingProps,
    comboboxProps,
    cascaderProps,
    treeSelectProps,
    transferProps,
};
`
    );
    writeText(
        path.join(srcDir, 'App.vue'),
        `<script setup lang="ts">
import { Button, Loading } from 'brutx-ui-vue';
import { Button as ButtonFromSubpath } from 'brutx-ui-vue/button';
import { Loading as LoadingFromSubpath } from 'brutx-ui-vue/loading';

const isLoading = false;
</script>

<template>
    <main class="p-8">
        <Button variant="default">Root Button</Button>
        <ButtonFromSubpath variant="primary">Subpath Button</ButtonFromSubpath>
        <Loading :loading="isLoading" />
        <LoadingFromSubpath :loading="isLoading" />
    </main>
</template>
`
    );
    writeText(
        path.join(tempConsumerDir, 'index.html'),
        '<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>'
    );
}

async function runU1(manifest, artifactSummary) {
    const startTime = Date.now();
    const tempConsumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-u1-consumer-'));
    const uiTarball = manifest.packages['brutx-ui-vue'].tarballPath;

    try {
        console.log(`[U1] Setting up isolated Vite + Vue + Tailwind consumer in ${tempConsumerDir}...`);
        writeJson(path.join(tempConsumerDir, 'package.json'), {
            name: 'u1-vite-consumer',
            private: true,
            type: 'module',
            scripts: {
                build: 'vite build',
                typecheck: 'vue-tsc --noEmit --skipLibCheck false',
            },
            dependencies: {
                'brutx-ui-vue': `file:${uiTarball}`,
                vue: CONSUMER_VERSIONS.vue,
                '@vitejs/plugin-vue': CONSUMER_VERSIONS.vitePluginVue,
                'reka-ui': CONSUMER_VERSIONS.rekaUi,
                '@lucide/vue': CONSUMER_VERSIONS.lucideVue,
                '@tailwindcss/vite': CONSUMER_VERSIONS.tailwindVite,
                tailwindcss: CONSUMER_VERSIONS.tailwindcss,
                vite: CONSUMER_VERSIONS.vite,
                'vue-tsc': CONSUMER_VERSIONS.vueTsc,
                typescript: CONSUMER_VERSIONS.typescript,
                '@tanstack/vue-virtual': CONSUMER_VERSIONS.tanstackVueVirtual,
                'embla-carousel-vue': CONSUMER_VERSIONS.emblaCarouselVue,
                prismjs: CONSUMER_VERSIONS.prismjs,
                'v-calendar': CONSUMER_VERSIONS.vCalendar,
                'vee-validate': CONSUMER_VERSIONS.veeValidate,
                '@vueuse/core': CONSUMER_VERSIONS.vueUseCore,
                '@types/prismjs': CONSUMER_VERSIONS.typesPrismjs,
                '@types/web-bluetooth': CONSUMER_VERSIONS.typesWebBluetooth,
                'vue-component-type-helpers': CONSUMER_VERSIONS.vueComponentTypeHelpers,
            },
        });
        writeText(path.join(tempConsumerDir, '.npmrc'), CONSUMER_NPMRC);

        installLockedConsumer({
            directory: tempConsumerDir,
            id: 'U1',
            artifact: manifest.packages['brutx-ui-vue'],
            lockDirectory: path.join(__dirname, 'fixtures/consumers'),
            evidenceDirectory: process.env.BRUTX_CONSUMER_EVIDENCE_DIR ?? path.join(path.dirname(manifest.packages['brutx-ui-vue'].tarballPath), 'consumers'),
            env: consumerEnv(),
        });
        assertNoWorktreePackageLinks(tempConsumerDir);
        writeU1Consumer(tempConsumerDir);

        console.log('[U1] Running vue-tsc with skipLibCheck=false...');
        execWithLogging('pnpm exec vue-tsc --noEmit --skipLibCheck false', {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });
        runU1NegativeImports(tempConsumerDir);

        console.log('[U1] Running Vite production build...');
        execWithLogging('pnpm exec vite build', {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });
        assertNonEmptyFile(path.join(tempConsumerDir, 'dist', 'index.html'));

        const durationMs = Date.now() - startTime;
        console.log(`✓ U1 (UI tarball root/subpaths, strict types, negative API checks, build) passed in ${durationMs}ms`);
        return {
            id: 'U1',
            description: 'UI tarball root/subpaths, strict types, negative API checks, build',
            durationMs,
            success: true,
            artifactSummary,
        };
    } finally {
        await rmWithRetry(tempConsumerDir);
    }
}

function writeC1ViteConfig(tempConsumerDir) {
    writeText(
        path.join(tempConsumerDir, 'vite.config.ts'),
        `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(projectRoot, 'src'),
        },
    },
});
`
    );
}

function writeC1Source(tempConsumerDir) {
    const srcDir = path.join(tempConsumerDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    writeJson(path.join(tempConsumerDir, 'tsconfig.json'), {
        compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            skipLibCheck: false,
            noEmit: true,
            types: ['vite/client', 'web-bluetooth'],
            baseUrl: '.',
            ignoreDeprecations: '6.0',
            paths: {
                '@/*': ['src/*'],
            },
        },
        include: ['src/**/*.ts', 'src/**/*.vue'],
    });
    writeText(path.join(srcDir, 'style.css'), '@import "tailwindcss";\n');
    writeText(path.join(srcDir, 'env.d.ts'), '/// <reference types="vite/client" />\n');
    writeText(
        path.join(srcDir, 'main.ts'),
        `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(App).mount('#app');
`
    );
    writeText(
        path.join(srcDir, 'App.vue'),
        `<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { TreeSelect } from '@/components/ui/tree-select';
import { Transfer } from '@/components/ui/transfer';

const comboboxOptions = [{ value: 'one', label: 'One' }];
const treeNodes = [{ id: 'root', label: 'Root' }];
const transferData = [{ key: 'one', label: 'One' }];
const selectedTransfer = ['one'];
</script>

<template>
    <main class="p-4">
        <Button>CLI Added Button</Button>
        <Combobox :options="comboboxOptions" />
        <TreeSelect :nodes="treeNodes" />
        <Transfer :data="transferData" :model-value="selectedTransfer" />
    </main>
</template>
`
    );
    writeText(
        path.join(srcDir, 'helper-types.ts'),
        `import { buttonVariants } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import type { ComboboxOption } from '@/components/ui/combobox';
import { TreeSelect } from '@/components/ui/tree-select';
import type { SelectionMode, TreeNode } from '@/components/ui/tree-select';
import { Transfer } from '@/components/ui/transfer';
import type { TransferDataItem } from '@/components/ui/transfer';

type ComponentProps<C> = C extends new (...args: any[]) => any
    ? InstanceType<C>['$props']
    : never;

export const comboboxOptions: ComboboxOption[] = [{ value: 'one', label: 'One' }];
export const buttonClass = buttonVariants({ variant: 'default' });
export const treeNodes: TreeNode[] = [{ id: 'root', label: 'Root' }];
export const transferData: TransferDataItem[] = [{ key: 'one', label: 'One' }];
export const selectionMode: SelectionMode = 'single';
export type PublicComboboxProps = ComponentProps<typeof Combobox>;
export type PublicTreeSelectProps = ComponentProps<typeof TreeSelect>;
export type PublicTransferProps = ComponentProps<typeof Transfer>;
`
    );
    writeText(
        path.join(tempConsumerDir, 'index.html'),
        '<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>'
    );
}

function assertC1PublicIndexes(tempConsumerDir) {
    for (const [componentName, expectedExports] of Object.entries(C1_PUBLIC_INDEX_EXPECTATIONS)) {
        const indexPath = path.join(tempConsumerDir, 'src/components/ui', componentName, 'index.ts');
        assertFile(indexPath, `Expected generated public index for ${componentName}: ${indexPath}`);
        const content = fs.readFileSync(indexPath, 'utf-8');
        for (const expectedExport of expectedExports) {
            assertContains(content, expectedExport, `Public index ${indexPath} is missing ${expectedExport}`);
        }
        for (const internalHelper of INTERNAL_SELECTION_HELPERS) {
            if (content.includes(internalHelper)) {
                throw new Error(`Public index ${indexPath} leaked internal helper ${internalHelper}`);
            }
        }
    }
}

async function runC1(manifest, artifactSummary) {
    const startTime = Date.now();
    const tempConsumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-c1-consumer-'));
    const cliTarball = manifest.packages['brutx-vue'].tarballPath;
    const baselineRegistry = path.join(tempConsumerDir, 'registry-baseline');

    try {
        execFileSync('pnpm', ['exec', 'tsx', path.join(__dirname, 'fixtures/consumer-registry.ts'), localRegistryDir, baselineRegistry], {
            cwd: cliPackageRoot,
            env: consumerEnv(),
            stdio: 'pipe',
        });
        console.log(`[C1] Setting up isolated Vite source consumer in ${tempConsumerDir}...`);
        writeJson(path.join(tempConsumerDir, 'package.json'), {
            name: 'c1-cli-consumer',
            private: true,
            type: 'module',
            scripts: {
                build: 'vite build',
                typecheck: 'vue-tsc --noEmit --skipLibCheck false',
            },
            dependencies: {
                'brutx-vue': `file:${cliTarball}`,
                ...packageVersions(),
                'class-variance-authority': CONSUMER_VERSIONS.classVarianceAuthority,
                clsx: CONSUMER_VERSIONS.clsx,
                'tailwind-merge': CONSUMER_VERSIONS.tailwindMerge,
                'reka-ui': CONSUMER_VERSIONS.rekaUi,
                '@lucide/vue': CONSUMER_VERSIONS.lucideVue,
                '@vueuse/core': CONSUMER_VERSIONS.vueUseCore,
                '@types/web-bluetooth': CONSUMER_VERSIONS.typesWebBluetooth,
                'vue-component-type-helpers': CONSUMER_VERSIONS.vueComponentTypeHelpers,
                'vue-tsc': CONSUMER_VERSIONS.vueTsc,
                typescript: CONSUMER_VERSIONS.typescript,
            },
        });
        writeText(path.join(tempConsumerDir, '.npmrc'), CONSUMER_NPMRC);

        installLockedConsumer({
            directory: tempConsumerDir,
            id: 'C1',
            artifact: manifest.packages['brutx-vue'],
            lockDirectory: path.join(__dirname, 'fixtures/consumers'),
            evidenceDirectory: process.env.BRUTX_CONSUMER_EVIDENCE_DIR ?? path.join(path.dirname(manifest.packages['brutx-ui-vue'].tarballPath), 'consumers'),
            env: consumerEnv(),
        });
        assertNoWorktreePackageLinks(tempConsumerDir);
        writeC1ViteConfig(tempConsumerDir);
        writeC1Source(tempConsumerDir);

        console.log('[C1] Running brutx-vue init...');
        execWithLogging('pnpm exec brutx-vue init -y', {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });

        const localRegistryUrl = registryUrl(baselineRegistry);
        for (const componentName of ['button', 'combobox', 'tree-select', 'transfer']) {
            console.log(`[C1] Adding ${componentName} from the local registry snapshot...`);
            execWithLogging(`pnpm exec brutx-vue add ${componentName} --yes --no-cache --registry "${localRegistryUrl}"`, {
                cwd: tempConsumerDir,
                env: consumerEnv(),
            });
        }

        const treeIndexPath = path.join(tempConsumerDir, 'src/components/ui/tree-select/index.ts');
        assertContains(fs.readFileSync(treeIndexPath, 'utf8'), 'useSelectableTrigger', '基线快照缺少预期的旧公开入口');
        const buttonPath = path.join(tempConsumerDir, 'src/components/ui/button/Button.vue');
        assertFile(buttonPath);

        const localMarker = '<!-- consumer-local-modification -->';
        const buttonBeforeUpdate = fs.readFileSync(buttonPath, 'utf-8');
        if (buttonBeforeUpdate.includes(localMarker)) {
            throw new Error('C1 fixture marker unexpectedly existed before the update protection check.');
        }
        writeText(buttonPath, buttonBeforeUpdate.replace('</template>', `    ${localMarker}\n</template>`));
        const candidateRegistryUrl = registryUrl();
        const diffOutput = execWithLogging(`pnpm exec brutx-vue diff button tree-select --json --no-cache --registry "${candidateRegistryUrl}"`, {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });
        const differences = JSON.parse(diffOutput);
        for (const name of ['button', 'tree-select']) {
            if (!differences.some(result => result.component === name && result.integrityStatus === 'outdated')) {
                throw new Error(`diff 未识别 ${name} 的快照变化`);
            }
        }
        execWithLogging(`pnpm exec brutx-vue update button tree-select --yes --no-cache --registry "${candidateRegistryUrl}"`, {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });
        const buttonAfterUpdate = fs.readFileSync(buttonPath, 'utf-8');
        assertContains(buttonAfterUpdate, localMarker, 'CLI update did not preserve the local Button modification.');
        if (buttonAfterUpdate.includes('<<<<<<<') || buttonAfterUpdate.includes('>>>>>>>')) {
            throw new Error('CLI update left conflict markers in the locally modified Button.');
        }
        assertC1PublicIndexes(tempConsumerDir);
        if (fs.readFileSync(path.join(tempConsumerDir, 'src/components/ui/button/index.ts'), 'utf8').includes('consumerBaseline')) {
            throw new Error('update 未移除基线快照中的公开符号');
        }
        const replayEvidence = path.join(process.env.BRUTX_CONSUMER_EVIDENCE_DIR
            ?? path.join(path.dirname(manifest.packages['brutx-ui-vue'].tarballPath), 'consumers'), 'C1');
        writeJson(path.join(replayEvidence, 'replay.json'), {
            baselineDigest: JSON.parse(fs.readFileSync(path.join(baselineRegistry, 'registry-manifest.json'), 'utf8')).digest,
            candidateDigest: JSON.parse(fs.readFileSync(path.join(localRegistryDir, 'registry-manifest.json'), 'utf8')).digest,
            differences,
            localModificationPreserved: true,
            publicProjectionUpdated: true,
        });

        console.log('[C1] Running source typecheck with skipLibCheck=false...');
        execWithLogging('pnpm exec vue-tsc --noEmit --skipLibCheck false', {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });
        console.log('[C1] Running Vite production build with copied source components...');
        execWithLogging('pnpm exec vite build', {
            cwd: tempConsumerDir,
            env: consumerEnv(),
        });
        assertNonEmptyFile(path.join(tempConsumerDir, 'dist', 'index.html'));

        const durationMs = Date.now() - startTime;
        console.log(`✓ C1 (CLI tarball source add, public indexes, update protection, typecheck, build) passed in ${durationMs}ms`);
        return {
            id: 'C1',
            description: 'CLI tarball source add, public indexes, update protection, typecheck, build',
            durationMs,
            success: true,
            artifactSummary,
        };
    } finally {
        await rmWithRetry(tempConsumerDir);
    }
}

async function runC3(manifest, artifactSummary) {
    const startTime = Date.now();
    const tempMonorepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-c3-monorepo-'));
    const cliTarball = manifest.packages['brutx-vue'].tarballPath;

    try {
        console.log(`[C3] Setting up isolated pnpm workspace in ${tempMonorepoDir}...`);
        writeJson(path.join(tempMonorepoDir, 'package.json'), {
            name: 'c3-workspace-root',
            private: true,
            dependencies: {
                'brutx-vue': `file:${cliTarball}`,
            },
        });
        writeText(
            path.join(tempMonorepoDir, 'pnpm-workspace.yaml'),
            'packages:\n  - "apps/*"\nallowBuilds:\n  vue-demi: true\n  esbuild: true\n'
        );
        writeText(path.join(tempMonorepoDir, '.npmrc'), CONSUMER_NPMRC);

        const appDir = path.join(tempMonorepoDir, 'apps/web');
        fs.mkdirSync(appDir, { recursive: true });
        writeJson(path.join(appDir, 'package.json'), {
            name: '@c3/web',
            private: true,
            type: 'module',
            dependencies: packageVersions(),
        });
        writeText(path.join(appDir, '.npmrc'), CONSUMER_NPMRC);
        fs.mkdirSync(path.join(appDir, 'src'), { recursive: true });
        writeText(path.join(appDir, 'src/main.ts'), "import { createApp } from 'vue';\n");
        writeC3ViteConfig(appDir);

        installLockedConsumer({
            directory: tempMonorepoDir,
            id: 'C3',
            artifact: manifest.packages['brutx-vue'],
            lockDirectory: path.join(__dirname, 'fixtures/consumers'),
            evidenceDirectory: process.env.BRUTX_CONSUMER_EVIDENCE_DIR ?? path.join(path.dirname(manifest.packages['brutx-ui-vue'].tarballPath), 'consumers'),
            env: consumerEnv(),
        });
        assertNoWorktreePackageLinks(tempMonorepoDir);
        const localRegistryUrl = registryUrl();
        execWithLogging('pnpm exec brutx-vue init -y', {
            cwd: appDir,
            env: consumerEnv(),
        });
        execWithLogging(`pnpm exec brutx-vue add button --yes --no-cache --registry "${localRegistryUrl}"`, {
            cwd: appDir,
            env: consumerEnv(),
        });

        assertFile(path.join(appDir, 'src/components/ui/button/Button.vue'));
        const durationMs = Date.now() - startTime;
        console.log(`✓ C3 (CLI in pnpm workspace sub-application) passed in ${durationMs}ms`);
        return {
            id: 'C3',
            description: 'CLI in pnpm workspace sub-application',
            durationMs,
            success: true,
            artifactSummary,
        };
    } finally {
        await rmWithRetry(tempMonorepoDir);
    }
}

function writeC3ViteConfig(appDir) {
    writeText(
        path.join(appDir, 'vite.config.ts'),
        `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(projectRoot, 'src'),
        },
    },
});
`
    );
}

async function main() {
    const options = parseConsumerArguments(process.argv.slice(2));
    console.log('=== [test-consumers] Starting Real Consumer Matrix Verification ===');
    const startTime = Date.now();
    let artifactsDir;
    let manifest;

    try {
        if (options.artifactsPath !== undefined) {
            console.log(`[test-consumers] Loading candidate artifacts from ${options.artifactsPath}...`);
            manifest = loadCandidateArtifacts(options.artifactsPath);
        } else {
            artifactsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-candidate-artifacts-'));
            console.log(`[test-consumers] Packing candidate tarballs into ${artifactsDir}...`);
            manifest = packCandidateArtifacts(artifactsDir, repoRoot);
        }

        const artifactSummary = summarizeCandidateArtifacts(manifest);
        console.log(`[test-consumers] Shared candidate summary: ${JSON.stringify(artifactSummary)}`);
        console.log(`[test-consumers] Selected consumer matrices: ${options.tests.join(', ')}`);

        const runners = { U1: runU1, C1: runC1, C3: runC3 };
        const results = [];
        for (const testId of options.tests) {
            results.push(await runners[testId](manifest, artifactSummary));
        }

        const totalDuration = Date.now() - startTime;
        writeJson(path.join(path.dirname(manifest.packages['brutx-ui-vue'].tarballPath), 'consumer-results.json'), {
            artifactSummary,
            results,
            totalDurationMs: totalDuration,
        });
        console.log('\n=== [test-consumers] Verification Summary ===');
        console.table(
            results.map(result => ({
                Matrix: result.id,
                Description: result.description,
                'Duration (s)': (result.durationMs / 1000).toFixed(2),
                Status: result.success ? 'PASSED' : 'FAILED',
            }))
        );
        console.log(`Total Elapsed: ${(totalDuration / 1000).toFixed(2)}s\n`);

        if (results.some(result => !result.success)) {
            process.exitCode = 1;
        }
    } finally {
        if (artifactsDir !== undefined) {
            await rmWithRetry(artifactsDir);
        }
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main().catch(error => {
        console.error('[test-consumers] Execution failed with error:', error);
        process.exitCode = 1;
    });
}
