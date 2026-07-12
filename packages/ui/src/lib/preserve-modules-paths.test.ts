import { describe, expect, it } from 'vitest'
import { isJsOutputFile, rewriteFlattenedChunkImports } from './preserve-modules-paths'

describe('preserve modules path rewriting', () => {
    const distDir = 'E:/project/brutxui-vue3/packages/ui/dist'

    it('detects JavaScript output files', () => {
        expect(isJsOutputFile('index.js')).toBe(true)
        expect(isJsOutputFile('index.cjs')).toBe(true)
        expect(isJsOutputFile('index.mjs')).toBe(true)
        expect(isJsOutputFile('styles.css')).toBe(false)
        expect(isJsOutputFile('Button.vue.d.ts')).toBe(false)
    })

    it('rewrites source prefixes in root entry chunks', () => {
        const filePath = `${distDir}/index.js`
        const content = [
            'export { Button } from "./packages/ui/src/components/button/Button.js"',
            'import helper from "./packages/ui/src/lib/utils.js"',
        ].join('\n')

        expect(rewriteFlattenedChunkImports(content, filePath, distDir)).toBe([
            'export { Button } from "./components/button/Button.js"',
            'import helper from "./lib/utils.js"',
        ].join('\n'))
    })

    it('rewrites virtual and node_modules imports from nested chunks', () => {
        const filePath = `${distDir}/components/button/Button.js`
        const content = [
            'import exportHelper from "../../_virtual/_plugin-vue_export-helper.js"',
            'import primitive from "../../node_modules/reka-ui/dist/index.js"',
            'import virtualThing from "../../../_virtual/chunk.js"',
        ].join('\n')

        expect(rewriteFlattenedChunkImports(content, filePath, distDir)).toBe([
            'import exportHelper from "../../_virtual/_plugin-vue_export-helper.js"',
            'import primitive from "../../node_modules/reka-ui/dist/index.js"',
            'import virtualThing from "../../_virtual/chunk.js"',
        ].join('\n'))
    })

    it('rewrites virtual export helpers to the dist-relative helper path', () => {
        const nestedFilePath = `${distDir}/components/dialog/DialogContent.cjs`
        const rootFilePath = `${distDir}/index.cjs`

        expect(rewriteFlattenedChunkImports(
            'const component = helper(script, [["__file", "Dialog.vue"]]);export default "../../../_virtual/_plugin-vue_export-helper.cjs"',
            nestedFilePath,
            distDir,
        )).toContain('"../../_virtual/_plugin-vue_export-helper.cjs"')

        expect(rewriteFlattenedChunkImports(
            'module.exports = require("./packages/ui/src/index.cjs");require("./_virtual/_plugin-vue_export-helper.cjs")',
            rootFilePath,
            distDir,
        )).toContain('"./_virtual/_plugin-vue_export-helper.cjs"')
    })

    it('does not rewrite import-like patterns inside string literals', () => {
        const filePath = `${distDir}/components/button/Button.js`
        const content = 'const msg = "import x from \\"../../_virtual/chunk.js\\""'

        expect(rewriteFlattenedChunkImports(content, filePath, distDir)).toBe(content)
    })

    it('does not rewrite import-like patterns inside comments', () => {
        const filePath = `${distDir}/components/button/Button.js`
        const content = '// import x from "../../_virtual/chunk.js"'

        expect(rewriteFlattenedChunkImports(content, filePath, distDir)).toBe(content)
    })

    it('rewrites CJS require() calls', () => {
        const nestedFilePath = `${distDir}/components/button/Button.vue.cjs`
        const content = 'const e=require("../../_virtual/_plugin-vue_export-helper.cjs")'

        const result = rewriteFlattenedChunkImports(content, nestedFilePath, distDir)
        expect(result).toContain('"../../_virtual/_plugin-vue_export-helper.cjs"')
    })

    it('rewrites dynamic import() expressions', () => {
        const filePath = `${distDir}/components/button/Button.js`
        const content = 'const mod = import("../../../_virtual/chunk.js")'

        const result = rewriteFlattenedChunkImports(content, filePath, distDir)
        expect(result).toContain('"../../_virtual/chunk.js"')
        expect(result).not.toContain('"../../../_virtual/chunk.js"')
    })
})
