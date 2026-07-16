import { createVNode, render, type Directive } from 'vue'
import { isClient, getDocument, getComputedStyle } from '../lib/env'
import Spinner from '../components/spinner/Spinner.vue'

interface LoadingEl extends HTMLElement {
    _loading?: {
        mask: HTMLDivElement
        spinnerContainer: HTMLDivElement
        originalPosition: string
        textSpan?: HTMLSpanElement
    }
}

/**
 * v-loading 指令：为宿主元素添加局部加载遮罩和 Spinner。
 * 具备 SSR 环境安全保护、动态定位劫持与还原、以及粗野主义风格文字。
 */
export const vLoading: Directive<LoadingEl, boolean> & { getSSRProps?: () => Record<string, unknown> } = {
    mounted(el, binding) {
        if (!isClient) return

        const doc = getDocument()!

        // 1. 获取挂载前的 position 样式
        const originalPosition = el.style.position || getComputedStyle(el)?.position || ''

        // 2. 创建遮罩容器
        const mask = doc.createElement('div')
        mask.className = 'absolute inset-0 flex flex-col items-center justify-center z-50 select-none bg-white/80 dark:bg-brutal-black/80 transition-opacity duration-150'
        mask.style.display = binding.value ? 'flex' : 'none'

        // 3. 实例化 Spinner 并挂载
        const spinnerContainer = doc.createElement('div')
        const spinnerVnode = createVNode(Spinner, { size: 'lg' })
        render(spinnerVnode, spinnerContainer)

        const spinnerEl = spinnerContainer.firstElementChild
        if (spinnerEl) {
            mask.appendChild(spinnerEl)
        }

        // 4. 解析加载文本，支持 element-loading-text 或者是 loading-text 属性
        const text = el.getAttribute('element-loading-text') || el.getAttribute('loading-text')
        let textSpan: HTMLSpanElement | undefined
        if (text) {
            textSpan = doc.createElement('span')
            textSpan.className = 'mt-3 text-sm font-black text-brutal-black dark:text-white uppercase tracking-wider bg-brutal-yellow px-2 py-0.5 border border-brutal-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            textSpan.textContent = text
            mask.appendChild(textSpan)
        }

        // 5. 保存参数
        el._loading = {
            mask,
            spinnerContainer,
            originalPosition,
            textSpan
        }

        // 6. 挂载到宿主
        el.appendChild(mask)

        // 7. 处理定位
        if (binding.value) {
            togglePosition(el, true)
        }
    },

    updated(el, binding) {
        if (!isClient || !el._loading) return

        const doc = getDocument()!
        const { mask, textSpan } = el._loading

        // 切换可见性
        mask.style.display = binding.value ? 'flex' : 'none'

        // 动态更新文本
        const text = el.getAttribute('element-loading-text') || el.getAttribute('loading-text')
        if (text) {
            if (textSpan) {
                textSpan.textContent = text
            } else {
                const newSpan = doc.createElement('span')
                newSpan.className = 'mt-3 text-sm font-black text-brutal-black dark:text-white uppercase tracking-wider bg-brutal-yellow px-2 py-0.5 border border-brutal-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                newSpan.textContent = text
                mask.appendChild(newSpan)
                el._loading.textSpan = newSpan
            }
        } else if (textSpan) {
            textSpan.remove()
            el._loading.textSpan = undefined
        }

        togglePosition(el, binding.value)
    },

    unmounted(el) {
        if (!isClient || !el._loading) return

        const { mask, spinnerContainer } = el._loading

        // 还原宿主 position（复用 togglePosition 保证与挂载时一致）
        togglePosition(el, false)

        // 卸载 Spinner 组件实例，避免 watchers/onUnmounted 钩子泄漏
        render(null, spinnerContainer)

        // 卸载与清理
        mask.remove()
        delete el._loading
    },
    getSSRProps() {
        return {}
    }
}

function togglePosition(el: LoadingEl, loading: boolean) {
    if (!el._loading) return

    if (loading) {
        const currentPosition = getComputedStyle(el)?.position
        if (currentPosition === 'static' || currentPosition === '') {
            el.style.position = 'relative'
        }
    } else {
        const { originalPosition } = el._loading
        if (originalPosition === 'static' || originalPosition === '') {
            el.style.position = ''
        } else if (originalPosition) {
            el.style.position = originalPosition
        } else {
            el.style.removeProperty('position')
        }
    }
}
