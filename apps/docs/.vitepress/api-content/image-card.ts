import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        ImageCard: {
            props: {
                src: { zh: '图片元素使用的资源地址。', en: 'The resource URL used by the image element.' },
                alt: { zh: '图片替代文本；空字符串表示图片仅作装饰。', en: 'Alternative text for the image; an empty string marks it as decorative.' },
                aspect: { zh: '设置图片区域的宽高比；video 对应 16:9，square 为正方形，4/3 为 4:3。', en: 'Sets the image area ratio: video is 16:9, square is 1:1, and 4/3 is 4:3.' },
                accent: { zh: '设置底栏使用的主题色族。', en: 'Sets the theme color family used by the footer.' },
                title: { zh: '显示在底栏中的标题文本。', en: 'The title text displayed in the footer.' },
                description: { zh: '显示在底栏标题附近的描述文本。', en: 'The description text displayed alongside the footer title.' },
                class: { zh: '追加到图片卡片根元素的自定义 CSS 类值。', en: 'Custom CSS class values added to the image card root element.' },
            },
            slots: {
                default: { zh: '替换默认底栏内容；未提供标题、描述和插槽内容时，组件省略底栏并只显示图片。', en: 'Replaces the default footer content. When title, description, and slot content are all absent, the footer is omitted and only the image is shown.' },
            },
        },
    },
} satisfies ApiContent

export default content
