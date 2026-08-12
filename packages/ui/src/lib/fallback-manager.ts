/**
 * 共享 fallback 单例管理工具：统一处理「懒创建 + 组件引用计数清理 + beforeunload 监听注册/移除」。
 *
 * useTheme / useToast 的 fallback 单例逻辑原为两份逐字重复（模块级 instance/refCount/
 * beforeUnloadHandler + eager 注册 + onUnmounted 守卫），后续修复其一极易漏改另一处。
 * 抽为本模块单一实现（见审查报告 §12.2 相关），两处 composable 仅注入各自的创建/销毁钩子。
 */
import { getCurrentInstance, onUnmounted } from 'vue'
import { getWindow } from './env'

export interface FallbackManagerOptions<T> {
    /** 是否客户端环境（决定是否注册 beforeunload 监听） */
    isClient: boolean
    /** 创建共享单例（懒加载：首次 acquire 时调用） */
    createInstance: () => T
    /** 单例创建后的初始化钩子（如 useTheme 的 initTheme，须与 provide 路径时序一致） */
    initInstance?: (instance: T) => void
    /** 销毁单例实例（如 useToast 的 clearToasts / useTheme 的 destroy） */
    destroyInstance: (instance: T) => void
}

export interface FallbackManager<T> {
    /** 获取共享单例：首次创建并注册 beforeunload；组件 setup 上下文内注册引用计数清理 */
    acquire: () => T
    /** 显式销毁单例并移除 beforeunload 监听（供 destroyBrutxUI 调用；无实例时幂等） */
    destroy: () => void
}

export function createFallbackManager<T>(options: FallbackManagerOptions<T>): FallbackManager<T> {
    let instance: T | null = null
    let refCount = 0
    let beforeUnloadHandler: (() => void) | null = null

    function registerBeforeUnload(): void {
        if (!options.isClient || beforeUnloadHandler) return
        beforeUnloadHandler = () => destroy()
        getWindow()?.addEventListener('beforeunload', beforeUnloadHandler)
    }

    function unregisterBeforeUnload(): void {
        if (beforeUnloadHandler) {
            getWindow?.()?.removeEventListener('beforeunload', beforeUnloadHandler)
            beforeUnloadHandler = null
        }
    }

    function acquire(): T {
        if (!instance) {
            instance = options.createInstance()
            options.initInstance?.(instance)
            // 单例创建时（重新）注册 beforeunload：destroy 后重建的单例不会失去清理监听，
            // 与「单例可重建」语义一致（见 useTheme/useToast 的 fallbackInstance 重建场景）
            registerBeforeUnload()
        }
        if (getCurrentInstance()) {
            // 捕获本次 setup 使用的实例：若外部（beforeunload/显式 destroy）先销毁单例并重建，
            // 本组件卸载时不得误减新实例的引用计数或误销毁新单例
            const captured = instance
            refCount++
            onUnmounted(() => {
                if (instance !== captured) return
                refCount--
                if (refCount <= 0) destroy()
            })
        }
        return instance
    }

    function destroy(): void {
        unregisterBeforeUnload()
        if (instance) {
            options.destroyInstance(instance)
            instance = null
            refCount = 0
        }
    }

    return { acquire, destroy }
}
