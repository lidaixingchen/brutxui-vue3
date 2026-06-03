import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

function mergeStylesPlugin(): Plugin {
    return {
        name: 'merge-styles',
        writeBundle() {
            try {
                const tokensCss = readFileSync(resolve(__dirname, 'src/styles.css'), 'utf-8')
                const componentCssPath = resolve(__dirname, 'dist/brutx-ui-vue.css')
                let componentCss = ''
                try {
                    componentCss = readFileSync(componentCssPath, 'utf-8')
                } catch {
                    // No component CSS generated
                }
                writeFileSync(
                    resolve(__dirname, 'dist/styles.css'),
                    componentCss ? `${componentCss}\n${tokensCss}` : tokensCss
                )
            } catch (e) {
                console.warn('Failed to merge styles.css:', e)
            }
        },
    }
}

export default defineConfig({
    plugins: [
        vue(),
        dts({
            insertTypesEntry: true,
            include: ['src/**/*.ts', 'src/**/*.vue'],
            outDir: 'dist',
        }),
        mergeStylesPlugin(),
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
            },
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['vue', 'tailwindcss', /^reka-ui/, /^@vueuse/, /^v-calendar/, /^vee-validate/, /^@vee-validate/],
            output: {
                globals: {
                    vue: 'Vue',
                },
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
