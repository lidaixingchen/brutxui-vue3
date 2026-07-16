import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'

interface ExportsManifest {
    components: string[]
    composables: string[]
    directives: string[]
}

/**
 * Build multi-entry inputs from exports-manifest.json.
 *
 * Entry key → output path: `components/button/index` → `dist/components/button/index.js`.
 * This matches the `buildEntry()` paths in generate-exports.ts so package.json
 * exports declarations and dist/ artifacts are 1:1.
 *
 * `index` and `locales` are top-level entries (not under components/).
 */
function buildInputs(): Record<string, string> {
    const manifestPath = resolve(__dirname, 'exports-manifest.json')
    if (!existsSync(manifestPath)) {
        throw new Error(
            `exports-manifest.json not found at ${manifestPath}\n` +
            'Run `pnpm prebuild:scan` first.',
        )
    }
    const manifest: ExportsManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

    const inputs: Record<string, string> = {
        index: resolve(__dirname, 'src/index.ts'),
        locales: resolve(__dirname, 'src/locales/index.ts'),
    }

    for (const component of manifest.components) {
        inputs[`components/${component}/index`] = resolve(__dirname, `src/components/${component}/index.ts`)
    }
    for (const composable of manifest.composables) {
        const name = composable.replace(/\.ts$/, '')
        inputs[`composables/${name}`] = resolve(__dirname, `src/composables/${name}.ts`)
    }
    for (const directive of manifest.directives) {
        const name = directive.replace(/\.ts$/, '')
        inputs[`directives/${name}`] = resolve(__dirname, `src/directives/${name}.ts`)
    }

    return inputs
}

/**
 * Vite lib mode emits CSS as `dist/<package-name>.css` (or under `dist/assets/`
 * depending on `assetFileNames`). Normalize to `dist/styles.css` so the
 * `./style.css` subpath export always resolves. Idempotent — safe to call
 * even if the source filename already matches.
 */
function copyStylesPlugin(): Plugin {
    return {
        name: 'copy-styles',
        writeBundle() {
            const distDir = resolve(__dirname, 'dist')
            const stylesCssPath = resolve(distDir, 'styles.css')

            // Scan dist/ recursively (Node 18.17+) — CSS may land in dist/assets/
            // when `assetFileNames: 'assets/[name][extname]'` is used.
            const allFiles = readdirSync(distDir, { recursive: true }) as string[]
            const candidates = allFiles
                .map(f => f.replace(/\\/g, '/'))
                .filter(f => f.endsWith('.css') && f !== 'preflight.css' && f !== 'styles.css')

            if (candidates.length === 0) {
                if (!existsSync(stylesCssPath)) {
                    throw new Error('Expected CSS artifact not found in dist/')
                }
                return
            }

            // Prefer the largest CSS file (the main bundle, not per-entry chunks)
            let best = candidates[0]
            let bestSize = 0
            for (const name of candidates) {
                const size = readFileSync(resolve(distDir, name), 'utf-8').length
                if (size > bestSize) {
                    bestSize = size
                    best = name
                }
            }

            const content = readFileSync(resolve(distDir, best), 'utf-8')
            writeFileSync(stylesCssPath, content, 'utf-8')

            // Remove the original if it's not styles.css
            if (best !== 'styles.css') {
                try {
                    const fs = require('node:fs')
                    fs.unlinkSync(resolve(distDir, best))
                } catch {
                    // Non-fatal if cleanup fails
                }
            }
        },
    }
}

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        dts({
            insertTypesEntry: true,
            include: ['src/**/*.ts', 'src/**/*.vue'],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/**/*.browser.test.ts',
            ],
            outDir: 'dist',
        }),
        copyStylesPlugin(),
    ],
    build: {
        lib: {
            entry: buildInputs(),
            formats: ['es'],
        },
        cssCodeSplit: false,
        rollupOptions: {
            external: [
                'vue',
                'tailwindcss',
                'class-variance-authority',
                'clsx',
                'tailwind-merge',
                /^reka-ui/,
                /^prismjs/,
                /^@tanstack\/vue-virtual/,
                /^v-calendar/,
                /^vee-validate/,
                /^@vee-validate/,
                /^@lucide/,
                /^(?:@lucide\/vue|lucide-vue-next)/,
                /^embla-carousel/,
            ],
            output: {
                // No preserveModules — multi-entry output paths are determined by
                // input key, matching generate-exports.ts buildEntry() declarations.
                format: 'es',
                entryFileNames: '[name].js',
                // Consolidate chunks under dist/chunks/ for shared code
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: 'assets/[name][extname]',
            },
            treeshake: {
                moduleSideEffects: true,
                propertyReadSideEffects: false,
            },
        },
        copyPublicDir: false,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
})
