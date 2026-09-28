import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ApiContract } from 'brutx-shared-vue/api-contract'
import { COMPONENT_METADATA } from 'brutx-shared-vue'
import { API_CONTRACT } from '../../api-contract.js'
import { collectApiCatalog, serializeApiCatalog } from './catalog.js'

const ROOT = path.resolve(__dirname, '../../../..')

function changeButton(change: (entry: ApiContract['entries'][number]) => ApiContract['entries'][number]): ApiContract {
    return { ...API_CONTRACT, entries: API_CONTRACT.entries.map(entry => entry.id === 'component:button' ? change(entry) : entry) }
}

describe('公开组件文档清单', () => {
    it('全部中英文组件页均能解析到契约，索引页不参与迁移', () => {
        const catalog = collectApiCatalog(ROOT, API_CONTRACT)
        const pages = catalog.groups.flatMap(group => group.pages)
        const expected = ['components', 'en/components'].flatMap(directory => fs.readdirSync(`${ROOT}/apps/docs/${directory}`).filter(file => file.endsWith('.md') && file !== 'index.md').map(file => `apps/docs/${directory}/${file}`))
        expect(pages.map(page => page.file).sort()).toEqual(expected.sort())
        expect(catalog.diagnostics.filter(item => item.ruleId.startsWith('API_PAGE_'))).toEqual([])
    })

    it('复用元信息中的页面别名和组件分类', () => {
        const catalog = collectApiCatalog(ROOT, API_CONTRACT)
        expect(catalog.groups.find(group => group.id === 'component:kanban')?.slug).toBe('kanban-board')
        for (const group of catalog.groups.filter(item => item.scope === 'block')) {
            expect(group.pages).toEqual([])
            expect(COMPONENT_METADATA[group.id.replace('component:', '')].kind).toBe('block')
        }
    })

    it('文档主成员独立于按名称排列的公开导出', () => {
        const dialog = collectApiCatalog(ROOT, API_CONTRACT).groups.find(group => group.id === 'component:dialog')!
        expect(dialog.primaryMemberId).toBe('component:dialog/DialogContent')
        expect(dialog.members[0].name).toBe('DialogContent')
        expect(dialog.members.some(member => member.name === 'DialogRoot')).toBe(false)
    })

    it('保留公开别名的实际来源，不收录仅存在于目录的组件', () => {
        const contract = changeButton(entry => ({ ...entry, exports: entry.exports.map(item => item.publicName === 'Button' ? { ...item, publicName: 'ActionButton' } : item) }))
        const catalog = collectApiCatalog(ROOT, contract)
        const group = catalog.groups.find(item => item.id === 'component:button')!
        expect(group.members.map(member => member.name)).toEqual(['ActionButton'])
        expect(group.members[0].source).toBe('packages/ui/src/components/button/Button.vue')
        expect(catalog.diagnostics.some(item => item.ruleId === 'API_PRIMARY_MEMBER_MISSING' && item.groupId === group.id)).toBe(true)
    })

    it('公开测试夹具产生来源诊断并保留在清单中', () => {
        const contract = changeButton(entry => ({ ...entry, exports: [...entry.exports, { source: '../select/SelectTestFixture.vue', sourceName: 'default', publicName: 'PublicFixture', kind: 'value' }] }))
        const catalog = collectApiCatalog(ROOT, contract)
        const fixture = catalog.groups.find(group => group.id === 'component:button')!.members.find(member => member.name === 'PublicFixture')
        expect(fixture?.classification).toBe('test-fixture')
        expect(catalog.diagnostics).toContainEqual(expect.objectContaining({ ruleId: 'API_PUBLIC_TEST_FIXTURE', member: 'PublicFixture', file: 'packages/ui/src/components/select/SelectTestFixture.vue' }))
    })

    it('缺失公开成员源码时报告准确来源', () => {
        const contract = changeButton(entry => ({ ...entry, exports: [...entry.exports, { source: './Absent.vue', sourceName: 'default', publicName: 'Absent', kind: 'value' }] }))
        expect(collectApiCatalog(ROOT, contract).diagnostics).toContainEqual(expect.objectContaining({ ruleId: 'API_SOURCE_MISSING', file: 'packages/ui/src/components/button/Absent.vue' }))
    })

    it('迁移验收记录按双语页面投影到生成目录', () => {
        const group = collectApiCatalog(ROOT, API_CONTRACT).groups.find(item => item.id === 'component:button')!
        expect(group.pages.every(page => page.presentation === 'component-api' && page.migration === 'complete' && page.pending.length === 0)).toBe(true)
    })

    it('同一输入重复生成具有相同内容', () => {
        expect(serializeApiCatalog(collectApiCatalog(ROOT, API_CONTRACT))).toBe(serializeApiCatalog(collectApiCatalog(ROOT, API_CONTRACT)))
    })
})
