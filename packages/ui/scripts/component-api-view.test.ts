import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { apiMemberId, type ApiGroup } from '../../../apps/docs/.vitepress/api-types'
import { getApiTypeReferenceAnchorId } from '../../../apps/docs/.vitepress/theme/components/component-api-view'

import ComponentApi from '../../../apps/docs/.vitepress/theme/components/ComponentApi.vue'

const apiData: ApiGroup = {
    id: 'component:button',
    name: 'Button',
    locale: 'zh-CN',
    components: [
        {
            id: 'component:button/Button',
            name: 'Button',
            source: { file: 'packages/ui/src/components/button/Button.vue' },
            members: [
                {
                    id: apiMemberId('component:button/Button', 'props', 'variant'),
                    name: 'variant',
                    kind: 'props',
                    type: {
                        text: "'default' | 'primary' | 'outline'",
                        literals: ["'default'", "'primary'", "'outline'"],
                        references: [{ name: 'ButtonVariant', text: "export type ButtonVariant = 'default' | 'primary' | 'outline'", id: 'type-button-variant' }],
                    },
                    description: '<img src=x onerror=alert(1)> 使用 `variant`\n[按钮变体](https://example.com) [不安全链接](javascript:alert(1))',
                    notes: ['运行时回退到 primary。'],
                    source: { file: 'packages/ui/src/components/button/Button.vue', line: 12 },
                    required: false,
                    nullable: false,
                    default: {
                        declaration: { kind: 'expression', text: "'primary'", source: { file: 'packages/ui/src/components/button/Button.vue', line: 42 } },
                        resolution: { kind: 'resolved', text: "'primary'" },
                        fallback: "'default'",
                    },
                },
                {
                    id: apiMemberId('component:button/Button', 'events', 'click'),
                    name: 'click',
                    kind: 'events',
                    type: { text: '(event: MouseEvent) => void', literals: [], references: [] },
                    description: '触发点击回调',
                    notes: [],
                    source: { file: 'packages/ui/src/components/button/Button.vue' },
                },
            ],
        },
        {
            id: 'component:button/ButtonGroup',
            name: 'ButtonGroup',
            source: { file: 'packages/ui/src/components/button/ButtonGroup.vue' },
            members: [
                {
                    id: apiMemberId('component:button/ButtonGroup', 'props', 'orientation'),
                    name: 'orientation',
                    kind: 'props',
                    type: { text: "'horizontal' | 'vertical'", literals: ["'horizontal'", "'vertical'"], references: [] },
                    description: '设置排列方向。',
                    notes: [],
                    source: { file: 'packages/ui/src/components/button/ButtonGroup.vue' },
                    required: false,
                    default: { declaration: { kind: 'absent' } },
                },
            ],
        },
    ],
}

describe('ComponentApi 展示', () => {
    it('SSR 输出完整分类、稳定锚点、默认值、说明与类型引用', async () => {
        const html = await renderToString(createSSRApp(ComponentApi, {
            name: 'button',
            data: apiData,
            instance: 'primary',
            defaultTab: 'events',
        }))

        expect(html).toContain('primary-api-component_3Abutton_2FButton-props-variant')
        expect(html).toContain('primary-api-component_3Abutton_2FButton-events-click')
        expect(html).toContain('primary')
        expect(html).toContain('运行时回退')
        expect(html).toContain('运行时回退到 primary。')
        expect(html).toContain('ButtonVariant')
        expect(html).toContain('事件')
        expect(html).toContain('属性')
        expect(html).not.toMatch(/<img\b/i)
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
        expect(html).toContain('https://example.com')
        expect(html).not.toContain('href="javascript:alert(1)"')
    })

    it('解析安全编码的成员锚点并优先显示目标分类', async () => {
        const originalUrl = window.location.href
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
        const memberId = apiData.components[0].members[0].id
        window.history.replaceState(null, '', `#${memberId}`)

        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData, defaultTab: 'events' },
            attachTo: document.body,
        })

        try {
            await nextTick()
            await nextTick()

            expect(document.activeElement?.id).toBe(memberId)
            expect(wrapper.findAll('tr').some(row => row.attributes('id') === memberId)).toBe(true)
            expect(wrapper.text()).toContain('variant')
        } finally {
            wrapper.unmount()
            window.history.replaceState(null, '', originalUrl)
            scrollTo.mockRestore()
        }
    })

    it('类型定义入口使用实例成员范围的安全锚点并提供原生展开控件', async () => {
        const memberId = apiData.components[0].members[0].id
        const instanceMemberId = `primary-${memberId}`
        const definitionId = getApiTypeReferenceAnchorId(instanceMemberId, 0)
        const html = await renderToString(createSSRApp(ComponentApi, {
            name: 'button',
            data: apiData,
            instance: 'primary',
        }))

        expect(memberId).toBe('api-component_3Abutton_2FButton-props-variant')
        expect(definitionId).toBe(`primary-${memberId}-type-reference-0`)
        expect(html).toContain(`href="#${definitionId}"`)
        expect(html).toContain(`<details id="${definitionId}" open`)
        expect(html).toContain('export type ButtonVariant')
        expect(html).not.toMatch(/(?:href|id)="[^"]*%[0-9A-F]{2}/i)
    })

    it('defaultTab 在水合后初始化，搜索覆盖组件组且组件筛选保持选中', async () => {
        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData, defaultTab: 'events' },
        })
        await nextTick()

        const eventFilter = wrapper.findAll('button').find(button => button.text().startsWith('事件'))
        const propsFilter = wrapper.findAll('button').find(button => button.text().startsWith('属性'))
        expect(eventFilter?.attributes('aria-pressed')).toBe('true')
        expect(propsFilter?.attributes('aria-pressed')).toBe('false')
        expect(wrapper.findAll('tr').some(row => row.attributes('id') === apiData.components[0].members[0].id)).toBe(false)

        await wrapper.get('input[type="search"]').setValue('排列方向')
        await nextTick()
        expect(wrapper.text()).toContain('ButtonGroup')
        expect(wrapper.text()).toContain('orientation')
        expect(wrapper.text()).toContain('匹配 1 项 API 成员')

        const groupFilter = wrapper.findAll('button').find(button => button.text().trim() === 'ButtonGroup')
        await groupFilter?.trigger('click')
        await nextTick()
        expect(groupFilter?.attributes('aria-pressed')).toBe('true')
        expect(wrapper.text()).toContain('orientation')
        expect(wrapper.text()).not.toContain('@click')
        wrapper.unmount()
    })

    it('固定子组件时不显示组件切换，并在组语言变化后重置临时筛选', async () => {
        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData, subcomponent: 'Button' },
        })
        const input = wrapper.get('input[type="search"]')
        await input.setValue('click')
        await nextTick()
        expect(wrapper.text()).toContain('@click')
        expect(wrapper.text()).not.toContain('ButtonGroup')
        expect(wrapper.find('[aria-label="按组件筛选"]').exists()).toBe(false)

        await wrapper.setProps({ data: { ...apiData, locale: 'en' } })
        await nextTick()
        await nextTick()
        expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
        expect(wrapper.text()).toContain('variant')
        expect(wrapper.text()).toContain('Search API members')
        wrapper.unmount()
    })

    it('路由数据重置或卸载后忽略尚未完成的复制请求', async () => {
        vi.useFakeTimers()
        const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
        const pendingWrites: Array<() => void> = []
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn(() => new Promise<void>(resolve => pendingWrites.push(resolve))),
            },
        })

        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData },
        })
        const findNameCopy = (label: string) => wrapper.findAll('button').find(button => button.attributes('aria-label') === label)

        try {
            await findNameCopy('复制成员名称')?.trigger('click')
            expect(pendingWrites).toHaveLength(1)

            await wrapper.setProps({ data: { ...apiData, locale: 'en' } })
            pendingWrites[0]()
            await flushPromises()
            await nextTick()
            expect(findNameCopy('Copy member name')?.exists()).toBe(true)

            await findNameCopy('Copy member name')?.trigger('click')
            expect(pendingWrites).toHaveLength(2)
            wrapper.unmount()
            pendingWrites[1]()
            await flushPromises()
            expect(vi.getTimerCount()).toBe(0)
        } finally {
            wrapper.unmount()
            if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
            else Reflect.deleteProperty(navigator, 'clipboard')
            vi.useRealTimers()
        }
    })

    it('为剪贴板成功与失败呈现不同反馈', async () => {
        const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn()
                    .mockResolvedValueOnce(undefined)
                    .mockRejectedValueOnce(new Error('Clipboard unavailable')),
            },
        })

        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData },
        })
        const findCopy = (label: string) => wrapper.findAll('button').find(button => button.attributes('aria-label') === label)

        try {
            await findCopy('复制成员名称')?.trigger('click')
            await flushPromises()
            expect(findCopy('已复制')?.exists()).toBe(true)

            await findCopy('已复制')?.trigger('click')
            await flushPromises()
            expect(findCopy('复制失败')?.exists()).toBe(true)
        } finally {
            wrapper.unmount()
            if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
            else Reflect.deleteProperty(navigator, 'clipboard')
        }
    })
})
