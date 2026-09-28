import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Carousel: {
            props: describe({
                loop: ['启用首尾循环滚动；启用后上一张和下一张始终可滚动。', 'Enables looping from the last slide to the first; previous and next navigation remain available.'],
                autoplay: ['启用轮播自动播放；减少动态效果偏好生效时自动播放会停止。', 'Enables automatic slide playback; autoplay stops while reduced motion is preferred.'],
                autoplayDelay: ['设置自动播放切换幻灯片的间隔，单位为毫秒。', 'Sets the autoplay interval between slides, in milliseconds.'],
                showArrows: ['控制是否显示上一张和下一张导航按钮。', 'Controls whether previous and next navigation buttons are shown.'],
                showDots: ['控制是否显示底部圆点导航；显示缩略图时圆点导航会隐藏。', 'Controls whether bottom dot navigation is shown; dots are hidden when thumbnails are displayed.'],
                size: ['设置轮播视口的高度预设。', 'Sets the height preset for the carousel viewport.'],
                thumbnails: ['配置缩略图导航的显示、位置、尺寸、间距和当前项高亮。', 'Configures thumbnail navigation visibility, position, size, spacing, and current-item highlighting.'],
                autoplayIndicator: ['配置自动播放指示器的类型、位置和悬停暂停行为。', 'Configures the autoplay indicator type, position, and pause-on-hover behavior.'],
                parallax: ['配置幻灯片视差效果及其缩放、透明度和动画时长。', 'Configures the slide parallax effect, including scale, opacity, and animation duration.'],
                class: ['追加到轮播根元素的 CSS 类。', 'CSS classes added to the carousel root element.'],
            }),
            slots: describe({
                default: ['放置 CarouselItem 幻灯片组件。', 'Contains CarouselItem slide components.'],
                thumbnail: ['自定义缩略图内容；作用域提供当前缩略图 index 和跳转到指定项的 scrollTo 函数。', 'Customizes thumbnail content; the slot scope provides the thumbnail index and a scrollTo function for navigating to a slide.'],
            }),
            exposes: describe({
                scrollPrev: ['滚动到上一张幻灯片；循环模式下可从第一张回到最后一张。', 'Scrolls to the previous slide; in loop mode it wraps from the first slide to the last.'],
                scrollNext: ['滚动到下一张幻灯片；循环模式下可从最后一张回到第一张。', 'Scrolls to the next slide; in loop mode it wraps from the last slide to the first.'],
                scrollTo: ['滚动到指定的从零开始的幻灯片索引。', 'Scrolls to the slide at the specified zero-based index.'],
                selectedIndex: ['当前选中幻灯片的从零开始索引，只读响应式状态。', 'The zero-based index of the selected slide as read-only reactive state.'],
                canScrollPrev: ['指示当前是否可以向前滚动；循环模式下始终为 true。', 'Indicates whether scrolling backward is possible; it is always true in loop mode.'],
                canScrollNext: ['指示当前是否可以向后滚动；循环模式下始终为 true。', 'Indicates whether scrolling forward is possible; it is always true in loop mode.'],
                startAutoplay: ['开始自动播放；减少动态效果偏好仍会阻止播放。', 'Starts autoplay; a reduced-motion preference still prevents playback.'],
                stopAutoplay: ['停止自动播放。', 'Stops autoplay.'],
            }),
        },
        CarouselItem: {
            props: describe({
                class: ['追加到单张幻灯片容器的 CSS 类。', 'CSS classes added to the individual slide container.'],
                ariaHidden: ['将当前幻灯片及其后代标记为对辅助技术隐藏；视口外幻灯片应设为 true。', 'Marks the slide and its descendants as hidden from assistive technology; set it to true for slides outside the viewport.'],
            }),
            slots: describe({ default: ['单张幻灯片中展示的自定义内容。', 'Custom content displayed inside the slide.'] }),
        },
    },
} satisfies ApiContent

export default content
