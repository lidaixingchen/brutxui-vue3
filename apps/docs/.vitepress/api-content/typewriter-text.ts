import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        TypewriterText: {
            props: {
                text: { zh: '逐字显示的完整文本内容。', en: 'The full text to reveal one character at a time.' },
                speed: { zh: '每显示一个字符之间的间隔时间，单位为毫秒。', en: 'The delay between revealing characters, in milliseconds.' },
                delay: { zh: '首次开始打字前等待的时间；循环模式下也作为每轮重新开始前的间隔。', en: 'The wait before typing begins; in loop mode it is also the delay before each restart.' },
                loop: { zh: '在文本显示完成后持续循环播放。', en: 'Repeats the typing animation after the text is fully displayed.' },
                cursor: { zh: '显示打字光标；非循环模式下文本完成后光标隐藏。', en: 'Shows the typing cursor; in non-loop mode it hides after typing completes.' },
                size: { zh: '设置打字文本的字号预设。', en: 'Sets the preset font size for the typed text.' },
                weight: { zh: '设置打字文本的字重。', en: 'Sets the font weight of the typed text.' },
                class: { zh: '追加到打字文本根元素的自定义 CSS 类。', en: 'Custom CSS classes added to the typed text root element.' },
            },
            events: {
                complete: { zh: '一轮文本显示完成时发出；循环模式下每轮完成都会触发。', en: 'Emits when one text pass completes; it fires after every pass in loop mode.' },
                start: { zh: '每轮打字动画开始时发出。', en: 'Emits when each typing pass begins.' },
            },
        },
    },
} satisfies ApiContent

export default content
