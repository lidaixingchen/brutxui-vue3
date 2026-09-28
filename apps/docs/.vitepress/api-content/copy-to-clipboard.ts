import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        CopyToClipboard: {
            props: {
                text: { zh: '用户激活复制操作时写入剪贴板的文本。', en: 'The text written to the clipboard when the user activates the copy action.' },
                duration: { zh: '成功或失败状态反馈在界面上保持的时长，单位为毫秒。', en: 'How long success or failure feedback remains visible, in milliseconds.' },
                variant: { zh: '设置复制按钮的默认、主色或描边视觉样式。', en: 'Sets the copy button to the default, primary, or outline visual style.' },
                size: { zh: '设置复制按钮的尺寸预设。', en: 'Sets the preset size of the copy button.' },
                class: { zh: '追加到复制按钮容器的自定义 CSS 类。', en: 'Custom CSS classes added to the copy button container.' },
                iconSize: { zh: '设置复制及状态图标的尺寸。', en: 'Sets the size of the copy and status icons.' },
            },
            slots: {
                default: { zh: '自定义复制按钮内容；作用域提供 copied 成功状态和 failed 最近一次复制失败状态。', en: 'Customizes the copy button content; its scope exposes the copied success state and failed state of the most recent copy.' },
            },
        },
    },
} satisfies ApiContent

export default content
