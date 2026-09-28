import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Calendar: {
            props: describe({
                modelValue: ['当前选中的日期，通过 v-model 更新；单日模式为 Date，范围模式为包含起止日期的 Date 数组，未选择时为 null。', 'The selected date, updated with v-model; single mode uses a Date, range mode uses an array containing the start and end dates, and an empty selection is null.'],
                isRange: ['启用日期范围选择；modelValue 应表示起止日期范围。', 'Enables date-range selection; modelValue should represent the start and end dates.'],
                disabled: ['禁用日历日期选择交互。', 'Disables date selection interaction in the calendar.'],
                class: ['追加到日历根容器的 CSS 类。', 'CSS classes added to the calendar root container.'],
                events: ['提供需要标记的日历事件；每项包含日期和标题，并可携带自定义字段。', 'Provides calendar events to mark; each item has a date and title and may include custom fields.'],
                eventRenderer: ['自定义事件展示文本的回调；接收一个 CalendarEvent 并返回可渲染内容。', 'Callback for customizing event display content; receives a CalendarEvent and returns renderable content.'],
                mode: ['设置事件标记呈现方式：default 使用圆点和提示框，card 使用日历卡片和徽章。', 'Sets how event markers are rendered: default uses dots and tooltips, while card uses calendar cards and badges.'],
                retroHeader: ['显示复古挂历头部装饰；装饰内容不参与无障碍语义。', 'Shows a retro wall-calendar header decoration; the decorative elements carry no accessibility semantics.'],
            }),
            events: describe({ 'update:modelValue': ['用户选择日期或范围变化时发出新的日期值。', 'Emits the updated date value when the user changes the selected date or range.'] }),
        },
    },
} satisfies ApiContent

export default content
