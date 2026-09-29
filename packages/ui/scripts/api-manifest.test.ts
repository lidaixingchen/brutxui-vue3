import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ApiGroup, ApiMember } from '../../../apps/docs/.vitepress/api-types.js'
import type { ApiCatalog } from './api-docs/catalog.js'

const GENERATED_DIRECTORY = path.resolve(__dirname, '../../../apps/docs/.vitepress/api-generated')

function readGeneratedJson<T>(fileName: string): T {
    return JSON.parse(fs.readFileSync(path.join(GENERATED_DIRECTORY, fileName), 'utf8')) as T
}

function readGroup(slug: string, locale: 'zh-CN' | 'en'): ApiGroup {
    return readGeneratedJson<ApiGroup>(`${slug}.${locale}.json`)
}

function findMember(componentName: string, members: ApiMember[], kind: ApiMember['kind'], name: string): ApiMember {
    const member = members.find(item => item.kind === kind && item.name === name)
    if (!member) throw new Error(`${componentName} ${kind}.${name} is missing from generated API data`)
    return member
}

describe('生成的组件 API 分组数据', () => {
    const catalogPath = path.join(GENERATED_DIRECTORY, 'catalog.json')

    it('目录仅为组件页面生成双语分组文件', () => {
        const catalog = readGeneratedJson<ApiCatalog>('catalog.json')
        const pageGroups = catalog.groups.filter(group => group.scope === 'component-page')
        const files = fs.readdirSync(GENERATED_DIRECTORY).filter(file => file.endsWith('.json'))

        expect(catalog.diagnostics).toEqual([])
        expect(fs.existsSync(catalogPath)).toBe(true)
        expect(files).toHaveLength(1 + pageGroups.length * 2)
        for (const group of pageGroups) {
            expect(fs.existsSync(path.join(GENERATED_DIRECTORY, `${group.slug}.zh-CN.json`))).toBe(true)
            expect(fs.existsSync(path.join(GENERATED_DIRECTORY, `${group.slug}.en.json`))).toBe(true)
        }
        for (const group of catalog.groups.filter(item => item.scope === 'block')) {
            expect(fs.existsSync(path.join(GENERATED_DIRECTORY, `${group.slug}.zh-CN.json`))).toBe(false)
            expect(fs.existsSync(path.join(GENERATED_DIRECTORY, `${group.slug}.en.json`))).toBe(false)
        }
    })

    it('Button 分组保留类型默认值并输出独立的中英文语义', () => {
        const chinese = readGroup('button', 'zh-CN')
        const english = readGroup('button', 'en')
        const chineseButton = chinese.components[0]
        const englishButton = english.components[0]
        const chineseVariant = findMember(chineseButton.name, chineseButton.members, 'props', 'variant')
        const englishVariant = findMember(englishButton.name, englishButton.members, 'props', 'variant')

        expect(chinese.locale).toBe('zh-CN')
        expect(english.locale).toBe('en')
        expect(chineseButton.name).toBe('Button')
        expect(englishButton.name).toBe('Button')
        expect(chineseVariant.description).toBe('按钮的主视觉变体，控制配色和交互状态样式')
        expect(englishVariant.description).toBe('Controls the button’s visual variant, including its color and interaction-state styles.')
        expect(chineseVariant.description).not.toBe(englishVariant.description)
        expect(englishVariant.type.literals).toContain('"primary"')
        expect(englishVariant.default?.declaration).toMatchObject({ kind: 'value', text: "'default'" })
        expect(englishVariant.default?.resolution?.text).toBe('"default"')
    })

    it('Alert 主组件排首位且包含真实事件与插槽', () => {
        const group = readGroup('alert', 'en')
        const names = group.components.map(component => component.name)
        const alert = group.components[0]

        expect(names[0]).toBe('Alert')
        expect(names).toEqual(['Alert', 'AlertDescription', 'AlertTitle'])
        expect(alert.members.some(member => member.kind === 'events' && member.name === 'close')).toBe(true)
        expect(alert.members.some(member => member.kind === 'slots' && member.name === 'default')).toBe(true)
        expect(alert.members.some(member => member.kind === 'slots' && member.name === 'actions')).toBe(true)
    })

    it('Dialog 分组以公开主组件 DialogContent 开始', () => {
        const catalog = readGeneratedJson<ApiCatalog>('catalog.json')
        const dialogCatalog = catalog.groups.find(group => group.slug === 'dialog')
        const dialog = readGroup('dialog', 'zh-CN')

        expect(dialogCatalog?.primaryMemberId).toBe('component:dialog/DialogContent')
        expect(dialog.components[0].name).toBe('DialogContent')
        expect(dialog.components.some(component => component.name.includes('TestFixture'))).toBe(false)
    })
})
