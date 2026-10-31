import type { MarkdownRenderer } from 'vitepress'

export function markdownTables(md: MarkdownRenderer): void {
    md.renderer.rules.table_open = (tokens, index, options, _env, renderer) => {
        return `<div class="vp-doc-table-wrapper" tabindex="0">\n${renderer.renderToken(tokens, index, options)}`
    }
    md.renderer.rules.table_close = (tokens, index, options, _env, renderer) => {
        return `${renderer.renderToken(tokens, index, options)}</div>\n`
    }
}
