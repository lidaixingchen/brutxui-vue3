import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageCard from './ImageCard.vue'
import { imageCardVariants, imageCardImageVariants, imageCardFooterVariants } from './image-card-variants'

describe('ImageCard', () => {
    const baseProps = {
        src: 'https://example.com/photo.jpg',
        alt: '示例照片',
    }

    it('渲染 img 元素并透传 src 与 alt', () => {
        const wrapper = mount(ImageCard, { props: baseProps })
        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe(baseProps.src)
        expect(img.attributes('alt')).toBe(baseProps.alt)
    })

    it('无 title/description/插槽时不渲染底栏', () => {
        const wrapper = mount(ImageCard, { props: baseProps })
        expect(wrapper.find('figcaption').exists()).toBe(false)
    })

    it('title 与 description 渲染于 figcaption 底栏', () => {
        const wrapper = mount(ImageCard, {
            props: { ...baseProps, title: 'ARCHIVE_01', description: '拍立得档案卡片' },
        })
        const caption = wrapper.find('figcaption')
        expect(caption.text()).toContain('ARCHIVE_01')
        expect(caption.text()).toContain('拍立得档案卡片')
    })

    it('默认插槽覆盖默认底栏内容', () => {
        const wrapper = mount(ImageCard, {
            props: { ...baseProps, title: '会被覆盖' },
            slots: { default: '<b>CUSTOM</b>' },
        })
        expect(wrapper.find('figcaption').text()).toContain('CUSTOM')
        expect(wrapper.text()).not.toContain('会被覆盖')
    })

    it.each(['4/3', 'video', 'square'] as const)('aspect=%s 应用对应图片区类', (aspect) => {
        const wrapper = mount(ImageCard, { props: { ...baseProps, aspect } })
        expect(wrapper.find('img').classes()).toContain(
            imageCardImageVariants({ aspect }).split(' ').find(c => c.startsWith('aspect-'))!,
        )
    })

    it('图片区与底栏之间为实体粗黑线隔断（border-t-3 border-brutal）', () => {
        const wrapper = mount(ImageCard, {
            props: { ...baseProps, title: 'T' },
        })
        const footerClass = wrapper.find('figcaption').classes()
        expect(footerClass).toContain('border-t-3')
        expect(footerClass).toContain('border-brutal')
    })

    it.each(['secondary', 'accent', 'destructive', 'info'] as const)(
        'accent=%s 底栏应用对应主题色族',
        (accent) => {
            const wrapper = mount(ImageCard, { props: { ...baseProps, accent, title: 'T' } })
            const expectedBg = imageCardFooterVariants({ accent })
                .split(' ')
                .find(c => c.startsWith('bg-brutal-') && !c.includes('-foreground'))
            expect(wrapper.find('figcaption').classes()).toContain(expectedBg!)
        },
    )

    it('前景色引用 *-foreground 令牌族，无硬编码色值字面量', () => {
        for (const accent of ['primary', 'secondary', 'accent', 'destructive', 'success', 'info', 'muted'] as const) {
            expect(imageCardFooterVariants({ accent })).toMatch(/text-brutal-[a-z]+-foreground/)
        }
    })

    it('根容器承载实体边框、硬阴影与悬浮上浮', () => {
        const classes = imageCardVariants()
        expect(classes).toContain('border-3')
        expect(classes).toContain('shadow-brutal')
        expect(classes).toContain('hover:-translate-y-0.5')
    })

    it('支持自定义 class 合并', () => {
        const wrapper = mount(ImageCard, { props: { ...baseProps, class: 'custom-class' } })
        expect(wrapper.classes()).toContain('custom-class')
    })
})
