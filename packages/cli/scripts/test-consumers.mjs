import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    packCandidateArtifacts,
    ProcessTreeManager,
    rmWithRetry,
} from '../../../scripts/testing/consumer-artifacts.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPackageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(cliPackageRoot, '../..');
const localRegistryDir = path.join(repoRoot, 'packages/registry/registry');

const processManager = new ProcessTreeManager();

// 注册退出信号处理
process.on('SIGINT', async () => {
    await processManager.cleanupAll();
    process.exit(130);
});
process.on('SIGTERM', async () => {
    await processManager.cleanupAll();
    process.exit(143);
});



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
        throw new Error(`Command failed: ${cmd}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
    }
}

/**
 * 运行 U1 矩阵：UI tarball 在 Vite + Vue + Tailwind v4 中的真实消费与构建
 */
async function runU1(artifactsDir, manifest) {
    const startTime = Date.now();
    const tempConsumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-u1-consumer-'));
    const uiTarball = manifest.packages['brutx-ui-vue'].tarballPath;

    try {
        console.log(`[U1] Setting up Vite + Vue + Tailwind v4 consumer in ${tempConsumerDir}...`);

        // 1. 写 package.json（包含真实候选 tarball 引用）
        fs.writeFileSync(
            path.join(tempConsumerDir, 'package.json'),
            JSON.stringify(
                {
                    name: 'u1-vite-consumer',
                    private: true,
                    type: 'module',
                    scripts: {
                        build: 'vite build',
                        typecheck: 'vue-tsc --noEmit',
                    },
                    dependencies: {
                        'brutx-ui-vue': `file:${uiTarball}`,
                        vue: '^3.5.0',
                        '@vitejs/plugin-vue': '^6.0.0',
                        'reka-ui': '^2.9.0',
                        '@lucide/vue': '^1.0.0',
                        '@tailwindcss/vite': '^4.0.0',
                        tailwindcss: '^4.0.0',
                        vite: '^6.0.0',
                        'vue-tsc': '^3.3.3',
                        typescript: '^5.7.0',
                    },
                },
                null,
                2
            )
        );

        // 2. 写 .npmrc 和 pnpm-workspace.yaml 避免 pnpm 脚本阻断
        fs.writeFileSync(
            path.join(tempConsumerDir, '.npmrc'),
            'ignore-scripts=true\nconfirmModulesPurge=false\n'
        );
        fs.writeFileSync(
            path.join(tempConsumerDir, 'pnpm-workspace.yaml'),
            'allowBuilds:\n  vue-demi: true\n  esbuild: true\n'
        );

        // 3. 安装依赖
        console.log('[U1] Installing UI tarball and dependencies...');
        execWithLogging('pnpm --config.ignore-scripts=true install', {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        // 4. 写 vite.config.ts
        fs.writeFileSync(
            path.join(tempConsumerDir, 'vite.config.ts'),
            `
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
});
`
        );

        // 5. 写 tsconfig.json
        fs.writeFileSync(
            path.join(tempConsumerDir, 'tsconfig.json'),
            JSON.stringify(
                {
                    compilerOptions: {
                        target: 'ES2022',
                        module: 'ESNext',
                        moduleResolution: 'bundler',
                        strict: true,
                        skipLibCheck: true,
                        noEmit: true,
                    },
                    include: ['src/**/*.ts', 'src/**/*.vue'],
                },
                null,
                2
            )
        );

        // 6. 写 src/style.css, src/main.ts, src/App.vue
        const srcDir = path.join(tempConsumerDir, 'src');
        fs.mkdirSync(srcDir, { recursive: true });

        fs.writeFileSync(
            path.join(srcDir, 'style.css'),
            `@import "tailwindcss";\n@import "brutx-ui-vue/style.css";\n`
        );

        fs.writeFileSync(
            path.join(srcDir, 'main.ts'),
            `
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

createApp(App).mount('#app');
`
        );

        fs.writeFileSync(
            path.join(srcDir, 'App.vue'),
            `
<script setup lang="ts">
import { Button } from 'brutx-ui-vue/button';
import { Badge } from 'brutx-ui-vue/badge';
</script>

<template>
  <main class="p-8">
    <Button variant="default">Test Button</Button>
    <Badge>Test Badge</Badge>
  </main>
</template>
`
        );

        fs.writeFileSync(
            path.join(tempConsumerDir, 'index.html'),
            `<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`
        );

        // 7. 严格类型检查
        console.log('[U1] Running vue-tsc typecheck...');
        execWithLogging('pnpm exec vue-tsc --noEmit', {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '' },
        });

        // 8. 生产构建
        console.log('[U1] Running vite build...');
        execWithLogging('pnpm exec vite build', {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '' },
        });

        // 9. 校验构建产物
        const distIndex = path.join(tempConsumerDir, 'dist', 'index.html');
        if (!fs.existsSync(distIndex) || fs.statSync(distIndex).size === 0) {
            throw new Error('Vite production build output index.html missing or empty');
        }

        const durationMs = Date.now() - startTime;
        console.log(`✓ U1 (UI tarball -> Vite + Vue + Tailwind v4) passed in ${durationMs}ms`);
        return { id: 'U1', description: 'UI tarball -> Vite + Vue + Tailwind v4', durationMs, success: true };
    } finally {
        await rmWithRetry(tempConsumerDir);
    }
}

/**
 * 运行 C1 矩阵：CLI tarball 在 Vite 源码项目中执行 init, add 与生产构建
 */
async function runC1(artifactsDir, manifest) {
    const startTime = Date.now();
    const tempConsumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-c1-consumer-'));
    const cliTarball = manifest.packages['brutx-vue'].tarballPath;

    try {
        console.log(`[C1] Setting up Vite project for CLI testing in ${tempConsumerDir}...`);

        fs.writeFileSync(
            path.join(tempConsumerDir, 'package.json'),
            JSON.stringify(
                {
                    name: 'c1-cli-consumer',
                    private: true,
                    type: 'module',
                    scripts: {
                        build: 'vite build',
                    },
                    dependencies: {
                        'brutx-vue': `file:${cliTarball}`,
                        vue: '^3.5.0',
                        '@vitejs/plugin-vue': '^6.0.0',
                        '@tailwindcss/vite': '^4.0.0',
                        tailwindcss: '^4.0.0',
                        vite: '^6.0.0',
                    },
                },
                null,
                2
            )
        );

        fs.writeFileSync(
            path.join(tempConsumerDir, '.npmrc'),
            'ignore-scripts=true\nconfirmModulesPurge=false\n'
        );
        fs.writeFileSync(
            path.join(tempConsumerDir, 'pnpm-workspace.yaml'),
            'allowBuilds:\n  vue-demi: true\n  esbuild: true\n'
        );

        // 1. 安装 CLI tarball 及 Vite 依赖
        console.log('[C1] Installing CLI tarball and Vite dependencies...');
        execWithLogging('pnpm --config.ignore-scripts=true install', {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        // 2. 初始化基本项目骨架
        fs.writeFileSync(
            path.join(tempConsumerDir, 'vite.config.ts'),
            `
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`
        );

        const srcDir = path.join(tempConsumerDir, 'src');
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, 'style.css'), '@import "tailwindcss";\n');
        fs.writeFileSync(path.join(srcDir, 'main.ts'), 'import { createApp } from "vue";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");\n');
        fs.writeFileSync(path.join(srcDir, 'App.vue'), '<template><div id="app">Hello</div></template>\n');
        fs.writeFileSync(path.join(tempConsumerDir, 'index.html'), '<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>');

        // 3. 执行 brutx-vue init
        console.log('[C1] Running brutx-vue init...');
        execWithLogging('pnpm exec brutx-vue init -y', {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        // 4. 执行 brutx-vue add button
        console.log('[C1] Running brutx-vue add button...');
        const registryUrl = `file://${localRegistryDir.replace(/\\/g, '/')}`;
        execWithLogging(`pnpm exec brutx-vue add button --yes --registry "${registryUrl}"`, {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        // 5. 校验 Button 源码是否成功写入
        const buttonPath = path.join(srcDir, 'components/ui/button/Button.vue');
        if (!fs.existsSync(buttonPath)) {
            throw new Error(`Expected Button component at ${buttonPath} was not created`);
        }

        // 6. 更新 App.vue 引入生成的组件
        fs.writeFileSync(
            path.join(srcDir, 'App.vue'),
            `
<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
</script>

<template>
  <main class="p-4">
    <Button>CLI Added Button</Button>
  </main>
</template>
`
        );

        // 7. 生产构建
        console.log('[C1] Building Vite project with imported source component...');
        execWithLogging('pnpm exec vite build', {
            cwd: tempConsumerDir,
            env: { ...process.env, NODE_PATH: '' },
        });

        const distIndex = path.join(tempConsumerDir, 'dist', 'index.html');
        if (!fs.existsSync(distIndex)) {
            throw new Error('C1 Vite build output index.html not found');
        }

        const durationMs = Date.now() - startTime;
        console.log(`✓ C1 (CLI tarball -> Vite source add & build) passed in ${durationMs}ms`);
        return { id: 'C1', description: 'CLI tarball -> Vite source add & build', durationMs, success: true };
    } finally {
        await rmWithRetry(tempConsumerDir);
    }
}

/**
 * 运行 C3 矩阵：CLI 在 pnpm workspace 多包子应用环境中的目标定位与安装
 */
async function runC3(artifactsDir, manifest) {
    const startTime = Date.now();
    const tempMonorepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-c3-monorepo-'));
    const cliTarball = manifest.packages['brutx-vue'].tarballPath;

    try {
        console.log(`[C3] Setting up pnpm workspace in ${tempMonorepoDir}...`);

        fs.writeFileSync(
            path.join(tempMonorepoDir, 'package.json'),
            JSON.stringify(
                {
                    name: 'c3-workspace-root',
                    private: true,
                    dependencies: {
                        'brutx-vue': `file:${cliTarball}`,
                    },
                },
                null,
                2
            )
        );

        fs.writeFileSync(
            path.join(tempMonorepoDir, 'pnpm-workspace.yaml'),
            'packages:\n  - "apps/*"\nallowBuilds:\n  vue-demi: true\n  esbuild: true\n'
        );

        fs.writeFileSync(
            path.join(tempMonorepoDir, '.npmrc'),
            'ignore-scripts=true\nconfirmModulesPurge=false\n'
        );

        const appDir = path.join(tempMonorepoDir, 'apps/web');
        fs.mkdirSync(appDir, { recursive: true });

        fs.writeFileSync(
            path.join(appDir, '.npmrc'),
            'ignore-scripts=true\nconfirmModulesPurge=false\n'
        );

        fs.writeFileSync(
            path.join(appDir, 'package.json'),
            JSON.stringify(
                {
                    name: '@c3/web',
                    private: true,
                    type: 'module',
                    dependencies: {
                        vue: '^3.5.0',
                        '@vitejs/plugin-vue': '^6.0.0',
                        '@tailwindcss/vite': '^4.0.0',
                        tailwindcss: '^4.0.0',
                        vite: '^6.0.0',
                    },
                },
                null,
                2
            )
        );

        const srcDir = path.join(appDir, 'src');
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, 'style.css'), '@import "tailwindcss";\n');
        fs.writeFileSync(path.join(srcDir, 'main.ts'), 'import { createApp } from "vue";\n');
        fs.writeFileSync(
            path.join(appDir, 'vite.config.ts'),
            `
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`
        );

        // 根目录安装 CLI
        execWithLogging('pnpm --config.ignore-scripts=true install', {
            cwd: tempMonorepoDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        const registryUrl = `file://${localRegistryDir.replace(/\\/g, '/')}`;

        // 在子应用中执行 init
        console.log('[C3] Initializing in sub-package apps/web...');
        execWithLogging('pnpm exec brutx-vue init -y', {
            cwd: appDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        // 在子应用中添加组件
        console.log('[C3] Adding component into apps/web...');
        execWithLogging(`pnpm exec brutx-vue add button --yes --registry "${registryUrl}"`, {
            cwd: appDir,
            env: { ...process.env, NODE_PATH: '', CI: 'true', npm_config_ignore_scripts: 'true', npm_config_confirm_modules_purge: 'false' },
        });

        const buttonPath = path.join(appDir, 'src/components/ui/button/Button.vue');
        if (!fs.existsSync(buttonPath)) {
            throw new Error(`Expected button in apps/web at ${buttonPath} not found`);
        }

        const durationMs = Date.now() - startTime;
        console.log(`✓ C3 (CLI in pnpm workspace sub-application) passed in ${durationMs}ms`);
        return { id: 'C3', description: 'CLI in pnpm workspace sub-application', durationMs, success: true };
    } finally {
        await rmWithRetry(tempMonorepoDir);
    }
}

async function main() {
    console.log('=== [test-consumers] Starting Real Consumer Matrix Verification ===');
    const startTime = Date.now();

    // 1. 打包待测 tarball 并生成 candidate-manifest.json
    const artifactsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-candidate-artifacts-'));
    console.log(`[test-consumers] Packing candidate tarballs into ${artifactsDir}...`);
    const manifest = packCandidateArtifacts(artifactsDir, repoRoot);

    const args = process.argv.slice(2);
    const runAll = args.includes('--all');
    const filterArg = args.indexOf('--filter');
    const filter = filterArg !== -1 ? args[filterArg + 1] : null;

    const results = [];

    try {
        const testsToRun = [];

        if (filter) {
            testsToRun.push(filter.toUpperCase());
        } else if (runAll) {
            testsToRun.push('U1', 'C1', 'C3');
        } else {
            // 普通 PR 默认执行核心 U1 和 C1 矩阵
            testsToRun.push('U1', 'C1');
        }

        console.log(`[test-consumers] Selected consumer matrices: ${testsToRun.join(', ')}`);

        for (const testId of testsToRun) {
            if (testId === 'U1') {
                results.push(await runU1(artifactsDir, manifest));
            } else if (testId === 'C1') {
                results.push(await runC1(artifactsDir, manifest));
            } else if (testId === 'C3') {
                results.push(await runC3(artifactsDir, manifest));
            } else {
                console.warn(`[test-consumers] Unknown matrix filter: ${testId}, skipping`);
            }
        }

        const totalDuration = Date.now() - startTime;
        console.log('\n=== [test-consumers] Verification Summary ===');
        console.table(
            results.map(r => ({
                Matrix: r.id,
                Description: r.description,
                'Duration (s)': (r.durationMs / 1000).toFixed(2),
                Status: r.success ? 'PASSED' : 'FAILED',
            }))
        );
        console.log(`Total Elapsed: ${(totalDuration / 1000).toFixed(2)}s\n`);

        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            process.exit(1);
        }
    } finally {
        await rmWithRetry(artifactsDir);
    }
}

main().catch(err => {
    console.error('[test-consumers] Execution failed with error:', err);
    process.exit(1);
});
