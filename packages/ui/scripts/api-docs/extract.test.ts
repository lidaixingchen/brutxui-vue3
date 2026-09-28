import path from 'node:path'
import ts from 'typescript'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apiAnchorPart, apiMemberId, type ApiComponent, type ApiKind, type ApiMember } from '../../../../apps/docs/.vitepress/api-types.js'
import type { CatalogMember } from './catalog.js'
import { collectDefaultExpressions, createApiExtractor } from './extract.js'
import { isVueRefType } from './type-shape.js'
import { evaluateFactoryExpression, evaluateStaticExpression, isFactoryExpression } from './default-static-evaluator.js'

const ROOT = path.resolve(__dirname, '../../../..')
const API_EXTRACTOR_INITIALIZATION_TIMEOUT_MS = 90_000
let extractor: ReturnType<typeof createApiExtractor> | undefined

beforeAll(() => {
    extractor = createApiExtractor(ROOT)
    extractor.extract(catalogMember('Button', 'packages/ui/src/components/button/Button.vue'))
}, API_EXTRACTOR_INITIALIZATION_TIMEOUT_MS)

afterAll(() => extractor?.dispose())

function catalogMember(name: string, source: string): CatalogMember {
    return { id: `component:${name.toLowerCase()}/${name}`, name, source, sourceName: 'default', classification: 'component' }
}

function extract(name: string, source: string): ApiComponent {
    if (!extractor) throw new Error('API extractor is not initialized')
    return extractor.extract(catalogMember(name, source))
}

function member(component: ApiComponent, kind: ApiKind, name: string): ApiMember {
    const result = component.members.find(item => item.kind === kind && item.name === name)
    expect(result, `${component.name}.${kind}.${name}`).toBeDefined()
    return result!
}

describe('Vue 组件 API 结构提取', () => {
    it('提取 Button 别名联合值并静态解析常量默认值', () => {
        const button = extract('Button', 'packages/ui/src/components/button/Button.vue')
        const glitchSpeed = member(button, 'props', 'glitchSpeed')
        const glitchDirection = member(button, 'props', 'glitchDirection')
        const glitchInterval = member(button, 'props', 'glitchInterval')

        expect(glitchSpeed.type.text).toBe('ButtonGlitchSpeed | undefined')
        expect(glitchSpeed.required).toBe(false)
        expect(glitchSpeed.nullable).toBe(false)
        expect(glitchSpeed.type.literals).toEqual(['"fast"', '"medium"', '"slow"'])
        const speedReference = glitchSpeed.type.references.find(reference => reference.name === 'ButtonGlitchSpeed')
        expect(speedReference?.text).toBe("type ButtonGlitchSpeed = NonNullable<ButtonVariantProps['glitchSpeed']>")
        expect(speedReference?.id).toBe(`type-${encodeURIComponent('packages/ui/src/components/button/Button.vue#ButtonGlitchSpeed')}`)
        expect(glitchDirection.type.literals).toEqual(['"both"', '"horizontal"', '"vertical"'])
        expect(glitchSpeed.default).toEqual(expect.objectContaining({
            declaration: expect.objectContaining({ kind: 'value', text: "'medium'" }),
            resolution: { kind: 'resolved', text: '"medium"' },
        }))
        expect(glitchInterval.default).toEqual(expect.objectContaining({
            declaration: expect.objectContaining({ kind: 'expression', text: 'DEFAULT_AUTOPLAY_INTERVAL_MS' }),
            resolution: { kind: 'resolved', text: '3000' },
        }))
        expect(glitchSpeed.id).toBe(apiMemberId(button.id, 'props', 'glitchSpeed'))
    })

    it('为 API 成员生成稳定且无分隔符碰撞的锚点', () => {
        expect(apiAnchorPart('a-b')).toBe('a_2Db')
        expect(apiAnchorPart('a-b')).not.toBe(apiAnchorPart('a_2Db'))
        expect(apiMemberId('component:button/Button', 'props', 'glitchSpeed'))
            .toBe('api-component_3Abutton_2FButton-props-glitchSpeed')
    })

    it('提取 Input 的 v-model 属性和具名更新参数', () => {
        const input = extract('Input', 'packages/ui/src/components/input/Input.vue')
        const modelValue = member(input, 'props', 'modelValue')
        const update = member(input, 'events', 'update:modelValue')

        expect(modelValue.type.text).toBe('string | undefined')
        expect(modelValue.required).toBe(false)
        expect(modelValue.default?.declaration).toEqual(expect.objectContaining({ kind: 'value', text: 'undefined' }))
        expect(update.type.text).toBe('[value: string]')
        expect(update.source.file).toBe(input.source.file)
        expect(input.members.some(item => item.name.includes('__@'))).toBe(false)
        expect(input.members.some(item => item.kind === 'exposes' && item.name === 'ref.value')).toBe(false)
    })

    it('将顶层 Ref 暴露值作为实例属性并跳过内部 value 路径', () => {
        const input = extract('HardcoreInput', 'packages/ui/src/components/hardcore-input/HardcoreInput.vue')
        const validationState = member(input, 'exposes', 'validationState')
        const errorMessage = member(input, 'exposes', 'errorMessage')

        expect(validationState.type.text).toBe('ValidationState')
        expect(errorMessage.type.text).toBe('string')
        expect(input.members.some(item => item.kind === 'exposes' && item.name.endsWith('.value'))).toBe(false)
    })

    it('识别 Readonly 与 DeepReadonly 包装的 Vue Ref，但保留普通 value 属性对象', () => {
        const fileName = path.join(ROOT, 'packages/ui/scripts/api-docs/extract-ref.fixture.ts')
        const fixture = `
import type { Ref } from 'vue'
type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
declare const readonlyRef: Readonly<Ref<string>>
declare const deepReadonlyRef: DeepReadonly<Ref<string>>
declare const ordinaryObject: { value: string }
`
        const options: ts.CompilerOptions = {
            target: ts.ScriptTarget.Latest,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            strict: true,
            skipLibCheck: true,
            noEmit: true,
        }
        const host = ts.createCompilerHost(options)
        const originalFileExists = host.fileExists.bind(host)
        const originalReadFile = host.readFile.bind(host)
        const originalGetSourceFile = host.getSourceFile.bind(host)
        host.fileExists = file => path.resolve(file) === fileName || originalFileExists(file)
        host.readFile = file => path.resolve(file) === fileName ? fixture : originalReadFile(file)
        host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => path.resolve(file) === fileName
            ? ts.createSourceFile(file, fixture, languageVersion, true, ts.ScriptKind.TS)
            : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile)
        const program = ts.createProgram([fileName], options, host)
        const sourceFile = program.getSourceFile(fileName)
        expect(sourceFile).toBeDefined()
        const declarations = sourceFile!.statements.filter(ts.isVariableStatement)
            .flatMap(statement => [...statement.declarationList.declarations])
        const checker = program.getTypeChecker()
        const type = (name: string): ts.Type => {
            const declaration = declarations.find(item => ts.isIdentifier(item.name) && item.name.text === name)
            expect(declaration, name).toBeDefined()
            return checker.getTypeAtLocation(declaration!)
        }

        expect(isVueRefType(type('readonlyRef'), checker)).toBe(true)
        expect(isVueRefType(type('deepReadonlyRef'), checker)).toBe(true)
        expect(isVueRefType(type('ordinaryObject'), checker)).toBe(false)
    })

    it('提取 Select 的解构默认、model 事件和子插槽', () => {
        const select = extract('Select', 'packages/ui/src/components/select/Select.vue')
        const options = member(select, 'props', 'options')
        const size = member(select, 'props', 'size')

        expect(options.default).toEqual(expect.objectContaining({
            declaration: expect.objectContaining({ kind: 'value', text: '[]' }),
            resolution: { kind: 'resolved', text: '[]' },
        }))
        expect(options.type.references).toContainEqual(expect.objectContaining({ name: 'SelectOption' }))
        const optionReference = options.type.references.find(reference => reference.name === 'SelectOption')
        expect(optionReference?.text).toContain('interface SelectOption {')
        expect(optionReference?.text).toContain('label: string')
        expect(optionReference?.text).toContain('[key: string]: unknown')
        expect(optionReference?.id).not.toContain(ROOT)
        expect(size.type.literals).toEqual(['"default"', '"lg"', '"sm"'])
        expect(member(select, 'events', 'update:modelValue').type.text).toBe('[value: string | undefined]')
        expect(select.members.filter(item => item.kind === 'slots').map(item => item.name)).toEqual(['default', 'trigger'])
    })

    it('提取 DialogContent 的 variant 聯合值', () => {
        const dialog = extract('DialogContent', 'packages/ui/src/components/dialog/DialogContent.vue')
        const size = member(dialog, 'props', 'size')
        const entrance = member(dialog, 'props', 'entrance')

        expect(size.type.literals).toEqual(['"default"', '"full"', '"lg"', '"sm"', '"xl"'])
        expect(entrance.type.literals).toEqual(['"fade-zoom"', '"shutter"'])
    })

    it('保留组件显式声明的 class 属性并过滤 Vue 自动全局属性', () => {
        const button = extract('Button', 'packages/ui/src/components/button/Button.vue')
        const alert = extract('Alert', 'packages/ui/src/components/alert/Alert.vue')

        for (const component of [button, alert]) {
            expect(member(component, 'props', 'class').source.file).toBe(component.source.file)
            expect(component.members.some(item => item.kind === 'props' && ['key', 'ref', 'ref_for', 'ref_key', 'style'].includes(item.name))).toBe(false)
        }
        expect(button.members.filter(item => item.kind === 'events').map(item => item.name)).toEqual([])
        expect(alert.members.filter(item => item.kind === 'events').map(item => item.name)).toEqual(['close'])
    })

    it('静态值评估不会调用工厂之外的业务表达式', () => {
        let calls = 0
        const values = { sideEffect() { calls += 1; return 42 } }
        const sourceFile = ts.createSourceFile(
            'default-expression.ts',
            'const eager = values.sideEffect(); const factory = () => values.sideEffect();',
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        )
        const program = ts.createProgram({ rootNames: [], options: { target: ts.ScriptTarget.Latest } })
        const declarations = sourceFile.statements.filter(ts.isVariableStatement).flatMap(statement => [...statement.declarationList.declarations])
        const eager = declarations.find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === 'eager')!.initializer!
        const factory = declarations.find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === 'factory')!.initializer!

        expect(evaluateStaticExpression(eager, program.getTypeChecker())).toEqual({ kind: 'expression' })
        expect(isFactoryExpression(factory)).toBe(true)
        expect(evaluateFactoryExpression(factory, program.getTypeChecker())).toEqual({ kind: 'expression' })
        expect(calls).toBe(0)
        void values
    })

    it('区分 runtime defineProps 选项、withDefaults 和具名 defineModel 默认值', () => {
        const fileName = path.join(ROOT, 'packages/ui/scripts/api-docs/extract-defaults.fixture.ts')
        const fixture = `
const RUNTIME_DEFAULT = 'runtime-value'
declare function defineProps(value?: unknown): unknown
declare function withDefaults(value: unknown, defaults: Record<string, unknown>): unknown
declare function defineModel(...args: unknown[]): unknown

defineProps({
    title: { type: String, default: RUNTIME_DEFAULT },
    rows: { type: Array, default: () => [1, 2] },
    required: { type: String, required: true },
    dynamic: { type: String, default: createDefault() },
})
withDefaults(defineProps(), { heading: 'heading-default' })
const { count = 3 } = defineProps()
defineModel('query', { default: 'query-default' })
defineModel({ default: 4 })
`
        const options: ts.CompilerOptions = { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.ESNext, noEmit: true }
        const host = ts.createCompilerHost(options)
        const originalFileExists = host.fileExists.bind(host)
        const originalReadFile = host.readFile.bind(host)
        const originalGetSourceFile = host.getSourceFile.bind(host)
        host.fileExists = file => path.resolve(file) === fileName || originalFileExists(file)
        host.readFile = file => path.resolve(file) === fileName ? fixture : originalReadFile(file)
        host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => path.resolve(file) === fileName
            ? ts.createSourceFile(file, fixture, languageVersion, true, ts.ScriptKind.TS)
            : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile)
        const program = ts.createProgram([fileName], options, host)
        const sourceFile = program.getSourceFile(fileName)
        expect(sourceFile).toBeDefined()
        const defaults = collectDefaultExpressions(sourceFile!)
        const checker = program.getTypeChecker()
        const value = (name: string): string => defaults.get(name)!.initializer.getText(sourceFile)

        expect(value('title')).toBe('RUNTIME_DEFAULT')
        expect(evaluateStaticExpression(defaults.get('title')!.initializer, checker)).toEqual({ kind: 'resolved', value: 'runtime-value' })
        expect(value('rows')).toBe('() => [1, 2]')
        expect(evaluateFactoryExpression(defaults.get('rows')!.initializer, checker)).toEqual({ kind: 'resolved', value: [1, 2] })
        expect(defaults.has('required')).toBe(false)
        expect(value('dynamic')).toBe('createDefault()')
        expect(evaluateStaticExpression(defaults.get('dynamic')!.initializer, checker)).toEqual({ kind: 'expression' })
        expect(value('heading')).toBe("'heading-default'")
        expect(value('count')).toBe('3')
        expect(value('query')).toBe("'query-default'")
        expect(value('modelValue')).toBe('4')
    })

    it('保留 DataTable 泛型、nullable 事件、常量工厂預設和嵌套暴露成员', () => {
        const table = extract('DataTable', 'packages/ui/src/components/data-table/DataTable.vue')
        const data = member(table, 'props', 'data')
        const columns = member(table, 'props', 'columns')
        const pageSize = member(table, 'props', 'pageSize')
        const pageSizeOptions = member(table, 'props', 'pageSizeOptions')
        const sort = member(table, 'events', 'sort')
        const select = member(table, 'events', 'select')
        const expandChange = member(table, 'events', 'expand-change')

        expect(data.required).toBe(true)
        expect(data.type.text).toBe('T[]')
        expect(columns.type.text).toBe('DataTableColumn<T>[]')
        expect(columns.type.references).toContainEqual(expect.objectContaining({ name: 'DataTableColumn' }))
        expect(pageSize.default).toEqual(expect.objectContaining({
            declaration: expect.objectContaining({ kind: 'expression', text: 'DEFAULT_PAGE_SIZE' }),
            resolution: { kind: 'resolved', text: '10' },
        }))
        expect(pageSizeOptions.default).toEqual(expect.objectContaining({
            declaration: expect.objectContaining({ kind: 'factory', text: '() => [...DEFAULT_PAGE_SIZE_OPTIONS]' }),
            resolution: { kind: 'resolved', text: '[10, 20, 50, 100]' },
        }))
        expect(sort.type.text).toBe('[column: string, direction: "asc" | "desc" | null]')
        expect(sort.type.literals).toContain('null')
        expect(select.type.text).toBe('[rows: T[]]')
        expect(expandChange.type.text).toBe('[row: T, expanded: boolean]')
        for (const name of ['sort.toggleSort', 'sort.sortState', 'filter.setGlobalFilter', 'selection.clearSelection', 'pagination.setPageSize', 'expand.isRowExpanded']) {
            expect(table.members.some(item => item.kind === 'exposes' && item.name === name), name).toBe(true)
        }
        for (const name of ['sort.sortState', 'filter.filterState', 'selection.selectedRows', 'pagination.pageIndex', 'pagination.pageCount']) {
            expect(member(table, 'exposes', name).readonly, name).toBe(true)
        }
        expect(member(table, 'exposes', 'expand.expandedRowKeys').readonly).toBe(false)
    })
})
