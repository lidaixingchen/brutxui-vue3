import { describe, expect, it } from 'vitest'
import type { ApiComponent, ApiContent, ApiMember } from '../../../../apps/docs/.vitepress/api-types.js'
import { mergeApiContent } from './merge.js'

const COMPONENT_ID = 'component:button/Button'
const COMPONENT_NAME = 'Button'

function buttonComponent(): ApiComponent {
    const member: ApiMember = {
        id: 'api-button-props-variant',
        name: 'variant',
        kind: 'props',
        type: { text: "'default' | 'outline'", literals: ['default', 'outline'], references: [] },
        description: '按钮样式类型。',
        notes: ['源码注释'],
        source: { file: 'packages/ui/src/components/button/Button.vue', line: 12 },
        required: false,
        nullable: false,
        default: { declaration: { kind: 'value', text: "'default'", source: { file: 'packages/ui/src/components/button/Button.vue', line: 18 } } },
    }
    return {
        id: COMPONENT_ID,
        name: 'Button',
        source: { file: 'packages/ui/src/components/button/Button.vue' },
        members: [member],
    }
}

function completeContent(): ApiContent {
    return {
        complete: true,
        members: {
            [COMPONENT_NAME]: {
                props: {
                    variant: {
                        zh: '按钮的外观样式。',
                        en: 'Controls the visual style of the button.',
                        notes: { 'zh-CN': ['支持主题样式。'], en: ['Selects a theme style.'] },
                        fallback: { 'zh-CN': '未设置时使用默认样式。', en: 'Uses the default style when omitted.' },
                    },
                },
            },
        },
    }
}

describe('API 语义合并', () => {
    it('中文覆盖说明使用 zh 语义键', () => {
        expect(mergeApiContent([buttonComponent()], completeContent(), 'zh-CN')[0].members[0].description)
            .toBe('按钮的外观样式。')
    })
    it('只替换当前语言的语义字段并保留提取结构', () => {
        const component = buttonComponent()
        const [merged] = mergeApiContent([component], completeContent(), 'en')
        const member = merged.members[0]

        expect(member.description).toBe('Controls the visual style of the button.')
        expect(member.notes).toEqual(['源码注释', 'Selects a theme style.'])
        expect(member.default?.fallback).toBe('Uses the default style when omitted.')
        expect(member.type).toEqual(component.members[0].type)
        expect(member.required).toBe(component.members[0].required)
        expect(member.default?.declaration).toEqual(component.members[0].default?.declaration)
        expect(member.source).toEqual(component.members[0].source)
    })

    it('缺少语义资源时保留中文源码说明并为英文留空', () => {
        const component = buttonComponent()
        expect(mergeApiContent([component], undefined, 'zh-CN')[0].members[0].description).toBe('按钮样式类型。')
        expect(mergeApiContent([component], undefined, 'en')[0].members[0].description).toBe('')
    })

    it('完整语义必须为每个声明成员提供有效中英文说明', () => {
        const invalid: ApiContent = {
            complete: true,
            members: { [COMPONENT_NAME]: { props: { variant: { zh: '按钮的样式。' } } } },
        }
        expect(() => mergeApiContent([buttonComponent()], invalid, 'zh-CN'))
            .toThrow(`API_CONTENT_INCOMPLETE_MEMBER ${COMPONENT_ID}/props/variant`)
    })

    it('完整性校验接受有效的中文源码说明作为语义资源补充', () => {
        const content: ApiContent = {
            complete: true,
            members: { [COMPONENT_NAME]: { props: { variant: { en: 'Controls the visual style of the button.' } } } },
        }

        expect(mergeApiContent([buttonComponent()], content, 'zh-CN')[0].members[0].description)
            .toBe('按钮样式类型。')
    })

    it.each(['-', 'variant', '   '])('拒绝完整说明中的占位内容 %j', value => {
        const content = completeContent()
        content.members[COMPONENT_NAME].props!.variant!.en = value
        expect(() => mergeApiContent([buttonComponent()], content, 'en'))
            .toThrow(`API_CONTENT_INCOMPLETE_MEMBER ${COMPONENT_ID}/props/variant`)
    })

    it('拒绝失效的组件和成员语义键', () => {
        expect(() => mergeApiContent([buttonComponent()], {
            complete: false,
            members: { Missing: {} },
        }, 'zh-CN')).toThrow('API_CONTENT_COMPONENT_UNKNOWN Missing')

        expect(() => mergeApiContent([buttonComponent()], {
            complete: false,
            members: { [COMPONENT_NAME]: { props: { absent: { zh: '不存在的属性' } } } },
        }, 'zh-CN')).toThrow(`API_CONTENT_MEMBER_UNKNOWN ${COMPONENT_ID}/props/absent`)
    })

    it('拒绝语义资源覆盖类型等结构字段', () => {
        const content = completeContent()
        const semantic = content.members[COMPONENT_NAME].props!.variant! as typeof content.members[string]['props'][string] & { type: string }
        semantic.type = 'string'
        expect(() => mergeApiContent([buttonComponent()], content, 'zh-CN'))
            .toThrow(`API_CONTENT_STRUCTURAL_OVERRIDE ${COMPONENT_NAME}/props/variant.type`)
    })

    it('追加带来源的补充成员，并按语言选择说明', () => {
        const content = completeContent()
        content.supplements = {
            [COMPONENT_NAME]: [{
                name: 'native-click',
                kind: 'events',
                type: 'MouseEvent',
                source: { file: 'packages/ui/src/components/button/Button.vue', line: 42 },
                origin: 'fallthrough',
                description: { 'zh-CN': '原生点击事件。', en: 'The native click event.' },
            }],
        }
        const [merged] = mergeApiContent([buttonComponent()], content, 'en')
        const supplement = merged.members[1]

        expect(supplement).toMatchObject({
            id: 'api-component_3Abutton_2FButton-events-native_2Dclick',
            name: 'native-click',
            kind: 'events',
            description: 'The native click event.',
            source: { file: 'packages/ui/src/components/button/Button.vue', line: 42 },
            origin: 'fallthrough',
        })
        expect(supplement.type).toEqual({ text: 'MouseEvent', literals: [], references: [] })
    })

    it('完整资源要求补充成员具有双语说明并拒绝无效补充键', () => {
        const missingTranslation = completeContent()
        missingTranslation.supplements = {
            [COMPONENT_NAME]: [{
                name: 'native-click',
                kind: 'events',
                type: 'MouseEvent',
                source: { file: 'packages/ui/src/components/button/Button.vue' },
                origin: 'fallthrough',
                description: { 'zh-CN': '原生点击事件。', en: '' },
            }],
        }
        expect(() => mergeApiContent([buttonComponent()], missingTranslation, 'zh-CN'))
            .toThrow(`API_CONTENT_INCOMPLETE_SUPPLEMENT ${COMPONENT_ID}/events/native-click`)

        expect(() => mergeApiContent([buttonComponent()], {
            complete: false,
            members: {},
            supplements: { Missing: [] },
        }, 'zh-CN')).toThrow('API_CONTENT_SUPPLEMENT_COMPONENT_UNKNOWN Missing')
    })
})
