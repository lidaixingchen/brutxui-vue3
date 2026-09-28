import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        NoiseBackground: {
            props: {
                type: { zh: '选择 SVG `feTurbulence` 的 `fractalNoise` 分形噪声或 `turbulence` 湍流算法。', en: 'Selects the SVG `feTurbulence` algorithm: `fractalNoise` or `turbulence`.' },
                frequency: { zh: '噪声的基础频率；启用动画时围绕该值周期性变化。', en: 'The base noise frequency; animation varies around this value when enabled.' },
                octaves: { zh: 'SVG 噪声细节层数，层数越多纹理越复杂。', en: 'The number of SVG noise octaves; more octaves produce more complex texture.' },
                opacity: { zh: '背景噪点矩形的透明度。', en: 'The opacity of the rendered noise rectangle.' },
                animated: { zh: '启用基础频率的周期性动画；系统减少动态效果时暂停动画但保留静态纹理。', en: 'Animates the base frequency periodically. With reduced-motion enabled, animation stops while the static texture remains.' },
                animationDuration: { zh: '动画周期秒数；非正值不会启动动画。', en: 'The animation cycle duration in seconds; non-positive values prevent animation from starting.' },
                animationRange: { zh: '动画期间基础频率绕初始值变化的范围。', en: 'The range over which the base frequency varies during animation.' },
                rounded: { zh: '背景容器的圆角样式：无圆角、默认、较大圆角或全圆角。', en: 'The background container corner style: none, default, large, or fully rounded.' },
                class: { zh: '追加到背景根容器的 CSS 类。', en: 'CSS classes added to the background root container.' },
            },
            slots: { default: { zh: '显示在噪点 SVG 图层上方的背景内容。', en: 'Background content rendered above the noise SVG layer.' } },
        },
    },
} satisfies ApiContent

export default content
