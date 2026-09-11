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
    /** 是否作为独占模态浮层参与全局层级栈调度（默认 true；通知架等常驻宿主可设为 false） */
    modal?: boolean
    /** @deprecated 无头原语自带 ESC 路由，保留仅供兼容 */
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

export type OverlayPropsFactory<P extends object = Record<string, unknown>, R = unknown> = (context: {
    isOpen: Ref<boolean>
    zIndex: number
    close: (result?: R) => void
    destroy: (result?: R) => void
    resolve: (result: R) => void
}) => P

let overlayIdCounter = 0
const activeModalStack: number[] = []
const activeOverlays = new Set<() => void>()

function pushModalStack(id: number): void {
    activeModalStack.push(id)
}

function popModalStack(id: number): void {
    const idx = activeModalStack.indexOf(id)
    if (idx !== -1) {
        activeModalStack.splice(idx, 1)
    }
}

/**
 * 销毁当前所有活跃的命令式弹层容器（供测试沙箱 afterEach 或全局清理使用）
 */
export function destroyAllOverlays(): void {
    const toDestroy = Array.from(activeOverlays)
    activeOverlays.clear()
    activeModalStack.length = 0
    for (const destroyFn of toDestroy) {
        try {
            destroyFn()
        } catch {
            // 防御销毁步骤抛错
        }
    }
}

/**
 * 全生命周期命令式弹层宿主控制器（Imperative Overlay Host）
 * 
 * 核心特性：
 * 1. 两阶段受控关闭（Two-Phase Controlled Closing）：Phase A 置 open 为 false 驱动 Leave 动画，
 *    Phase B 在动画窗口结束后执行 render(null) 与 DOM 节点 GC 清理，杜绝离场动效被提前切断。
 * 2. 模态栈与 Z-Index 调度：独占模态弹层按入栈顺序递增 z-index，非模态（通知架等）可声明 modal: false 隔离。
 * 3. 自动 AppContext 继承：优先级为 options.appContext ?? getCurrentInstance()?.appContext ?? getGlobalAppContext()。
 * 4. 确定性非拒绝 Promise 契约与 SSR 安全守卫。
 */
export function mountOverlay<P extends object = Record<string, unknown>, R = unknown>(
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

    const isModal = options.modal ?? true
    const stackDepth = activeModalStack.length
    const calculatedZIndex = options.zIndex ?? (DEFAULT_OVERLAY_Z_INDEX + stackDepth * OVERLAY_Z_INDEX_STEP)

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

        if (isModal) {
            popModalStack(stackId)
        }

        if (result !== undefined) {
            resolvePromise(result)
        } else if (!isResolved) {
            resolvePromise(undefined as unknown as R)
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

        if (isModal) {
            popModalStack(stackId)
        }
        activeOverlays.delete(handleDestroy)

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

        try {
            render(null, container)
        } finally {
            container.remove()
        }
    }

    if (isModal) {
        pushModalStack(stackId)
    }
    activeOverlays.add(handleDestroy)

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
        rejectPromise(err)
        handleDestroy()
        throw err
    }

    return {
        close: handleClose,
        destroy: handleDestroy,
        promise,
    }
}

export type RenderImperativeOptions = MountOverlayOptions

export interface RenderImperativeReturn {
    destroy: () => void
}

/**
 * @deprecated 请使用 {@link mountOverlay}。
 * 命令式渲染挂载组件的兼容包装工具。
 */
export function renderImperative(
    component: Component,
    props: Record<string, unknown> = {},
    options: RenderImperativeOptions = {}
): RenderImperativeReturn {
    const handle = mountOverlay(component, props, {
        modal: false,
        ...options,
    })
    return {
        destroy: handle.destroy,
    }
}

