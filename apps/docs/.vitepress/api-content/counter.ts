import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Counter: {
            props: {
                to: { zh: '动画的目标数值，必填。', en: 'The required target value for the count-up animation.' },
                from: { zh: '动画起始数值；`play()` 也从该值重新开始。', en: 'The starting value; `play()` also restarts from this value.' },
                duration: { zh: '动画时长，单位为毫秒；非正数使用组件默认时长。', en: 'Animation duration in milliseconds; non-positive values use the component default duration.' },
                decimals: { zh: '显示的小数位数，结果按该位数格式化。', en: 'The number of displayed decimal places; values are formatted to this precision.' },
                decimalSeparator: { zh: '数字整数和小数部分之间显示的分隔符。', en: 'The separator displayed between the integer and fractional parts.' },
                prefix: { zh: '显示在数值前面的文本，例如货币符号。', en: 'Text displayed before the number, such as a currency symbol.' },
                suffix: { zh: '显示在数值后面的文本，例如百分号或加号。', en: 'Text displayed after the number, such as a percent sign or plus sign.' },
                prefixComponent: { zh: '替代文本前缀的展示型组件；测量布局时会额外挂载一份，因此应避免内部状态和副作用。', en: 'A display component used instead of the text prefix. It is mounted again for layout measurement, so avoid internal state and side effects.' },
                suffixComponent: { zh: '替代文本后缀的展示型组件；测量布局时会额外挂载一份，因此应避免内部状态和副作用。', en: 'A display component used instead of the text suffix. It is mounted again for layout measurement, so avoid internal state and side effects.' },
                animatePrefix: { zh: '存在 `prefixComponent` 时是否渲染该组件；关闭后显示 `prefix` 文本。', en: 'Whether to render `prefixComponent` when provided; when false, the `prefix` text is shown.' },
                animateSuffix: { zh: '存在 `suffixComponent` 时是否渲染该组件；关闭后显示 `suffix` 文本。', en: 'Whether to render `suffixComponent` when provided; when false, the `suffix` text is shown.' },
                separator: { zh: '千位分隔符；设为空字符串可关闭千分位分组，但仍应用 `decimalSeparator`。', en: 'The thousands separator. An empty string disables digit grouping while retaining `decimalSeparator`.' },
                easing: { zh: '动画进度使用的缓动函数。', en: 'The easing function applied to animation progress.' },
                autoStart: { zh: '挂载后自动开始动画；为 false 时数值停留在 `from`，也不会随 `to/from` 更新自动播放。', en: 'Starts the animation on mount. When false, the value stays at `from` and `to`/`from` changes do not auto-play.' },
                variant: { zh: '数值文本的颜色变体，不改变卡片背景。', en: 'The number text color variant; it does not change the card background.' },
                size: { zh: '数值文字的字号预设。', en: 'The preset font size for the number.' },
                title: { zh: '可选标题；提供后进入容器布局，标题插槽内容优先于该文本。', en: 'Optional heading text. Providing it enables container layout; title-slot content takes precedence.' },
                card: { zh: '为数值启用带边框、内边距和阴影的卡片容器。', en: 'Wraps the value in a card container with border, padding, and shadow.' },
                valueStyle: { zh: '应用到数值区域外层元素的内联样式。', en: 'Inline styles applied to the wrapper around the value.' },
                class: { zh: '追加到容器模式的外层容器；未启用容器模式时追加到数值文本元素。', en: 'Classes added to the outer container in container mode, or to the number element when container mode is off.' },
            },
            events: {
                complete: { zh: '动画到达 `to` 时发出；减少动态效果偏好下直接显示目标值也会发出。', en: 'Emitted when the animation reaches `to`; it is also emitted when reduced-motion preferences cause the value to jump directly to the target.' },
            },
            slots: {
                title: { zh: '替换 `title` 属性的标题内容；提供插槽也会启用容器布局。', en: 'Replaces the `title` prop content; providing this slot also enables container layout.' },
            },
            exposes: {
                play: { zh: '取消当前动画并从 `from` 重新播放；减少动态效果偏好下直接显示目标值。', en: 'Cancels the current animation and restarts from `from`; under reduced-motion preferences it jumps directly to the target.' },
                stop: { zh: '取消当前动画并停止继续更新数值。', en: 'Cancels the current animation and stops further value updates.' },
            },
        },
    },
} satisfies ApiContent

export default content
