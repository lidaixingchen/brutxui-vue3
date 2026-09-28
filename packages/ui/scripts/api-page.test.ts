import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMarkdownRenderer, disposeMdItInstance } from '../../../apps/docs/node_modules/vitepress/dist/node/index.js'
import { createApiPagePlugin, createApiPageSearchOptions } from '../../../apps/docs/.vitepress/api-page'

interface ApiPageTestEnvironment extends Record<string, unknown> {
    path: string
    relativePath: string
    cleanUrls: boolean
    frontmatter?: Record<string, unknown>
    sfcBlocks?: {
        scripts: Array<{ content: string; contentStripped: string; tagOpen: string; tagClose: string }>
        scriptSetup: { content: string; contentStripped: string; tagOpen: string; tagClose: string } | null
    }
}

const catalog = {
    groups: [
        {
            id: 'component:button',
            slug: 'button',
            scope: 'component-page',
            members: [
                { id: 'component:button/Button', name: 'Button' },
                { id: 'component:button/ButtonGroup', name: 'ButtonGroup' },
            ],
        },
    ],
}

let temporaryRoot = ''
let docsRoot = ''
let generatedDir = ''
let catalogPath = ''
let pluginOptions: { catalogPath: string; generatedDir: string; docsRoot: string }

describe('VitePress 组件 API 页面编译与搜索', () => {
    beforeEach(async () => {
        temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-api-page-'))
        docsRoot = path.join(temporaryRoot, 'apps', 'docs')
        generatedDir = path.join(docsRoot, '.vitepress', 'api-generated')
        catalogPath = path.join(generatedDir, 'catalog.json')
        fs.mkdirSync(path.join(docsRoot, 'components'), { recursive: true })
        fs.mkdirSync(path.join(docsRoot, 'en', 'components'), { recursive: true })
        fs.mkdirSync(generatedDir, { recursive: true })
        fs.writeFileSync(catalogPath, JSON.stringify(catalog))
        writeGroup('zh-CN', '按钮标签')
        writeGroup('en', 'Button label')
        await disposeMdItInstance()
    })

    afterEach(() => {
        fs.rmSync(temporaryRoot, { recursive: true, force: true })
    })

    it('只把真实 Markdown 组件调用绑定到本页生成数据', async () => {
        const md = await createRenderer()
        const env = createEnvironment('components/button.md')
        const source = [
            '```vue',
            '<ComponentApi :name="missing" />',
            '```',
            '`<ComponentApi name="missing" />`',
            '<!-- <ComponentApi name="missing" /> -->',
            '',
            '<ComponentApi name="button" />',
        ].join('\n')
        md.render(source, env)
        md.render(source, env)

        expect(env.sfcBlocks?.scriptSetup?.content).toContain('import __brutxApiGroup0 from "../.vitepress/api-generated/button.zh-CN.json"')
        expect(env.sfcBlocks?.scriptSetup?.contentStripped).toContain('__brutxApiGroup0')
        expect(env.sfcBlocks?.scriptSetup?.contentStripped.match(/import __brutxApiGroup0/gu)).toHaveLength(1)
    })

    it('静态导入按页面相对路径和当前语言解析', async () => {
        const md = await createRenderer()
        const zhEnvironment = createEnvironment('components/button.md')
        const enEnvironment = createEnvironment('en/components/button.md')
        md.render('<ComponentApi name="button" />', zhEnvironment)
        await disposeMdItInstance()
        const enMd = await createRenderer()
        enMd.render('<ComponentApi name="button" />', enEnvironment)

        expect(zhEnvironment.sfcBlocks?.scriptSetup?.content).toContain('../.vitepress/api-generated/button.zh-CN.json')
        expect(enEnvironment.sfcBlocks?.scriptSetup?.content).toContain('../../.vitepress/api-generated/button.en.json')
    })

    it('未知组、未知子组件和动态范围参数给出源码位置', async () => {
        const md = await createRenderer()

        expect(() => md.render(['# 组件', '', '<ComponentApi name="missing" />'].join('\n'), createEnvironment('components/button.md')))
            .toThrow(/apps\/docs\/components\/button\.md:3:\d+ \[API_CALL_GROUP_UNKNOWN\]/u)
        await disposeMdItInstance()

        const secondMd = await createRenderer()
        expect(() => secondMd.render('<ComponentApi name="button" subcomponent="Ghost" />', createEnvironment('components/button.md')))
            .toThrow(/\[API_CALL_SUBCOMPONENT_UNKNOWN\]/u)
        await disposeMdItInstance()

        const thirdMd = await createRenderer()
        expect(() => thirdMd.render('<ComponentApi :name="group" />', createEnvironment('components/button.md')))
            .toThrow(/\[API_CALL_DYNAMIC_PARAMETER\]/u)

        await disposeMdItInstance()
        const fourthMd = await createRenderer()
        expect(() => fourthMd.render('<ComponentApi name="button" :subcomponent="section" />', createEnvironment('components/button.md')))
            .toThrow(/\[API_CALL_DYNAMIC_PARAMETER\]/u)
    })

    it('本页生成数据缺失时使用组件调用位置报告错误', async () => {
        const md = await createRenderer()
        fs.rmSync(path.join(generatedDir, 'button.zh-CN.json'))

        expect(() => md.render('<ComponentApi name="button" />', createEnvironment('components/button.md')))
            .toThrow(/apps\/docs\/components\/button\.md:1:1 \[API_DATA_UNAVAILABLE\]/u)
    })

    it('固定子组件范围只将该成员投影到搜索索引', async () => {
        const md = await createRenderer()
        const search = createApiPageSearchOptions(pluginOptions)
        const html = search._render(
            '<ComponentApi name="button" subcomponent="ButtonGroup" />',
            createEnvironment('components/button.md'),
            md,
        )

        expect(html).toContain('groupLabel')
        expect(html).not.toContain('modelValue')
        expect(html).toContain('component%3Abutton%2FButtonGroup')
    })

    it('不索引 search=false 的 API 调用，也遵循页面级 search:false', async () => {
        const md = await createRenderer()
        const search = createApiPageSearchOptions(pluginOptions)
        const callHtml = search._render('<ComponentApi name="button" search="false" />', createEnvironment('components/button.md'), md)
        expect(callHtml).not.toContain('modelValue')
        expect(callHtml).not.toContain('search=')

        const pageHtml = search._render(
            ['---', 'search: false', '---', '', '# 不加入索引', '', '<ComponentApi name="button" />'].join('\n'),
            createEnvironment('components/button.md'),
            md,
        )
        expect(pageHtml).toBe('')
    })

    it('在调用位置替换搜索投影，并只补页面缺少的旧分类锚点', async () => {
        const md = await createRenderer()
        const search = createApiPageSearchOptions(pluginOptions)
        const source = [
            '# 页面',
            '',
            '<ComponentApi name="button" />',
            '',
            '## 页面结尾',
        ].join('\n')
        const html = search._render(source, createEnvironment('components/button.md'), md)

        expect(html.indexOf('modelValue')).toBeLessThan(html.indexOf('页面结尾'))
        expect(html).toContain('href="#api-component%3Abutton%2FButton-props-modelValue"')
        expect(html).not.toMatch(/页面结尾[\s\S]*modelValue/u)

        await disposeMdItInstance()
        const renderMd = await createRenderer()
        const pageHtml = renderMd.render([
            '# 页面',
            '',
            '<ComponentApi name="button" instance="first" />',
            '',
            '## 页面结尾',
            '',
            '<ComponentApi name="button" instance="second" />',
        ].join('\n'), createEnvironment('components/button.md'))
        expect(pageHtml.match(/id="props"/gu)).toHaveLength(1)
        expect(pageHtml.match(/id="events"/gu)).toHaveLength(1)
        expect(pageHtml.match(/id="slots"/gu)).toHaveLength(1)
        expect(pageHtml.match(/id="exposes"/gu)).toHaveLength(1)
        expect(pageHtml).toContain('instance="first"')
        expect(pageHtml).toContain('instance="second"')

        await disposeMdItInstance()
        const enMd = await createRenderer()
        const enHtml = enMd.render(
            '## API Reference\n\n<ComponentApi name="button" instance="first" />\n\n<ComponentApi name="button" instance="second" />',
            createEnvironment('en/components/button.md'),
        )
        for (const id of ['props', 'events', 'slots', 'exposes']) {
            expect(enHtml.match(new RegExp(`id="${id}"`, 'gu'))).toHaveLength(1)
        }
    })

    it('保留正文已有分类锚点且拒绝冲突的成员锚点', async () => {
        const md = await createRenderer()
        const html = md.render('## Props\n\n<ComponentApi name="button" />', createEnvironment('components/button.md'))
        expect(html.match(/id="props"/gu)).toHaveLength(1)

        await disposeMdItInstance()
        const collisionMd = await createRenderer()
        expect(() => collisionMd.render(
            '<a id="api-component%3Abutton%2FButton-props-modelValue"></a>\n\n<ComponentApi name="button" />',
            createEnvironment('components/button.md'),
        )).toThrow(/\[API_PAGE_ANCHOR_DUPLICATE\]/u)
    })

    it('搜索投影使用页面语言和展示成员锚点，重复调用要求 instance', async () => {
        const md = await createRenderer()
        const search = createApiPageSearchOptions(pluginOptions)
        const zhHtml = search._render(
            '<ComponentApi name="button" instance="first" />\n\n<ComponentApi name="button" instance="second" />',
            createEnvironment('components/button.md'),
            md,
        )
        expect(zhHtml).toContain('按钮标签')
        expect(zhHtml).toContain('href="#first-api-component%3Abutton%2FButton-props-modelValue"')
        expect(zhHtml).toContain('href="#second-api-component%3Abutton%2FButton-props-modelValue"')

        const enHtml = search._render(
            '<ComponentApi name="button" instance="first" />\n\n<ComponentApi name="button" instance="second" />',
            createEnvironment('en/components/button.md'),
            md,
        )

        expect(enHtml).toContain('Button label')
        expect(enHtml).not.toContain('按钮标签')
        expect(enHtml).toContain('href="#first-api-component%3Abutton%2FButton-props-modelValue"')
        expect(enHtml).toContain('href="#second-api-component%3Abutton%2FButton-props-modelValue"')
        expect(enHtml.match(/<script setup/gu)).toBeNull()

        await disposeMdItInstance()
        const duplicateMd = await createRenderer()
        expect(() => duplicateMd.render(
            '<ComponentApi name="button" />\n\n<ComponentApi name="button" />',
            createEnvironment('components/button.md'),
        )).toThrow(/\[API_CALL_INSTANCE_REQUIRED\]/u)

        await disposeMdItInstance()
        const sameInstanceMd = await createRenderer()
        expect(() => sameInstanceMd.render(
            '<ComponentApi name="button" instance="repeat" />\n\n<ComponentApi name="button" instance="repeat" />',
            createEnvironment('components/button.md'),
        )).toThrow(/\[API_CALL_INSTANCE_DUPLICATE\]/u)

        const generatedPath = path.join(generatedDir, 'button.zh-CN.json')
        const data = JSON.parse(fs.readFileSync(generatedPath, 'utf8'))
        data.components[1].members[0].id = data.components[0].members[0].id
        fs.writeFileSync(generatedPath, JSON.stringify(data))
        await disposeMdItInstance()
        const duplicateMemberMd = await createRenderer()
        expect(() => duplicateMemberMd.render('<ComponentApi name="button" />', createEnvironment('components/button.md')))
            .toThrow(/\[API_DATA_MEMBER_ID_DUPLICATE\]/u)
    })
})

async function createRenderer() {
    pluginOptions = { catalogPath, generatedDir, docsRoot }
    return createMarkdownRenderer(docsRoot, { config: createApiPagePlugin(pluginOptions) }, '/', console)
}

function createEnvironment(relativePath: string): ApiPageTestEnvironment {
    return {
        path: path.join(docsRoot, relativePath),
        relativePath,
        cleanUrls: false,
    }
}

function writeGroup(locale: 'zh-CN' | 'en', buttonDescription: string): void {
    const group = {
        id: 'component:button',
        name: 'button',
        locale,
        components: [
            {
                id: 'component:button/Button',
                name: 'Button',
                source: { file: 'packages/ui/src/components/button/Button.vue' },
                members: [
                    {
                        id: 'api-component%3Abutton%2FButton-props-modelValue',
                        name: 'modelValue',
                        kind: 'props',
                        type: { text: 'string', literals: [], references: [] },
                        description: buttonDescription,
                        notes: [],
                        source: { file: 'Button.vue' },
                    },
                ],
            },
            {
                id: 'component:button/ButtonGroup',
                name: 'ButtonGroup',
                source: { file: 'packages/ui/src/components/button/ButtonGroup.vue' },
                members: [
                    {
                        id: 'api-component%3Abutton%2FButtonGroup-props-groupLabel',
                        name: 'groupLabel',
                        kind: 'props',
                        type: { text: 'string', literals: [], references: [] },
                        description: '分组标签',
                        notes: [],
                        source: { file: 'ButtonGroup.vue' },
                    },
                ],
            },
        ],
    }
    fs.writeFileSync(path.join(generatedDir, `button.${locale}.json`), JSON.stringify(group))
}
