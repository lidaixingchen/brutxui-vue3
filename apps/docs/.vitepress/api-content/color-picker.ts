import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        ColorPicker: {
            props: {
                open: { zh: '颜色面板的受控开关状态；与 `v-model:open` 配合控制面板。', en: 'The controlled open state of the color panel, used with `v-model:open`.' },
                size: { zh: '触发按钮及颜色控件的尺寸。', en: 'The size of the trigger and color controls.' },
                modelValue: { zh: '当前颜色字符串；`null` 表示尚未选择颜色，可通过 `v-model` 双向绑定。', en: 'The current color string; `null` means no color is selected. Supports two-way binding with `v-model`.' },
                format: { zh: '颜色值的输入和输出格式：HEX、RGB 或 HSL。', en: 'The input and output color format: HEX, RGB, or HSL.' },
                showAlpha: { zh: '显示透明度滑块，并在输出颜色值中保留 alpha 通道。', en: 'Shows the opacity slider and includes the alpha channel in emitted color values.' },
                presets: { zh: '可选色板；元素可以是颜色字符串或带标签、禁用状态的 `ColorPreset`。未提供时面板使用内置预设。', en: 'Optional swatches as color strings or `ColorPreset` objects with labels and disabled states. The panel uses its built-in presets when omitted.' },
                showPresets: { zh: '控制面板是否显示预设色板。', en: 'Controls whether the panel displays preset swatches.' },
                presetsLabel: { zh: '预设色板区域的可见标题；未提供时使用本地化文案。', en: 'The visible heading for the preset area; localized text is used when omitted.' },
                showHistory: { zh: '控制面板是否显示并维护最近选择的颜色历史。', en: 'Controls whether the panel displays and maintains recently selected colors.' },
                historyMax: { zh: '颜色历史最多保留的条目数。', en: 'The maximum number of entries retained in color history.' },
                historyStorageKey: { zh: '颜色历史写入 `localStorage` 时使用的键名。', en: 'The `localStorage` key used to persist color history.' },
                showInput: { zh: '在触发按钮中显示颜色文本；关闭后只保留色块和占位文本。', en: 'Shows the color text in the trigger. When false, the trigger shows the swatch and placeholder only.' },
                placeholder: { zh: '没有有效颜色时显示的占位文本，同时作为无障碍名称的本地化回退来源。', en: 'Placeholder text shown when there is no valid color; it is also the localized fallback for the accessible name.' },
                disabled: { zh: '禁用触发按钮和清除操作，并阻止打开颜色面板。', en: 'Disables the trigger and clear action and prevents opening the color panel.' },
                clearable: { zh: '有颜色值且未禁用时显示清除按钮。', en: 'Shows a clear button when a color is selected and the control is enabled.' },
                name: { zh: '表单字段名；设置后渲染隐藏 input 提交当前颜色，禁用时该值不参与表单提交。', en: 'The form field name. When set, a hidden input submits the current color; a disabled control is excluded from form submission.' },
                id: { zh: '设置触发按钮的原生 HTML `id`。', en: 'Sets the native HTML `id` on the trigger button.' },
                ariaLabel: { zh: '触发按钮的无障碍名称；未提供时回退到本地化占位文本。', en: 'The accessible name of the trigger; localized placeholder text is used when omitted.' },
                class: { zh: '追加到颜色选择器触发按钮的 CSS 类，支持 `ClassValue` 的数组和对象形式。', en: 'CSS classes added to the color picker trigger. Supports array and object forms accepted by `ClassValue`.' },
            },
            events: {
                'update:modelValue': { zh: '颜色输入、拖动选择或清除时发出新的格式化颜色值；清除后为 `null`。', en: 'Emits the formatted color as it is typed, selected by dragging, or cleared; clearing emits `null`.' },
                open: { zh: '面板打开时发出，不带参数。', en: 'Emitted without a payload when the panel opens.' },
                close: { zh: '面板关闭时发出，不带参数。', en: 'Emitted without a payload when the panel closes.' },
                'update:open': { zh: '面板开关状态变化时发出新布尔值，用于更新受控的 `open`。', en: 'Emits the new boolean open state so a controlled `open` value can be updated.' },
                change: { zh: '用户确认或清除颜色时发出最终值；与拖动过程中的 `update:modelValue` 区分。', en: 'Emits the final value when the user confirms or clears a color, separate from intermediate `update:modelValue` changes.' },
            },
            exposes: {
                open: { zh: '面板开关状态的 `Ref`；通过组件实例读取或写入可程序化打开、关闭面板。', en: 'A `Ref` for the panel open state. Read or write it through the component instance to open or close the panel programmatically.' },
            },
        },
        ColorPickerHistory: {
            props: {
                history: { zh: '要展示的历史颜色字符串列表；非法颜色会被过滤。', en: 'The list of historical color strings to display; invalid colors are filtered out.' },
                modelValue: { zh: '当前颜色，用于高亮与历史颜色归一化后相同的色块。', en: 'The current color, used to highlight a swatch with the same normalized color value.' },
                size: { zh: '历史色块的尺寸。', en: 'The size of the history swatches.' },
                ariaLabel: { zh: '历史颜色分组的无障碍名称；未提供时使用本地化标题。', en: 'The accessible name of the history group; a localized heading is used when omitted.' },
                clearLabel: { zh: '清空历史按钮的无障碍名称；未提供时使用本地化文案。', en: 'The accessible name of the clear-history button; localized text is used when omitted.' },
            },
            events: {
                clear: { zh: '用户激活清空按钮时发出，不带参数。', en: 'Emitted without a payload when the user activates the clear button.' },
                select: { zh: '用户选择有效历史色块时发出该颜色字符串。', en: 'Emits the color string when the user selects a valid history swatch.' },
            },
        },
        ColorPickerInput: {
            props: {
                modelValue: { zh: '当前颜色；有效颜色会按 `format` 归一化显示，`null` 时输入框为空。', en: 'The current color. Valid values are displayed in the requested `format`; `null` leaves the input empty.' },
                format: { zh: '输入框颜色值归一化及输出时使用的格式。', en: 'The format used to normalize and emit the input value.' },
                showAlpha: { zh: '格式化颜色值时是否保留透明度通道。', en: 'Whether formatted color values include the alpha channel.' },
                disabled: { zh: '禁用原生文本输入。', en: 'Disables the native text input.' },
                ariaLabel: { zh: '文本输入框的无障碍名称。', en: 'The accessible name of the text input.' },
            },
            events: {
                'update:modelValue': { zh: '输入值为空或解析为有效颜色时发出；无效文本不会更新颜色值。', en: 'Emitted when the input is empty or contains a valid color; invalid text does not update the color value.' },
                confirm: { zh: '按 Enter 或离开输入框时确认有效颜色或空值；无效文本会恢复为当前 model 值。', en: 'Confirms a valid color or empty value on Enter or blur; invalid text is restored from the current model value.' },
            },
        },
        ColorPickerPanel: {
            props: {
                modelValue: { zh: '面板当前颜色；`null` 表示没有已选颜色。', en: 'The panel current color; `null` means no color is selected.' },
                format: { zh: '面板产生和格式化颜色值时使用的颜色格式。', en: 'The color format used when the panel creates and formats color values.' },
                showAlpha: { zh: '显示透明度控件并在颜色值中包含 alpha 通道。', en: 'Shows the opacity control and includes the alpha channel in color values.' },
                presets: { zh: '色板内容，可传字符串或 `ColorPreset`；未提供时使用内置默认色板。', en: 'Swatches as strings or `ColorPreset` objects. The built-in palette is used when omitted.' },
                showPresets: { zh: '是否渲染预设色板区域。', en: 'Whether to render the preset swatches section.' },
                presetsLabel: { zh: '预设区域标题；未提供时使用本地化文案。', en: 'The preset-section heading; localized text is used when omitted.' },
                showHistory: { zh: '是否显示颜色历史区域。', en: 'Whether to display the color history section.' },
                historyMax: { zh: '历史记录保留的最大颜色数量。', en: 'The maximum number of colors retained in history.' },
                historyStorageKey: { zh: '传给颜色历史存储逻辑的 `localStorage` 键名。', en: 'The `localStorage` key passed to the color-history storage logic.' },
                showInput: { zh: '是否显示可编辑的颜色文本输入框。', en: 'Whether to show the editable color text input.' },
                clearable: { zh: '是否显示清除当前颜色的操作。', en: 'Whether to show the action for clearing the current color.' },
                size: { zh: '面板色块及控件的尺寸。', en: 'The size of the panel swatches and controls.' },
            },
            events: {
                'update:modelValue': { zh: '颜色通过面板控件变化时发出新值。', en: 'Emits the new value when a panel control changes the color.' },
                clear: { zh: '用户清除当前颜色时发出，不带参数。', en: 'Emitted without a payload when the user clears the current color.' },
                confirm: { zh: '用户确认面板颜色时发出最终颜色值。', en: 'Emits the final color value when the user confirms the panel selection.' },
            },
        },
        ColorPickerSwatch: {
            props: {
                value: { zh: '色块表示的颜色字符串；无效颜色禁用该按钮。', en: 'The color string represented by the swatch; invalid colors disable the button.' },
                label: { zh: '色块提示文本，并作为无障碍名称的回退值。', en: 'The swatch tooltip and fallback accessible name.' },
                selected: { zh: '是否将色块标记为选中，并反映到 `aria-pressed`。', en: 'Whether the swatch is selected, also reflected by `aria-pressed`.' },
                disabled: { zh: '禁用色块的鼠标和键盘选择。', en: 'Disables mouse and keyboard selection of the swatch.' },
                size: { zh: '按钮色块的尺寸。', en: 'The size of the swatch button.' },
                ariaLabel: { zh: '显式设置色块按钮的无障碍名称；优先于 `label` 和颜色值。', en: 'Explicitly sets the swatch button accessible name, taking precedence over `label` and the color value.' },
            },
            events: {
                select: { zh: '有效且未禁用的色块被激活时发出其颜色字符串。', en: 'Emits the color string when a valid, enabled swatch is activated.' },
            },
        },
    },
} satisfies ApiContent

export default content
