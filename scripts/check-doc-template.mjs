#!/usr/bin/env node
/**
 * 组件文档章节与 API 页面契约检查
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { register } from 'tsx/esm/api'
import { getRepoRoot, toPosixPath } from './shared/path.mjs'
import { traverseMarkdownLines } from './shared/markdown-lexer.mjs'

register()

const ROOT = getRepoRoot()
const COMPONENT_DOCS_ROOT = path.join(ROOT, 'apps', 'docs')
const VITEPRESS_ENTRY = path.join(COMPONENT_DOCS_ROOT, 'node_modules', 'vitepress', 'dist', 'node', 'index.js')
const { createApiPagePlugin, parseApiPageMarkdown, validateApiPageCalls } = await import('../apps/docs/.vitepress/api-page.ts')
const { createMarkdownRenderer, disposeMdItInstance } = await import(pathToFileURL(VITEPRESS_ENTRY).href)

const DOC_EXCEPTIONS = new Set([])
const ZH_REQUIRED = ['## 预览', '## 安装', '## 用法', '## Props', '## 可访问性']
const ZH_PREVIEW = ['## 预览']
const EN_PREVIEW_ALT = ['## Demo', '## Preview']
const EN_REQUIRED = ['## Installation', '## Usage', '## Props', '## Accessibility']

const cleanHeading = (heading) => heading.trim().replace(/\s*\{#[\w-]+\}\s*$/u, '').replace(/\s+/gu, ' ')

function headings(content) {
  const result = new Set()
  traverseMarkdownLines(content, context => {
    if (context.inFence || context.inComment) return
    const match = /^##\s+(.+)$/u.exec(context.raw.trim())
    if (match) result.add(cleanHeading(`## ${match[1]}`))
  })
  return result
}

function extractSection(content, heading) {
  const target = cleanHeading(heading)
  const lines = []
  let capturing = false

  traverseMarkdownLines(content, context => {
    const isHeading = !context.inFence && !context.inComment && /^#{1,2}\s+/u.test(context.raw.trim())
    if (isHeading) {
      const currentTitle = cleanHeading(context.raw)
      if (capturing) {
        capturing = false
        return
      }
      if (currentTitle === target) {
        capturing = true
        lines.push(context.raw)
        return
      }
    }

    if (capturing) lines.push(context.raw)
  })

  return lines.length > 0 ? lines.join('\n') : null
}

export function checkFile(filePath, requiredList, previewAlts, options = {}) {
  const content = readFileSync(filePath, 'utf8')
  const foundHeadings = headings(content)
  const isZh = !toPosixPath(filePath).includes('/en/')
  const problems = []
  const componentApiPage = options.componentApiPage === true
  const missing = requiredList.filter(heading => {
    const cleaned = cleanHeading(heading)
    if (cleaned !== '## Props') return !foundHeadings.has(cleaned)

    const alternatives = isZh
      ? ['## Props', '## API 参考', '## API']
      : ['## Props', '## API Reference', '## API']
    const acceptedHeadings = componentApiPage ? alternatives.slice(1) : alternatives.slice(0, 1)
    return !acceptedHeadings.some(headingAlt => foundHeadings.has(cleanHeading(headingAlt)))
  })

  if (missing.length > 0) {
    problems.push({ ruleId: 'doc-template/missing-section', message: `缺必须章节：${missing.join('、')}` })
  }

  const previewName = previewAlts?.find(heading => foundHeadings.has(cleanHeading(heading)))
  if (previewAlts && !previewName) {
    problems.push({ ruleId: 'doc-template/missing-preview', message: `缺预览章节（${previewAlts.join(' 或 ')}）` })
  } else if (previewName) {
    const previewContent = extractSection(content, previewName)
    if (previewContent !== null && !previewContent.includes('<ComponentPreview')) {
      problems.push({ ruleId: 'doc-template/missing-component-preview', message: '预览节缺少 <ComponentPreview>' })
    }
  }

  for (const installationHeading of ['## 安装', '## Installation']) {
    if (!foundHeadings.has(cleanHeading(installationHeading))) continue
    const installationContent = extractSection(content, installationHeading)
    if (installationContent === null || !installationContent.includes('<InstallationTabs')) {
      problems.push({ ruleId: 'doc-template/missing-installation-tabs', message: '安装节缺少 <InstallationTabs>' })
    }
  }

  return problems
}

function walkMarkdownFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory).filter(file => file.endsWith('.md') && file !== 'index.md').sort()
}

function getPageGroup(catalog, relativeFile) {
  return catalog.groups.find(group => group.pages?.some(page => page.file === relativeFile))
}

async function loadSemanticResource(contentRoot, slug, cache) {
  if (!cache.has(slug)) {
    const semanticPath = path.join(contentRoot, `${slug}.ts`)
    if (!existsSync(semanticPath)) {
      cache.set(slug, undefined)
    } else {
      try {
        const module = await import(pathToFileURL(semanticPath).href)
        const exported = module.default
        cache.set(slug, exported && typeof exported === 'object' && Object.hasOwn(exported, 'default')
          ? exported.default
          : exported)
      } catch (error) {
        cache.set(slug, { loadError: error instanceof Error ? error.message : String(error) })
      }
    }
  }
  return cache.get(slug)
}

function addProblem(diagnostics, file, problem, line = 1) {
  diagnostics.push({
    file,
    line,
    ruleId: problem.ruleId,
    message: problem.message,
    severity: 'error',
  })
}

function reportApiError(diagnostics, relativeFile, error) {
  const diagnostic = error?.diagnostic
  if (!diagnostic) {
    addProblem(diagnostics, relativeFile, { ruleId: 'doc-template/api-parse', message: error instanceof Error ? error.message : String(error) })
    return
  }
  diagnostics.push({
    file: relativeFile,
    line: diagnostic.line,
    column: diagnostic.column,
    ruleId: diagnostic.ruleId,
    message: diagnostic.message,
    severity: 'error',
  })
}

function readGeneratedGroup(file, expectedId, locale) {
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`无法读取 API 生成数据：${error instanceof Error ? error.message : String(error)}`)
  }
  if (data.id !== expectedId || data.locale !== locale || !Array.isArray(data.components)) {
    throw new Error(`API 生成数据与组 ${expectedId} 或语言 ${locale} 不匹配`)
  }
  return data
}

function validateLocalizedApiData(calls, apiTypes, dataByFile, diagnostics, relativeFile) {
  for (const call of calls) {
    let data = dataByFile.get(call.generatedFile)
    if (!data) {
      try {
        data = readGeneratedGroup(call.generatedFile, call.group.id, call.locale)
        dataByFile.set(call.generatedFile, data)
      } catch (error) {
        addProblem(diagnostics, relativeFile, {
          ruleId: 'doc-template/api-data-unavailable',
          message: `${call.group.slug}: ${error instanceof Error ? error.message : String(error)}`,
        }, call.position.line)
        continue
      }
    }

    let components
    try {
      components = apiTypes.selectApiComponents(call.group, data, call.subcomponent, call.position)
    } catch (error) {
      reportApiError(diagnostics, relativeFile, error)
      continue
    }
    for (const component of components) {
      for (const member of component.members) {
        if (!member.name || !member.type?.text?.trim() || !member.description?.trim()) {
          addProblem(diagnostics, relativeFile, {
            ruleId: 'doc-template/api-semantic-incomplete',
            message: `${component.name}.${member.name || '(unknown)'} 缺少名称、类型或当前语言的说明`,
          }, call.position.line)
        }
      }
    }
  }
}

function invocationScope(calls, groupId, normalizeName) {
  return calls
    .filter(call => call.group.id === groupId)
    .map(call => JSON.stringify({
      group: call.group.id,
      subcomponent: call.subcomponent ? normalizeName(call.subcomponent) : '*',
      defaultTab: call.defaultTab ?? 'all',
      instance: call.instance ?? '',
      search: call.search,
    }))
}

function findDuplicateApiMemberTables(content, components, calls, normalizeName) {
  const visibleComponents = new Map()
  const selectedScopes = calls.length > 0 ? calls : [{ subcomponent: undefined, defaultTab: 'all' }]
  for (const call of selectedScopes) {
    const scope = components.filter(component => !call.subcomponent || normalizeName(component.name) === normalizeName(call.subcomponent))
    for (const component of scope) {
      const members = component.members.filter(member => call.defaultTab === 'all' || !call.defaultTab || member.kind === call.defaultTab)
      visibleComponents.set(component.name, members)
    }
  }

  const typeNames = new Set()
  for (const members of visibleComponents.values()) {
    for (const member of members) {
      for (const reference of member.type?.references ?? []) typeNames.add(normalizeName(reference.name))
    }
  }
  const knownComponents = new Map([...visibleComponents.keys()].map(name => [normalizeName(name), name]))
  const duplicates = []
  let headingStack = []
  let tableLines = []

  const flushTable = () => {
    if (tableLines.length < 3) {
      tableLines = []
      return
    }
    const header = splitTableCells(tableLines[0].raw)
    const kind = tableApiKind(header) ?? headingApiKind(headingStack)
    if (
      !kind ||
      isExcludedApiTableContext(headingStack, typeNames) ||
      isValueReferenceTable(header, kind) ||
      isExternalPrimitiveTable(headingStack, knownComponents)
    ) {
      tableLines = []
      return
    }

    const slotColumn = kind === 'slots' ? header.findIndex(cell => /^(?:slot|插槽)$/iu.test(cleanTableCell(cell))) : -1
    const componentColumn = header.findIndex(cell => /^(?:component|组件)$/iu.test(cleanTableCell(cell)))
    const memberColumn = slotColumn >= 0 ? slotColumn : 0
    const headingComponent = [...headingStack].reverse()
      .map(heading => knownComponents.get(normalizeName(heading.text)))
      .find(Boolean)
    const matchedRows = []

    for (const row of tableLines.slice(2)) {
      const cells = splitTableCells(row.raw)
      if (cells.length <= memberColumn) continue
      const memberName = normalizeTableMember(cells[memberColumn])
      if (!memberName || /^:?-{3,}:?$/u.test(memberName)) continue
      const rowComponent = componentColumn >= 0 ? knownComponents.get(normalizePlainName(cells[componentColumn].replace(/`/gu, '').trim())) : undefined
      const scopedComponent = rowComponent ?? headingComponent
      const matching = [...visibleComponents.entries()].flatMap(([componentName, members]) => {
        if (scopedComponent && scopedComponent !== componentName) return []
        return members
          .filter(member => member.kind === kind && normalizeTableMember(member.name) === memberName)
          .map(member => `${componentName}.${member.name}`)
      })
      if (matching.length > 0) matchedRows.push({ line: row.line, members: matching })
    }

    for (const row of matchedRows) {
      duplicates.push({
        line: row.line,
        message: `手工 API 表格重复列出 ${row.members.join('、')}；请保留类型说明并使用 ComponentApi 展示组件成员`,
      })
    }
    tableLines = []
  }

  traverseMarkdownLines(content, context => {
    if (context.inFence || context.inComment) {
      flushTable()
      return
    }
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(context.raw.trim())
    if (heading) {
      flushTable()
      const level = heading[1].length
      headingStack = headingStack.filter(item => item.level < level)
      headingStack.push({ level, text: heading[2].replace(/\s*\{#[\w-]+\}\s*$/u, '').trim() })
      return
    }
    if (context.raw.trim().startsWith('|')) {
      tableLines.push(context)
      return
    }
    flushTable()
  })
  flushTable()
  return duplicates
}

function splitTableCells(line) {
  return line.trim().replace(/^\|/u, '').replace(/\|$/u, '').split(/(?<!\\)\|/u).map(cell => cell.trim())
}

function cleanTableCell(value) {
  return value?.replace(/`/gu, '').replace(/<[^>]*>/gu, '').trim().toLowerCase() ?? ''
}

function normalizeTableMember(value) {
  const normalized = value.replace(/`/gu, '').replace(/<[^>]*>/gu, '').trim()
    .replace(/^v-model(?:\s*:\s*)?/iu, 'modelValue')
    .replace(/\(.*$/u, '')
    .replace(/\s+/gu, '')
  return normalizePlainName(normalized)
}

function tableApiKind(header) {
  const labels = header.map(cleanTableCell)
  const first = labels[0] ?? ''
  if (labels.some(label => /^(?:slot|插槽)$/u.test(label))) return 'slots'
  if (labels.some(label => /^(?:event|事件)$/u.test(label))) return 'events'
  if (labels.some(label => /(?:method|方法|expose|暴露)/u.test(label)) || /(?:方法|method|expose|暴露)/u.test(first)) return 'exposes'
  if (/^(?:prop|props|属性|属性名)$/u.test(first)) return 'props'
  return undefined
}

function headingApiKind(headings) {
  for (const { text } of [...headings].reverse()) {
    const heading = text.trim().toLowerCase()
    if (/^(?:props|属性|属性列表|参数)(?:\b|\s|$)/u.test(heading)) return 'props'
    if (/^(?:events|事件)(?:\b|\s|$)/u.test(heading)) return 'events'
    if (/^(?:slots|插槽)(?:\b|\s|$)/u.test(heading)) return 'slots'
    if (/(?:expose|exposed|defineexpose|暴露|方法)/u.test(heading)) return 'exposes'
  }
  return undefined
}

function isExcludedApiTableContext(headings, typeNames) {
  return headings.some(({ text }) => {
    const normalized = text.trim()
    return /(?:data\s*types?|type\s*definitions?|types?|数据类型|类型定义|类型|composable|组合式|reka|primitive|原语)/iu.test(normalized) ||
      typeNames.has(normalizePlainName(normalized))
  })
}

function isValueReferenceTable(header, kind) {
  if (kind !== 'props') return false
  return header.some((cell, index) => index > 0 && /^(?:values?|值|可选值|取值)$/iu.test(cleanTableCell(cell)))
}

function isExternalPrimitiveTable(headings, knownComponents) {
  const isApiComposition = headings.some(({ text }) => /^(?:api\s+composition|api\s+组成|组件组成)$/iu.test(text.trim()))
  if (!isApiComposition) return false
  const detailHeading = [...headings].reverse().find(({ level, text }) => level >= 3 && !headingApiKind([{ text }]))
  return Boolean(detailHeading && !knownComponents.has(normalizePlainName(detailHeading.text)))
}

function normalizePlainName(value) {
  return value.trim().replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()
}

export async function runDocTemplateCheck(options = {}) {
  const root = options.root ?? ROOT
  const docsRoot = path.join(root, 'apps', 'docs')
  const generatedDir = path.join(docsRoot, '.vitepress', 'api-generated')
  const contentRoot = path.join(docsRoot, '.vitepress', 'api-content')
  const catalogPath = options.catalogPath ?? path.join(generatedDir, 'catalog.json')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
  const apiPageOptions = { catalogPath, generatedDir, docsRoot }
  const renderer = await createMarkdownRenderer(docsRoot, {
    config: createApiPagePlugin(apiPageOptions),
  }, '/', console)
  const diagnostics = []
  const apiScopes = new Map()
  const semanticCache = new Map()
  const dataByFile = new Map()
  const apiTypes = await import('../apps/docs/.vitepress/api-page-parser.ts')
  const documentSets = [
    { directory: path.join(docsRoot, 'components'), required: ZH_REQUIRED, preview: ZH_PREVIEW },
    { directory: path.join(docsRoot, 'en', 'components'), required: EN_REQUIRED, preview: EN_PREVIEW_ALT },
    { directory: path.join(docsRoot, 'blocks'), required: ZH_REQUIRED, preview: ZH_PREVIEW },
    { directory: path.join(docsRoot, 'en', 'blocks'), required: EN_REQUIRED, preview: EN_PREVIEW_ALT },
  ]
  let totalDocs = 0

  try {
    for (const documentSet of documentSets) {
      const files = walkMarkdownFiles(documentSet.directory)
      totalDocs += files.length

      for (const filename of files) {
        const absoluteFile = path.join(documentSet.directory, filename)
        const relativeFile = toPosixPath(path.relative(root, absoluteFile))
        const docsRelativeFile = toPosixPath(path.relative(docsRoot, absoluteFile))
        const pageGroup = getPageGroup(catalog, relativeFile)
        const pageCatalogEntry = pageGroup?.pages?.find(page => page.file === relativeFile)
        const env = { path: absoluteFile, relativePath: docsRelativeFile, cleanUrls: false }
        const source = readFileSync(absoluteFile, 'utf8')
        let parsed
        let apiCalls = []

        try {
          parsed = parseApiPageMarkdown(source, env, renderer)
          apiCalls = parsed.calls
        } catch (error) {
          reportApiError(diagnostics, relativeFile, error)
        }

        const semantic = pageGroup ? await loadSemanticResource(contentRoot, pageGroup.slug, semanticCache) : undefined
        const isComponentPage = pageGroup?.scope === 'component-page'
        const isApplicableApiPage = isComponentPage && (
          pageCatalogEntry?.presentation === 'component-api' || pageCatalogEntry?.migration === 'complete'
        )
        const expectedCalls = pageGroup ? apiCalls.filter(call => call.group.id === pageGroup.id) : []
        const validApiCall = isApplicableApiPage && expectedCalls.length > 0

        if (isApplicableApiPage) {
          if (pageCatalogEntry?.presentation !== 'component-api') {
            addProblem(diagnostics, relativeFile, {
              ruleId: 'doc-template/api-presentation-mismatch',
              message: `已迁移组件页 ${pageGroup.slug} 必须使用 component-api 展示`,
            })
          }
          if (pageCatalogEntry?.migration !== 'complete') {
            addProblem(diagnostics, relativeFile, {
              ruleId: 'doc-template/api-migration-incomplete',
              message: `组件页 ${pageGroup.slug} 的 API 迁移状态必须为 complete`,
            })
          }
          if (!semantic) {
            addProblem(diagnostics, relativeFile, {
              ruleId: 'doc-template/api-semantic-unavailable',
              message: `缺少语义资源 ${pageGroup.slug}.ts`,
            })
          } else if (semantic.loadError) {
            addProblem(diagnostics, relativeFile, { ruleId: 'doc-template/api-semantic-unavailable', message: semantic.loadError })
          } else if (semantic.complete !== true) {
            addProblem(diagnostics, relativeFile, {
              ruleId: 'doc-template/api-semantic-incomplete',
              message: `语义资源 ${pageGroup.slug} 尚未完成双语成员说明`,
            })
          }
          if (!validApiCall) {
            addProblem(diagnostics, relativeFile, {
              ruleId: 'doc-template/missing-component-api',
              message: `已迁移组件页必须引用组件组 ${pageGroup.slug} 的真实 ComponentApi 调用`,
            })
          }
          for (const call of apiCalls) {
            if (call.group.id !== pageGroup.id) {
              addProblem(diagnostics, relativeFile, {
                ruleId: 'doc-template/api-group-page-mismatch',
                message: `页面 ${pageGroup.slug} 引用了不匹配的组件组 ${call.group.slug}`,
              }, call.position.line)
            }
          }

          if (validApiCall && parsed) {
            try {
              validateApiPageCalls(expectedCalls, parsed.html)
            } catch (error) {
              reportApiError(diagnostics, relativeFile, error)
            }
            validateLocalizedApiData(expectedCalls, apiTypes, dataByFile, diagnostics, relativeFile)
          }

          const locale = docsRelativeFile.startsWith('en/') ? 'en' : 'zh-CN'
          const groupScope = apiScopes.get(pageGroup.slug) ?? {}
          groupScope[locale] = invocationScope(expectedCalls, pageGroup.id, apiTypes.normalizeName)
          apiScopes.set(pageGroup.slug, groupScope)

          const generatedFile = path.join(generatedDir, `${pageGroup.slug}.${locale}.json`)
          let pageApiData = dataByFile.get(generatedFile)
          if (!pageApiData) {
            try {
              pageApiData = readGeneratedGroup(generatedFile, pageGroup.id, locale)
              dataByFile.set(generatedFile, pageApiData)
            } catch (error) {
              addProblem(diagnostics, relativeFile, {
                ruleId: 'doc-template/api-data-unavailable',
                message: `${pageGroup.slug}: ${error instanceof Error ? error.message : String(error)}`,
              })
            }
          }
          if (pageApiData) {
            for (const duplicate of findDuplicateApiMemberTables(source, pageApiData.components, expectedCalls, apiTypes.normalizeName)) {
              addProblem(diagnostics, relativeFile, {
                ruleId: 'doc-template/api-member-table-duplicate',
                message: duplicate.message,
              }, duplicate.line)
            }
          }
        }

        const problems = checkFile(absoluteFile, documentSet.required, documentSet.preview, { componentApiPage: isApplicableApiPage })
        for (const problem of problems) addProblem(diagnostics, relativeFile, problem)

        if (problems.length === 0 && DOC_EXCEPTIONS.has(relativeFile)) {
          addProblem(diagnostics, relativeFile, {
            ruleId: 'doc-template/stale-exception',
            message: '已达标但仍登记在 DOC_EXCEPTIONS（自清空约束）',
          })
        }
      }
    }
  } finally {
    await disposeMdItInstance()
  }

  for (const [slug, locales] of apiScopes) {
    if (!locales['zh-CN'] || !locales.en) {
      addProblem(diagnostics, `apps/docs/components/${slug}.md`, {
        ruleId: 'doc-template/api-bilingual-mirror',
        message: `已迁移组件 API 页 ${slug} 必须提供中英文组件 API 调用`,
      })
      continue
    }
    if (JSON.stringify(locales['zh-CN']) !== JSON.stringify(locales.en)) {
      addProblem(diagnostics, `apps/docs/components/${slug}.md`, {
        ruleId: 'doc-template/api-bilingual-scope',
        message: `组件 ${slug} 的中英文 API 调用组、固定成员范围、标签页、实例或搜索设置不一致`,
      })
    }
  }

  return { diagnostics, totalDocs }
}

function isMainModule() {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
}

if (isMainModule()) {
  const { diagnostics, totalDocs } = await runDocTemplateCheck()
  const isClean = diagnostics.length === 0
  const violations = new Map()
  for (const diagnostic of diagnostics) {
    const problems = violations.get(diagnostic.file) ?? []
    problems.push(diagnostic.message)
    violations.set(diagnostic.file, problems)
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({
      status: isClean ? 'success' : 'error',
      summary: isClean
        ? `Doc template lint: all ${totalDocs} docs satisfy required sections`
        : `Doc template lint: ${violations.size} files failed section or API requirements`,
      diagnostics,
    }, null, 2))
    process.exitCode = isClean ? 0 : 1
  } else if (isClean && !process.argv.includes('--verbose') && !process.argv.includes('-v')) {
    console.log(`✓ Doc template lint: all ${totalDocs} docs satisfy required sections`)
  } else {
    console.log('=== 组件文档章节与 API 页面契约检查 ===')
    console.log(`已扫描组件与区块文档 ${totalDocs} 个`)
    for (const [file, problems] of violations) {
      console.log(`  ✗ ${file}`)
      for (const problem of problems) console.log(`      ${problem}`)
    }
    console.log(isClean ? '✓ 全部文档满足模板章节与 API 契约' : `结论：${violations.size} 个文件违规，exit 1`)
    process.exitCode = isClean ? 0 : 1
  }
}
