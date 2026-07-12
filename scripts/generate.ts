#!/usr/bin/env tsx
/**
 * 代码生成器 - 支持生成组件、Composable、页面
 *
 * 使用方式：
 *   pnpm generate:component MyComponent
 *   pnpm generate:composable useMyHook
 *   pnpm generate:page MyPage
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join, resolve, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

// ============================================================
// 类型定义
// ============================================================

/** 支持的生成类型 */
type GenerateType = 'component' | 'composable' | 'page'

/** ANSI 颜色码 */
interface AnsiColors {
    reset: string
    red: string
    green: string
    yellow: string
    blue: string
    cyan: string
    bold: string
    dim: string
}

/** 模板变量映射 */
interface TemplateVars {
    /** PascalCase 名称 */
    PascalName: string
    /** kebab-case 名称 */
    kebabName: string
    /** camelCase 名称 */
    camelName: string
    /** 组件描述（中文） */
    description: string
}

/** 生成器配置 */
interface GeneratorConfig {
    /** 目标目录 */
    targetDir: string
    /** 需要创建的文件列表 */
    files: FileTemplate[]
    /** 导出语句（用于更新 index.ts） */
    exports: string[]
}

/** 文件模板 */
interface FileTemplate {
    /** 相对于 targetDir 的文件路径 */
    relativePath: string
    /** 文件内容模板 */
    content: string
}

// ============================================================
// 常量
// ============================================================

const COLORS: AnsiColors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
}

const VALID_TYPES: readonly GenerateType[] = ['component', 'composable', 'page'] as const

const TYPE_LABEL_MAP: Record<GenerateType, string> = {
    component: '组件',
    composable: 'Composable',
    page: '页面',
}

/** 项目根目录 */
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** UI 包源码目录 */
const UI_SRC_DIR = join(PROJECT_ROOT, 'packages', 'ui', 'src')

/** 组件目录 */
const COMPONENTS_DIR = join(UI_SRC_DIR, 'components')

/** Composables 目录 */
const COMPOSABLES_DIR = join(UI_SRC_DIR, 'composables')

/** 主导出文件 */
const INDEX_FILE = join(UI_SRC_DIR, 'index.ts')

// ============================================================
// 工具函数
// ============================================================

/** 将名称转为 PascalCase */
function toPascalCase(name: string): string {
    return name
        .replace(/[-_\s]+(.)?/g, (_match: string, char: string | undefined): string =>
            char ? char.toUpperCase() : ''
        )
        .replace(/^./, (char: string): string => char.toUpperCase())
}

/** 将名称转为 kebab-case */
function toKebabCase(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
}

/** 将名称转为 camelCase */
function toCamelCase(name: string): string {
    const pascal = toPascalCase(name)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/** 彩色输出 */
function colorize(color: keyof AnsiColors, text: string): string {
    return `${COLORS[color]}${text}${COLORS.reset}`
}

/** 打印成功信息 */
function logSuccess(message: string): void {
    console.log(`${colorize('green', '  ✓')} ${message}`)
}

/** 打印错误信息 */
function logError(message: string): void {
    console.error(`${colorize('red', '  ✗')} ${message}`)
}

/** 打印信息 */
function logInfo(message: string): void {
    console.log(`${colorize('cyan', '  ℹ')} ${message}`)
}

/** 打印警告 */
function logWarning(message: string): void {
    console.log(`${colorize('yellow', '  ⚠')} ${message}`)
}

/** 替换模板变量 */
function replaceTemplateVars(template: string, vars: TemplateVars): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        result = result.replace(pattern, value)
    }
    return result
}

/** 确保目录存在 */
function ensureDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true })
    }
}

/** 将文件写入磁盘，如已存在则报错 */
function writeFileIfNotExists(filePath: string, content: string): boolean {
    if (existsSync(filePath)) {
        logError(`文件已存在: ${relative(PROJECT_ROOT, filePath)}`)
        return false
    }
    ensureDir(dirname(filePath))
    writeFileSync(filePath, content, 'utf-8')
    logSuccess(`创建文件: ${colorize('cyan', relative(PROJECT_ROOT, filePath))}`)
    return true
}

// ============================================================
// 模板定义（使用数组拼接避免模板字面量中反引号导致的解析问题）
// ============================================================

function getComponentVueTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        '<script setup lang="ts">',
        "import { computed } from 'vue'",
        "import { cn } from '@/lib/utils'",
        "import { {{camelName}}Variants } from './{{kebabName}}-variants'",
        '',
        'interface {{PascalName}}Props {',
        '    /** 自定义 CSS 类名 */',
        '    class?: string',
        '}',
        '',
        'const props = withDefaults(defineProps<{{PascalName}}Props>(), {',
        '    class: undefined,',
        '})',
        '',
        'const classes = computed(() =>',
        '    cn({{camelName}}Variants(), props.class)',
        ')',
        '</script>',
        '',
        '<template>',
        '    <div :class="classes">',
        '        <slot />',
        '    </div>',
        '</template>',
        '',
    ]
    return lines.join('\n')
}

function getComponentVariantsTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { cva } from 'class-variance-authority'",
        '',
        'export const {{camelName}}Variants = cva(',
        '    [',
        "        'relative',",
        '    ],',
        '    {',
        '        variants: {',
        '            variant: {',
        "                default: '',",
        '            },',
        '            size: {',
        "                default: '',",
        '            },',
        '        },',
        '        defaultVariants: {',
        "            variant: 'default',",
        "            size: 'default',",
        '        },',
        '    }',
        ')',
        '',
    ]
    return lines.join('\n')
}

function getComponentIndexTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "export { default as {{PascalName}} } from './{{PascalName}}.vue'",
        "export { {{camelName}}Variants } from './{{kebabName}}-variants'",
        '',
    ]
    return lines.join('\n')
}

function getComponentTestTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { describe, it, expect } from 'vitest'",
        "import { mount } from '@vue/test-utils'",
        "import {{PascalName}} from './{{PascalName}}.vue'",
        '',
        "describe('{{PascalName}}', () => {",
        "    it('正确渲染默认状态', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            slots: {',
        "                default: '{{description}}',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.text()).toContain('{{description}}')",
        '    })',
        '',
        "    it('支持自定义 class', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            props: {',
        "                class: 'custom-class',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.classes()).toContain('custom-class')",
        '    })',
        '})',
        '',
    ]
    return lines.join('\n')
}

function getComposableTemplate(_vars: TemplateVars): string {
    const BT = '`'
    const lines: string[] = [
        "import { ref, type Ref } from 'vue'",
        '',
        '/**',
        ' * {{description}} 选项',
        ' */',
        'export interface {{PascalName}}Options {',
        '    /** 初始值 */',
        '    initialValue?: unknown',
        '}',
        '',
        '/**',
        ' * {{description}} 返回类型',
        ' */',
        'export interface {{PascalName}}Return {',
        '    /** 当前值 */',
        '    value: Ref<unknown>',
        '    /** 重置为初始值 */',
        '    reset: () => void',
        '}',
        '',
        '/**',
        ' * {{description}}',
        ' *',
        ' * @param options - 配置选项',
        ' * @returns 包含状态和操作方法的对象',
        ' *',
        ' * @example',
        ` * ${BT}${BT}${BT}vue`,
        ' * <script setup lang="ts">',
        " * import { {{camelName}} } from '@brutx/ui-vue'",
        ' *',
        ' * const { value, reset } = {{camelName}}({',
        ' *     initialValue: null,',
        ' * })',
        ' * </script>',
        ` * ${BT}${BT}${BT}`,
        ' */',
        'export function {{camelName}}(',
        '    options: {{PascalName}}Options = {},',
        '): {{PascalName}}Return {',
        '    const { initialValue = null } = options',
        '',
        '    const value = ref<unknown>(initialValue)',
        '',
        '    function reset(): void {',
        '        value.value = initialValue',
        '    }',
        '',
        '    return {',
        '        value,',
        '        reset,',
        '    }',
        '}',
        '',
    ]
    return lines.join('\n')
}

function getComposableTestTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { describe, it, expect } from 'vitest'",
        "import { {{camelName}} } from './{{camelName}}'",
        '',
        "describe('{{camelName}}', () => {",
        "    it('返回默认初始值', () => {",
        '        const { value } = {{camelName}}()',
        '        expect(value.value).toBeNull()',
        '    })',
        '',
        "    it('支持自定义初始值', () => {",
        "        const { value } = {{camelName}}({ initialValue: 'test' })",
        "        expect(value.value).toBe('test')",
        '    })',
        '',
        "    it('重置为初始值', () => {",
        "        const { value, reset } = {{camelName}}({ initialValue: 'initial' })",
        "        value.value = 'changed'",
        "        expect(value.value).toBe('changed')",
        '',
        '        reset()',
        "        expect(value.value).toBe('initial')",
        '    })',
        '})',
        '',
    ]
    return lines.join('\n')
}

function getPageVueTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        '<script setup lang="ts">',
        "import { cn } from '@/lib/utils'",
        '',
        'interface {{PascalName}}Props {',
        '    /** 页面标题 */',
        '    title?: string',
        '    /** 页面描述 */',
        '    description?: string',
        '    /** 自定义 CSS 类名 */',
        '    class?: string',
        '}',
        '',
        'const props = withDefaults(defineProps<{{PascalName}}Props>(), {',
        "    title: '{{description}}',",
        "    description: '',",
        '    class: undefined,',
        '})',
        '</script>',
        '',
        '<template>',
        '    <div :class="cn(\'flex flex-col gap-6 p-6\', props.class)">',
        '        <header class="flex flex-col gap-2">',
        '            <h1 class="text-3xl font-black tracking-tight">',
        '                {{ title }}',
        '            </h1>',
        '            <p',
        '                v-if="description"',
        '                class="text-muted-foreground"',
        '            >',
        '                {{ description }}',
        '            </p>',
        '        </header>',
        '',
        '        <main class="flex-1">',
        '            <slot />',
        '        </main>',
        '',
        '        <footer v-if="$slots.footer">',
        '            <slot name="footer" />',
        '        </footer>',
        '    </div>',
        '</template>',
        '',
    ]
    return lines.join('\n')
}

function getPageIndexTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "export { default as {{PascalName}} } from './{{PascalName}}.vue'",
        '',
    ]
    return lines.join('\n')
}

function getPageTestTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { describe, it, expect } from 'vitest'",
        "import { mount } from '@vue/test-utils'",
        "import {{PascalName}} from './{{PascalName}}.vue'",
        '',
        "describe('{{PascalName}}', () => {",
        "    it('正确渲染默认标题', () => {",
        '        const wrapper = mount({{PascalName}})',
        '',
        "        expect(wrapper.find('h1').text()).toBe('{{description}}')",
        '    })',
        '',
        "    it('支持自定义标题', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            props: {',
        "                title: '自定义标题',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.find('h1').text()).toBe('自定义标题')",
        '    })',
        '',
        "    it('支持自定义 class', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            props: {',
        "                class: 'custom-class',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.classes()).toContain('custom-class')",
        '    })',
        '})',
        '',
    ]
    return lines.join('\n')
}

// ============================================================
// 生成器核心逻辑
// ============================================================

/** 验证名称是否合法 */
function validateName(name: string): boolean {
    const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/
    return NAME_PATTERN.test(name)
}

/** 构建模板变量 */
function buildTemplateVars(name: string, type: GenerateType): TemplateVars {
    const pascalName = toPascalCase(name)
    const kebabName = toKebabCase(name)

    const DESCRIPTION_MAP: Record<GenerateType, string> = {
        component: `${pascalName} 组件`,
        composable: `${pascalName} 组合式函数`,
        page: `${pascalName} 页面`,
    }

    return {
        PascalName: pascalName,
        kebabName: kebabName,
        camelName: toCamelCase(name),
        description: DESCRIPTION_MAP[type],
    }
}

/** 获取组件生成配置 */
function getComponentConfig(vars: TemplateVars): GeneratorConfig {
    const kebabName = vars.kebabName
    const targetDir = join(COMPONENTS_DIR, kebabName)

    return {
        targetDir,
        files: [
            {
                relativePath: `${vars.PascalName}.vue`,
                content: replaceTemplateVars(getComponentVueTemplate(vars), vars),
            },
            {
                relativePath: `${kebabName}-variants.ts`,
                content: replaceTemplateVars(getComponentVariantsTemplate(vars), vars),
            },
            {
                relativePath: 'index.ts',
                content: replaceTemplateVars(getComponentIndexTemplate(vars), vars),
            },
            {
                relativePath: `${vars.PascalName}.test.ts`,
                content: replaceTemplateVars(getComponentTestTemplate(vars), vars),
            },
        ],
        exports: [
            `export { default as ${vars.PascalName} } from './components/${kebabName}/${vars.PascalName}.vue'`,
            `export { ${vars.camelName}Variants } from './components/${kebabName}/${kebabName}-variants'`,
        ],
    }
}

/** 获取 Composable 生成配置 */
function getComposableConfig(vars: TemplateVars): GeneratorConfig {
    const targetDir = COMPOSABLES_DIR

    return {
        targetDir,
        files: [
            {
                relativePath: `${vars.camelName}.ts`,
                content: replaceTemplateVars(getComposableTemplate(vars), vars),
            },
            {
                relativePath: `${vars.camelName}.test.ts`,
                content: replaceTemplateVars(getComposableTestTemplate(vars), vars),
            },
        ],
        exports: [
            `export { ${vars.camelName} } from './composables/${vars.camelName}'`,
            `export type { ${vars.PascalName}Options, ${vars.PascalName}Return } from './composables/${vars.camelName}'`,
        ],
    }
}

/** 获取页面生成配置 */
function getPageConfig(vars: TemplateVars): GeneratorConfig {
    const kebabName = vars.kebabName
    const targetDir = join(COMPONENTS_DIR, kebabName)

    return {
        targetDir,
        files: [
            {
                relativePath: `${vars.PascalName}.vue`,
                content: replaceTemplateVars(getPageVueTemplate(vars), vars),
            },
            {
                relativePath: 'index.ts',
                content: replaceTemplateVars(getPageIndexTemplate(vars), vars),
            },
            {
                relativePath: `${vars.PascalName}.test.ts`,
                content: replaceTemplateVars(getPageTestTemplate(vars), vars),
            },
        ],
        exports: [
            `export { default as ${vars.PascalName} } from './components/${kebabName}/${vars.PascalName}.vue'`,
        ],
    }
}

/** 根据类型获取生成器配置 */
function getGeneratorConfig(type: GenerateType, vars: TemplateVars): GeneratorConfig {
    const CONFIG_MAP: Record<GenerateType, (v: TemplateVars) => GeneratorConfig> = {
        component: getComponentConfig,
        composable: getComposableConfig,
        page: getPageConfig,
    }

    return CONFIG_MAP[type](vars)
}

/** 生成文件 */
function generateFiles(config: GeneratorConfig): boolean {
    let allSuccess = true

    for (const file of config.files) {
        const filePath = join(config.targetDir, file.relativePath)
        const success = writeFileIfNotExists(filePath, file.content)
        if (!success) {
            allSuccess = false
        }
    }

    return allSuccess
}

/** 更新主导出文件 */
function updateIndexFile(exports: string[]): boolean {
    if (!existsSync(INDEX_FILE)) {
        logError(`导出文件不存在: ${relative(PROJECT_ROOT, INDEX_FILE)}`)
        return false
    }

    const content = readFileSync(INDEX_FILE, 'utf-8')

    const newExports = exports.filter((exp) => !content.includes(exp))
    const duplicateExports = exports.filter((exp) => content.includes(exp))

    if (duplicateExports.length > 0) {
        logWarning('以下导出已存在，跳过:')
        for (const exp of duplicateExports) {
            logWarning(`  ${exp}`)
        }
    }

    if (newExports.length === 0) {
        return true
    }

    // 在文件末尾追加新导出
    const newContent = content.trimEnd() + '\n\n// 自动生成的导出\n' + newExports.join('\n') + '\n'
    writeFileSync(INDEX_FILE, newContent, 'utf-8')

    logSuccess(`更新导出: ${colorize('cyan', relative(PROJECT_ROOT, INDEX_FILE))}`)
    for (const exp of newExports) {
        logInfo(`  ${exp}`)
    }

    return true
}

// ============================================================
// 主函数
// ============================================================

function printUsage(): void {
    console.log('')
    console.log(colorize('bold', '  BrutxUI 代码生成器'))
    console.log('')
    console.log(colorize('dim', '  使用方式:'))
    console.log(`    ${colorize('cyan', 'pnpm generate:component')} ${colorize('yellow', '<名称>')}     生成组件`)
    console.log(`    ${colorize('cyan', 'pnpm generate:composable')} ${colorize('yellow', '<名称>')}    生成 Composable`)
    console.log(`    ${colorize('cyan', 'pnpm generate:page')} ${colorize('yellow', '<名称>')}         生成页面`)
    console.log('')
    console.log(colorize('dim', '  示例:'))
    console.log('    pnpm generate:component MyButton')
    console.log('    pnpm generate:composable useLocalStorage')
    console.log('    pnpm generate:page Dashboard')
    console.log('')
}

function parseArgs(): { type: GenerateType; name: string } | null {
    const args = process.argv.slice(2)

    if (args.length < 2) {
        return null
    }

    const type = args[0] as GenerateType
    const name = args[1]

    if (!VALID_TYPES.includes(type)) {
        logError(`无效的生成类型: "${type}"`)
        logInfo(`支持的类型: ${VALID_TYPES.join(', ')}`)
        return null
    }

    if (!name) {
        logError('请指定名称')
        return null
    }

    return { type, name }
}

function main(): void {
    const args = parseArgs()

    if (!args) {
        printUsage()
        process.exit(1)
    }

    const { type, name } = args

    // 验证名称
    if (!validateName(name)) {
        logError(`无效的名称: "${name}"`)
        logInfo('名称必须以字母开头，只包含字母、数字、连字符、下划线')
        process.exit(1)
    }

    console.log('')
    console.log(colorize('bold', `  开始生成 ${TYPE_LABEL_MAP[type]}: ${colorize('cyan', name)}`))
    console.log('')

    // 构建模板变量
    const vars = buildTemplateVars(name, type)

    // 获取生成器配置
    const config = getGeneratorConfig(type, vars)

    // 检查目标目录是否已存在
    if (existsSync(config.targetDir)) {
        logWarning(`目标目录已存在: ${relative(PROJECT_ROOT, config.targetDir)}`)
        logInfo('将继续创建不存在的文件...')
        console.log('')
    }

    // 生成文件
    const fileSuccess = generateFiles(config)

    if (!fileSuccess) {
        console.log('')
        logWarning('部分文件已存在，请手动检查')
    }

    // 更新导出文件
    console.log('')
    const indexSuccess = updateIndexFile(config.exports)

    // 打印总结
    console.log('')
    if (fileSuccess && indexSuccess) {
        console.log(colorize('green', '  ✓ 生成完成！'))
    } else {
        console.log(colorize('yellow', '  ⚠ 生成完成（有部分警告）'))
    }
    console.log('')
}

main()
