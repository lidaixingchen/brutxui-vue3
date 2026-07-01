/**
 * API 文档自动生成工具
 *
 * 功能：
 * 1. 使用 TypeDoc 生成 TypeScript API 文档（composables、types、utils）
 * 2. 解析 Vue SFC 文件提取组件 Props、Events、Slots 文档
 * 3. 生成统一的 Markdown 格式 API 文档
 *
 * 用法：
 *   pnpm docs:api
 *   pnpm docs:api -- --skip-typedoc  # 跳过 TypeDoc，仅生成 Vue 组件文档
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// 类型定义
// ============================================================================

/** Vue 组件 Prop 定义 */
interface ComponentProp {
    name: string
    type: string
    required: boolean
    default: string
    description: string
}

/** Vue 组件 Event 定义 */
interface ComponentEvent {
    name: string
    payload: string
    description: string
}

/** Vue 组件 Slot 定义 */
interface ComponentSlot {
    name: string
    props: string
    description: string
}

/** Vue 组件 Expose 定义 */
interface ComponentExpose {
    name: string
    type: string
    description: string
}

/** Vue 组件完整文档 */
interface ComponentDoc {
    name: string
    category: string
    description: string
    filePath: string
    props: ComponentProp[]
    events: ComponentEvent[]
    slots: ComponentSlot[]
    exposes: ComponentExpose[]
}

/** Composable 文档 */
interface ComposableDoc {
    name: string
    description: string
    filePath: string
    params: Array<{ name: string; type: string; description: string }>
    returns: Array<{ name: string; type: string; description: string }>
}

/** 文档生成配置 */
interface DocGenConfig {
    srcDir: string
    outputDir: string
    skipTypeDoc: boolean
}

// ============================================================================
// 常量
// ============================================================================

const DEFAULT_CONFIG: DocGenConfig = {
    srcDir: path.resolve(__dirname, '../src'),
    outputDir: path.resolve(__dirname, '../docs/api'),
    skipTypeDoc: process.argv.includes('--skip-typedoc'),
}

/** 组件分类映射 */
const CATEGORY_MAP: Record<string, string> = {
    button: '基础组件',
    badge: '基础组件',
    separator: '基础组件',
    label: '基础组件',
    switch: '基础组件',
    checkbox: '基础组件',
    radio: '基础组件',
    input: '表单组件',
    textarea: '表单组件',
    select: '表单组件',
    combobox: '表单组件',
    'number-input': '表单组件',
    'tags-input': '表单组件',
    'hardcore-input': '表单组件',
    slider: '表单组件',
    toggle: '表单组件',
    'toggle-group': '表单组件',
    form: '表单组件',
    'date-picker': '表单组件',
    'color-picker': '表单组件',
    calendar: '表单组件',
    feedback: '表单组件',
    dialog: '弹窗组件',
    'alert-dialog': '弹窗组件',
    sheet: '弹窗组件',
    popover: '弹窗组件',
    tooltip: '弹窗组件',
    toast: '弹窗组件',
    popconfirm: '弹窗组件',
    dropdown: '导航组件',
    tabs: '导航组件',
    breadcrumb: '导航组件',
    pagination: '导航组件',
    table: '数据展示',
    'data-table': '数据展示',
    'data-table-section': '数据展示',
    card: '数据展示',
    'card-3d': '数据展示',
    avatar: '数据展示',
    progress: '数据展示',
    skeleton: '数据展示',
    accordion: '数据展示',
    timeline: '数据展示',
    tree: '数据展示',
    descriptions: '数据展示',
    kanban: '数据展示',
    chart: '数据展示',
    gallery: '数据展示',
    marquee: '数据展示',
    'before-after': '数据展示',
    carousel: '数据展示',
    counter: '数据展示',
    'code-block': '数据展示',
    kbd: '数据展示',
    stepper: '数据展示',
    spinner: '反馈组件',
    alert: '反馈组件',
    'empty-state': '反馈组件',
    'error-card': '反馈组件',
    'success-card': '反馈组件',
    'loading-page': '反馈组件',
    'not-found-page': '反馈组件',
    'cookie-consent': '反馈组件',
    command: '增强组件',
    'scroll-area': '增强组件',
    'virtual-scroll': '增强组件',
    'infinite-scroll': '增强组件',
    'copy-to-clipboard': '增强组件',
    'glitch-text': '新粗野主义',
    'glitch-button': '新粗野主义',
    'typewriter-text': '新粗野主义',
    'noise-background': '新粗野主义',
    'scratch-card': '新粗野主义',
    'sketchy-chart': '新粗野主义',
    'color-mode-switcher': '主题组件',
    layout: '布局组件',
    header: '布局组件',
    footer: '布局组件',
    dashboard: '布局组件',
    profile: '页面组件',
    settings: '页面组件',
    blog: '页面组件',
    activity: '页面组件',
    overview: '页面组件',
    auth: '页面组件',
    waitlist: '页面组件',
    pricing: '页面组件',
    testimonial: '页面组件',
    'file-card': '页面组件',
    'quick-actions': '页面组件',
    search: '页面组件',
    faq: '页面组件',
    upload: '页面组件',
    chat: '页面组件',
}

// ============================================================================
// Vue SFC 解析器
// ============================================================================

/**
 * 从 Vue SFC 文件中提取 JSDoc 注释
 */
function extractJSDocComment(content: string, startIndex: number): string {
    const beforeContent = content.substring(Math.max(0, startIndex - 500), startIndex)
    const commentMatch = beforeContent.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\/\s*$/)
    if (commentMatch) {
        return commentMatch[0]
            .replace(/\/\*\*\s*\n/, '')
            .replace(/\s*\*\/\s*$/, '')
            .split('\n')
            .map(line => line.replace(/^\s*\*\s?/, '').trim())
            .filter(line => line.length > 0)
            .join(' ')
    }
    return ''
}

/**
 * 从 TypeScript 类型字符串中解析 Props 定义
 */
function parsePropsFromTypeScript(content: string): ComponentProp[] {
    const props: ComponentProp[] = []

    // 匹配 interface 或 type 定义的 Props
    const propsInterfaceMatch = content.match(
        /(?:interface|type)\s+(\w*Props)\s*(?:=\s*)?{([^}]*)}/s
    )

    if (!propsInterfaceMatch) return props

    const propsBlock = propsInterfaceMatch[2]
    const lines = propsBlock.split('\n')

    let currentComment = ''

    for (const line of lines) {
        const trimmedLine = line.trim()

        // 收集注释
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/**')) {
            currentComment += trimmedLine.replace(/^\/?\*?\*?\s?/, '') + ' '
            continue
        }

        // 解析属性定义
        const propMatch = trimmedLine.match(
            /^(\w+)(\?)?:\s*(.+?)(?:\s*=\s*(.+?))?[,;]?$/
        )

        if (propMatch) {
            const [, name, optional, type, defaultVal] = propMatch
            props.push({
                name,
                type: type.trim(),
                required: !optional,
                default: defaultVal?.trim() || '-',
                description: currentComment.trim() || '-',
            })
            currentComment = ''
        }
    }

    return props
}

/**
 * 从 Vue SFC 的 defineProps 中解析 Props
 */
function parsePropsFromDefineProps(content: string): ComponentProp[] {
    const props: ComponentProp[] = []

    // 匹配 defineProps<{ ... }>() 模式
    const definePropsMatch = content.match(
        /defineProps\s*<\s*{([^}]*)}\s*>\s*\(\s*\)/s
    )

    if (definePropsMatch) {
        const propsBlock = definePropsMatch[1]
        const lines = propsBlock.split('\n')

        let currentComment = ''

        for (const line of lines) {
            const trimmedLine = line.trim()

            if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/**')) {
                currentComment += trimmedLine.replace(/^\/?\*?\*?\s?/, '') + ' '
                continue
            }

            const propMatch = trimmedLine.match(
                /^(\w+)(\?)?:\s*(.+?)(?:\s*=\s*(.+?))?[,;]?$/
            )

            if (propMatch) {
                const [, name, optional, type, defaultVal] = propMatch
                props.push({
                    name,
                    type: type.trim(),
                    required: !optional,
                    default: defaultVal?.trim() || '-',
                    description: currentComment.trim() || '-',
                })
                currentComment = ''
            }
        }
    }

    // 匹配 withDefaults(defineProps<{ ... }>(), { ... }) 模式
    const withDefaultsMatch = content.match(
        /withDefaults\s*\(\s*defineProps\s*<\s*{([^}]*)}\s*>\s*\(\s*\)\s*,\s*{([^}]*)}\s*\)/s
    )

    if (withDefaultsMatch) {
        const propsBlock = withDefaultsMatch[1]
        const defaultsBlock = withDefaultsMatch[2]

        // 解析默认值
        const defaults: Record<string, string> = {}
        const defaultMatches = defaultsBlock.matchAll(/(\w+):\s*(.+?)[,;]/g)
        for (const match of defaultMatches) {
            defaults[match[1]] = match[2].trim()
        }

        const lines = propsBlock.split('\n')
        let currentComment = ''

        for (const line of lines) {
            const trimmedLine = line.trim()

            if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/**')) {
                currentComment += trimmedLine.replace(/^\/?\*?\*?\s?/, '') + ' '
                continue
            }

            const propMatch = trimmedLine.match(
                /^(\w+)(\?)?:\s*(.+?)[,;]?$/
            )

            if (propMatch) {
                const [, name, optional, type] = propMatch
                props.push({
                    name,
                    type: type.trim(),
                    required: !optional,
                    default: defaults[name] || '-',
                    description: currentComment.trim() || '-',
                })
                currentComment = ''
            }
        }
    }

    return props
}

/**
 * 从 Vue SFC 中解析 Emits
 */
function parseEmits(content: string): ComponentEvent[] {
    const events: ComponentEvent[] = []

    // 匹配 defineEmits 模式
    const emitPatterns = [
        /defineEmits\s*<\s*{([^}]*)}\s*>\s*\(\s*\)/s,
        /defineEmits\s*\(\s*{([^}]*)}\s*\)/s,
        /defineEmits\s*\(\s*\[([^\]]*)\]\s*\)/s,
    ]

    for (const pattern of emitPatterns) {
        const match = content.match(pattern)
        if (match) {
            const emitsBlock = match[1]

            // 解析事件定义
            const eventMatches = emitsBlock.matchAll(
                /\(e:\s*['"](\w+)['"]\s*(?:,\s*(.+?))?\)/g
            )

            for (const eventMatch of eventMatches) {
                events.push({
                    name: eventMatch[1],
                    payload: eventMatch[2]?.trim() || 'void',
                    description: '-',
                })
            }

            // 简单格式：'event1' | 'event2'
            const simpleMatches = emitsBlock.matchAll(/['"](\w+)['"]/g)
            for (const simpleMatch of simpleMatches) {
                if (!events.find(e => e.name === simpleMatch[1])) {
                    events.push({
                        name: simpleMatch[1],
                        payload: 'void',
                        description: '-',
                    })
                }
            }

            break
        }
    }

    return events
}

/**
 * 从 Vue SFC 模板中解析 Slots
 */
function parseSlots(content: string): ComponentSlot[] {
    const slots: ComponentSlot[] = []

    // 匹配 <slot name="xxx" :prop="value" /> 模式
    const slotMatches = content.matchAll(
        /<slot\s+(?:name="(\w+)")?\s*(?::([\w]+)="([^"]*)")?\s*(?:\/>|>[\s\S]*?<\/slot>)/g
    )

    for (const match of slotMatches) {
        const name = match[1] || 'default'
        const propName = match[2]
        const propType = match[3]

        if (!slots.find(s => s.name === name)) {
            slots.push({
                name,
                props: propName ? `${propName}: ${propType || 'any'}` : '-',
                description: '-',
            })
        }
    }

    // 匹配 <slot> 标签
    const defaultSlot = content.match(/<slot\s*\/?>/)
    if (defaultSlot && !slots.find(s => s.name === 'default')) {
        slots.unshift({
            name: 'default',
            props: '-',
            description: '默认插槽',
        })
    }

    return slots
}

/**
 * 解析单个 Vue SFC 文件
 */
function parseVueSFC(filePath: string): ComponentDoc | null {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath, '.vue')
    const dirName = path.basename(path.dirname(filePath))

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

    // 解析 script setup 内容
    const scriptMatch = content.match(
        /<script\s+setup[^>]*>([\s\S]*?)<\/script>/
    )

    if (!scriptMatch) return null

    const scriptContent = scriptMatch[1]

    // 解析各类 API
    const props = [
        ...parsePropsFromDefineProps(scriptContent),
        ...parsePropsFromTypeScript(scriptContent),
    ]

    // 去重
    const uniqueProps = props.filter(
        (prop, index, self) => self.findIndex(p => p.name === prop.name) === index
    )

    const events = parseEmits(scriptContent)
    const slots = parseSlots(content)

    // 确定分类
    const category = CATEGORY_MAP[dirName] || '其他组件'

    return {
        name: fileName,
        category,
        description: description || `${fileName} 组件`,
        filePath: path.relative(path.resolve(__dirname, '..'), filePath),
        props: uniqueProps,
        events,
        slots,
        exposes: [],
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
        filePath: path.relative(path.resolve(__dirname, '..'), filePath),
        params,
        returns,
    }
}

// ============================================================================
// Markdown 生成器
// ============================================================================

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
            const type = `\`${prop.type}\``
            lines.push(`| ${prop.name} | ${type} | ${required} | \`${prop.default}\` | ${prop.description} |`)
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
            lines.push(`| ${event.name} | \`${event.payload}\` | ${event.description} |`)
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
            lines.push(`| ${slot.name} | \`${slot.props}\` | ${slot.description} |`)
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
            lines.push(`| ${expose.name} | \`${expose.type}\` | ${expose.description} |`)
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
        // Windows 上使用 cmd /c 调用 npx
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

    // 确保目录存在
    if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true })
    }

    // 生成每个组件的文档
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

    // 确保目录存在
    if (!fs.existsSync(composablesDir)) {
        fs.mkdirSync(composablesDir, { recursive: true })
    }

    // 生成每个 composable 的文档
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
    // 生成索引页
    const indexContent = generateIndexPage(components, composables)
    fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent, 'utf-8')
    console.log('📄 生成了 API 文档索引页')

    // 生成侧边栏配置
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

    // 组件类型
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

    // Composable 类型
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

    // 确保输出目录存在
    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true })
    }

    // 步骤 1: 运行 TypeDoc
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

    // 步骤 2: 扫描 Vue 组件
    console.log('🔍 扫描 Vue 组件...')
    const components = scanVueComponents(config.srcDir)
    console.log(`   找到 ${components.length} 个组件`)

    // 步骤 3: 扫描 Composables
    console.log('🔍 扫描 Composables...')
    const composables = scanComposables(config.srcDir)
    console.log(`   找到 ${composables.length} 个 Composable`)

    console.log('')

    // 步骤 4: 生成 Vue 组件文档
    console.log('📝 生成 Vue 组件文档...')
    generateVueComponentDocs(components, config.outputDir)

    // 步骤 5: 生成 Composable 文档
    console.log('📝 生成 Composable 文档...')
    generateComposableDocs(composables, config.outputDir)

    // 步骤 6: 生成索引和配置
    console.log('📝 生成索引和配置文件...')
    generateIndexAndConfig(components, composables, config.outputDir)

    // 步骤 7: 生成类型汇总
    console.log('📝 生成类型汇总文档...')
    generateTypesSummary(components, composables, config.outputDir)

    console.log('')
    console.log('✅ API 文档生成完成！')
    console.log(`📁 输出目录: ${config.outputDir}`)
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
