import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Countdown: {
            props: {
                value: { zh: '倒计时的目标时间点，支持毫秒时间戳、Date、纯数字时间戳字符串及可解析的日期字符串；空值或无效日期显示占位文本。', en: 'The target deadline, as a millisecond timestamp, Date, numeric timestamp string, or parseable date string. Empty or invalid values show the placeholder.' },
                format: { zh: '剩余时间格式，支持 DD、D、HH、H、mm、m、ss、s、SSS、SS、S 和方括号转义文本。包含 S 时使用毫秒级刷新。', en: 'The remaining-time format, supporting DD, D, HH, H, mm, m, ss, s, SSS, SS, S, and literal text in square brackets. Formats containing S use millisecond-level updates.' },
                title: { zh: '显示在倒计时数值上方的标题文本，title 插槽可替换其内容。', en: 'The title above the countdown value; the title slot can replace its content.' },
                prefix: { zh: '显示在倒计时数值前的文本，prefix 插槽可替换其内容。', en: 'Text before the countdown value; the prefix slot can replace its content.' },
                suffix: { zh: '显示在倒计时数值后的文本，suffix 插槽可替换其内容。', en: 'Text after the countdown value; the suffix slot can replace its content.' },
                placeholder: {
                    zh: '目标时间为空或无效时显示的占位文本。', en: 'The placeholder displayed when the target time is empty or invalid.',
                    fallback: { 'zh-CN': '未提供时使用短横线“-”。', en: 'Uses a hyphen when omitted.' },
                },
                variant: { zh: '倒计时外层容器的背景和边框变体。', en: 'The background and border variant of the countdown container.' },
                size: { zh: '传给内部 Statistic 的尺寸，控制数值与配套文字的大小。', en: 'The size passed to the inner Statistic, controlling the value and accompanying text.' },
                class: { zh: '合并到倒计时外层容器的自定义 CSS 类。', en: 'Custom CSS classes merged onto the countdown container.' },
            },
            events: {
                finish: { zh: '有效倒计时进入完成状态时发出；挂载时目标已到期也会发出。新的未来目标会重新开始计时并允许再次完成。', en: 'Emitted when a valid countdown enters its finished state, including an already-expired target at mount. A new future target restarts the countdown and allows it to finish again.' },
                change: { zh: '计时刷新或目标时间重新计算时发出剩余毫秒数，最小为零。', en: 'Emits the remaining milliseconds, clamped at zero, when the timer updates or the target is recalculated.' },
            },
            slots: {
                default: { zh: '自定义数值区域，接收剩余毫秒数、格式化字符串及是否完成的状态。', en: 'Customizes the value area with the remaining milliseconds, formatted string, and finished state.' },
                title: { zh: '自定义标题区域，接收 title 属性值；默认显示该文本。', en: 'Customizes the title area with the title prop value, which is rendered by default.' },
                prefix: { zh: '自定义数值前缀区域，接收 prefix 属性值。', en: 'Customizes the value prefix area with the prefix prop value.' },
                suffix: { zh: '自定义数值后缀区域，接收 suffix 属性值。', en: 'Customizes the value suffix area with the suffix prop value.' },
            },
        },
    },
} satisfies ApiContent

export default content
