import {
    getCurrentInstance,
    onUnmounted,
    effectScope,
    type EffectScope,
    type AppContext,
} from 'vue'
import { getWindow } from './env'

export const SSR_MISSING_CONTEXT_CODE = 'ERR_SSR_MISSING_CONTEXT' as const

export interface FallbackManagerOptions<T> {
    name: string
    isClient: boolean
    createInstance: (context?: AppContext) => T
    initInstance?: (instance: T) => void
    destroyInstance: (instance: T) => void
}

export interface FallbackManager<T> {
    acquire: () => T
    destroy: () => void
}

interface Entry<T> {
    instance: T
    scope?: EffectScope
    refCount: number
    disposed: boolean
}

export function createFallbackManager<T>(options: FallbackManagerOptions<T>): FallbackManager<T> {
    let appEntries = new WeakMap<AppContext, Entry<T>>()
    let browserFallbackEntry: Entry<T> | null = null
    let beforeUnloadHandler: (() => void) | null = null

    function registerBeforeUnload(): void {
        if (!options.isClient || beforeUnloadHandler) return
        beforeUnloadHandler = () => destroy()
        getWindow()?.addEventListener('beforeunload', beforeUnloadHandler)
    }

    function unregisterBeforeUnload(): void {
        if (beforeUnloadHandler) {
            getWindow()?.removeEventListener('beforeunload', beforeUnloadHandler)
            beforeUnloadHandler = null
        }
    }

    function createScopedEntry(appContext?: AppContext): Entry<T> {
        if (options.isClient) {
            const scope = effectScope(true)
            const instance = scope.run(() => options.createInstance(appContext))!
            options.initInstance?.(instance)
            return {
                instance,
                scope,
                refCount: 0,
                disposed: false,
            }
        }
        return {
            instance: options.createInstance(appContext),
            refCount: 0,
            disposed: false,
        }
    }

    function acquire(): T {
        const currentInstance = getCurrentInstance()
        const appContext = currentInstance?.appContext

        if (appContext) {
            let entry = appEntries.get(appContext)
            if (!entry || entry.disposed) {
                entry = createScopedEntry(appContext)
                appEntries.set(appContext, entry)
            }

            if (options.isClient) {
                const capturedEntry = entry
                capturedEntry.refCount++
                onUnmounted(() => {
                    if (capturedEntry.disposed) return
                    capturedEntry.refCount--
                    if (capturedEntry.refCount <= 0) {
                        capturedEntry.disposed = true
                        options.destroyInstance(capturedEntry.instance)
                        capturedEntry.scope?.stop()
                        appEntries.delete(appContext)
                    }
                })
            }

            return entry.instance
        }

        if (!options.isClient) {
            throw new Error(
                `[BrutxUI] [${SSR_MISSING_CONTEXT_CODE}] ${options.name}() was called on the server without an active Vue setup() or application context. ` +
                `To resolve this: ` +
                `1) Call ${options.name}() synchronously inside a component setup(), or ` +
                `2) Install BrutxUIPlugin on your app and retrieve the instance using app.runWithContext(() => ${options.name}()), or ` +
                `3) Create an explicit instance using create${options.name.replace(/^use/, '')}() and pass it directly.`
            )
        }

        if (!browserFallbackEntry || browserFallbackEntry.disposed) {
            browserFallbackEntry = createScopedEntry()
            registerBeforeUnload()
        }

        return browserFallbackEntry.instance
    }

    function destroy(): void {
        unregisterBeforeUnload()
        if (browserFallbackEntry && !browserFallbackEntry.disposed) {
            browserFallbackEntry.disposed = true
            options.destroyInstance(browserFallbackEntry.instance)
            browserFallbackEntry.scope?.stop()
            browserFallbackEntry = null
        }
        appEntries = new WeakMap<AppContext, Entry<T>>()
    }

    return { acquire, destroy }
}
