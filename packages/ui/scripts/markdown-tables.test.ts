import path from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMarkdownRenderer, disposeMdItInstance } from '../../../apps/docs/node_modules/vitepress/dist/node/index.js'
import { markdownTables } from '../../../apps/docs/.vitepress/markdown-tables'
import ComponentCatalog from '../../../apps/docs/.vitepress/theme/components/ComponentCatalog.vue'

vi.mock('../../../apps/docs/node_modules/vitepress', async importOriginal => ({
    ...await importOriginal<Record<string, unknown>>(),
    useData: () => ({ lang: { value: 'zh-CN' } }),
    withBase: (href: string) => href,
}))

const DOCS_ROOT = path.resolve(import.meta.dirname, '../../../apps/docs')
const markdown = [
    '| 组件 | 说明 |',
    '| --- | --- |',
    '| Button | 操作按钮 |',
].join('\n')

afterAll(disposeMdItInstance)

describe('文档 Markdown 表格', () => {
    it('保留表格语义，并由可聚焦的容器承接滚动', async () => {
        const md = await createMarkdownRenderer(DOCS_ROOT, { highlight: source => source, config: markdownTables })
        const parsed = new DOMParser().parseFromString(md.render(markdown), 'text/html')
        const table = parsed.querySelector('table')!
        expect(table.rows).toHaveLength(2)
        expect(table.parentElement?.classList.contains('vp-doc-table-wrapper')).toBe(true)
        expect(table.parentElement?.tabIndex).toBe(0)
        expect(table.hasAttribute('tabindex')).toBe(false)
    })

    it('引用块和后续段落保持正确的元素嵌套', async () => {
        const md = await createMarkdownRenderer(DOCS_ROOT, { highlight: source => source, config: markdownTables })
        const source = [markdown.split('\n').map(line => `> ${line}`).join('\n'), '', markdown, '', '表格后的说明'].join('\n')
        const parsed = new DOMParser().parseFromString(md.render(source), 'text/html')
        expect(parsed.querySelectorAll('.vp-doc-table-wrapper')).toHaveLength(2)
        expect(parsed.querySelectorAll('blockquote .vp-doc-table-wrapper')).toHaveLength(1)
        expect(parsed.querySelector('body > p')?.textContent).toBe('表格后的说明')
    })

    it('组件目录的各分类表格使用相同的滚动容器', async () => {
        const html = await renderToString(createSSRApp(ComponentCatalog, { locale: 'zh' }))
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const tables = parsed.querySelectorAll('table')
        expect(tables.length).toBeGreaterThan(0)
        for (const table of tables) {
            expect(table.parentElement?.classList.contains('vp-doc-table-wrapper')).toBe(true)
            expect(table.parentElement?.tabIndex).toBe(0)
        }
    })
})
