import { afterEach, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import ScrollArea from './ScrollArea.vue'

let wrapper: ReturnType<typeof mount> | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

it.each(['ltr', 'rtl'] as const)('reserves scrollbar space in %s when the track is hidden or shown', async (dir) => {
    wrapper = mount(defineComponent(() => () => h(ScrollArea, {
        dir,
        type: 'hover',
        size: 'lg',
        style: { width: '220px', height: '120px' },
    }, () => Array.from({ length: 16 }, (_, index) => h('p', `Row ${index + 1}`)))))

    const root = wrapper.element as HTMLElement
    const viewport = root.querySelector<HTMLElement>('[data-reka-scroll-area-viewport]')!
    const getTrack = () => root.querySelector<HTMLElement>('[data-orientation="vertical"]')
    const restingWidth = viewport.clientWidth
    expect(getTrack()).toBeNull()

    await userEvent.hover(viewport)
    await expect.poll(getTrack).not.toBeNull()

    const track = getTrack()!.getBoundingClientRect()
    const content = viewport.getBoundingClientRect()
    expect(viewport.clientWidth).toBe(restingWidth)
    expect(root.clientWidth - restingWidth).toBeCloseTo(track.width)
    if (dir === 'rtl') expect(content.left).toBeCloseTo(track.right)
    else expect(content.right).toBeCloseTo(track.left)

    viewport.focus()
    await userEvent.keyboard('{End}')
    await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
})
