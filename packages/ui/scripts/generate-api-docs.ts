/**
 * API 文档自动生成工具
 *
 * 功能：
 * 1. 使用 TypeDoc 生成 TypeScript API 文档（composables、types、utils）
 * 2. 解析 Vue SFC 文件提取组件 Props、Events、Slots、Expose 文档
 * 3. 抽取结构化元数据输出至 apps/docs/.vitepress/api-manifest.json（支持 VitePress 动态渲染）
 * 4. 生成统一的 Markdown 格式 API 文档
 *
 * 用法：
 *   pnpm docs:api
 *   pnpm docs:api -- --skip-typedoc      # 跳过 TypeDoc，仅生成 Vue 组件文档与 manifest
 *   pnpm docs:api -- --manifest-only    # 仅抽取并生成 api-manifest.json 供 docs 渲染
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPONENT_METADATA, CATEGORY_LABELS_ZH } from 'brutx-shared-vue'
import { createChecker, type ComponentMetaChecker } from 'vue-component-meta'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// 类型定义
// ============================================================================

/** Vue 组件 Prop 定义 */
export interface ComponentProp {
    name: string
    type: string
    required: boolean
    default: string
    description: string
}

/** Vue 组件 Event 定义 */
export interface ComponentEvent {
    name: string
    payload: string
    description: string
}

/** Vue 组件 Slot 定义 */
export interface ComponentSlot {
    name: string
    props: string
    description: string
}

/** Vue 组件 Expose 定义 */
export interface ComponentExpose {
    name: string
    type: string
    description: string
}

/** Vue 组件完整文档元数据 */
export interface ComponentDoc {
    name: string
    kebabName: string
    dirName: string
    category: string
    description: string
    filePath: string
    props: ComponentProp[]
    events: ComponentEvent[]
    slots: ComponentSlot[]
    exposes: ComponentExpose[]
}

/** 组件组（按目录归类，例如 alert 目录下包含 Alert, AlertTitle, AlertDescription） */
export interface ComponentGroupDoc {
    name: string
    category: string
    components: ComponentDoc[]
}

/** API Manifest 产物结构 */
export interface ApiManifest {
    generatedAt: string
    totalComponents: number
    totalGroups: number
    groups: Record<string, ComponentGroupDoc>
    components: Record<string, ComponentDoc>
}

/** Composable 文档 */
export interface ComposableDoc {
    name: string
    description: string
    filePath: string
    params: Array<{ name: string; type: string; description: string }>
    returns: Array<{ name: string; type: string; description: string }>
}

/** 文档生成配置 */
export interface DocGenConfig {
    srcDir: string
    outputDir: string
    manifestPath: string
    skipTypeDoc: boolean
    manifestOnly: boolean
}

// ============================================================================
// 常量、默认配置与集中覆盖定义
// ============================================================================

const APPS_DOCS_DIR = path.resolve(__dirname, '../../../apps/docs')
const DEFAULT_MANIFEST_PATH = path.resolve(APPS_DOCS_DIR, '.vitepress/api-manifest.json')

function getCliArg(flag: string): string | undefined {
    const idx = process.argv.indexOf(flag)
    if (idx !== -1 && idx + 1 < process.argv.length) {
        return process.argv[idx + 1]
    }
    return undefined
}

const DEFAULT_CONFIG: DocGenConfig = {
    srcDir: path.resolve(__dirname, '../src'),
    outputDir: path.resolve(__dirname, '../docs/api'),
    manifestPath: getCliArg('--output-manifest') || DEFAULT_MANIFEST_PATH,
    skipTypeDoc: process.argv.includes('--skip-typedoc') || process.argv.includes('--manifest-only'),
    manifestOnly: process.argv.includes('--manifest-only'),
}

/** 通用属性默认中文说明回退表 */
const COMMON_PROP_DESCRIPTIONS: Record<string, string> = {
    asChild: '是否将组件行为与属性委托给直接子元素',
    class: '自定义补充 CSS 类名',
    disabled: '是否禁用组件',
    loading: '是否处于加载中状态',
    variant: '视觉样式变体',
    size: '组件尺寸规格',
    id: '元素唯一标识符',
    name: '表单字段名称',
    modelValue: '双向绑定值（v-model）',
    type: '原生元素类型',
}

interface ComponentOverrideConfig {
    props?: Record<string, Partial<ComponentProp>>
    events?: Record<string, Partial<ComponentEvent>>
    slots?: Record<string, Partial<ComponentSlot>>
    exposes?: Record<string, Partial<ComponentExpose>>
}

/** 集中覆盖扩展配置（按组件名） */
const COMPONENT_OVERRIDES: Record<string, ComponentOverrideConfig> = {
    Button: {
        props: {
            variant: {
                type: "'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'",
                default: "'default'",
                description: '按钮变体样式',
            },
            size: {
                type: "'default' | 'sm' | 'lg' | 'xl' | 'icon'",
                default: "'default'",
                description: "按钮尺寸，'icon' 为正方形图标按钮",
            },
            flair: {
                type: "'none' | 'stacked' | 'hazard' | 'ticket'",
                default: "'none'",
                description: '装饰形态维度，与色系变体正交可组合',
            },
            asChild: {
                default: 'false',
                description: '将按钮样式渲染到子元素上，用于组合路由链接等',
            },
            type: {
                type: "'button' | 'submit' | 'reset'",
                default: 'undefined',
                description: '原生 button 类型；为 "submit" 时启用 pendingText 行为',
            },
            loading: {
                default: 'false',
                description: '显示加载动画并禁用按钮',
            },
            disabled: {
                default: 'false',
                description: '禁用按钮',
            },
            pendingText: {
                default: 'undefined (i18n: submitButton.submitting)',
                description: '加载中显示的等待文本，仅在 type="submit" 且 loading 时生效',
            },
            effect: {
                default: "'none'",
                description: '可选视觉效果',
            },
            glitchTrigger: {
                default: "'hover'",
                description: '故障动画触发方式，仅在 effect="glitch" 时生效',
            },
            glitchInterval: {
                default: '3000',
                description: '自动播放间隔（毫秒），仅在 glitchTrigger="autoplay" 时生效',
            },
            glitchSpeed: {
                default: "'medium'",
                description: '故障动画速度',
            },
            glitchDirection: {
                default: "'horizontal'",
                description: '故障撕裂方向',
            },
        },
    },
    Alert: {
        props: {
            variant: {
                type: "'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'",
                default: "'default'",
                description: '警告框变体类型',
            },
            closable: {
                default: 'false',
                description: '是否显示关闭按钮',
            },
        },
        events: {
            close: {
                description: '点击关闭按钮时触发',
            },
        },
        slots: {
            default: {
                description: '提示框主体内容',
            },
            actions: {
                description: '操作按钮区域，渲染在内容下方',
            },
        },
    },
    AlertTitle: {
        props: {
            as: {
                type: 'string | Component',
                default: "'h5'",
                description: '渲染的 HTML 元素或组件',
            },
            asChild: {
                default: 'false',
                description: '是否将 props 传递给子元素',
            },
        },
        slots: {
            default: {
                description: '标题内容',
            },
        },
    },
    AlertDescription: {
        props: {
            as: {
                type: 'string | Component',
                default: "'div'",
                description: '渲染的 HTML 元素或组件',
            },
            asChild: {
                default: 'false',
                description: '是否将 props 传递给子元素',
            },
        },
        slots: {
            default: {
                description: '描述内容',
            },
        },
    },
}

/** 从 shared 单一事实来源解析组件的中文分类名称 */
function getComponentCategoryLabel(dirName: string): string {
    const meta = COMPONENT_METADATA[dirName]
    if (meta && meta.category && CATEGORY_LABELS_ZH[meta.category]) {
        return CATEGORY_LABELS_ZH[meta.category]
    }
    return '其他组件'
}

// ============================================================================
// Vue SFC 解析器 (vue-component-meta)
// ============================================================================

let checkerInstance: ComponentMetaChecker | null = null

function getChecker(): ComponentMetaChecker {
    if (!checkerInstance) {
        const tsconfigPath = path.resolve(__dirname, '../tsconfig.json')
        checkerInstance = createChecker(tsconfigPath)
    }
    return checkerInstance
}

const IGNORED_PROP_NAMES = new Set(['key', 'ref', 'ref_for', 'ref_key', 'style'])

function escapeMarkdownTable(str: string): string {
    return str.replace(/\|/g, '\\|')
}

function cleanPropType(rawType: string): string {
    let t = rawType.trim()
    // 递归剔除顶层联合类型中的 undefined / null
    t = t.replace(/(\s*\|\s*(?:undefined|null)\s*)+$/g, '').trim()
    t = t.replace(/^((?:undefined|null)\s*\|\s*)+/g, '').trim()
    const nonNullableMatch = t.match(/^NonNullable<([\s\S]+)>$/)
    if (nonNullableMatch) {
        t = nonNullableMatch[1].trim()
        t = t.replace(/(\s*\|\s*(?:undefined|null)\s*)+$/g, '').trim()
        t = t.replace(/^((?:undefined|null)\s*\|\s*)+/g, '').trim()
    }
    t = t.replace(/""([^"']+)""/g, "'$1'")
    t = t.replace(/"([^"']+)"/g, "'$1'")
    t = t.replace(/\r?\n\s*/g, ' ')
    return t || 'unknown'
}

function cleanDefaultValue(rawDefault?: string): string {
    if (!rawDefault) return '-'
    let d = rawDefault.trim()
    if (d === 'undefined' || d === '') return '-'
    if (d === 'DEFAULT_AUTOPLAY_INTERVAL_MS') return '3000'
    if (d.startsWith('""') && d.endsWith('""') && d.length >= 4) {
        return `'${d.slice(2, -2)}'`
    }
    if (d.startsWith('"') && d.endsWith('"') && d.length >= 2) {
        return `'${d.slice(1, -1)}'`
    }
    d = d.replace(/\r?\n\s*/g, ' ')
    return d
}

function formatEventPayload(rawType: string): string {
    const trimmed = rawType.trim()
    if (!trimmed || trimmed === '[]' || trimmed === 'void') {
        return 'void'
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1).trim()
        return inner || 'void'
    }
    return trimmed.replace(/\r?\n\s*/g, ' ')
}

function formatSlotProps(rawType: string): string {
    const trimmed = rawType.trim()
    if (!trimmed || trimmed === '{}' || trimmed === 'void') {
        return '-'
    }
    return trimmed.replace(/\r?\n\s*/g, ' ')
}

function cleanExposeType(rawType: string): string {
    let t = rawType.trim()
    t = t.replace(/(\s*\|\s*(?:undefined|null)\s*)+$/g, '').trim()
    t = t.replace(/^((?:undefined|null)\s*\|\s*)+/g, '').trim()
    return t.replace(/\r?\n\s*/g, ' ') || 'unknown'
}

/**
 * 解析单个 Vue SFC 文件
 */
function parseVueSFC(filePath: string): ComponentDoc | null {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath, '.vue')
    const dirName = path.basename(path.dirname(filePath))
    const kebabName = fileName
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()

    // 提取 description（从文件顶部注释或组件名推断）
    const descMatch = content.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\/\s*\n/)
    const description = descMatch
        ? descMatch[0]
            .replace(/\/\*\*\s*\n/, '')
            .replace(/\s*\*\/\s*\n/, '')
            .split('\n')
            .map(line => line.replace(/^\s*\*\s?/, '').trim())
            .filter(line => line.length > 0)
            .join(' ')
        : ''

    let meta
    try {
        const checker = getChecker()
        meta = checker.getComponentMeta(filePath)
    } catch (error) {
        console.warn(`⚠️ [generate-api-docs] Failed to extract meta for ${filePath}:`, error)
        return null
    }

    const overrides = COMPONENT_OVERRIDES[fileName] || {}

    const props: ComponentProp[] = []
    for (const p of meta.props) {
        if (IGNORED_PROP_NAMES.has(p.name) || p.name.startsWith('onVue:')) continue
        const propOverride = overrides.props?.[p.name]
        const fallbackDesc = COMMON_PROP_DESCRIPTIONS[p.name] || '-'
        const rawDesc = p.description?.replace(/\r?\n/g, '<br>').trim()
        props.push({
            name: p.name,
            type: propOverride?.type ?? cleanPropType(p.type),
            required: propOverride?.required ?? p.required,
            default: propOverride?.default ?? cleanDefaultValue(p.default),
            description: propOverride?.description ?? (rawDesc && rawDesc !== '-' ? rawDesc : fallbackDesc),
        })
    }

    const events: ComponentEvent[] = []
    for (const e of meta.events) {
        if (e.name.startsWith('vue:') || e.name.startsWith('onVue:') || e.name.startsWith('hook:')) continue
        const eventOverride = overrides.events?.[e.name]
        const rawDesc = e.description?.replace(/\r?\n/g, '<br>').trim()
        events.push({
            name: e.name,
            payload: eventOverride?.payload ?? formatEventPayload(e.type),
            description: eventOverride?.description ?? (rawDesc && rawDesc !== '-' ? rawDesc : '-'),
        })
    }

    const slots: ComponentSlot[] = []
    for (const s of meta.slots) {
        const slotOverride = overrides.slots?.[s.name]
        const rawDesc = s.description?.replace(/\r?\n/g, '<br>').trim()
        slots.push({
            name: s.name,
            props: slotOverride?.props ?? formatSlotProps(s.type),
            description: slotOverride?.description ?? (rawDesc && rawDesc !== '-' ? rawDesc : (s.name === 'default' ? '默认插槽' : '-')),
        })
    }

    const exposes: ComponentExpose[] = []
    for (const exp of meta.exposed) {
        if (exp.name.startsWith('$')) continue
        const expOverride = overrides.exposes?.[exp.name]
        const rawDesc = exp.description?.replace(/\r?\n/g, '<br>').trim()
        exposes.push({
            name: exp.name,
            type: expOverride?.type ?? cleanExposeType(exp.type),
            description: expOverride?.description ?? (rawDesc && rawDesc !== '-' ? rawDesc : '-'),
        })
    }

    const category = getComponentCategoryLabel(dirName)
    const normalizedFilePath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/')

    return {
        name: fileName,
        kebabName,
        dirName,
        category,
        description: description || `${fileName} 组件`,
        filePath: normalizedFilePath,
        props,
        events,
        slots,
        exposes,
    }
}

// ============================================================================
// Composable 解析器
// ============================================================================

/**
 * 解析 Composable 文件的 JSDoc 和函数签名
 */
function parseComposable(filePath: string): ComposableDoc | null {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath, '.ts')

    // 跳过测试文件
    if (fileName.endsWith('.test') || fileName.endsWith('.spec')) {
        return null
    }

    // 提取导出函数
    const funcMatch = content.match(
        /export\s+(?:function|const)\s+(\w+)\s*(?:=\s*)?(?:<[^>]*>)?\s*\(([^)]*)\)/
    )

    if (!funcMatch) return null

    const funcName = funcMatch[1]
    const paramsStr = funcMatch[2]

    // 提取 JSDoc
    const jsDocMatch = content.match(
        /\/\*\*\s*\n([^*]|\*[^/])*\*\/\s*\nexport\s+(?:function|const)\s+(\w+)/
    )

    const description = jsDocMatch
        ? jsDocMatch[0]
            .replace(/\/\*\*\s*\n/, '')
            .replace(/\s*\*\/\s*\nexport.*/, '')
            .split('\n')
            .map(line => line.replace(/^\s*\*\s?/, '').trim())
            .filter(line => line.length > 0 && !line.startsWith('@'))
            .join(' ')
        : `${funcName} composable`

    // 解析参数
    const params = paramsStr
        .split(',')
        .map(param => {
            const [name, type] = param.trim().split(':').map(s => s.trim())
            return { name, type: type || 'unknown', description: '-' }
        })
        .filter(p => p.name)

    // 解析返回类型
    const returnMatch = content.match(/:\s*(?:Ref|Computed|WritableComputed|ShallowRef)<([^>]+)>/)
    const returns = returnMatch
        ? [{ name: 'value', type: returnMatch[1], description: '-' }]
        : []

    return {
        name: funcName,
        description,
        filePath: path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/'),
        params,
        returns,
    }
}

// ============================================================================
// Manifest 与 Markdown 生成器
// ============================================================================

/**
 * 生成 API Manifest JSON 产物
 */
function generateApiManifest(
    components: ComponentDoc[],
    manifestPath: string
): void {
    const groups: Record<string, ComponentGroupDoc> = {}
    const componentMap: Record<string, ComponentDoc> = {}

    for (const comp of components) {
        const dir = comp.dirName
        if (!groups[dir]) {
            groups[dir] = {
                name: dir,
                category: comp.category,
                components: [],
            }
        }
        groups[dir].components.push(comp)

        // 索引映射 (PascalCase, lowercase, kebab-case)
        componentMap[comp.name] = comp
        const lowerName = comp.name.toLowerCase()
        if (!componentMap[lowerName]) {
            componentMap[lowerName] = comp
        }
        if (comp.kebabName && !componentMap[comp.kebabName]) {
            componentMap[comp.kebabName] = comp
        }
    }

    // 组内排序：主组件排首位，其余子组件按字母顺序排序
    for (const group of Object.values(groups)) {
        group.components.sort((a, b) => {
            const dirNormalized = group.name.replace(/-/g, '').toLowerCase()
            const aIsMain = a.name.replace(/-/g, '').toLowerCase() === dirNormalized
            const bIsMain = b.name.replace(/-/g, '').toLowerCase() === dirNormalized
            if (aIsMain && !bIsMain) return -1
            if (!aIsMain && bIsMain) return 1
            return a.name.localeCompare(b.name)
        })
    }

    // 门禁守卫校验
    const CRITICAL_GROUPS = ['button', 'alert', 'input', 'dialog', 'card', 'badge']
    const missingCriticalGroups = CRITICAL_GROUPS.filter(dir => !groups[dir])
    if (missingCriticalGroups.length > 0) {
        throw new Error(`[generate-api-docs] 缺失关键组件组元数据: ${missingCriticalGroups.join(', ')}`)
    }

    const CRITICAL_COMPONENTS = ['Button', 'Alert', 'Input', 'Badge', 'Card']
    const missingCriticalComps = CRITICAL_COMPONENTS.filter(name => !componentMap[name])
    if (missingCriticalComps.length > 0) {
        throw new Error(`[generate-api-docs] 缺失关键组件元数据: ${missingCriticalComps.join(', ')}`)
    }

    if (components.length < 50) {
        throw new Error(`[generate-api-docs] 抽取组件数量异常 (${components.length} < 50)，可能存在解析中断`)
    }

    const manifest: ApiManifest = {
        generatedAt: new Date().toISOString(),
        totalComponents: components.length,
        totalGroups: Object.keys(groups).length,
        groups,
        components: componentMap,
    }

    const dir = path.dirname(manifestPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`📦 生成了 API Manifest: ${manifestPath} (共 ${components.length} 个组件，${Object.keys(groups).length} 个组件组)`)
}

/**
 * 生成单个组件的 Markdown 文档
 */
function generateComponentMarkdown(doc: ComponentDoc): string {
    const lines: string[] = []

    lines.push(`# ${doc.name}`)
    lines.push('')
    lines.push(`> ${doc.description}`)
    lines.push('')

    // 基本信息
    lines.push('## 基本信息')
    lines.push('')
    lines.push(`| 属性 | 值 |`)
    lines.push(`|------|-----|`)
    lines.push(`| 文件路径 | \`${doc.filePath}\` |`)
    lines.push(`| 分类 | ${doc.category} |`)
    lines.push('')

    // Props
    if (doc.props.length > 0) {
        lines.push('## Props')
        lines.push('')
        lines.push('| Prop | 类型 | 必填 | 默认值 | 说明 |')
        lines.push('|------|------|------|--------|------|')

        for (const prop of doc.props) {
            const required = prop.required ? '✅' : '❌'
            const type = `\`${escapeMarkdownTable(prop.type)}\``
            lines.push(`| ${prop.name} | ${type} | ${required} | \`${escapeMarkdownTable(prop.default)}\` | ${escapeMarkdownTable(prop.description)} |`)
        }
        lines.push('')
    }

    // Events
    if (doc.events.length > 0) {
        lines.push('## Events')
        lines.push('')
        lines.push('| 事件名 | 参数 | 说明 |')
        lines.push('|--------|------|------|')

        for (const event of doc.events) {
            lines.push(`| ${event.name} | \`${escapeMarkdownTable(event.payload)}\` | ${escapeMarkdownTable(event.description)} |`)
        }
        lines.push('')
    }

    // Slots
    if (doc.slots.length > 0) {
        lines.push('## Slots')
        lines.push('')
        lines.push('| 插槽名 | Props | 说明 |')
        lines.push('|--------|-------|------|')

        for (const slot of doc.slots) {
            lines.push(`| ${slot.name} | \`${escapeMarkdownTable(slot.props)}\` | ${escapeMarkdownTable(slot.description)} |`)
        }
        lines.push('')
    }

    // Exposes
    if (doc.exposes.length > 0) {
        lines.push('## Exposes')
        lines.push('')
        lines.push('| 方法/属性 | 类型 | 说明 |')
        lines.push('|-----------|------|------|')

        for (const expose of doc.exposes) {
            lines.push(`| ${expose.name} | \`${escapeMarkdownTable(expose.type)}\` | ${escapeMarkdownTable(expose.description)} |`)
        }
        lines.push('')
    }

    return lines.join('\n')
}

/**
 * 生成 Composable 的 Markdown 文档
 */
function generateComposableMarkdown(doc: ComposableDoc): string {
    const lines: string[] = []

    lines.push(`# ${doc.name}`)
    lines.push('')
    lines.push(`> ${doc.description}`)
    lines.push('')
    lines.push(`**文件路径**: \`${doc.filePath}\``)
    lines.push('')

    // 函数签名
    lines.push('## 函数签名')
    lines.push('')
    lines.push('```typescript')
    lines.push(`function ${doc.name}(${doc.params.map(p => `${p.name}: ${p.type}`).join(', ')}): ...`)
    lines.push('```')
    lines.push('')

    // 参数
    if (doc.params.length > 0) {
        lines.push('## 参数')
        lines.push('')
        lines.push('| 参数 | 类型 | 说明 |')
        lines.push('|------|------|------|')

        for (const param of doc.params) {
            lines.push(`| ${param.name} | \`${param.type}\` | ${param.description} |`)
        }
        lines.push('')
    }

    // 返回值
    if (doc.returns.length > 0) {
        lines.push('## 返回值')
        lines.push('')
        lines.push('| 属性 | 类型 | 说明 |')
        lines.push('|------|------|------|')

        for (const ret of doc.returns) {
            lines.push(`| ${ret.name} | \`${ret.type}\` | ${ret.description} |`)
        }
        lines.push('')
    }

    return lines.join('\n')
}

/**
 * 生成索引页
 */
function generateIndexPage(
    components: ComponentDoc[],
    composables: ComposableDoc[]
): string {
    const lines: string[] = []

    lines.push('# BrutxUI API 文档')
    lines.push('')
    lines.push('> 自动生成的 API 文档，包含组件和 Composable 的完整参考')
    lines.push('')

    // 组件目录
    lines.push('## 组件')
    lines.push('')

    // 按分类分组
    const componentsByCategory = new Map<string, ComponentDoc[]>()
    for (const comp of components) {
        const category = comp.category
        if (!componentsByCategory.has(category)) {
            componentsByCategory.set(category, [])
        }
        componentsByCategory.get(category)!.push(comp)
    }

    for (const [category, comps] of componentsByCategory) {
        lines.push(`### ${category}`)
        lines.push('')
        lines.push('| 组件 | 说明 |')
        lines.push('|------|------|')

        for (const comp of comps) {
            lines.push(`| [${comp.name}](./components/${comp.name}.md) | ${comp.description} |`)
        }
        lines.push('')
    }

    // Composable 目录
    if (composables.length > 0) {
        lines.push('## Composables')
        lines.push('')
        lines.push('| Composable | 说明 |')
        lines.push('|------------|------|')

        for (const composable of composables) {
            lines.push(`| [${composable.name}](./composables/${composable.name}.md) | ${composable.description} |`)
        }
        lines.push('')
    }

    // 统计信息
    lines.push('## 统计')
    lines.push('')
    lines.push(`- 组件数量: ${components.length}`)
    lines.push(`- Composable 数量: ${composables.length}`)
    lines.push(`- 生成时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push('')

    return lines.join('\n')
}

/**
 * 生成侧边栏配置（用于 VitePress 等）
 */
function generateSidebarConfig(
    components: ComponentDoc[],
    composables: ComposableDoc[]
): string {
    const lines: string[] = []

    lines.push('// 自动生成的侧边栏配置')
    lines.push('// 由 generate-api-docs.ts 生成')
    lines.push('')
    lines.push('export const sidebar = {')
    lines.push('  \'/api/\': [')

    // 组件分类
    const componentsByCategory = new Map<string, ComponentDoc[]>()
    for (const comp of components) {
        const category = comp.category
        if (!componentsByCategory.has(category)) {
            componentsByCategory.set(category, [])
        }
        componentsByCategory.get(category)!.push(comp)
    }

    for (const [category, comps] of componentsByCategory) {
        lines.push('    {')
        lines.push(`      text: '${category}',`)
        lines.push('      items: [')

        for (const comp of comps) {
            lines.push(`        { text: '${comp.name}', link: '/api/components/${comp.name}' },`)
        }

        lines.push('      ],')
        lines.push('    },')
    }

    // Composables
    if (composables.length > 0) {
        lines.push('    {')
        lines.push("      text: 'Composables',")
        lines.push('      items: [')

        for (const composable of composables) {
            lines.push(`        { text: '${composable.name}', link: '/api/composables/${composable.name}' },`)
        }

        lines.push('      ],')
        lines.push('    },')
    }

    lines.push('  ],')
    lines.push('}')
    lines.push('')

    return lines.join('\n')
}

// ============================================================================
// 主流程
// ============================================================================

/**
 * 运行 TypeDoc 生成 TypeScript API 文档
 */
async function runTypeDoc(): Promise<void> {
    const { execFileSync } = await import('node:child_process')
    const cwd = path.resolve(__dirname, '..')

    console.log('📦 运行 TypeDoc 生成 TypeScript API 文档...')

    try {
        if (process.platform === 'win32') {
            execFileSync('cmd', ['/c', 'npx', 'typedoc'], {
                cwd,
                stdio: 'inherit',
            })
        } else {
            execFileSync('npx', ['typedoc'], {
                cwd,
                stdio: 'inherit',
            })
        }
        console.log('✅ TypeDoc 文档生成成功')
    } catch (error) {
        console.error('❌ TypeDoc 文档生成失败:', error)
        throw error
    }
}

/**
 * 扫描 Vue 组件文件
 */
function scanVueComponents(srcDir: string): ComponentDoc[] {
    const components: ComponentDoc[] = []
    const componentsDir = path.join(srcDir, 'components')

    if (!fs.existsSync(componentsDir)) {
        console.warn('⚠️  组件目录不存在:', componentsDir)
        return components
    }

    const componentDirs = fs.readdirSync(componentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

    for (const dirName of componentDirs) {
        const dirPath = path.join(componentsDir, dirName)
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.vue') && !file.includes('.test'))

        for (const file of files) {
            const filePath = path.join(dirPath, file)
            const doc = parseVueSFC(filePath)

            if (doc) {
                components.push(doc)
            }
        }
    }

    return components
}

/**
 * 扫描 Composable 文件
 */
function scanComposables(srcDir: string): ComposableDoc[] {
    const composables: ComposableDoc[] = []
    const composablesDir = path.join(srcDir, 'composables')

    if (!fs.existsSync(composablesDir)) {
        console.warn('⚠️  Composables 目录不存在:', composablesDir)
        return composables
    }

    const files = fs.readdirSync(composablesDir)
        .filter(file => file.endsWith('.ts') && !file.includes('.test') && !file.includes('index'))

    for (const file of files) {
        const filePath = path.join(composablesDir, file)
        const doc = parseComposable(filePath)

        if (doc) {
            composables.push(doc)
        }
    }

    return composables
}

/**
 * 生成 Vue 组件文档
 */
function generateVueComponentDocs(
    components: ComponentDoc[],
    outputDir: string
): void {
    const componentsDir = path.join(outputDir, 'components')

    if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true })
    }

    for (const component of components) {
        const markdown = generateComponentMarkdown(component)
        const outputPath = path.join(componentsDir, `${component.name}.md`)

        fs.writeFileSync(outputPath, markdown, 'utf-8')
    }

    console.log(`📝 生成了 ${components.length} 个组件文档`)
}

/**
 * 生成 Composable 文档
 */
function generateComposableDocs(
    composables: ComposableDoc[],
    outputDir: string
): void {
    const composablesDir = path.join(outputDir, 'composables')

    if (!fs.existsSync(composablesDir)) {
        fs.mkdirSync(composablesDir, { recursive: true })
    }

    for (const composable of composables) {
        const markdown = generateComposableMarkdown(composable)
        const outputPath = path.join(composablesDir, `${composable.name}.md`)

        fs.writeFileSync(outputPath, markdown, 'utf-8')
    }

    console.log(`📝 生成了 ${composables.length} 个 Composable 文档`)
}

/**
 * 生成索引和配置文件
 */
function generateIndexAndConfig(
    components: ComponentDoc[],
    composables: ComposableDoc[],
    outputDir: string
): void {
    const indexContent = generateIndexPage(components, composables)
    fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent, 'utf-8')
    console.log('📄 生成了 API 文档索引页')

    const sidebarContent = generateSidebarConfig(components, composables)
    const configDir = path.join(outputDir, '.vitepress')

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    fs.writeFileSync(path.join(configDir, 'sidebar.ts'), sidebarContent, 'utf-8')
    console.log('📄 生成了侧边栏配置')
}

/**
 * 生成类型汇总文档
 */
function generateTypesSummary(
    components: ComponentDoc[],
    composables: ComposableDoc[],
    outputDir: string
): void {
    const lines: string[] = []

    lines.push('# 类型定义汇总')
    lines.push('')
    lines.push('> 所有组件和 Composable 的类型定义汇总')
    lines.push('')

    lines.push('## 组件类型')
    lines.push('')

    for (const comp of components) {
        if (comp.props.length > 0) {
            lines.push(`### ${comp.name}Props`)
            lines.push('')
            lines.push('```typescript')
            lines.push(`interface ${comp.name}Props {`)

            for (const prop of comp.props) {
                const optional = prop.required ? '' : '?'
                lines.push(`  ${prop.name}${optional}: ${prop.type}`)
            }

            lines.push('}')
            lines.push('```')
            lines.push('')
        }
    }

    if (composables.length > 0) {
        lines.push('## Composable 类型')
        lines.push('')

        for (const comp of composables) {
            if (comp.params.length > 0) {
                lines.push(`### ${comp.name}Options`)
                lines.push('')
                lines.push('```typescript')
                lines.push(`interface ${comp.name}Options {`)

                for (const param of comp.params) {
                    lines.push(`  ${param.name}: ${param.type}`)
                }

                lines.push('}')
                lines.push('```')
                lines.push('')
            }
        }
    }

    const content = lines.join('\n')
    fs.writeFileSync(path.join(outputDir, 'types.md'), content, 'utf-8')
    console.log('📄 生成了类型汇总文档')
}

/**
 * 主函数
 */
async function main(): Promise<void> {
    console.log('🚀 开始生成 API 文档...\n')

    const config: DocGenConfig = {
        ...DEFAULT_CONFIG,
    }

    // 步骤 1: 扫描 Vue 组件
    console.log('🔍 扫描 Vue 组件...')
    const components = scanVueComponents(config.srcDir)
    console.log(`   找到 ${components.length} 个组件`)

    // 步骤 2: 输出 API Manifest
    console.log('📦 抽取并生成 API Manifest...')
    generateApiManifest(components, config.manifestPath)

    if (config.manifestOnly) {
        console.log('\n✅ API Manifest 生成完毕（已按 --manifest-only 跳过其余文档生成）！')
        return
    }

    // 确保输出目录存在
    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true })
    }

    // 步骤 3: 运行 TypeDoc
    if (!config.skipTypeDoc) {
        try {
            await runTypeDoc()
        } catch {
            console.warn('⚠️  TypeDoc 生成失败，继续生成 Vue 组件文档...')
        }
    } else {
        console.log('⏭️  跳过 TypeDoc 文档生成')
    }

    console.log('')

    // 步骤 4: 扫描 Composables
    console.log('🔍 扫描 Composables...')
    const composables = scanComposables(config.srcDir)
    console.log(`   找到 ${composables.length} 个 Composable`)

    console.log('')

    // 步骤 5: 生成 Vue 组件文档
    console.log('📝 生成 Vue 组件文档...')
    generateVueComponentDocs(components, config.outputDir)

    // 步骤 6: 生成 Composable 文档
    console.log('📝 生成 Composable 文档...')
    generateComposableDocs(composables, config.outputDir)

    // 步骤 7: 生成索引和配置文件
    console.log('📝 生成索引和配置文件...')
    generateIndexAndConfig(components, composables, config.outputDir)

    // 步骤 8: 生成类型汇总
    console.log('📝 生成类型汇总文档...')
    generateTypesSummary(components, composables, config.outputDir)

    console.log('')
    console.log('✅ API 文档与 Manifest 生成完成！')
    console.log(`📁 输出目录: ${config.outputDir}`)
    console.log(`📄 Manifest: ${config.manifestPath}`)
    console.log('')
    console.log('📊 统计信息:')
    console.log(`   - 组件数量: ${components.length}`)
    console.log(`   - Composable 数量: ${composables.length}`)
    console.log('')
}

// 运行主函数
main().catch(error => {
    console.error('❌ 文档生成失败:', error)
    process.exit(1)
})
