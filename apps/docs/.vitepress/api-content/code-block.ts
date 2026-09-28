import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        CodeBlock: {
            props: {
                code: { zh: '必填的原始代码文本，用于内置语法高亮、行号和复制操作。', en: 'The required raw source text used for built-in highlighting, line numbers, and copying.' },
                language: { zh: '设置语法高亮语言和顶栏徽章；未指定时按 plaintext 处理，支持的语言及别名见页面语言列表。', en: 'Sets the syntax-highlighting language and header badge. It defaults to plaintext; see the page language list for supported languages and aliases.' },
                filename: { zh: '在代码块顶栏显示文件名或路径。', en: 'Displays a file name or path in the code block header.' },
                showLineNumbers: { zh: '在代码左侧显示与 code 文本行数对应的行号。', en: 'Displays line numbers beside the lines in the code text.' },
                maxLines: { zh: '限制折叠状态下可见的最大代码行数；超出时提供展开和收起操作，未设置时不限制。', en: 'Limits the visible code lines while collapsed. Expand and collapse controls appear when the code exceeds the limit; no limit is applied when omitted.' },
                class: { zh: '追加到代码卡片根容器的 CSS 类。', en: 'Additional CSS classes applied to the code card root container.' },
            },
            slots: {
                default: { zh: '可选的自定义代码渲染内容；提供后跳过内置 Prism 高亮并直接渲染插槽。复制文本和行号仍以 code 属性为准。', en: 'Optional custom code rendering. When provided, built-in Prism highlighting is skipped and the slot is rendered directly; copied text and line numbers still come from the code prop.' },
            },
        },
    },
} satisfies ApiContent

export default content
