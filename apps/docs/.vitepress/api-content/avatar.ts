import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Avatar: {
            props: describe({
                variant: ['设置头像回退内容的颜色变体。', 'Sets the color variant used by the avatar fallback content.'],
                size: ['设置头像容器及其内容的尺寸。', 'Sets the size of the avatar container and its content.'],
                shape: ['设置头像容器为方形或圆角形状。', 'Sets the avatar container to a square or rounded shape.'],
                status: ['设置头像右下角的状态指示点；none 时不显示状态点。', 'Sets the status indicator at the avatar’s lower-right corner; none hides the indicator.'],
                lanyard: ['显示顶部吊孔装饰；该装饰层从无障碍树中隐藏。', 'Shows a decorative lanyard grommet at the top; the decoration is hidden from the accessibility tree.'],
                class: ['追加到头像根容器的 CSS 类。', 'CSS classes added to the avatar root container.'],
            }),
            slots: describe({ default: ['组合 AvatarImage 与 AvatarFallback 子组件。', 'Composes the AvatarImage and AvatarFallback subcomponents.'] }),
        },
        AvatarFallback: {
            props: describe({
                delayMs: ['设置图片加载失败或仍在加载时，回退内容出现前的延迟；省略时立即显示。', 'Sets the delay before fallback content appears while the image is loading or unavailable; it appears immediately when omitted.'],
                class: ['追加到回退内容根元素的 CSS 类。', 'CSS classes added to the fallback content root.'],
                asChild: ['将根元素语义和属性合并到唯一的默认插槽子元素上；启用时 as 不生效。', 'Merges the root element’s semantics and attributes into the single default-slot child; when enabled, as is ignored.'],
                as: ['指定根节点渲染成的 HTML 标签或 Vue 组件；asChild 优先。', 'Specifies the HTML tag or Vue component rendered as the root; asChild takes precedence.'],
            }),
            slots: describe({ default: ['图片不可用时显示的文字、图标或其他回退内容。', 'Text, an icon, or other fallback content shown when the image is unavailable.'] }),
        },
        AvatarImage: {
            props: describe({
                src: ['头像图片的 URL。', 'The URL of the avatar image.'],
                alt: ['图片的替代文本；默认空字符串将图片作为装饰内容处理。', 'Alternative text for the image; the default empty string treats it as decorative content.'],
                class: ['追加到头像图片元素的 CSS 类。', 'CSS classes added to the avatar image element.'],
            }),
        },
    },
} satisfies ApiContent

export default content
