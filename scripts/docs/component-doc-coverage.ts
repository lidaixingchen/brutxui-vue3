#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPONENT_METADATA } from '../../packages/shared/src/component-metadata.ts'
import { getRepoRoot, toPosixPath } from '../shared/path.mjs'
import { existsExactCaseSync } from '../shared/fs-native.mjs'

export const DOC_LOCALES = ['zh-CN', 'en'] as const
export type DocLocale = typeof DOC_LOCALES[number]

export const DOC_LOCALE_DIRECTORIES = {
  'zh-CN': { component: 'components', block: 'blocks' },
  en: { component: 'en/components', block: 'en/blocks' },
} as const

const FIRST_DOCUMENT_LINE = 1
const DOCUMENTATION_DIRECTORY = 'apps/docs'

export interface ComponentDocPageCoverage {
  componentName: string
  locale: DocLocale
  file: string
  exists: boolean
}

export interface ComponentDocCoverageDiagnostic {
  componentName: string
  locale: DocLocale
  file: string
  line: number
  ruleId: string
  message: string
  severity: 'error'
}

export interface ComponentDocCoverageResult {
  checkedComponents: number
  pages: ComponentDocPageCoverage[]
  diagnostics: ComponentDocCoverageDiagnostic[]
  unresolvedComponentNames: string[]
}

export function checkComponentDocCoverage(root: string, componentNames?: Iterable<string>): ComponentDocCoverageResult {
  const repositoryRoot = fs.realpathSync.native(root)
  const requestedNames = componentNames === undefined
    ? Object.keys(COMPONENT_METADATA).filter(name => COMPONENT_METADATA[name].docsHidden !== true)
    : [...new Set(componentNames)]
  const pages: ComponentDocPageCoverage[] = []
  const diagnostics: ComponentDocCoverageDiagnostic[] = []
  const unresolvedComponentNames: string[] = []
  let checkedComponents = 0

  for (const componentName of requestedNames) {
    const metadata = COMPONENT_METADATA[componentName]
    if (!metadata) {
      unresolvedComponentNames.push(componentName)
      continue
    }

    checkedComponents += 1
    const slug = metadata.docsSlug ?? componentName
    const kind = metadata.kind === 'block' ? 'block' : 'component'

    for (const locale of DOC_LOCALES) {
      const directory = DOC_LOCALE_DIRECTORIES[locale][kind]
      const file = toPosixPath(path.posix.join(DOCUMENTATION_DIRECTORY, directory, `${slug}.md`))
      const absolutePath = path.join(repositoryRoot, ...file.split('/'))
      const exists = existsExactCaseSync(absolutePath, repositoryRoot)
      pages.push({ componentName, locale, file, exists })

      if (!exists) {
        diagnostics.push({
          componentName,
          locale,
          file,
          line: FIRST_DOCUMENT_LINE,
          ruleId: `component-doc-coverage/missing-${locale === 'zh-CN' ? 'zh' : 'en'}-doc`,
          message: `组件 ${componentName} 缺少${locale === 'zh-CN' ? '中文' : '英文'}使用文档，或文档路径大小写不匹配`,
          severity: 'error',
        })
      }
    }
  }

  return { checkedComponents, pages, diagnostics, unresolvedComponentNames }
}

function run(): void {
  const isJson = process.argv.includes('--json')
  const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
  const result = checkComponentDocCoverage(getRepoRoot())
  const isClean = result.diagnostics.length === 0
  const summary = isClean
    ? `Component docs coverage: passed (${result.checkedComponents} components documented)`
    : `Component docs coverage: ${result.diagnostics.length} pages missing or with case mismatch`

  if (isJson) {
    console.log(JSON.stringify({ status: isClean ? 'success' : 'error', summary, diagnostics: result.diagnostics }, null, 2))
    process.exit(isClean ? 0 : 1)
  }

  if (isClean && !isVerbose) {
    console.log(`✓ ${summary}`)
    process.exit(0)
  }

  console.log('=== 共享组件元数据文档覆盖检查 ===\n')
  console.log(`登记组件文档存在性（COMPONENT_METADATA ${result.checkedComponents} 项）`)
  if (isClean) {
    console.log('  ✓ 所有组件与区块均有中英文使用文档且路径大小写严格吻合')
    process.exit(0)
  }

  for (const diagnostic of result.diagnostics) {
    console.log(`  ✗ ${diagnostic.componentName}: ${diagnostic.file}`)
  }
  console.log(`\n结论：${result.diagnostics.length} 个语言页面缺失或大小写不匹配，exit 1`)
  process.exit(1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run()
}
