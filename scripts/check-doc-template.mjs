#!/usr/bin/env node
/**
 * 组件文档必须章节 lint（零依赖，仿 check-i18n.mjs / check-doc-links.mjs）。
 *
 * 扫描 apps/docs/components/*.md 与 apps/docs/en/components/*.md（排除 index.md），
 * 依据 COMPONENT_DOC_TEMPLATE.md 章节顺序规范强制「必须章节」：
 *   - zh：`## 预览` / `## 安装` / `## 用法` / `## Props` / `## 可访问性`
 *   - en：`## Preview` 或 `## Demo`（二选一）/ `## Installation` / `## Usage` / `## Props` / `## Accessibility`
 *   - 预览节须含 `<ComponentPreview>`；安装节须含 `<InstallationTabs>`
 *
 * DOC_EXCEPTIONS：登记「已知未达标、待补节」的文档（相对路径 key）。已达标仍列例外
 * 即报错（自清空逼收敛）——补节完成后必须从清单移除。
 *
 * 用法：
 *   node scripts/check-doc-template.mjs    # 违规即 exit 1
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const ZH_DIR = join(ROOT, 'apps', 'docs', 'components')
const EN_DIR = join(ROOT, 'apps', 'docs', 'en', 'components')

/**
 * 已知未达标、待补节的文档（补节后须移除，否则自清空报错）。
 * 相对 apps/docs/ 的路径。
 */
const DOC_EXCEPTIONS = new Set([
    // 待补节：已列入的本方案补节清单之外的存量缺口
])

const ZH_REQUIRED = ['## 预览', '## 安装', '## 用法', '## Props', '## 可访问性']
const EN_PREVIEW_ALT = ['## Demo', '## Preview']
const EN_REQUIRED = ['## Installation', '## Usage', '## Props', '## Accessibility']

function headings(content) {
    const set = new Set()
    for (const line of content.split('\n')) {
        const m = /^##\s+(.+)$/.exec(line.trim())
        if (m) set.add('## ' + m[1])
    }
    return set
}

function checkFile(file, requiredList, previewAlts) {
    const content = readFileSync(file, 'utf-8')
    const hs = headings(content)
    const missing = requiredList.filter((h) => !hs.has(h))
    const hasPreview = previewAlts ? previewAlts.some((h) => hs.has(h)) : true
    const previewName = previewAlts ? previewAlts.find((h) => hs.has(h)) : null
    const problems = []
    if (missing.length > 0) problems.push(`缺必须章节：${missing.join('、')}`)
    if (previewAlts && !hasPreview) problems.push(`缺预览章节（${previewAlts.join(' 或 ')}）`)
    if (hasPreview) {
        const previewContent = extractSection(content, previewName)
        if (previewContent !== null && !previewContent.includes('<ComponentPreview')) {
            problems.push('预览节缺少 <ComponentPreview>')
        }
    }
    if (hs.has('## 安装') && !extractSection(content, '## 安装').includes('<InstallationTabs')) {
        problems.push('安装节缺少 <InstallationTabs>')
    }
    if (hs.has('## Installation') && !extractSection(content, '## Installation').includes('<InstallationTabs')) {
        problems.push('安装节缺少 <InstallationTabs>')
    }
    return problems
}

function extractSection(content, heading) {
    const lines = content.split('\n')
    const startIdx = lines.findIndex((l) => l.trim() === heading)
    if (startIdx === -1) return null
    let endIdx = lines.length
    for (let i = startIdx + 1; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i].trim())) {
            endIdx = i
            break
        }
    }
    return lines.slice(startIdx, endIdx).join('\n')
}

function walkMd(dir) {
    let entries
    try {
        entries = readdirSync(dir)
    } catch {
        return []
    }
    return entries.filter((f) => f.endsWith('.md') && f !== 'index.md').sort()
}

const zhFiles = walkMd(ZH_DIR)
const enFiles = walkMd(EN_DIR)
const violations = []

for (const f of zhFiles) {
    const rel = relative(ROOT, join(ZH_DIR, f)).split('\\').join('/')
    const problems = checkFile(join(ZH_DIR, f), ZH_REQUIRED, null)
    if (problems.length > 0 && !DOC_EXCEPTIONS.has(rel)) {
        violations.push({ rel, problems })
    } else if (problems.length === 0 && DOC_EXCEPTIONS.has(rel)) {
        violations.push({ rel, problems: ['已达标但仍登记在 DOC_EXCEPTIONS（自清空约束）'] })
    }
}

for (const f of enFiles) {
    const rel = relative(ROOT, join(EN_DIR, f)).split('\\').join('/')
    const problems = checkFile(join(EN_DIR, f), EN_REQUIRED, EN_PREVIEW_ALT)
    if (problems.length > 0 && !DOC_EXCEPTIONS.has(rel)) {
        violations.push({ rel, problems })
    } else if (problems.length === 0 && DOC_EXCEPTIONS.has(rel)) {
        violations.push({ rel, problems: ['已达标但仍登记在 DOC_EXCEPTIONS（自清空约束）'] })
    }
}

console.log('=== 组件文档必须章节 lint ===')
console.log(`中文文档 ${zhFiles.length} 个，英文文档 ${enFiles.length} 个`)
if (violations.length === 0) {
    console.log('✓ 全部文档满足模板必须章节')
    process.exit(0)
}
for (const v of violations) {
    console.log(`  ✗ ${v.rel}`)
    for (const p of v.problems) console.log(`      ${p}`)
}
console.log(`\n结论：${violations.length} 个文件违规，exit 1`)
process.exit(1)
