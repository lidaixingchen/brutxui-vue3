import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Switch: {
            props: describe({
                class: ['追加到 Switch 原语根元素的 CSS 类。', 'CSS classes added to the Switch primitive root element.'],
                modelValue: ['受控开关状态，通过 v-model 绑定；传入 null 时按关闭状态处理。', 'The controlled switch state, bound with v-model; null is treated as off.'],
                defaultValue: ['未传入 modelValue 时使用的初始状态；同时传入 defaultChecked 时以 defaultValue 为准。', 'The initial state used when modelValue is omitted; it takes precedence over defaultChecked when both are provided.'],
                defaultChecked: ['非受控模式下的初始状态别名；同时提供 defaultValue 时被其覆盖。', 'An alias for the initial state in uncontrolled mode; overridden when defaultValue is also provided.'],
                disabled: ['禁用开关交互。', 'Disables switch interaction.'],
                variant: ['设置开关的颜色和状态样式变体。', 'Sets the switch color and state style variant.'],
                shape: ['设置滑块的机械外观为常规滑动式或摇杆式。', 'Sets the mechanical appearance to a sliding or rocker-style switch.'],
                size: ['设置开关轨道和滑块的尺寸。', 'Sets the size of the switch track and thumb.'],
                showLabels: ['在轨道内显示表示关闭和开启的 O/I 铭牌；标签仅为装饰并从无障碍树中隐藏。', 'Shows O/I markings for off and on inside the track; the markings are decorative and hidden from the accessibility tree.'],
                ariaLabel: ['设置开关的无障碍名称；未提供时使用当前语言的默认文案。', 'Sets the switch’s accessible name; the current locale’s default text is used when omitted.'],
                sound: ['显式启用切换状态时的继电器音效；默认不播放。', 'Explicitly enables the relay sound when the state changes; sound is off by default.'],
            }),
            events: describe({ 'update:modelValue': ['用户切换状态后发出新的布尔值，用于同步 v-model。', 'Emits the new boolean after the user toggles the switch to synchronize v-model.'] }),
        },
    },
} satisfies ApiContent

export default content
