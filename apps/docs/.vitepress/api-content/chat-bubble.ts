import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        ChatBubble: {
            props: {
                message: { zh: '要展示的聊天消息对象，包含 id、content、角色、时间戳以及可选头像和状态信息。', en: 'The chat message to display, including its id, content, role, timestamp, and optional avatar and status data.' },
                color: { zh: '设置 sent 角色气泡的配色；received 和 system 角色不受此属性影响。', en: 'Sets the color of sent-role bubbles; received and system roles are unaffected.' },
                size: { zh: '设置气泡内边距和文字尺寸，并同步调整头像尺寸。', en: 'Sets bubble padding and text size and adjusts the avatar size to match.' },
                showAvatar: { zh: '控制头像区域的显示；system 角色始终不显示头像。', en: 'Controls the avatar area; system-role messages never display an avatar.' },
                showStatus: { zh: '控制发送状态图标的显示；状态图标只用于 sent 角色。', en: 'Controls the send-status icon; the status icon is used only for sent-role messages.' },
                showTimestamp: { zh: '控制消息时间戳的显示。', en: 'Controls whether the message timestamp is displayed.' },
                dateFormat: { zh: '自定义消息日期和时间的格式化函数；未提供时使用 Date.toLocaleString。', en: 'Custom formatter for the message date and time; Date.toLocaleString is used when omitted.' },
                class: { zh: '追加到消息气泡根元素的自定义 CSS 类。', en: 'Custom CSS classes added to the message bubble root element.' },
            },
            slots: {
                default: { zh: '替换消息主体内容；未提供时显示 message.content。', en: 'Replaces the message body; message.content is shown when omitted.' },
            },
        },
        ChatContainer: {
            props: {
                messages: { zh: '按顺序展示的聊天消息数组。', en: 'The ordered array of chat messages to display.' },
                groupByTime: {
                    zh: '启用按真实日历日期和时间间隔对消息分组，并显示日期或时刻分隔标签。',
                    en: 'Groups messages by calendar date and time interval and displays date or time separators.',
                    notes: {
                        'zh-CN': [
                            '有效时间戳按升序排序；缺失或无法解析的时间戳消息保留在输入数组对应位置和相对顺序。',
                            '日期边界按真实年月日判断，不依赖 dateFormat 的输出；同一天内相邻消息间隔超过 groupInterval 分钟时另起时间分组。',
                        ],
                        en: [
                            'Messages with valid timestamps are sorted in ascending order; messages with missing or unparseable timestamps remain anchored to their input positions and keep their relative order.',
                            'Date boundaries use the actual year, month, and day rather than dateFormat output. Within one date, adjacent messages more than groupInterval minutes apart start a separate time group.',
                        ],
                    },
                },
                groupInterval: { zh: '同一日期内相邻消息允许归入同一时间组的最大间隔，单位为分钟；小于 1 的值按 1 分钟处理。', en: 'The maximum gap between adjacent messages in one time group, in minutes; values below 1 are clamped to 1.' },
                showAvatar: { zh: '控制各条消息头像区域的显示。', en: 'Controls whether message avatar areas are displayed.' },
                showStatus: { zh: '控制 sent 消息状态图标的显示。', en: 'Controls whether status icons are displayed for sent messages.' },
                showTimestamp: { zh: '控制各条消息时间戳的显示。', en: 'Controls whether message timestamps are displayed.' },
                dateFormat: { zh: '格式化消息时间和分组标签的函数；未提供时使用本地日期时间格式。', en: 'Formats message times and grouping labels; local date and time formatting is used when omitted.' },
                class: { zh: '追加到聊天容器根元素的自定义 CSS 类。', en: 'Custom CSS classes added to the chat container root element.' },
            },
        },
    },
} satisfies ApiContent

export default content
