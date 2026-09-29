import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Statistic: {
            props: {
                value: { zh: '要格式化并展示的数值，支持 number、string、bigint 以及空值。', en: 'The value to format and display; accepts number, string, bigint, or an empty value.' },
                title: { zh: '统计数值上方显示的标题文本。', en: 'The title displayed above the statistic value.' },
                prefix: { zh: '显示在格式化数值之前的文本，例如货币符号。', en: 'Text displayed before the formatted value, such as a currency symbol.' },
                suffix: { zh: '显示在格式化数值之后的文本，例如百分号或单位。', en: 'Text displayed after the formatted value, such as a percent sign or unit.' },
                precision: { zh: '指定格式化结果保留的小数位数。', en: 'Sets the number of decimal places preserved in the formatted result.' },
                decimalSeparator: { zh: '覆盖格式化数值中的小数分隔符。', en: 'Overrides the decimal separator in the formatted value.' },
                groupSeparator: { zh: '覆盖格式化数值中的千位分组分隔符。', en: 'Overrides the thousands grouping separator in the formatted value.' },
                formatter: { zh: '自定义数值转文本函数；返回的字符串作为格式化结果展示。', en: 'A custom value-to-text function whose returned string is displayed as the formatted result.' },
                placeholder: { zh: 'value 为空或无法格式化时展示的占位文本。', en: 'Placeholder displayed when value is empty or cannot be formatted.' },
                trend: { zh: '展示上升或下降趋势标记，并使用相应的状态色。', en: 'Shows an upward or downward trend marker with the corresponding status color.' },
                trendPlacement: { zh: '将趋势标记放在数值内容的前侧或后侧。', en: 'Places the trend marker before or after the value content.' },
                variant: { zh: '设置统计容器的默认、卡片、边框或柔和视觉样式。', en: 'Sets the statistic container to the default, card, bordered, or subtle visual style.' },
                size: { zh: '设置统计内容的默认、小或大尺寸。', en: 'Sets the statistic content to the default, small, or large size.' },
                locale: { zh: '指定本地化数值格式化所用的区域设置。', en: 'The locale used for localized number formatting.' },
                class: { zh: '追加到统计根容器的自定义 CSS 类。', en: 'Custom CSS classes added to the statistic root container.' },
            },
            slots: {
                title: { zh: '替换标题区域内容；作用域提供当前 title。', en: 'Replaces the title area content and exposes the current title in its scope.' },
                prefix: { zh: '替换数值前缀区域内容；作用域提供当前 prefix。', en: 'Replaces the value prefix area and exposes the current prefix in its scope.' },
                suffix: { zh: '替换数值后缀区域内容；作用域提供当前 suffix。', en: 'Replaces the value suffix area and exposes the current suffix in its scope.' },
                trend: { zh: '替换趋势指示内容；作用域提供趋势方向和本地化标签。', en: 'Replaces the trend indicator and exposes the trend direction and localized label.' },
                default: { zh: '替换格式化数值内容；作用域提供原始 value 与 formattedValue。', en: 'Replaces the formatted value content and exposes the raw value and formattedValue.' },
            },
        },
    },
} satisfies ApiContent

export default content
