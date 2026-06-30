import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'
import { resolve, relative, join } from 'path'
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, existsSync } from 'node:fs'

function copyStylesPlugin(): Plugin {
    return {
        name: 'copy-styles',
        writeBundle() {
            try {
                const componentCssPath = resolve(__dirname, 'dist/brutx-ui-vue.css')
                const stylesCssPath = resolve(__dirname, 'dist/styles.css')
                const componentCss = readFileSync(componentCssPath, 'utf-8')
                writeFileSync(stylesCssPath, componentCss)
            } catch (e) {
                console.warn('Failed to copy styles.css:', e)
            }
        },
    }
}

/** Flattens the nested preserveModules output (dist/packages/ui/src/...) into dist/ */
function flattenPreserveModulesPlugin(): Plugin {
    return {
        name: 'flatten-preserve-modules',
        writeBundle(options) {
            const distDir = options.dir ?? resolve(__dirname, 'dist')
            const nestedPrefix = join(distDir, 'packages', 'ui', 'src')
            if (!existsSync(nestedPrefix)) return

            // Recursively collect all files in nested dir
            function walk(dir: string): string[] {
                const result: string[] = []
                for (const entry of readdirSync(dir, { withFileTypes: true })) {
                    const full = join(dir, entry.name)
                    if (entry.isDirectory()) {
                        result.push(...walk(full))
                    } else {
                        result.push(full)
                    }
                }
                return result
            }

            const files = walk(nestedPrefix)
            for (const srcFile of files) {
                const relFromNested = relative(nestedPrefix, srcFile)
                const destFile = join(distDir, relFromNested)

                // Ensure destination directory exists
                mkdirSync(resolve(destFile, '..'), { recursive: true })

                // For JS/CJS files, rewrite relative imports
                const ext = relFromNested.slice(relFromNested.lastIndexOf('.'))
                if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
                    let content = readFileSync(srcFile, 'utf-8')
                    // Replace ./packages/ui/src/ prefix with ./
                    content = content.replace(/\.\/packages\/ui\/src\//g, './')
                    writeFileSync(destFile, content)
                } else {
                    writeFileSync(destFile, readFileSync(srcFile))
                }
            }

            // Clean up nested directory
            rmSync(join(distDir, 'packages'), { recursive: true, force: true })

            // Rewrite imports in entry files (index.js, index.cjs, etc.) that were NOT in nested dir
            for (const entry of readdirSync(distDir, { withFileTypes: true })) {
                if (!entry.isFile()) continue
                const ext = entry.name.slice(entry.name.lastIndexOf('.'))
                if (ext !== '.js' && ext !== '.cjs' && ext !== '.mjs') continue
                const filePath = join(distDir, entry.name)
                let content = readFileSync(filePath, 'utf-8')
                if (content.includes('./packages/ui/src/')) {
                    content = content.replace(/\.\/packages\/ui\/src\//g, './')
                    writeFileSync(filePath, content)
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
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
            outDir: 'dist',
        }),
        copyStylesPlugin(),
        flattenPreserveModulesPlugin(),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                locales: resolve(__dirname, 'src/locales/index.ts'),
                calendar: resolve(__dirname, 'src/calendar.ts'),
                'submit-button': resolve(__dirname, 'src/submit-button.ts'),
                hooks: resolve(__dirname, 'src/hooks/index.ts'),
                'brutalism-plugin': resolve(__dirname, 'src/lib/brutalism-plugin.js'),
                'devtools-plugin': resolve(__dirname, 'src/lib/devtools-plugin.ts'),
                button: resolve(__dirname, 'src/button.ts'),
                input: resolve(__dirname, 'src/input.ts'),
                dialog: resolve(__dirname, 'src/dialog.ts'),
                toast: resolve(__dirname, 'src/toast.ts'),
                form: resolve(__dirname, 'src/form.ts'),
                select: resolve(__dirname, 'src/select.ts'),
                'dropdown-menu': resolve(__dirname, 'src/dropdown-menu.ts'),
                table: resolve(__dirname, 'src/table.ts'),
                card: resolve(__dirname, 'src/card.ts'),
                tabs: resolve(__dirname, 'src/tabs.ts'),
            },
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['vue', 'tailwindcss', /^reka-ui/, /^prismjs/, /^@tanstack\/vue-virtual/, /^v-calendar/, /^vee-validate/, /^@vee-validate/, /^@lucide/, /^lucide-vue-next/, /^embla-carousel/],
            output: {
                globals: {
                    vue: 'Vue',
                },
                preserveModules: true,
                preserveModulesRoot: resolve(__dirname, 'src'),
                manualChunks(id) {
                    if (id.includes('node_modules/class-variance-authority')) {
                        return 'cva'
                    }
                    if (id.includes('node_modules/clsx')) {
                        return 'clsx'
                    }
                    if (id.includes('node_modules/tailwind-merge')) {
                        return 'tailwind-merge'
                    }
                },
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
