import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        CardWindowHeader: {
            props: {
                title: { zh: '居中显示的窗口标题，采用等宽字体和大写样式，超长内容截断。', en: 'The centered window title, styled in uppercase monospace text and truncated when too long.' },
                showControls: { zh: '在没有 actions 插槽且三个交互按钮均未开启时，显示右侧静态 ASCII 控制符。', en: 'Shows static ASCII controls on the right when there is no actions slot and none of the three interactive controls are enabled.' },
                closable: { zh: '启用右侧关闭按钮；actions 插槽存在时该按钮由插槽替代。', en: 'Enables the close button on the right; an actions slot replaces this button.' },
                minimizable: { zh: '启用右侧最小化按钮；actions 插槽存在时该按钮由插槽替代。', en: 'Enables the minimize button on the right; an actions slot replaces this button.' },
                maximizable: { zh: '启用右侧最大化按钮；actions 插槽存在时该按钮由插槽替代。', en: 'Enables the maximize button on the right; an actions slot replaces this button.' },
                interactiveLamps: {
                    zh: '让左侧指示灯可触发对应操作：红色关闭、黄色最小化、绿色最大化。',
                    en: 'Makes the left lamps trigger their corresponding actions: red closes, yellow minimizes, and green maximizes.',
                    notes: { 'zh-CN': ['三个交互按钮均未开启时，三盏灯均可交互；启用任一按钮后，仅对应已启用操作的灯可交互。actions 插槽不替换左侧指示灯。'], en: ['When none of the three controls is enabled, all lamps are interactive. Otherwise, only lamps for enabled actions are interactive. The actions slot does not replace the left lamps.'] },
                },
                closeAriaLabel: {
                    zh: '右侧关闭按钮的无障碍名称。', en: 'The accessible name of the close button on the right.',
                    fallback: { 'zh-CN': '去除首尾空白后为空或未提供时，使用 cardWindowHeader.close 语言文案。', en: 'When omitted or blank after trimming, uses the localized cardWindowHeader.close message.' },
                },
                minimizeAriaLabel: {
                    zh: '右侧最小化按钮的无障碍名称。', en: 'The accessible name of the minimize button on the right.',
                    fallback: { 'zh-CN': '去除首尾空白后为空或未提供时，使用 cardWindowHeader.minimize 语言文案。', en: 'When omitted or blank after trimming, uses the localized cardWindowHeader.minimize message.' },
                },
                maximizeAriaLabel: {
                    zh: '右侧最大化按钮的无障碍名称。', en: 'The accessible name of the maximize button on the right.',
                    fallback: { 'zh-CN': '去除首尾空白后为空或未提供时，使用 cardWindowHeader.maximize 语言文案。', en: 'When omitted or blank after trimming, uses the localized cardWindowHeader.maximize message.' },
                },
                class: { zh: '合并到窗口标题栏根容器的自定义 CSS 类。', en: 'Custom CSS classes merged onto the window header root container.' },
            },
            events: {
                close: { zh: '激活关闭按钮或可交互的红色指示灯时发出；由使用方执行实际关闭。', en: 'Emitted when the close button or interactive red lamp is activated. The consumer performs the actual close action.' },
                minimize: { zh: '激活最小化按钮或可交互的黄色指示灯时发出；由使用方执行实际折叠或最小化。', en: 'Emitted when the minimize button or interactive yellow lamp is activated. The consumer performs the actual collapse or minimize action.' },
                maximize: { zh: '激活最大化按钮或可交互的绿色指示灯时发出；由使用方执行实际展开或最大化。', en: 'Emitted when the maximize button or interactive green lamp is activated. The consumer performs the actual expand or maximize action.' },
            },
            slots: {
                actions: { zh: '替换整个右侧操作区，优先于内置交互按钮和静态 ASCII 控制符。', en: 'Replaces the entire right actions area, taking precedence over built-in interactive buttons and static ASCII controls.' },
            },
        },
    },
} satisfies ApiContent

export default content
