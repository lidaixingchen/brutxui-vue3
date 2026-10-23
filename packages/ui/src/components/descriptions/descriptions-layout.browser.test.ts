import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import Descriptions from './Descriptions.vue'
import DescriptionsItem from './DescriptionsItem.vue'

let wrapper: ReturnType<typeof mount> | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
    wrapper?.unmount()
    host?.remove()
    wrapper = undefined
    host = undefined
})

describe('Descriptions 印章布局', () => {
    it.each([234, 650])('在 %ipx 宽度为印章保留正文前的空间', async (width: number) => {
        host = document.createElement('div')
        host.style.width = `${width}px`
        document.body.appendChild(host)
        wrapper = mount(defineComponent({ setup: () => () => h(Descriptions, { border: true, column: 1 }, {
                stamp: () => h('span', {
                    'data-test-stamp': '',
                    class: 'inline-block rotate-6 border-3 border-brutal px-2 py-0.5 text-xs font-black',
                }, '[ CONFIDENTIAL ]'),
                default: () => [
                    h(DescriptionsItem, { label: '编号' }, () => 'BX-2077-001'),
                    h(DescriptionsItem, { label: '密级' }, () => 'Top Secret'),
                ],
            }) }), { attachTo: host })
        await nextTick()
        const stamp = host.querySelector<HTMLElement>('[data-test-stamp]')!
        const grid = host.querySelector<HTMLElement>('.grid')!
        const row = grid.firstElementChild!
        expect(stamp.getBoundingClientRect().bottom).toBeLessThanOrEqual(row.getBoundingClientRect().top)
        expect(grid.getBoundingClientRect().right).toBeLessThanOrEqual(host.getBoundingClientRect().right)
        expect(row.textContent).toContain('BX-2077-001')
    })
})
