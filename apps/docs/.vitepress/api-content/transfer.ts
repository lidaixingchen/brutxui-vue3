import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Transfer: {
            props: {
                class: { zh: '追加到穿梭框根容器的自定义 CSS 类。', en: 'Custom CSS classes added to the transfer root container.' },
                modelValue: { zh: '右侧目标面板中已选项目的 key 列表，通过 v-model 双向绑定。', en: 'The keys of items in the right target panel, bound with v-model.' },
                data: { zh: '穿梭框数据源；每项提供 key 和 label，并可用 disabled 禁止移动。', en: 'The transfer data source. Each item has a key and label, and may be disabled to prevent moving it.' },
                filterable: { zh: '在左右面板显示过滤输入框。', en: 'Shows a filter input in each panel.' },
                filterMethod: { zh: '自定义查询与项目匹配函数；返回 true 的项目保留在过滤结果中。', en: 'Custom query-to-item matcher; return true to keep an item in the filtered results.' },
                titles: { zh: '按源面板、目标面板顺序指定两侧标题；未提供完整标题时使用本地化默认文案。', en: 'Sets the source and target panel titles in order; localized defaults are used when both titles are not supplied.' },
                buttonTexts: { zh: '按左移、右移顺序设置两个穿梭按钮的文字；未提供时按钮仅显示方向图标。', en: 'Sets the left and right transfer button labels in order; direction icons are shown when labels are omitted.' },
                panelWidth: { zh: '设置左右面板各自的宽度，单位为像素。', en: 'Sets the width of each panel in pixels.' },
                panelHeight: { zh: '设置左右面板的高度，单位为像素。', en: 'Sets the height of each panel in pixels.' },
            },
            events: {
                'update:modelValue': { zh: '右侧目标列表的 key 集合变化时发出新数组，用于更新 v-model。', en: 'Emits the updated target key array when the right-side selection changes so v-model can be updated.' },
                change: { zh: '项目在左右面板之间移动时发出更新后的目标 key 列表、移动方向和本次移动的 key。', en: 'Emits the updated target keys, movement direction, and keys moved in this operation.' },
            },
        },
    },
} satisfies ApiContent

export default content
