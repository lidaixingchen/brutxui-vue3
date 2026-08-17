import {
    createVNode,
    render,
    ref,
    defineComponent,
    h,
    getCurrentInstance,
    type Component,
    type AppContext,
    type Ref,
} from 'vue'
import { canUseDocumentBody, getDocument } from './env'
import {
    DEFAULT_DIALOG_TRANSITION_MS,
    DEFAULT_OVERLAY_Z_INDEX,
    OVERLAY_Z_INDEX_STEP,
} from './defaults'
import { getGlobalAppContext } from '../plugin'

export interface MountOverlayOptions {
    /** 注入的 AppContext，默认自动继承当前组件实例或全局 AppContext */
    appContext?: AppContext
    /** 过渡离场动画持续时间（毫秒），用于守护自动物理 GC */
    transitionDuration?: number
    /** 自定义基准或指定 z-index（若不指定则按栈层级自动步进） */
    zIndex?: number
    /** 是否响应全局 ESC 按键关闭（默认 true） */
    enableEsc?: boolean
    /** 关闭时的回调（触发关闭动效时调用） */
    onClose?: () => void
    /** 完全销毁/GC 移除时的回调 */
    onDestroy?: () => void
}

export interface OverlayInstanceHandle<R = unknown> {
    /** 触发受控关闭：置 open 为 false 播放离场动效并在动画结束后自动 GC */
    close: (result?: R) => void
    /** 强制物理销毁：立即卸载组件并从 DOM 移除容器 */
    destroy: (result?: R) => void
    /** 确定性终态 Promise，在弹层关闭或销毁时兑现 */
    promise: Promise<R>
}

export type OverlayPropsFactory<P extends Record<string, unknown> = Record<string, unknown>, R = unknown> = (context: {
    isOpen: Ref<boolean>
    zIndex: number
    close: (result?: R) => void
    destroy: (result?: R) => void
    resolve: (result: R) => void
}) => P

interface StackEntry {
    id: number
    handleClose: () => void
    enableEsc: boolean
}

let overlayIdCounter = 0
const activeOverlayStack: StackEntry[] = []
let isKeydownListening = false

function handleGlobalKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (activeOverlayStack.length === 0) return
        const topEntry = activeOverlayStack[activeOverlayStack.length - 1]
        if (topEntry && topEntry.enableEsc) {
            e.stopPropagation()
            e.preventDefault()
            topEntry.handleClose()
        }
    }
}

function ensureKeydownListener(): void {
    if (isKeydownListening || !canUseDocumentBody()) return
    const doc = getDocument()
    if (doc?.defaultView) {
        doc.defaultView.addEventListener('keydown', handleGlobalKeydown, true)
        isKeydownListening = true
    }
}

function removeKeydownListener(): void {
    if (!isKeydownListening || !canUseDocumentBody()) return
    const doc = getDocument()
    if (doc?.defaultView) {
        doc.defaultView.removeEventListener('keydown', handleGlobalKeydown, true)
        isKeydownListening = false
    }
}

function pushStack(entry: StackEntry): void {
    activeOverlayStack.push(entry)
    ensureKeydownListener()
}

function popStack(id: number): void {
    const idx = activeOverlayStack.findIndex(e => e.id === id)
    if (idx !== -1) {
        activeOverlayStack.splice(idx, 1)
    }
    if (activeOverlayStack.length === 0) {
        removeKeydownListener()
    }
}

/**
 * 全生命周期命令式弹层宿主控制器（Imperative Overlay Host）
 * 
 * 核心特性：
 * 1. 两阶段受控关闭（Two-Phase Controlled Closing）：Phase A 置 open 为 false 驱动 Leave 动画，
 *    Phase B 在动画窗口结束后执行 render(null) 与 DOM 节点 GC 清理，杜绝离场动效被提前切断。
 * 2. 全局 LIFO 活动弹层栈：按后进先出规则自动递增 z-index，ESC 按键事件精准路由分发至栈顶活跃弹层。
 * 3. 自动 AppContext 继承：优先级为 options.appContext ?? getCurrentInstance()?.appContext ?? getGlobalAppContext()。
 * 4. 确定性非拒绝 Promise 契约与 SSR 安全守卫。
 */
export function mountOverlay<P extends Record<string, unknown> = Record<string, unknown>, R = unknown>(
    component: Component,
    propsOrFactory: P | OverlayPropsFactory<P, R> = {} as P,
    options: MountOverlayOptions = {}
): OverlayInstanceHandle<R> {
    if (!canUseDocumentBody()) {
        return {
            close: () => {},
            destroy: () => {},
            promise: Promise.resolve(undefined as unknown as R),
        }
    }

    const doc = getDocument()!
    const container = doc.createElement('div')
    const stackId = ++overlayIdCounter
    const isOpen = ref(true)

    // 上下文继承：如果在 setup 中调用优先获取实例 context，否则使用全局 context
    const currentInst = getCurrentInstance()
    const resolvedAppContext = options.appContext || currentInst?.appContext || getGlobalAppContext()

    const stackDepth = activeOverlayStack.length
    const calculatedZIndex = options.zIndex ?? (DEFAULT_OVERLAY_Z_INDEX + stackDepth * OVERLAY_Z_INDEX_STEP)
    const enableEsc = options.enableEsc ?? true

    let isResolved = false
    let isClosed = false
    let isDestroyed = false
    let destroyTimer: ReturnType<typeof setTimeout> | undefined

    let resolvePromise!: (val: R) => void
    let rejectPromise!: (err: unknown) => void

    const promise = new Promise<R>((resolve, reject) => {
        resolvePromise = (val) => {
            if (!isResolved) {
                isResolved = true
                resolve(val)
            }
        }
        rejectPromise = (err) => {
            if (!isResolved) {
                isResolved = true
                reject(err)
            }
        }
    })

    const handleClose = (result?: R): void => {
        if (isClosed || isDestroyed) return
        isClosed = true
        isOpen.value = false

        popStack(stackId)

        if (result !== undefined) {
            resolvePromise(result)
        }

        try {
            options.onClose?.()
        } catch {
            // 防御外部 onClose 抛错打断销毁流程
        }

        const transitionMs = options.transitionDuration ?? DEFAULT_DIALOG_TRANSITION_MS
        if (transitionMs > 0) {
            destroyTimer = setTimeout(() => {
                handleDestroy(result)
            }, transitionMs)
        } else {
            handleDestroy(result)
        }
    }

    const handleDestroy = (fallbackResult?: R): void => {
        if (isDestroyed) return
        isDestroyed = true
        isClosed = true

        if (destroyTimer) {
            clearTimeout(destroyTimer)
            destroyTimer = undefined
        }

        popStack(stackId)

        if (fallbackResult !== undefined) {
            resolvePromise(fallbackResult)
        } else if (!isResolved) {
            resolvePromise(undefined as unknown as R)
        }

        try {
            options.onDestroy?.()
        } catch {
            // 防御外部 onDestroy 抛错
        }

        render(null, container)
        container.remove()
    }

    pushStack({
        id: stackId,
        handleClose: () => handleClose(),
        enableEsc,
    })

    // 构建包装组件，为 propsFactory 或普通 props 提供响应式与生命周期绑定
    const WrapperComponent = defineComponent({
        name: 'ImperativeOverlayWrapper',
        setup() {
            return () => {
                const context = {
                    isOpen,
                    zIndex: calculatedZIndex,
                    close: handleClose,
                    destroy: handleDestroy,
                    resolve: resolvePromise,
                }

                const resolvedProps = typeof propsOrFactory === 'function'
                    ? (propsOrFactory as OverlayPropsFactory<P, R>)(context)
                    : {
                        ...propsOrFactory,
                        open: isOpen.value,
                        'onUpdate:open': (val: boolean) => {
                            if (!val) handleClose()
                        },
                        zIndex: calculatedZIndex,
                        onClose: () => handleClose(),
                        onDestroy: () => handleDestroy(),
                    }

                return h(component, resolvedProps)
            }
        },
    })

    const vnode = createVNode(WrapperComponent)
    if (resolvedAppContext) {
        vnode.appContext = resolvedAppContext
    }

    try {
        doc.body!.appendChild(container)
        render(vnode, container)
    } catch (err) {
        handleDestroy()
        rejectPromise(err)
        throw err
    }

    return {
        close: handleClose,
        destroy: handleDestroy,
        promise,
    }
}

export interface RenderImperativeOptions extends MountOverlayOptions {}

export interface RenderImperativeReturn {
    destroy: () => void
}

/**
 * 命令式渲染挂载组件的兼容包装工具（保持向后兼容并提供宿主深模块能力）
 */
export function renderImperative(
    component: Component,
    props: Record<string, unknown> = {},
    options: RenderImperativeOptions = {}
): RenderImperativeReturn {
    const handle = mountOverlay(component, props, options)
    return {
        destroy: handle.destroy,
    }
}
