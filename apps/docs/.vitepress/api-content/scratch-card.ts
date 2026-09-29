import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        ScratchCard: {
            props: describe({
                percentage: ['达到此已刮开面积百分比时自动完成揭示；默认阈值为 50。', 'Automatically completes the reveal when this percentage of the covered area has been scratched; the default threshold is 50.'],
                brushRadius: ['设置指针刮除笔刷的半径，单位为像素。', 'Sets the radius of the pointer scratch brush in pixels.'],
                overlayColor: ['设置 Canvas 覆盖层的纯色底色；未设置时使用主题双色斜纹。', 'Sets a solid background color for the Canvas overlay; when omitted, a two-color theme stripe pattern is used.'],
                fadeDuration: ['达到完成阈值后覆盖层淡出的时长，单位为毫秒；减少动态效果偏好会跳过动画。', 'The duration of the overlay fade-out after the completion threshold is reached, in milliseconds; reduced-motion preferences skip the animation.'],
                class: ['追加到刮刮卡根容器的 CSS 类。', 'CSS classes added to the scratch-card root container.'],
            }),
            events: describe({
                progress: ['刮除进度变化时发出当前已揭示面积百分比；事件经过节流。', 'Emits the current revealed-area percentage as scratching progresses; emissions are throttled.'],
                completed: ['达到自动揭示阈值或调用 revealAll 后，覆盖层完成移除时发出。', 'Emitted when the overlay is removed after reaching the reveal threshold or calling revealAll.'],
            }),
            slots: describe({ default: ['被 Canvas 覆盖层遮住并逐步揭示的刮刮卡底层内容。', 'The underlying scratch-card content covered by the Canvas overlay and revealed as it is scratched.'] }),
            exposes: describe({
                isRevealed: ['组件实例上暴露的揭示状态；Vue 会自动解包内部 Ref，可通过 `scratchCardRef.value.isRevealed` 读取布尔值。', 'The reveal state exposed on the component instance. Vue automatically unwraps its internal Ref, so read the boolean through `scratchCardRef.value.isRevealed`.'],
                revealAll: ['立即揭示全部内容并开始移除覆盖层。', 'Immediately reveals all content and starts removing the overlay.'],
            }),
        },
    },
} satisfies ApiContent

export default content
