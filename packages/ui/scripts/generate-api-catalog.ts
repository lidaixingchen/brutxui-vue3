import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { API_CONTRACT } from '../api-contract.js'
import { CATALOG_PATH, collectApiCatalog, serializeApiCatalog } from './api-docs/catalog.js'

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url))

function main(): void {
    const catalog = collectApiCatalog(REPOSITORY_ROOT, API_CONTRACT)
    const content = serializeApiCatalog(catalog)
    const output = path.join(REPOSITORY_ROOT, CATALOG_PATH)
    if (process.argv.includes('--check')) {
        if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) {
            console.error(`API_CATALOG_STALE ${CATALOG_PATH}：请运行 pnpm --filter brutx-ui-vue docs:catalog`)
            process.exitCode = 1
        }
    } else {
        fs.mkdirSync(path.dirname(output), { recursive: true })
        if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) fs.writeFileSync(output, content)
    }
    for (const diagnostic of catalog.diagnostics) console.error(JSON.stringify(diagnostic))
    if (catalog.diagnostics.length > 0) process.exitCode = 1
    const pages = catalog.groups.flatMap(group => group.pages)
    console.log(`API 清单：${catalog.groups.length} 个公开组件组，${pages.length} 个语言页面，${catalog.diagnostics.length} 项诊断`)
}

main()
