import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        InfiniteScroll: {
            props: {
                distance: { zh: '交叉观察器触发区域向视口外扩展的距离，单位为像素。', en: 'The number of pixels by which the intersection observer trigger area expands beyond the viewport.' },
                delay: { zh: '观察到加载哨兵后等待的防抖延迟，单位为毫秒。', en: 'The debounce delay in milliseconds after the loading sentinel enters the trigger area.' },
                disabled: { zh: '禁用加载检测并清理观察器；禁用期间不会触发加载。', en: 'Disables load detection and disconnects the observer; loading is not triggered while disabled.' },
                immediate: { zh: '启用时在挂载或重新启用后立即请求一次加载；关闭后仅由哨兵进入扩展视口触发。', en: 'Requests a load on mount and after re-enabling when true; when false, loading is triggered only by the sentinel entering the expanded viewport.' },
                class: { zh: '追加到列表、加载状态和观察哨兵共同外层容器的 CSS 类。', en: 'CSS classes added to the outer container for the list, loading state, and observer sentinel.' },
            },
            events: {
                load: { zh: '防抖延迟结束后需要加载更多数据时发出，不带参数；父组件完成加载后应调用 `resetLoading()`。', en: 'Emitted without a payload when more data should load after the debounce delay. Call `resetLoading()` after the parent finishes loading.' },
            },
            slots: {
                default: { zh: '要持续追加的列表或滚动内容。', en: 'The list or scrolling content to extend as more data is loaded.' },
                loading: { zh: '加载请求进行时显示的自定义指示器；未提供时显示脉冲圆点。', en: 'A custom indicator shown while a load is in progress; pulsing dots are shown when omitted.' },
            },
            exposes: {
                resetLoading: { zh: '标记加载完成并重新检查哨兵；若哨兵仍在扩展视口内可能立即再次发出 `load`，无更多数据时应先将 `disabled` 设为 true。', en: 'Marks loading as complete and checks the sentinel again. If it remains inside the expanded viewport, another `load` may fire immediately; set `disabled` to true when no more data is available.' },
            },
        },
    },
} satisfies ApiContent

export default content
