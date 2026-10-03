import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { apiMemberId, type ApiGroup } from '../../../apps/docs/.vitepress/api-types'
import { getApiDefaultMainValue, getApiSourceUrl, getApiTypeReferenceAnchorId } from '../../../apps/docs/.vitepress/theme/components/component-api-view'

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
                        displayText: 'ButtonVariant',
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

async function openSelect(trigger: { trigger(event: string, options?: Record<string, unknown>): Promise<unknown> }) {
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    await nextTick()
}

async function chooseOption(text: string) {
    const option = [...document.querySelectorAll('[role="option"]')]
        .find(item => item.textContent?.trim().startsWith(text))
    option?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    await nextTick()
}

describe('ComponentApi 展示', () => {
    it('SSR 输出完整分类、稳定锚点、默认值、说明与类型引用', async () => {
        const html = await renderToString(createSSRApp(ComponentApi, {
            name: 'button',
            data: apiData,
            instance: 'primary',
            defaultTab: 'events',
        }))
        const parsed = new DOMParser().parseFromString(html, 'text/html')

        expect(html).toContain('primary-api-component_3Abutton_2FButton-props-variant')
        expect(html).toContain('primary-api-component_3Abutton_2FButton-events-click')
        expect(html).toContain('primary')
        expect(html).toContain('运行时回退')
        expect(html).toContain('运行时回退到 primary。')
        expect(html).toContain('ButtonVariant')
        expect(html).toContain('事件')
        expect(html).toContain('属性')
        expect(html).not.toMatch(/<header\b/i)
        expect(html).not.toContain('<details id="primary-api-component_3Abutton_2FButton-props-variant-type" open')
        expect([...parsed.querySelectorAll('.component-api-root h3')].map(heading => heading.textContent?.trim())).toEqual(['Button', 'ButtonGroup'])
        expect(parsed.querySelectorAll('.component-api-member-summary')).toHaveLength(3)
        expect(parsed.querySelector('.component-api-controls')).toBeNull()
        expect(parsed.querySelector('.component-api-category-filter')).toBeNull()
        expect(parsed.querySelectorAll('button:not([disabled])')).toHaveLength(0)
        const propertyTable = [...parsed.querySelectorAll('table')].find(table => table.querySelector('caption')?.textContent?.includes('属性'))
        const eventTable = [...parsed.querySelectorAll('table')].find(table => table.querySelector('caption')?.textContent?.includes('事件'))
        expect([...propertyTable?.querySelectorAll('th') ?? []].map(cell => cell.textContent?.trim())).toEqual(['名称', '类型', '默认值', '说明'])
        expect([...eventTable?.querySelectorAll('th') ?? []].map(cell => cell.textContent?.trim())).toEqual(['名称', '签名或类型', '说明'])
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

    it('类型定义锚点在默认关闭时仍能揭开祖先详情', async () => {
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
        expect(html).toContain(`<details id="${definitionId}"`)
        expect(html).not.toMatch(new RegExp(`<details id="${definitionId}"[^>]* open`))
        expect(html).toContain('export type ButtonVariant')
        expect(html).not.toMatch(/(?:href|id)="[^"]*%[0-9A-F]{2}/i)

        const originalUrl = window.location.href
        window.history.replaceState(null, '', `#${definitionId}`)
        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData, instance: 'primary' },
            attachTo: document.body,
        })

        try {
            await nextTick()
            await nextTick()
            const referenceDetails = document.getElementById(definitionId) as HTMLDetailsElement | null
            const memberDetails = document.getElementById(`${instanceMemberId}-type`) as HTMLDetailsElement | null
            expect(referenceDetails?.open).toBe(true)
            expect(memberDetails?.open).toBe(true)
            expect(document.activeElement?.id).toBe(definitionId)
        } finally {
            wrapper.unmount()
            window.history.replaceState(null, '', originalUrl)
        }
    })

    it('主表只显示摘要、分类选择保留零结果并在切换子组件后重置', async () => {
        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData, defaultTab: 'events' },
            attachTo: document.body,
        })
        await nextTick()

        const componentFilter = wrapper.get('.component-api-select-trigger')
        const categoryFilter = wrapper.get('.component-api-category-filter')
        const getCategory = (name: string) => categoryFilter.findAll('button').find(button => button.text().startsWith(name))!
        expect(getCategory('事件').attributes('aria-pressed')).toBe('true')
        for (const label of wrapper.findAll('.component-api-filter label')) {
            expect(document.getElementById(label.attributes('for'))?.tagName).toBe('BUTTON')
        }
        expect(wrapper.findAll('tr').some(row => row.attributes('id') === apiData.components[0].members[0].id)).toBe(false)

        const variantId = apiData.components[0].members[0].id
        await wrapper.get('input[type="search"]').setValue('排列方向')
        await nextTick()
        expect(wrapper.text()).toContain('当前分类中没有符合筛选条件的成员。')
        expect(getCategory('事件').attributes('aria-pressed')).toBe('true')
        expect(categoryFilter.text()).not.toContain('插槽')
        expect(getCategory('事件').text()).toContain('0')
        await getCategory('属性').trigger('click')
        expect(wrapper.text()).toContain('orientation')

        await wrapper.get('input[type="search"]').setValue('')
        await nextTick()

        const summaryRow = wrapper.get(`#${variantId}`)
        const summaryCells = summaryRow.findAll('td')
        expect(summaryCells[1].text()).toBe('ButtonVariant')
        expect(summaryCells[1].text()).not.toContain("'default' | 'primary' | 'outline'")
        expect(summaryCells[2].text().match(/'primary'/g)).toHaveLength(1)
        expect(summaryCells[2].text()).toContain('运行时回退')
        expect(wrapper.get(`#${variantId}-type`).attributes('open')).toBeUndefined()
        expect(wrapper.get(`#${variantId}-type`).text()).toContain("'default' | 'primary' | 'outline'")
        expect(summaryCells[3].text()).not.toContain('来源')
        expect(wrapper.get(`#${variantId}-type .component-api-detail-source a`).attributes('title')).toBe(apiData.components[0].members[0].source.file)
        expect(getApiSourceUrl(apiData.components[0].members[0].source)).toContain('/blob/HEAD/packages/ui/src/components/button/Button.vue#L12')

        await openSelect(componentFilter)
        await chooseOption('ButtonGroup')
        expect(wrapper.get('input[type="search"]').element).toBeTruthy()
        expect(wrapper.text()).toContain('orientation')
        expect(wrapper.text()).not.toContain('variant')

        await wrapper.get('input[type="search"]').setValue('orientation')
        const selectedDetails = wrapper.get('details.component-api-details').element as HTMLDetailsElement
        selectedDetails.open = true
        await wrapper.setProps({ data: { ...apiData, locale: 'en' } })
        await nextTick()
        await nextTick()
        expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
        expect(wrapper.get('.component-api-select-trigger').text()).toContain('All components')
        expect(getCategory('Events').attributes('aria-pressed')).toBe('true')
        expect(wrapper.findAll('details').every(details => details.attributes('open') === undefined)).toBe(true)
        expect(wrapper.text()).toContain('@click')
        wrapper.unmount()
    })

    it('单体组件不显示重复标题，默认值语义保留在主值与详情中', async () => {
        const component = apiData.components[0]
        const data: ApiGroup = {
            ...apiData,
            components: [{
                ...component,
                members: [
                    { ...component.members[0], name: 'explicitUndefined', id: apiMemberId(component.id, 'props', 'explicitUndefined'), default: { declaration: { kind: 'expression', text: 'undefined' } } },
                    { ...component.members[0], name: 'factoryValue', id: apiMemberId(component.id, 'props', 'factoryValue'), default: { declaration: { kind: 'factory', text: '() => []' } } },
                    { ...component.members[0], name: 'absentValue', id: apiMemberId(component.id, 'props', 'absentValue'), default: { declaration: { kind: 'absent' } } },
                    { ...component.members[0], name: 'resolvedFactory', id: apiMemberId(component.id, 'props', 'resolvedFactory'), default: { declaration: { kind: 'factory', text: '() => []' }, resolution: { kind: 'resolved', text: '[]' } } },
                    { ...component.members[0], name: 'runtimeValue', id: apiMemberId(component.id, 'props', 'runtimeValue'), default: { declaration: { kind: 'absent' }, fallback: '运行时语言文本' } },
                ],
            }],
        }
        const html = await renderToString(createSSRApp(ComponentApi, { name: 'button', data }))
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        expect(parsed.querySelector('.component-api-root h2')).toBeNull()
        expect(parsed.querySelector('.component-api-root h3')).toBeNull()
        expect(parsed.querySelector('.component-api-root')?.textContent).not.toContain('API 参考')

        const wrapper = mount(ComponentApi, { props: { name: 'button', data } })
        const getDefaultText = (name: string) => {
            const member = data.components[0].members.find(item => item.name === name)
            return wrapper.get(`#${member?.id} .component-api-default-value`).text()
        }
        expect(getDefaultText('explicitUndefined')).toBe('undefined')
        expect(getDefaultText('factoryValue')).toBe('按实例调用工厂函数')
        expect(getDefaultText('absentValue')).toBe('—')
        expect(getDefaultText('resolvedFactory')).toBe('[]')
        expect(wrapper.get(`#${data.components[0].members[3].id} .component-api-factory-note`).text()).toContain('按实例调用')
        expect(getDefaultText('runtimeValue')).toBe('—')
        expect(wrapper.get(`#${data.components[0].members[4].id}-type`).text()).toContain('运行时语言文本')
        expect(wrapper.get(`#${data.components[0].members[2].id}-type`).text()).toContain('未声明默认值')
        expect(wrapper.get(`#${data.components[0].members[0].id}-type`).text()).toContain('声明')
        expect(wrapper.get(`#${data.components[0].members[1].id}-type`).text()).toContain('() => []')
        expect(getApiDefaultMainValue({ declaration: { kind: 'expression', text: 'undefined' } }, '工厂函数')).toBe('undefined')
        wrapper.unmount()
    })

    it('固定子组件时不显示组件切换，并在组语言变化后重置临时筛选', async () => {
        const wrapper = mount(ComponentApi, {
            props: { name: 'button', data: apiData, subcomponent: 'Button' },
        })
        await nextTick()
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
            await nextTick()
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
            await nextTick()
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
