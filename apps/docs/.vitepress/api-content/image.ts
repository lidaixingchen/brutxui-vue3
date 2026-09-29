import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Image: {
            props: {
                src: { zh: '必填的主图片 URL；预览列表为空时也作为预览器的唯一图片。', en: 'The required primary image URL. It is also the preview viewer’s only image when previewSrcList is empty.' },
                alt: { zh: '传递给原生 img 的替代文本；应说明图片内容以供辅助技术读取。', en: 'Alternative text passed to the native img element; describe the image for assistive technology.' },
                fit: { zh: '设置图片的 CSS object-fit 填充模式。', en: 'Sets the image’s CSS object-fit mode.' },
                previewSrcList: { zh: '设置预览器可切换的图片 URL 列表；包含多个地址时会显示上一张和下一张操作。', en: 'Provides the image URLs navigable in the preview viewer. Previous and next controls appear when the list has multiple entries.' },
                initialIndex: { zh: '设置打开预览器时选中的列表索引。', en: 'Sets the list index selected when the preview viewer opens.' },
                hideOnClickModal: { zh: '启用后，点击预览遮罩关闭预览；关闭时焦点会归还到打开预览前的元素。', en: 'When enabled, clicking the preview backdrop closes the viewer and returns focus to the element that opened it.' },
                zoomRate: { zh: '设置每次放大或缩小操作所用的缩放倍率。', en: 'Sets the multiplier applied by each zoom-in or zoom-out action.' },
                preview: { zh: '启用图片预览器及其缩放、拖拽和多图切换交互。', en: 'Enables the image preview viewer with zoom, drag, and multi-image navigation.' },
                fallback: { zh: '主图片加载失败后尝试加载的备用图片 URL；备用图片也失败时才进入错误状态并发出 error。', en: 'A fallback image URL tried after the primary image fails. The component enters its error state and emits error only if the fallback also fails.' },
                loading: { zh: '选择 eager 立即加载或 lazy 在元素接近视口时通过 IntersectionObserver 延迟加载。', en: 'Selects eager loading or lazy loading, which uses IntersectionObserver to defer loading until the image approaches the viewport.' },
            },
            events: {
                close: { zh: '预览器关闭时发出；关闭时组件会尝试将焦点恢复到打开预览前的活动元素。', en: 'Emitted when the preview viewer closes; the component then attempts to restore focus to the previously active element.' },
                error: { zh: '主图片加载失败且备用图片也未能加载时，携带最后一次原生图片错误事件发出。', en: 'Emitted with the final native image error event when both the primary and fallback images fail to load.' },
                load: { zh: '图片成功加载时携带原生图片事件发出；备用图片加载成功也会触发。', en: 'Emitted with the native image event when an image loads successfully, including a successful fallback image.' },
                show: { zh: '预览器打开时发出。', en: 'Emitted when the preview viewer opens.' },
                switch: { zh: '预览器切换到另一张图片后，携带新的图片列表索引发出。', en: 'Emitted with the new image-list index after the preview viewer switches images.' },
            },
            slots: {
                placeholder: { zh: '图片加载期间渲染自定义占位内容；未提供时显示组件内置的加载占位。', en: 'Renders custom content while the image is loading; the built-in loading placeholder is used when omitted.' },
                error: { zh: '图片及备用图片加载失败后渲染自定义错误内容；未提供时显示组件内置的失败占位。', en: 'Renders custom error content after the image and fallback fail; the built-in failure placeholder is used when omitted.' },
            },
        },
    },
} satisfies ApiContent

export default content
