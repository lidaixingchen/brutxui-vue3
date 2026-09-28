import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Slider: {
            props: {
                modelValue: { zh: '当前滑块值数组；单值数组渲染一个滑块，双值数组用于范围滑块，可用 `v-model` 受控。', en: 'The current slider values. One value renders a single thumb; two values create a range slider. Supports controlled `v-model`.' },
                min: { zh: '可选的最小值，也是空值数组的回退值。', en: 'The minimum value and the fallback value when the model array is empty.' },
                max: { zh: '可选的最大值。', en: 'The maximum permitted value.' },
                step: { zh: '键盘或指针调整数值时使用的步长。', en: 'The increment used when adjusting the value by keyboard or pointer.' },
                disabled: { zh: '禁用所有滑块拇指的交互。', en: 'Disables interaction with all slider thumbs.' },
                ariaLabel: { zh: '传递给滑块原语的无障碍名称。', en: 'The accessible name passed to the slider primitive.' },
                size: { zh: '设置滑轨和拇指的尺寸预设。', en: 'Sets the size preset for the track and thumb.' },
                variant: { zh: '设置滑块填充及拇指的颜色变体。', en: 'Sets the color variant for the range fill and thumb.' },
                orientation: { zh: '选择水平或垂直布局，并相应布置刻度与提示。', en: 'Selects horizontal or vertical layout and positions marks and tooltips accordingly.' },
                marks: { zh: '在滑轨指定数值位置绘制的刻度标记数组。', en: 'Values at which tick marks are drawn along the track.' },
                showTooltip: { zh: '在当前聚焦或悬停的滑块拇指旁显示其数值提示。', en: 'Shows the value tooltip beside the currently focused or hovered thumb.' },
                class: { zh: '追加到滑块根容器的 CSS 类。', en: 'CSS classes added to the slider root container.' },
            },
            events: {
                'update:modelValue': { zh: '用户调整滑块时发出新的数值数组；通过父组件更新 `modelValue` 完成受控绑定。', en: 'Emits the updated number array when the slider changes; a controlled value is applied when the parent updates `modelValue`.' },
            },
            exposes: {
                currentValue: { zh: '当前有效滑块数值数组的计算属性；只读，未传值或空数组时包含 `min`。', en: 'The computed array of effective slider values. It is read-only and contains `min` when the model is omitted or empty.' },
                setValue: { zh: '以 `update:modelValue` 事件请求父组件设置新的滑块数值数组。', en: 'Requests a new slider value array from the parent by emitting `update:modelValue`.' },
            },
        },
    },
} satisfies ApiContent

export default content
