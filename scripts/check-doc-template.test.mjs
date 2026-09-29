import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { runDocTemplateCheck } from './check-doc-template.mjs'

test('章节检查使用组件 API 解析器识别真实调用并验证完整双语数据', async () => {
  const fixture = createFixture({ complete: true })
  try {
    writePage(fixture, 'components/demo.md', `## 预览\n<ComponentPreview />\n\n## 安装\n<InstallationTabs componentName="demo" />\n\n## 用法\n用法说明。\n\n\`\`\`vue\n<ComponentApi name="missing" />\n\`\`\`\n\n## API 参考\n<ComponentApi name="demo" />\n\n## 可访问性\n键盘可操作。`)
    writePage(fixture, 'en/components/demo.md', `## Demo\n<ComponentPreview />\n\n## Installation\n<InstallationTabs componentName="demo" />\n\n## Usage\nExample.\n\n\`\`\`vue\n<ComponentApi name="missing" />\n\`\`\`\n\n## API Reference\n<ComponentApi name="demo" />\n\n## Accessibility\nKeyboard accessible.`)

    const result = await runDocTemplateCheck({ root: fixture.root })
    assert.deepEqual(result.diagnostics, [])
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('完整 API 页拒绝动态调用参数并报告解析位置', async () => {
  const fixture = createFixture({ complete: true })
  try {
    writePage(fixture, 'components/demo.md', `## 预览\n<ComponentPreview />\n\n## 安装\n<InstallationTabs componentName="demo" />\n\n## 用法\n说明。\n\n## API 参考\n<ComponentApi :name="group" />\n\n## 可访问性\n说明。`)
    writePage(fixture, 'en/components/demo.md', `## Demo\n<ComponentPreview />\n\n## Installation\n<InstallationTabs componentName="demo" />\n\n## Usage\nExample.\n\n## API Reference\n<ComponentApi name="demo" />\n\n## Accessibility\nKeyboard accessible.`)

    const result = await runDocTemplateCheck({ root: fixture.root })
    const error = result.diagnostics.find(item => item.ruleId === 'API_CALL_DYNAMIC_PARAMETER')
    assert.ok(error)
    assert.equal(error.file, 'apps/docs/components/demo.md')
    assert.equal(error.line, 11)
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('未迁移的旧页面继续允许手写 Props 表格', async () => {
  const fixture = createFixture({ complete: false, presentation: 'manual' })
  try {
    writePage(fixture, 'components/demo.md', `## 预览\n<ComponentPreview />\n\n## 安装\n<InstallationTabs componentName="demo" />\n\n## 用法\n说明。\n\n## Props\n\n| 属性 | 类型 | 说明 |\n| --- | --- | --- |\n| value | string | 值 |\n\n## 可访问性\n说明。`)
    writePage(fixture, 'en/components/demo.md', `## Preview\n<ComponentPreview />\n\n## Installation\n<InstallationTabs componentName="demo" />\n\n## Usage\nExample.\n\n## Props\n\n| Property | Type | Description |\n| --- | --- | --- |\n| value | string | Value |\n\n## Accessibility\nKeyboard accessible.`)

    const result = await runDocTemplateCheck({ root: fixture.root })
    assert.deepEqual(result.diagnostics, [])
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('已迁移组件页要求真实 API 调用并报告重复成员表格的行位置', async () => {
  const fixture = createFixture({ complete: true })
  try {
    writePage(fixture, 'components/demo.md', [
      '## 预览', '<ComponentPreview />', '',
      '## 安装', '<InstallationTabs componentName="demo" />', '',
      '## 用法', '用法说明。', '',
      '## API 参考', '仅有标题和手工表格不能代替组件 API 调用。', '',
      '## Props', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | 值 |', '',
      '## 可访问性', '键盘可操作。',
    ].join('\n'))
    writePage(fixture, 'en/components/demo.md', [
      '## Demo', '<ComponentPreview />', '',
      '## Installation', '<InstallationTabs componentName="demo" />', '',
      '## Usage', 'Example.', '',
      '## API Reference', 'The heading and hand-written table do not replace the component API call.', '',
      '## Props', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | Value |', '',
      '## Accessibility', 'Keyboard accessible.',
    ].join('\n'))

    const result = await runDocTemplateCheck({ root: fixture.root })
    for (const file of ['apps/docs/components/demo.md', 'apps/docs/en/components/demo.md']) {
      assert.ok(result.diagnostics.some(item => item.file === file && item.ruleId === 'doc-template/missing-component-api'))
      const duplicate = result.diagnostics.find(item => item.file === file && item.ruleId === 'doc-template/api-member-table-duplicate')
      assert.ok(duplicate)
      assert.equal(duplicate.line, 16)
    }
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('已迁移页面保留数据类型、组合式函数与 Reka 原语表格', async () => {
  const fixture = createFixture({ complete: true })
  try {
    const page = (locale, apiCall) => locale === 'en' ? [
      '## Demo', '<ComponentPreview />', '',
      '## Installation', '<InstallationTabs componentName="demo" />', '',
      '## Usage', 'Example.', '',
      '## API Reference', apiCall, '',
      '## Data Types', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | Domain field |', '',
      '## Composables', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | Composable result |', '',
      '## Reka UI Primitives', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | Primitive field |', '',
      '## Texture & Decoration', '| Prop | Values | Description |', '| --- | --- | --- |', '| `value` | `plain` / `striped` | Value variants |', '',
      '## Functional API', '### showDemo', '| Parameter | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | Function option |', '',
      '## API Composition', '### DemoPrimitive', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | External primitive prop |', '',
      '## Accessibility', 'Keyboard accessible.',
    ].join('\n') : [
      '## 预览', '<ComponentPreview />', '',
      '## 安装', '<InstallationTabs componentName="demo" />', '',
      '## 用法', '示例。', '',
      '## API 参考', apiCall, '',
      '## 数据类型', '| 属性 | 类型 | 说明 |', '| --- | --- | --- |', '| `value` | `string` | 业务字段 |', '',
      '## 组合式函数', '| 属性 | 类型 | 说明 |', '| --- | --- | --- |', '| `value` | `string` | 组合式返回值 |', '',
      '## Reka UI 原语', '| 属性 | 类型 | 说明 |', '| --- | --- | --- |', '| `value` | `string` | 原语字段 |', '',
      '## 纹理与装饰', '| 属性 | 值 | 说明 |', '| --- | --- | --- |', '| `value` | `plain` / `striped` | 值变体 |', '',
      '## 函数式 API', '### showDemo', '| 参数 | 类型 | 说明 |', '| --- | --- | --- |', '| `value` | `string` | 函数选项 |', '',
      '## API 组成', '### DemoPrimitive', '| 属性 | 类型 | 说明 |', '| --- | --- | --- |', '| `value` | `string` | 外部原语属性 |', '',
      '## 可访问性', '键盘可操作。',
    ].join('\n')
    writePage(fixture, 'components/demo.md', page('zh', '<ComponentApi name="demo" />'))
    writePage(fixture, 'en/components/demo.md', page('en', '<ComponentApi name="demo" />'))

    const result = await runDocTemplateCheck({ root: fixture.root })
    assert.deepEqual(result.diagnostics, [])
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('已迁移页面的中英文静态组件范围必须镜像', async () => {
  const fixture = createFixture({ complete: true })
  try {
    writePage(fixture, 'components/demo.md', `## 预览\n<ComponentPreview />\n\n## 安装\n<InstallationTabs componentName="demo" />\n\n## 用法\n示例。\n\n## API 参考\n<ComponentApi name="demo" subcomponent="Demo" />\n\n## 可访问性\n说明。`)
    writePage(fixture, 'en/components/demo.md', `## Demo\n<ComponentPreview />\n\n## Installation\n<InstallationTabs componentName="demo" />\n\n## Usage\nExample.\n\n## API Reference\n<ComponentApi name="demo" subcomponent="DemoExtra" />\n\n## Accessibility\nKeyboard accessible.`)

    const result = await runDocTemplateCheck({ root: fixture.root })
    assert.ok(result.diagnostics.some(item => item.ruleId === 'doc-template/api-bilingual-scope'))
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('函数式 API 页面要求匹配的真实 API 表并拒绝组件成员面板', async () => {
  const fixture = createFixture({
    complete: true,
    presentation: 'functional-api',
    scope: 'functional-page',
    functionalApi: { entry: 'useDemo', members: ['show'] },
  })
  try {
    writePage(fixture, 'components/demo.md', [
      '## 预览', '<ComponentPreview />', '',
      '## 安装', '<InstallationTabs componentName="demo" />', '',
      '## 用法', '示例。', '',
      '## API 参考', '公开入口为 `useDemo()`。', '',
      '## 组合式函数', '### useDemo', '| 方法 | 参数 | 说明 |', '| --- | --- | --- |', '| `show` | `options` | 显示提示 |', '',
      '## 可访问性', '键盘可操作。',
    ].join('\n'))
    writePage(fixture, 'en/components/demo.md', [
      '## Demo', '<ComponentPreview />', '',
      '## Installation', '<InstallationTabs componentName="demo" />', '',
      '## Usage', 'Example.', '',
      '## API Reference', 'The public entry is `useDemo()`. ', '',
      '## Composables', '### useDemo', '| Method | Parameters | Description |', '| --- | --- | --- |', '| `show` | `options` | Show a notification |', '',
      '## Accessibility', 'Keyboard accessible.',
    ].join('\n'))

    const valid = await runDocTemplateCheck({ root: fixture.root })
    assert.deepEqual(valid.diagnostics, [])

    writePage(fixture, 'components/demo.md', [
      '## 预览', '<ComponentPreview />', '',
      '## 安装', '<InstallationTabs componentName="demo" />', '',
      '## 用法', '示例。', '',
      '## API 参考', '<ComponentApi name="demo" />', '',
      '## 组合式函数', '### useDemo', '| 方法 | 参数 | 说明 |', '| --- | --- | --- |', '| `show` | `options` | 显示提示 |', '',
      '## 可访问性', '键盘可操作。',
    ].join('\n'))
    const invalid = await runDocTemplateCheck({ root: fixture.root })
    assert.ok(invalid.diagnostics.some(item => item.file === 'apps/docs/components/demo.md' && item.ruleId === 'API_CALL_FUNCTIONAL_GROUP'))
    assert.ok(invalid.diagnostics.some(item => item.file === 'apps/docs/components/demo.md' && item.ruleId === 'doc-template/missing-functional-api'))
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('Markdown token 表格诊断忽略注释与嵌套标签文本并保留真实成员行', async () => {
  const fixture = createFixture({ complete: true })
  try {
    const page = locale => [
      locale === 'en' ? '## Demo' : '## 预览', '<ComponentPreview />', '',
      locale === 'en' ? '## Installation' : '## 安装', '<InstallationTabs componentName="demo" />', '',
      locale === 'en' ? '## Usage' : '## 用法', 'Example.', '',
      locale === 'en' ? '## API Reference' : '## API 参考', '<!-- <ComponentApi name="missing" /> -->', '<ComponentApi name="demo" />', '',
      locale === 'en' ? '## Props' : '## Props',
      '<!--', '| Prop | Type | Description |', '| --- | --- | --- |', '| `value` | `string` | commented row |', '-->',
      '| Prop | Type | Description |', '| --- | --- | --- |', '| <span><b>val</b></span>ue | `string` | markup text must not become a member name |', '| `value` | `string` | visible duplicate |', '',
      locale === 'en' ? '## Accessibility' : '## 可访问性', 'Keyboard accessible.',
    ].join('\n')
    writePage(fixture, 'components/demo.md', page('zh'))
    writePage(fixture, 'en/components/demo.md', page('en'))

    const result = await runDocTemplateCheck({ root: fixture.root })
    const duplicates = result.diagnostics.filter(item => item.ruleId === 'doc-template/api-member-table-duplicate')
    assert.equal(duplicates.length, 2)
    assert.deepEqual(duplicates.map(item => item.line), [23, 23])
    assert.equal(result.diagnostics.some(item => item.ruleId === 'API_CALL_GROUP_UNKNOWN'), false)
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('区块文档继续使用手写 API 章节且不进入组件迁移门禁', async () => {
  const fixture = createFixture({ complete: false, scope: 'block' })
  try {
    writePage(fixture, 'blocks/demo.md', `## 预览\n<ComponentPreview />\n\n## 安装\n<InstallationTabs componentName="demo" />\n\n## 用法\n说明。\n\n## Props\n| 属性 | 类型 | 说明 |\n| --- | --- | --- |\n| value | string | 值 |\n\n## 可访问性\n说明。`)
    writePage(fixture, 'en/blocks/demo.md', `## Preview\n<ComponentPreview />\n\n## Installation\n<InstallationTabs componentName="demo" />\n\n## Usage\nExample.\n\n## Props\n| Property | Type | Description |\n| --- | --- | --- |\n| value | string | Value |\n\n## Accessibility\nKeyboard accessible.`)

    const result = await runDocTemplateCheck({ root: fixture.root })
    assert.deepEqual(result.diagnostics, [])
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

function createFixture({ complete, presentation = 'component-api', scope = 'component-page', functionalApi }) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'brutx-doc-template-'))
  const docsRoot = path.join(root, 'apps', 'docs')
  const generatedDir = path.join(docsRoot, '.vitepress', 'api-generated')
  const contentDir = path.join(docsRoot, '.vitepress', 'api-content')
  mkdirSync(path.join(docsRoot, 'components'), { recursive: true })
  mkdirSync(path.join(docsRoot, 'en', 'components'), { recursive: true })
  mkdirSync(path.join(docsRoot, 'blocks'), { recursive: true })
  mkdirSync(path.join(docsRoot, 'en', 'blocks'), { recursive: true })
  mkdirSync(generatedDir, { recursive: true })
  mkdirSync(contentDir, { recursive: true })
  if (scope !== 'functional-page') {
    writeFileSync(path.join(contentDir, 'demo.ts'), `export default { complete: ${complete} }\n`)
  }
  writeFileSync(path.join(generatedDir, 'catalog.json'), JSON.stringify({
    version: 1,
    groups: [{
      id: 'component:demo',
      slug: 'demo',
      scope,
      ...(functionalApi ? { functionalApi } : {}),
      members: [
        { id: 'component:demo/Demo', name: 'Demo' },
        { id: 'component:demo/DemoExtra', name: 'DemoExtra' },
      ],
      pages: [
        { locale: 'zh-CN', file: `apps/docs/${scope === 'block' ? 'blocks' : 'components'}/demo.md`, presentation, migration: ['component-api', 'functional-api'].includes(presentation) ? 'complete' : 'pending' },
        { locale: 'en', file: `apps/docs/en/${scope === 'block' ? 'blocks' : 'components'}/demo.md`, presentation, migration: ['component-api', 'functional-api'].includes(presentation) ? 'complete' : 'pending' },
      ],
    }],
  }))

  for (const locale of ['zh-CN', 'en']) {
    writeFileSync(path.join(generatedDir, `demo.${locale}.json`), JSON.stringify({
      id: 'component:demo',
      name: 'demo',
      locale,
      components: [
        {
          id: 'component:demo/Demo',
          name: 'Demo',
          source: { file: 'packages/ui/src/components/demo/Demo.vue' },
          members: [{
            id: 'api-component%3Ademo%2FDemo-props-value',
            name: 'value',
            kind: 'props',
            type: { text: 'string', literals: [], references: [] },
            description: locale === 'en' ? 'The value.' : '数据值。',
            notes: [],
            source: { file: 'Demo.vue' },
          }],
        },
        {
          id: 'component:demo/DemoExtra',
          name: 'DemoExtra',
          source: { file: 'packages/ui/src/components/demo/DemoExtra.vue' },
          members: [{
            id: 'api-component%3Ademo%2FDemoExtra-props-label',
            name: 'label',
            kind: 'props',
            type: { text: 'string', literals: [], references: [] },
            description: locale === 'en' ? 'The label.' : '标签。',
            notes: [],
            source: { file: 'DemoExtra.vue' },
          }],
        },
      ],
    }))
  }

  return { root }
}

function writePage(fixture, relativeFile, content) {
  const filePath = path.join(fixture.root, 'apps', 'docs', relativeFile)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
}
