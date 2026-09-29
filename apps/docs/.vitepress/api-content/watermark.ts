import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Watermark: {
            props: {
                width: { zh: '设置单个水印图块的宽度，单位为像素。', en: 'Sets the width in pixels of a single watermark tile.' },
                height: { zh: '设置单个水印图块的高度，单位为像素。', en: 'Sets the height in pixels of a single watermark tile.' },
                rotate: { zh: '设置水印图案的旋转角度，单位为度；默认值 -22 表示逆时针倾斜。', en: 'Sets the watermark rotation in degrees; the default -22 tilts it counterclockwise.' },
                zIndex: { zh: '设置水印覆盖层的 CSS z-index。', en: 'Sets the CSS z-index of the watermark overlay.' },
                image: { zh: '设置作为水印的图片 URL 或 Data URL；提供图片时使用图片图案而不绘制文本内容。', en: 'Sets a watermark image URL or Data URL. When provided, the image is used instead of text content.' },
                content: { zh: '设置水印文本；传入字符串数组可在单个图块中排布多行。', en: 'Sets the watermark text. A string array lays out multiple lines in a tile.' },
                font: { zh: '配置文字水印的颜色、字号、字重、字形和字体族；默认使用 14px sans-serif 常规字重，颜色跟随 --brutal-fg 并以 15% 不透明度绘制。', en: 'Configures text watermark color, size, weight, style, and family. By default it uses 14px sans-serif with normal weight and draws --brutal-fg at 15% opacity.' },
                gap: { zh: '设置相邻水印图块在水平方向和垂直方向的间距，顺序为 [gapX, gapY]。', en: 'Sets horizontal and vertical spacing between watermark tiles as [gapX, gapY].' },
                offset: { zh: '设置水印平铺起点在水平和垂直方向上的偏移，顺序为 [offsetX, offsetY]。', en: 'Offsets the starting point of the watermark tiling horizontally and vertically as [offsetX, offsetY].' },
                seal: { zh: '启用复古印章装饰，在图块中绘制双圆环和中心五角星。', en: 'Adds a vintage seal treatment with two circular rings and a centered five-point star in each tile.' },
            },
            slots: {
                default: { zh: '水印覆盖的宿主内容；组件在其上方平铺装饰性水印。', en: 'The host content covered by the watermark; the component tiles the decorative watermark over it.' },
            },
        },
    },
} satisfies ApiContent

export default content
