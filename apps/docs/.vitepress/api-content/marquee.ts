import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Marquee: {
            props: {
                direction: { zh: '设置循环滚动方向，left 向左、right 向右。', en: 'Sets the loop direction: left moves left and right moves right.' },
                speed: { zh: '设置一次循环动画的持续秒数，数值越小滚动越快；有效时长不会低于 0.1 秒。', en: 'Sets the duration of one animation cycle in seconds. Smaller values move faster, and the effective duration is at least 0.1 seconds.' },
                pauseOnHover: { zh: '启用后，指针悬停在跑马灯上时暂停循环动画。', en: 'Pauses the looping animation while the pointer hovers over the marquee when enabled.' },
                fade: { zh: '启用容器左右边缘的淡出遮罩效果。', en: 'Enables fade masks at the left and right edges of the container.' },
                variant: { zh: '设置跑马灯容器的背景色与文字颜色变体。', en: 'Sets the marquee container background and text color variant.' },
                size: { zh: '设置内容文字大小与容器内边距级别。', en: 'Sets the scale for the content text size and container padding.' },
                class: { zh: '追加到跑马灯外层容器的 CSS 类。', en: 'Additional CSS classes applied to the outer marquee container.' },
            },
            slots: {
                default: { zh: '提供随跑马灯轨道循环滚动的内容。', en: 'Provides the content that scrolls repeatedly along the marquee track.' },
            },
        },
    },
} satisfies ApiContent

export default content
