import type { ApiContent, ApiSemantic } from '../api-types'

const dateLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.placeholder，简体中文文案为“请选择日期”。',
    en: 'When undefined or null, uses datePicker.placeholder, whose English text is “Pick a date”.',
}
const rangeLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.rangeLabel，简体中文文案为“日期范围”。',
    en: 'When undefined or null, uses datePicker.rangeLabel, whose English text is “Date range”.',
}
const dateTimeLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.dateTimePlaceholder，简体中文文案为“选择日期时间”。',
    en: 'When undefined or null, uses datePicker.dateTimePlaceholder, whose English text is “Select date and time”.',
}
const timeLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.timePlaceholder，简体中文文案为“选择时间”。',
    en: 'When undefined or null, uses datePicker.timePlaceholder, whose English text is “Select time”.',
}
const weekLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.weekPlaceholder，简体中文文案为“选择周”。',
    en: 'When undefined or null, uses datePicker.weekPlaceholder, whose English text is “Select week”.',
}
const monthLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.monthPlaceholder，简体中文文案为“选择月份”。',
    en: 'When undefined or null, uses datePicker.monthPlaceholder, whose English text is “Select month”.',
}
const yearLabelFallback = {
    'zh-CN': '为 undefined 或 null 时读取 datePicker.yearPlaceholder，简体中文文案为“选择年”。',
    en: 'When undefined or null, uses datePicker.yearPlaceholder, whose English text is “Select year”.',
}

const triggerProps = {
    size: {
        zh: '控制日期触发按钮的高度、内边距及图标尺寸。',
        en: 'Controls the date trigger height, padding, and icon dimensions.',
    },
    variant: {
        zh: '控制日期触发按钮的视觉状态，提供常规、错误和成功配色。',
        en: 'Controls the date trigger appearance, with default, error, and success colors.',
    },
    displayFormat: {
        zh: '格式化触发器中显示的日期文本，支持 YYYY、YY、MM、DD、HH、mm、ss 和 WW；不改变绑定值的 Date 类型。WW 使用 ISO 周数，仅含周数而不含月日时，年份使用 ISO 周所属年份。',
        en: 'Formats the date text shown in the trigger using YYYY, YY, MM, DD, HH, mm, ss, and WW, while keeping the bound value as a Date. WW uses ISO week numbers; when the format contains weeks but no month or day tokens, the year is the ISO week year.',
    },
    disabled: {
        zh: '禁用触发按钮并隐藏触发器清除按钮；具有隐藏表单字段的选择器也会禁用该字段。',
        en: 'Disables the trigger and hides its clear button. Pickers with a hidden form field also disable that field.',
    },
    readonly: {
        zh: '阻止组件内部打开面板，并隐藏触发器清除按钮，保留当前日期的显示。',
        en: 'Prevents the component from opening its panel internally and hides the trigger clear button while preserving the displayed date.',
    },
    clearable: {
        zh: '显示面板底部的清除和确认操作；有值且未禁用、未只读时，也显示触发器清除按钮。',
        en: 'Shows the panel footer with Clear and Confirm actions. The trigger also shows a clear button when it has a value and is neither disabled nor read-only.',
    },
    id: {
        zh: '传递给日期触发按钮的 HTML ID，可供 label 或辅助技术引用。',
        en: 'The HTML ID assigned to the date trigger button for labels or assistive-technology references.',
    },
    class: {
        zh: '合并到日期触发按钮上的补充 CSS 类名。',
        en: 'Additional CSS classes merged into the date trigger button.',
    },
} satisfies Record<string, ApiSemantic>

const openProp = {
    zh: '受控的面板开关状态，通过 v-model:open 接收组件发出的开关请求。',
    en: 'The controlled panel open state. Use v-model:open to apply open-state requests emitted by the component.',
    fallback: {
        'zh-CN': '为 undefined 时使用组件内部开关状态，初始为关闭。',
        en: 'When undefined, the component manages its own open state, initially closed.',
    },
} satisfies ApiSemantic

const popupEvents = {
    open: {
        zh: '面板开关状态变为打开时触发，面板显示值同时从当前 modelValue 重新初始化。',
        en: 'Emitted when the panel state becomes open. Its displayed selection is reinitialized from the current modelValue.',
    },
    close: {
        zh: '面板开关状态变为关闭时触发。',
        en: 'Emitted when the panel state becomes closed.',
    },
} satisfies Record<string, ApiSemantic>

const pickerEvents = {
    ...popupEvents,
    'update:open': {
        zh: '组件请求设置面板开关时触发，用于 v-model:open；受控模式下需由父组件更新 open 才会改变显示状态。',
        en: 'Emitted when the component requests an open-state update for v-model:open. In controlled mode, the parent must update open to change the displayed state.',
    },
    'update:modelValue': {
        zh: '面板选择、确认或清除日期时触发，用于更新 v-model；清除时传入 null。',
        en: 'Emitted when a date is selected, confirmed, or cleared, updating v-model. Clearing emits null.',
    },
    change: {
        zh: '确认或清除时立即触发；其他关闭场景中，仅当面板显示值与当时 modelValue 的时间戳不同才触发。',
        en: 'Emitted immediately on confirmation or clearing. On other closes, it is emitted only if the panel selection and the current modelValue have different timestamps.',
    },
} satisfies Record<string, ApiSemantic>

const pickerExposes = {
    open: {
        zh: '可读写的面板开关引用；通过组件实例赋值可请求打开或关闭，readonly 会阻止打开请求。受控模式下写入会触发 update:open，仍需父组件更新 open。',
        en: 'A writable reference to the panel open state. Assigning through the component instance requests opening or closing; readonly blocks opening requests. Controlled writes emit update:open and require the parent to update open.',
    },
} satisfies Record<string, ApiSemantic>

const panelClearable = {
    zh: '显示包含清除和确认按钮的面板页脚；关闭时两个按钮一并隐藏。',
    en: 'Shows the panel footer containing Clear and Confirm buttons. Turning it off hides both buttons.',
} satisfies ApiSemantic

const panelEvents = {
    'update:modelValue': {
        zh: '面板选中的日期变化时触发；清除操作会传入 null，父组件需接收更新以同步选中状态。',
        en: 'Emitted when the panel selection changes. Clearing emits null; the parent must apply updates to keep the selected state synchronized.',
    },
    clear: {
        zh: '点击面板清除按钮时触发，随后发出 update:modelValue(null)。',
        en: 'Emitted when the panel Clear button is clicked, followed by update:modelValue(null).',
    },
    confirm: {
        zh: '点击面板确认按钮时触发，携带当前 modelValue，包括未选择时的 null。',
        en: 'Emitted when the panel Confirm button is clicked, carrying the current modelValue, including null when nothing is selected.',
    },
} satisfies Record<string, ApiSemantic>

const dateBounds = {
    minDate: {
        zh: '传给日历的最早可选日期；单日期快捷项按本地年月日比较，早于该日的快捷值会被忽略。',
        en: 'The earliest selectable date passed to the calendar. Single-date shortcuts are compared by local calendar date, and values before this day are ignored.',
    },
    maxDate: {
        zh: '传给日历的最晚可选日期；单日期快捷项按本地年月日比较，晚于该日的快捷值会被忽略。',
        en: 'The latest selectable date passed to the calendar. Single-date shortcuts are compared by local calendar date, and values after this day are ignored.',
    },
} satisfies Record<string, ApiSemantic>

const rangeBounds = {
    minDate: {
        zh: '传给范围日历的最早可选日期；快捷范围直接作为更新值发出，需由调用方保证快捷项符合边界。',
        en: 'The earliest selectable date passed to the range calendar. Shortcut ranges are emitted directly, so the caller must supply shortcuts within the bounds.',
    },
    maxDate: {
        zh: '传给范围日历的最晚可选日期；快捷范围直接作为更新值发出，需由调用方保证快捷项符合边界。',
        en: 'The latest selectable date passed to the range calendar. Shortcut ranges are emitted directly, so the caller must supply shortcuts within the bounds.',
    },
} satisfies Record<string, ApiSemantic>

const dateTimeBounds = {
    minDate: {
        zh: '日历选择下界，同时限制日期、时间和快捷项更新后的完整时间；早于下界的更新值会收敛到该 Date。',
        en: 'The lower calendar bound, also applied to the complete datetime after date, time, or shortcut updates. Earlier updates are clamped to this Date.',
    },
    maxDate: {
        zh: '日历选择上界，同时限制日期、时间和快捷项更新后的完整时间；当边界的时、分、秒均为零时，允许该边界日内的其他时间。',
        en: 'The upper calendar bound, also applied after date, time, or shortcut updates. When the boundary hours, minutes, and seconds are all zero, other times on that same calendar day remain allowed.',
    },
} satisfies Record<string, ApiSemantic>

const weekBounds = {
    minDate: {
        zh: '传给周选择日历的最早可选日期。选中后转换为周起始日，结果可能早于该边界；快捷项也直接转换为周起始日。',
        en: 'The earliest selectable date passed to the week calendar. Selection is converted to the week start, which can precede this bound; shortcuts are also converted directly to week starts.',
    },
    maxDate: {
        zh: '传给周选择日历的最晚可选日期。该限制针对日历中的选日，不要求整周位于边界内；快捷项需由调用方保证范围有效。',
        en: 'The latest selectable date passed to the week calendar. It constrains the selected calendar day rather than requiring the entire week to fit; callers must supply valid shortcut ranges.',
    },
} satisfies Record<string, ApiSemantic>

const monthBounds = {
    minDate: {
        zh: '月份选择下界；月末日期早于该值的月份不可选，选择或跨年确认得到的月初值会收敛到此下界。',
        en: 'The lower month-selection bound. Months whose last calendar date precedes it are disabled, and a first-of-month value produced by selection or confirmation after year navigation is clamped to this bound.',
    },
    maxDate: {
        zh: '月份选择上界；月初晚于该值的月份不可选，选择或跨年确认得到的值会收敛到此上界。',
        en: 'The upper month-selection bound. Months starting after it are disabled, and values produced by selection or confirmation after year navigation are clamped to this bound.',
    },
} satisfies Record<string, ApiSemantic>

const yearBounds = {
    minDate: {
        zh: '用于禁用年份按钮的下界；某年 12 月 31 日早于该值时，该年不可选。选择仍保留基准日期的月日，不会按完整日期收敛到边界。',
        en: 'The lower bound used to disable year buttons. A year is disabled when its December 31 precedes this value. Selection retains the base month and day instead of clamping the full date to the bound.',
    },
    maxDate: {
        zh: '用于禁用年份按钮的上界；某年 1 月 1 日晚于该值时，该年不可选。选择仍保留基准日期的月日，不会按完整日期收敛到边界。',
        en: 'The upper bound used to disable year buttons. A year is disabled when its January 1 follows this value. Selection retains the base month and day instead of clamping the full date to the bound.',
    },
} satisfies Record<string, ApiSemantic>

const timeStep = {
    zh: '分别设置小时、分钟和秒的选项步长。步长向下取整，小时最多为 24，分钟和秒最多为 60；当前值不在步进序列中时，仍会作为选项保留。',
    en: 'Sets separate option steps for hours, minutes, and seconds. Steps are rounded down and capped at 24 for hours or 60 for minutes and seconds. A current value outside the step sequence is retained as an option.',
    fallback: {
        'zh-CN': '缺失、非有限数或取整后小于 1 的分量使用步长 1。',
        en: 'A missing, non-finite, or rounded-down value below 1 uses a step of 1.',
    },
} satisfies ApiSemantic

const weekStartsOn = {
    zh: '设置周起始日，0 为周日、1 为周一，同时决定日历首列、整周高亮和选中值的周起始日期；不会从当前语言自动推导。',
    en: 'Sets the week start: 0 for Sunday or 1 for Monday. It controls the first calendar column, week highlight, and start date emitted on selection; it is not inferred from the current locale.',
} satisfies ApiSemantic

const content = {
    complete: true,
    members: {
        DatePicker: {
            props: {
                ...triggerProps,
                ...dateBounds,
                open: openProp,
                modelValue: { zh: '当前选中的单个日期，通过 v-model 绑定；null 表示尚未选择或已清除。', en: 'The selected single date, bound with v-model. null represents an empty or cleared selection.' },
                placeholder: { zh: '没有可显示日期时呈现在触发按钮中的占位文本。', en: 'Placeholder text in the trigger when there is no date to display.', fallback: dateLabelFallback },
                shortcuts: { zh: '日期面板中的快捷选项；每项提供显示标签和 Date 值或返回 Date 的函数，选择后仍需遵守日期上下界。', en: 'Shortcut options in the date panel. Each supplies a label and a Date or function returning a Date; selected shortcuts must satisfy the date bounds.' },
                name: { zh: '原生表单字段名。提供后创建隐藏字段，以 YYYY-MM-DD 提交日期；空值提交空字符串，禁用时不提交。', en: 'The native form field name. When provided, a hidden field submits the date as YYYY-MM-DD, an empty string for an empty value, and nothing when disabled.' },
                ariaLabel: { zh: '日期触发按钮和日期面板的无障碍名称。', en: 'The accessible name for the date trigger and date panel.', fallback: dateLabelFallback },
            },
            events: pickerEvents,
            exposes: pickerExposes,
        },
        DatePickerPanel: {
            props: {
                ...dateBounds,
                modelValue: { zh: '独立日期面板中的当前选中日期，通过 v-model 与调用方同步。', en: 'The currently selected date in the standalone panel, synchronized with the caller through v-model.' },
                shortcuts: { zh: '面板侧栏中的带标签日期快捷项，可提供 Date 或返回 Date 的函数；越过日期上下界的快捷值会被忽略。', en: 'Labeled date shortcuts in the panel sidebar, supplied as Dates or functions returning Dates. Shortcut values outside the date bounds are ignored.' },
                clearable: panelClearable,
                ariaLabel: { zh: '日期面板 dialog 的无障碍名称。', en: 'The accessible name of the date panel dialog.', fallback: dateLabelFallback },
            },
            events: panelEvents,
        },
        DatePickerPanelFooter: {
            props: {
                clearLabel: {
                    zh: '面板页脚清除按钮的文本。',
                    en: 'The text of the panel footer Clear button.',
                    fallback: { 'zh-CN': '为 undefined、null 或空字符串时读取 datePicker.clear，简体中文文案为“清除”。', en: 'When undefined, null, or empty, uses datePicker.clear, whose English text is “Clear”.' },
                },
                confirmLabel: {
                    zh: '面板页脚确认按钮的文本。',
                    en: 'The text of the panel footer Confirm button.',
                    fallback: { 'zh-CN': '为 undefined、null 或空字符串时读取 datePicker.confirm，简体中文文案为“确认”。', en: 'When undefined, null, or empty, uses datePicker.confirm, whose English text is “Confirm”.' },
                },
                disabled: { zh: '同时禁用清除和确认按钮，可在异步处理期间阻止用户重复提交。', en: 'Disables both Clear and Confirm buttons, allowing asynchronous processing to block repeated user submissions.' },
            },
            events: {
                clear: { zh: '启用状态下点击清除按钮时触发，具体清除行为由调用方处理。', en: 'Emitted when the enabled Clear button is clicked. The caller implements the clearing behavior.' },
                confirm: { zh: '启用状态下点击确认按钮时触发，具体确认行为由调用方处理。', en: 'Emitted when the enabled Confirm button is clicked. The caller implements the confirmation behavior.' },
            },
        },
        DatePickerRange: {
            props: {
                ...triggerProps,
                ...rangeBounds,
                modelValue: { zh: '当前起止日期组成的只读元组，通过 v-model 绑定；null 表示空范围。', en: 'The current readonly tuple of start and end dates, bound with v-model. null represents an empty range.' },
                startPlaceholder: { zh: '尚无完整日期范围时，在触发器起始日期位置显示的文本。', en: 'Text shown in the start-date position when no complete date range is available.', fallback: { 'zh-CN': '为 undefined 或 null 时读取 datePicker.startPlaceholder，简体中文文案为“开始日期”。', en: 'When undefined or null, uses datePicker.startPlaceholder, whose English text is “Start date”.' } },
                endPlaceholder: { zh: '尚无完整日期范围时，在触发器结束日期位置显示的文本。', en: 'Text shown in the end-date position when no complete date range is available.', fallback: { 'zh-CN': '为 undefined 或 null 时读取 datePicker.endPlaceholder，简体中文文案为“结束日期”。', en: 'When undefined or null, uses datePicker.endPlaceholder, whose English text is “End date”.' } },
                separator: { zh: '显示在起止日期或对应占位文本之间的分隔文本。', en: 'Separator text displayed between the start and end dates or their placeholders.', fallback: { 'zh-CN': '为 undefined 或 null 时读取 datePicker.separator，简体中文文案为“至”。', en: 'When undefined or null, uses datePicker.separator, whose English text is “to”.' } },
                shortcuts: { zh: '日期范围快捷项，包含标签和起止日期元组或返回该元组的函数；选中后直接更新范围。', en: 'Date-range shortcuts containing a label and a start/end tuple or a function returning one. Selecting a shortcut directly updates the range.' },
                displayFormat: { ...triggerProps.displayFormat, zh: '分别格式化起始和结束日期，支持 YYYY、YY、MM、DD、HH、mm、ss 和 WW；不改变 DateRange 绑定值。WW 遵循 ISO 周数与周所属年份规则。', en: 'Formats the start and end dates separately with YYYY, YY, MM, DD, HH, mm, ss, and WW, while preserving the DateRange value. WW follows ISO week-number and week-year rules.' },
                disabled: { zh: '禁用范围选择触发按钮并隐藏触发器清除按钮。', en: 'Disables the range trigger and hides its clear button.' },
                name: { zh: '传给范围触发按钮的原生 name 属性；此组件不创建用于提交日期范围的隐藏字段。', en: 'The native name attribute passed to the range trigger button. This component does not create a hidden field for submitting the date range.' },
                ariaLabel: { zh: '范围触发按钮和范围面板的无障碍名称，与占位文本独立配置。', en: 'The accessible name of the range trigger and panel, configured separately from placeholder text.', fallback: rangeLabelFallback },
            },
            events: {
                ...popupEvents,
                'update:modelValue': { zh: '日历选择、拖动范围、快捷选择、确认或清除时触发，用于更新 v-model；参数为起止日期元组或 null。', en: 'Emitted on calendar selection, range dragging, shortcut selection, confirmation, or clearing to update v-model, carrying a start/end tuple or null.' },
                change: { zh: '确认或清除范围时立即触发；其他关闭场景中，仅当面板起始或结束日期与当时 modelValue 的时间戳不同才触发。', en: 'Emitted immediately when the range is confirmed or cleared. On other closes, it is emitted only if either panel endpoint differs in timestamp from the current modelValue.' },
            },
        },
        DatePickerRangePanel: {
            props: {
                ...rangeBounds,
                modelValue: { zh: '独立范围面板中的起止日期只读元组，通过 v-model 同步；null 表示空范围。', en: 'The readonly start/end tuple in the standalone range panel, synchronized with v-model. null represents an empty range.' },
                shortcuts: { zh: '侧栏中的范围快捷项。函数值会用于解析显示状态，并在选择时重新求值，选中高亮与该次更新的范围保持一致。', en: 'Range shortcuts in the sidebar. Function values are resolved for display and evaluated again on selection, keeping the active highlight aligned with the emitted range.' },
                clearable: panelClearable,
                ariaLabel: { zh: '日期范围面板 dialog 的无障碍名称。', en: 'The accessible name of the date-range panel dialog.', fallback: rangeLabelFallback },
            },
            events: {
                ...panelEvents,
                'update:modelValue': { zh: '日历范围更新、拖动选区或选择快捷项时触发，携带起止日期元组；清除时传入 null。', en: 'Emitted when the calendar range changes, a selection is dragged, or a shortcut is selected, carrying a start/end tuple. Clearing emits null.' },
                confirm: { zh: '点击确认时触发，携带当前起止日期元组；尚无范围时传入 null。', en: 'Emitted on confirmation with the current start/end tuple, or null when no range is selected.' },
            },
        },
        DateTimePicker: {
            props: {
                ...triggerProps,
                ...dateTimeBounds,
                open: openProp,
                modelValue: { zh: '当前选中的日期和时间，通过 v-model 绑定；更换日期时会保留已有值的时分秒。', en: 'The selected date and time, bound with v-model. Changing the calendar date preserves the hours, minutes, and seconds of an existing value.' },
                showSeconds: { zh: '显示秒选择器，同时决定默认显示格式和隐藏表单字段是否包含秒；关闭后仍保留 Date 中已有的秒值。', en: 'Shows the seconds selector and determines whether the default display format and hidden form value include seconds. Hiding it preserves seconds already present in the Date.' },
                timeStep,
                placeholder: { zh: '没有可显示日期时间时呈现在触发按钮中的占位文本。', en: 'Placeholder text in the trigger when there is no datetime to display.', fallback: dateTimeLabelFallback },
                shortcuts: { zh: '日期时间面板的日期快捷项；已有选中值时保留其时分秒，否则使用快捷值的时间，并将更新结果按日期时间边界收敛。', en: 'Date shortcuts in the datetime panel. An existing selection keeps its time; otherwise the shortcut time is used. Updates are clamped according to the datetime bounds.' },
                displayFormat: { ...triggerProps.displayFormat, fallback: { 'zh-CN': '为 undefined 或 null 时，showSeconds 为真使用 YYYY-MM-DD HH:mm:ss，否则使用 YYYY-MM-DD HH:mm。', en: 'When undefined or null, uses YYYY-MM-DD HH:mm:ss when showSeconds is true, or YYYY-MM-DD HH:mm otherwise.' } },
                clearable: { zh: '显示面板清除按钮；有值且未禁用、未只读时也显示触发器清除按钮。面板确认按钮始终显示。', en: 'Shows the panel Clear button and, when a value exists and the trigger is neither disabled nor read-only, its clear button. The panel Confirm button is always shown.' },
                name: { zh: '原生隐藏表单字段名；按 showSeconds 提交 YYYY-MM-DD HH:mm 或 YYYY-MM-DD HH:mm:ss，与 displayFormat 独立。空值提交空字符串，禁用时不提交。', en: 'The native hidden form field name. It submits YYYY-MM-DD HH:mm or YYYY-MM-DD HH:mm:ss according to showSeconds, independently of displayFormat. Empty values submit an empty string; disabled fields are omitted.' },
                ariaLabel: { zh: '日期时间触发按钮及弹出日期时间面板的无障碍名称。', en: 'The accessible name of the datetime trigger and popup datetime panel.', fallback: dateTimeLabelFallback },
            },
            events: pickerEvents,
            exposes: pickerExposes,
        },
        DateTimePickerPanel: {
            props: {
                ...dateTimeBounds,
                modelValue: { zh: '独立日期时间面板的当前值，同时驱动日历和时间选择器，通过 v-model 同步。', en: 'The current standalone datetime-panel value, driving both calendar and time selectors and synchronized with v-model.' },
                shortcuts: { zh: '带标签的日期快捷项；已有值时合并其时分秒，否则保留快捷值的时间，更新结果按日期时间边界收敛。', en: 'Labeled date shortcuts. They merge the time of an existing value or keep the shortcut time when empty, then clamp the update according to the datetime bounds.' },
                clearable: { zh: '控制面板清除按钮的显示，确认按钮始终显示。', en: 'Controls visibility of the panel Clear button. The Confirm button is always shown.' },
                showSeconds: { zh: '在内嵌时间选择器中显示秒选择项，隐藏时保留已有 Date 中的秒值。', en: 'Shows a seconds selector in the embedded time picker. Hiding it preserves seconds already present in the Date.' },
                timeStep,
                ariaLabel: { zh: '日期时间面板 dialog 的无障碍名称。', en: 'The accessible name of the datetime panel dialog.', fallback: dateTimeLabelFallback },
            },
            events: {
                ...panelEvents,
                'update:modelValue': { zh: '日期、时间或快捷选择变化时，合并并按日期时间边界处理后触发；清除时传入 null。', en: 'Emitted after date, time, or shortcut updates are merged and processed against the datetime bounds. Clearing emits null.' },
            },
        },
        MonthPicker: {
            props: {
                ...triggerProps,
                ...monthBounds,
                open: openProp,
                modelValue: { zh: '用 Date 表示的当前月份，通过 v-model 绑定；选月时从该月第一日生成日期，再按上下界收敛。', en: 'The selected month represented by a Date and bound with v-model. Month selection starts with its first day, then clamps the date to the bounds.' },
                placeholder: { zh: '没有可显示月份时呈现在触发按钮中的占位文本。', en: 'Placeholder text in the trigger when there is no month to display.', fallback: monthLabelFallback },
                name: { zh: '原生隐藏表单字段名，以 YYYY-MM 提交月份，与 displayFormat 独立；空值提交空字符串，禁用时不提交。', en: 'The native hidden form field name, submitting the month as YYYY-MM independently of displayFormat. Empty values submit an empty string; disabled fields are omitted.' },
                ariaLabel: { zh: '月份触发按钮和月份面板的无障碍名称。', en: 'The accessible name of the month trigger and month panel.', fallback: monthLabelFallback },
            },
            events: pickerEvents,
            exposes: pickerExposes,
        },
        MonthPickerPanel: {
            props: {
                ...monthBounds,
                modelValue: { zh: '面板当前月份对应的 Date，并用其年份初始化显示视图；空值初始显示当前年份。', en: 'The Date representing the selected month, whose year initializes the view. An initially empty value displays the current year.' },
                clearable: panelClearable,
                ariaLabel: { zh: '月份面板 dialog 的无障碍名称。', en: 'The accessible name of the month panel dialog.', fallback: monthLabelFallback },
            },
            events: {
                ...panelEvents,
                'update:modelValue': { zh: '选择可用月份时触发，值从该月第一日生成并按上下界收敛；清除时传入 null。', en: 'Emitted when an available month is selected, using its first day clamped to the bounds. Clearing emits null.' },
                confirm: { zh: '确认当前月份；若仅翻年而未重新选月，则以视图年份和已有月份生成日期并按上下界收敛。没有选中值时传入 null。', en: 'Confirms the current month. If the year was changed without selecting another month, it uses the viewed year and existing month, clamped to the bounds. An empty selection emits null.' },
            },
        },
        TimePicker: {
            props: {
                modelValue: { zh: '承载时分秒的 Date，通过 v-model 绑定。更改某个时间分量时保留日期及其他分量；空值显示零，首次选择以本地当天零点为基准。', en: 'The Date carrying hours, minutes, and seconds, bound with v-model. Changing one part preserves the date and other parts. An empty value displays zero and uses local midnight today as the base for the first selection.' },
                showSeconds: { zh: '显示秒选择器；隐藏秒选择器不会清零 Date 中已有的秒值。', en: 'Shows the seconds selector. Hiding it does not reset seconds already present in the Date.' },
                timeStep,
                disabled: { zh: '禁用全部时间下拉框，并阻止小时、分钟和秒的选择回调更新值。', en: 'Disables every time dropdown and prevents hour, minute, and second selection callbacks from updating the value.' },
                embedded: { zh: '启用用于嵌入日期时间面板的布局和边框样式。', en: 'Uses the layout and border styling intended for embedding inside a datetime panel.' },
                ariaLabel: { zh: '包裹时分秒选择器的 group 元素的无障碍名称，各时间下拉框保留对应的国际化标签。', en: 'The accessible name of the group containing the time selectors. Individual dropdowns retain their localized time-part labels.', fallback: timeLabelFallback },
            },
            events: {
                'update:modelValue': { zh: '选择小时、分钟或秒时立即触发，携带更新后的 Date，用于 v-model 同步。', en: 'Emitted immediately when an hour, minute, or second is selected, carrying the updated Date for v-model synchronization.' },
            },
        },
        WeekPicker: {
            props: {
                ...triggerProps,
                ...weekBounds,
                open: openProp,
                modelValue: { zh: '表示当前周的 Date，通过 v-model 绑定；从面板选择日期或快捷项后，返回 weekStartsOn 指定的周起始日零点。', en: 'The Date representing the selected week, bound with v-model. Calendar or shortcut selection returns local midnight at the week start specified by weekStartsOn.' },
                weekStartsOn,
                placeholder: { zh: '没有可显示周次时呈现在触发按钮中的占位文本。', en: 'Placeholder text in the trigger when there is no week to display.', fallback: weekLabelFallback },
                shortcuts: { zh: '周选择快捷项，值可为 Date 或返回 Date 的函数；选中时转换为 weekStartsOn 指定的周起始日。', en: 'Week shortcuts supplied as Dates or functions returning Dates. Selection converts the value to the week start specified by weekStartsOn.' },
                name: { zh: '原生隐藏表单字段名，以 YYYY-MM-DD 提交当前 Date，与周次显示格式独立；空值提交空字符串，禁用时不提交。', en: 'The native hidden form field name, submitting the current Date as YYYY-MM-DD independently of the week display format. Empty values submit an empty string; disabled fields are omitted.' },
                ariaLabel: { zh: '周选择触发按钮和周选择面板的无障碍名称。', en: 'The accessible name of the week trigger and week panel.', fallback: weekLabelFallback },
            },
            events: pickerEvents,
            exposes: pickerExposes,
        },
        WeekPickerPanel: {
            props: {
                ...weekBounds,
                modelValue: { zh: '面板当前周对应的日期，按其所在周绘制整周高亮；选择更新时返回周起始日。', en: 'The date identifying the selected week. Its whole week is highlighted, and selection updates return the week start.' },
                weekStartsOn,
                shortcuts: { zh: '侧栏中的带标签日期快捷项，选中和高亮比较都使用对应的周起始日。', en: 'Labeled date shortcuts in the sidebar. Selection and active-state comparison both use the corresponding week start.' },
                clearable: panelClearable,
                ariaLabel: { zh: '周选择面板 dialog 的无障碍名称。', en: 'The accessible name of the week panel dialog.', fallback: weekLabelFallback },
            },
            events: {
                ...panelEvents,
                'update:modelValue': { zh: '选择日历日期或快捷项时触发，携带按 weekStartsOn 对齐的本地周起始日零点；清除时传入 null。', en: 'Emitted on calendar or shortcut selection with local midnight at the week start aligned to weekStartsOn. Clearing emits null.' },
            },
        },
        YearPicker: {
            props: {
                ...triggerProps,
                ...yearBounds,
                open: openProp,
                modelValue: { zh: '用 Date 表示的当前年份，通过 v-model 绑定；选择年份时保留已有值的月日，空值以当天月日为基准，闰日会收敛至有效日期。', en: 'The selected year represented by a Date and bound with v-model. Year selection preserves the existing month and day or uses today when empty, adjusting a leap day to a valid date.' },
                placeholder: { zh: '没有可显示年份时呈现在触发按钮中的占位文本。', en: 'Placeholder text in the trigger when there is no year to display.', fallback: yearLabelFallback },
                name: { zh: '原生隐藏表单字段名，以 YYYY 提交年份，与 displayFormat 独立；空值提交空字符串，禁用时不提交。', en: 'The native hidden form field name, submitting the year as YYYY independently of displayFormat. Empty values submit an empty string; disabled fields are omitted.' },
                ariaLabel: { zh: '年份触发按钮和年份面板的无障碍名称。', en: 'The accessible name of the year trigger and year panel.', fallback: yearLabelFallback },
            },
            events: pickerEvents,
            exposes: pickerExposes,
        },
        YearPickerPanel: {
            props: {
                ...yearBounds,
                modelValue: { zh: '面板当前年份对应的 Date，用于初始化所处年代；清空后视图回到当前年份所在年代。', en: 'The Date representing the selected year and initializing the viewed decade. Clearing returns the view to the decade containing the current year.' },
                clearable: panelClearable,
                yearRange: {
                    zh: '每页展示的连续年份数量，同时作为前后翻页步幅；初始视图起点仍为所选年份或当前年份所在年代的起始年。',
                    en: 'The number of consecutive years per page and the step for previous/next navigation. The initial view still starts at the decade boundary of the selected or current year.',
                    fallback: { 'zh-CN': '向下取整后不是有限数或小于 1 时，使用 DEFAULT_YEAR_RANGE。', en: 'If rounding down yields a non-finite number or a value below 1, uses DEFAULT_YEAR_RANGE.' },
                },
                ariaLabel: { zh: '年份面板 dialog 的无障碍名称。', en: 'The accessible name of the year panel dialog.', fallback: yearLabelFallback },
            },
            events: {
                ...panelEvents,
                'update:modelValue': { zh: '选择可用年份时触发，以已有日期或当天的月日生成本地零点日期；2 月 29 日切换到平年时收敛为 2 月 28 日。清除时传入 null。', en: 'Emitted when an available year is selected, using the existing or current month and day at local midnight. February 29 becomes February 28 in a non-leap year. Clearing emits null.' },
                confirm: { zh: '确认当前年份。若已有值不在当前页面的年份范围中，则改用该页起始年份并保留月日，闰日会收敛至有效日期；空值传入 null。', en: 'Confirms the current year. If the existing value is outside the visible year range, it uses the first visible year while preserving month and day and adjusting leap days. An empty value emits null.' },
            },
        },
    },
} satisfies ApiContent

export default content
