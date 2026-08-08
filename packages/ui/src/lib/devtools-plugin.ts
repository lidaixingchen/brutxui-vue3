/**
 * Vue Devtools 插件 - 提供 BrutxUI 组件的调试支持
 *
 * 功能：
 * - 组件树可视化支持
 * - Props 实时编辑支持
 * - 事件监控支持
 * - 性能分析支持
 *
 * 仅在开发环境加载
 */

import { inject } from 'vue'
import type { App, Plugin } from 'vue'
import { getWindow, isClient, isDev } from '@/lib/env'
import packageJson from '../../package.json'

/** Devtools 插件配置选项 */
export interface DevtoolsPluginOptions {
    /** 库名称，默认 'BrutxUI' */
    libraryName?: string
    /** 是否启用性能分析，默认 true */
    enablePerformance?: boolean
    /** 是否启用事件日志，默认 true */
    enableEventLogging?: boolean
    /** 是否启用组件树可视化，默认 true */
    enableComponentTree?: boolean
    /** 事件日志最大数量，默认 100 */
    maxEventLogSize?: number
    /** 性能阈值（毫秒），超过此值会发出警告，默认 16 */
    performanceThreshold?: number
}

/** 事件日志条目 */
export interface EventLogEntry {
    /** 时间戳 */
    timestamp: number
    /** 组件名称 */
    component: string
    /** 事件名称 */
    event: string
    /** 事件载荷 */
    payload: unknown
    /** 事件持续时间（毫秒） */
    duration?: number
}

/** 性能测量条目 */
export interface PerformanceEntry {
    /** 测量名称 */
    name: string
    /** 开始时间 */
    startTime: number
    /** 持续时间（毫秒） */
    duration: number
    /** 组件名称 */
    component?: string
}

/** 组件元数据 */
export interface DevtoolsComponentMeta {
    /** 组件名称 */
    name: string
    /** 组件版本 */
    version?: string
    /** 组件描述 */
    description?: string
    /** 注册时间 */
    registeredAt: number
    /** 最后更新时间 */
    lastUpdatedAt: number
    /** Props 定义 */
    props?: Record<string, unknown>
    /** 事件列表 */
    events?: string[]
}

/** Devtools 上下文接口 */
export interface BrutxUIDevtoolsContext {
    /** 库版本 */
    version: string
    /** 库名称 */
    libraryName: string
    /** 注册的组件集合 */
    components: Map<string, DevtoolsComponentMeta>
    /** 事件日志 */
    eventLog: EventLogEntry[]
    /** 性能测量记录 */
    performanceEntries: PerformanceEntry[]
    /** 日志事件函数 */
    logEvent: (component: string, event: string, payload?: unknown) => void
    /** 测量性能函数 */
    measure: <T>(name: string, fn: () => T, component?: string) => T
    /** 异步测量性能函数 */
    measureAsync: <T>(name: string, fn: () => Promise<T>, component?: string) => Promise<T>
    /** 注册组件函数 */
    registerComponent: (name: string, meta?: Partial<DevtoolsComponentMeta>) => void
    /** 获取组件列表函数 */
    getComponents: () => DevtoolsComponentMeta[]
    /** 获取事件日志函数 */
    getEventLog: () => EventLogEntry[]
    /** 清除事件日志函数 */
    clearEventLog: () => void
    /** 获取性能报告函数 */
    getPerformanceReport: () => PerformanceReport
    /** 清除性能记录函数 */
    clearPerformanceEntries: () => void
    /** 导出调试数据函数 */
    exportDebugData: () => string
}

/** 性能报告 */
export interface PerformanceReport {
    /** 总测量次数 */
    totalMeasurements: number
    /** 平均持续时间 */
    averageDuration: number
    /** 最大持续时间 */
    maxDuration: number
    /** 最小持续时间 */
    minDuration: number
    /** 超过阈值的测量 */
    slowMeasurements: PerformanceEntry[]
    /** 按组件分组的性能数据 */
    byComponent: Record<string, {
        count: number
        averageDuration: number
        maxDuration: number
    }>
}

// ── Vue Devtools 事件协议类型 ──────────────────────────────────
// 真实 Vue Devtools 的全局 hook（__VUE_DEVTOOLS_GLOBAL_HOOK__）是事件总线（emit/on/off），
// 插件通过 emit('devtools:plugin:add', descriptor) 注册，devtools 端创建 api 后回调 setupFn(api)。
// 这里只声明本插件用到的协议子集，形状与 @vue/devtools-api 一致。

/** Vue Devtools 全局 hook（事件总线协议） */
interface VueDevtoolsHook {
    emit: (eventName: string, ...args: unknown[]) => void
    on: (eventName: string, handler: (...args: unknown[]) => void) => void
    off: (eventName: string, handler: (...args: unknown[]) => void) => void
}

/** 组件树标签 */
interface DevtoolsComponentTag {
    label: string
    textColor: number
    backgroundColor: number
}

/** Inspector 树节点 */
interface DevtoolsTreeNode {
    id: string
    label: string
    tags?: DevtoolsComponentTag[]
    children?: DevtoolsTreeNode[]
}

/** Inspector 状态项（@vue/devtools-api 协议：分组下是字段名到状态项的嵌套对象） */
interface DevtoolsInspectorStateItem {
    value: unknown
    editable?: boolean
}

/** Inspector 树请求负载（@vue/devtools-api 协议：filter 为 devtools 端输入的搜索关键字） */
interface DevtoolsGetInspectorTreePayload {
    inspectorId: string
    filter?: string
    rootNodes: DevtoolsTreeNode[]
}

/** Inspector 状态请求负载 */
interface DevtoolsGetInspectorStatePayload {
    inspectorId: string
    nodeId: string
    state: Record<string, Record<string, DevtoolsInspectorStateItem>>
}

/** Inspector 状态编辑负载 */
interface DevtoolsEditInspectorStatePayload {
    inspectorId: string
    nodeId: string
    path: string[]
    state: { value: unknown }
}

/** setupFn 接收的 Devtools API（仅声明本插件用到的部分） */
interface VueDevtoolsPluginApi {
    addInspector: (options: { id: string; label: string; icon?: string; treeFilterPlaceholder?: string }) => void
    on: {
        getInspectorTree: (handler: (payload: DevtoolsGetInspectorTreePayload) => void) => void
        getInspectorState: (handler: (payload: DevtoolsGetInspectorStatePayload) => void) => void
        editInspectorState: (handler: (payload: DevtoolsEditInspectorStatePayload) => void) => void
    }
}

/** 插件描述符 */
interface VueDevtoolsPluginDescriptor {
    id: string
    label: string
    app: App
    packageName: string
    setupFn: (api: VueDevtoolsPluginApi) => void
}

/** 声明全局 __VUE_DEVTOOLS_GLOBAL_HOOK__ */
declare global {

    var __VUE_DEVTOOLS_GLOBAL_HOOK__: VueDevtoolsHook | undefined
}

const PLUGIN_ID = 'brutxui-devtools'
const PLUGIN_NAME = 'BrutxUI Devtools'

/** 默认配置 */
const DEFAULT_OPTIONS: Required<DevtoolsPluginOptions> = {
    libraryName: 'BrutxUI',
    enablePerformance: true,
    enableEventLogging: true,
    enableComponentTree: true,
    maxEventLogSize: 100,
    performanceThreshold: 16,
}

/**
 * 创建 Devtools 上下文
 */
function createDevtoolsContext(options: Required<DevtoolsPluginOptions>): BrutxUIDevtoolsContext {
    const components = new Map<string, DevtoolsComponentMeta>()
    const eventLog: EventLogEntry[] = []
    const performanceEntries: PerformanceEntry[] = []

    /**
     * 记录一次性能测量（条目 + 阈值告警）。
     * 在 measure/measureAsync 的 finally 中调用，保证 fn() 抛异常时也能观测到慢调用。
     */
    function recordMeasurement(name: string, startTime: number, component: string | undefined): void {
        const duration = performance.now() - startTime

        performanceEntries.push({
            name,
            startTime,
            duration,
            component,
        })

        // 超过阈值发出警告
        if (duration > options.performanceThreshold) {
            console.warn(
                `[${options.libraryName}] 性能警告: ${name} 耗时 ${duration.toFixed(2)}ms (阈值: ${options.performanceThreshold}ms)`
            )
        } else {
            console.log(
                `[${options.libraryName}] ${name}: ${duration.toFixed(2)}ms`
            )
        }
    }

    const context: BrutxUIDevtoolsContext = {
        version: packageJson.version,
        libraryName: options.libraryName,
        components,
        eventLog,
        performanceEntries,

        logEvent(component: string, event: string, payload?: unknown) {
            if (!options.enableEventLogging) return

            const entry: EventLogEntry = {
                timestamp: Date.now(),
                component,
                event,
                payload,
            }

            eventLog.push(entry)

            // 限制日志大小
            if (eventLog.length > options.maxEventLogSize) {
                eventLog.splice(0, eventLog.length - options.maxEventLogSize)
            }

            // 输出到控制台
            console.log(
                `[${options.libraryName}] ${component}.${event}`,
                payload !== undefined ? payload : ''
            )
        },

        measure<T>(name: string, fn: () => T, component?: string): T {
            if (!options.enablePerformance) {
                return fn()
            }

            const startTime = performance.now()
            try {
                return fn()
            } finally {
                // fn() 抛出异常时 finally 仍会执行：耗时数据不丢失，异常语义原样传播
                recordMeasurement(name, startTime, component)
            }
        },

        async measureAsync<T>(name: string, fn: () => Promise<T>, component?: string): Promise<T> {
            if (!options.enablePerformance) {
                return fn()
            }

            const startTime = performance.now()
            try {
                return await fn()
            } finally {
                // Promise 被拒绝时 finally 仍会执行：耗时数据不丢失，拒绝语义原样传播
                recordMeasurement(name, startTime, component)
            }
        },

        registerComponent(name: string, meta?: Partial<DevtoolsComponentMeta>) {
            const now = Date.now()
            const existing = components.get(name)

            if (existing) {
                existing.lastUpdatedAt = now
                if (meta?.version) existing.version = meta.version
                if (meta?.props) existing.props = meta.props
                if (meta?.events) existing.events = meta.events
                if (meta?.description) existing.description = meta.description
            } else {
                components.set(name, {
                    name,
                    version: meta?.version,
                    description: meta?.description,
                    registeredAt: now,
                    lastUpdatedAt: now,
                    props: meta?.props,
                    events: meta?.events,
                })
            }

            console.log(
                `[${options.libraryName}] 组件已注册: ${name}`
            )
        },

        getComponents() {
            return Array.from(components.values())
        },

        getEventLog() {
            return [...eventLog]
        },

        clearEventLog() {
            eventLog.length = 0
            console.log(`[${options.libraryName}] 事件日志已清除`)
        },

        getPerformanceReport(): PerformanceReport {
            if (performanceEntries.length === 0) {
                return {
                    totalMeasurements: 0,
                    averageDuration: 0,
                    maxDuration: 0,
                    minDuration: 0,
                    slowMeasurements: [],
                    byComponent: {},
                }
            }

            const durations = performanceEntries.map(e => e.duration)
            const maxDuration = Math.max(...durations)
            const minDuration = Math.min(...durations)
            const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length

            const slowMeasurements = performanceEntries.filter(
                e => e.duration > options.performanceThreshold
            )

            // 按组件分组
            const byComponent: Record<string, {
                count: number
                averageDuration: number
                maxDuration: number
            }> = {}

            for (const entry of performanceEntries) {
                const component = entry.component || 'unknown'
                if (!byComponent[component]) {
                    byComponent[component] = {
                        count: 0,
                        averageDuration: 0,
                        maxDuration: 0,
                    }
                }

                const stats = byComponent[component]
                stats.count++
                stats.maxDuration = Math.max(stats.maxDuration, entry.duration)
                stats.averageDuration = (
                    (stats.averageDuration * (stats.count - 1) + entry.duration) / stats.count
                )
            }

            return {
                totalMeasurements: performanceEntries.length,
                averageDuration,
                maxDuration,
                minDuration,
                slowMeasurements,
                byComponent,
            }
        },

        clearPerformanceEntries() {
            performanceEntries.length = 0
            console.log(`[${options.libraryName}] 性能记录已清除`)
        },

        exportDebugData() {
            // 循环引用检测按「当前序列化路径栈」判定，而非全局已访问集合：
            // 共享引用（同一对象出现在多条路径）不会被误判为循环，仅路径上重复出现的对象才标记 [Circular]
            const serialize = (value: unknown, stack: unknown[]): unknown => {
                if (typeof value !== 'object' || value === null) return value
                if (stack.includes(value)) return '[Circular]'
                const nextStack = [...stack, value]
                if (Array.isArray(value)) {
                    return value.map((item) => serialize(item, nextStack))
                }
                const result: Record<string, unknown> = {}
                for (const [key, item] of Object.entries(value)) {
                    result[key] = serialize(item, nextStack)
                }
                return result
            }

            return JSON.stringify(serialize({
                version: context.version,
                libraryName: context.libraryName,
                components: Array.from(components.values()),
                eventLog,
                performanceReport: context.getPerformanceReport(),
                exportedAt: new Date().toISOString(),
            }, []), null, 2)
        },
    }

    return context
}

/**
 * 通过 Vue Devtools 事件协议注册插件（等价于 @vue/devtools-api 的 setupDevToolsPlugin）。
 *
 * 真实 hook 是事件总线：emit('devtools:plugin:add', descriptor) 后由 devtools 端创建 api 并回调 setupFn。
 * 与旧实现不同，这里不再直接调用 hook 上不存在的同步方法（addInspector/on.visitComponentTree 等），
 * 避免 TypeErorr 被 try/catch 静默吞掉导致功能全部失效。
 */
function setupBrutxDevtoolsPlugin(descriptor: VueDevtoolsPluginDescriptor): boolean {
    // 仅浏览器环境存在 Vue Devtools hook
    if (!isClient) return false
    const hook = (getWindow() as (Window & { __VUE_DEVTOOLS_GLOBAL_HOOK__?: VueDevtoolsHook }) | undefined)?.__VUE_DEVTOOLS_GLOBAL_HOOK__
    // 形状不符（非事件总线）时跳过，避免对 hook 做不存在的同步调用
    if (!hook || typeof hook.emit !== 'function' || typeof hook.on !== 'function') return false
    hook.emit('devtools:plugin:add', descriptor)
    return true
}

/**
 * 初始化 Vue Devtools 集成
 */
function initDevtoolsIntegration(
    app: App,
    context: BrutxUIDevtoolsContext,
    options: Required<DevtoolsPluginOptions>
): void {
    try {
        const registered = setupBrutxDevtoolsPlugin({
            id: PLUGIN_ID,
            label: PLUGIN_NAME,
            app,
            packageName: 'brutx-ui-vue',
            setupFn: (api) => {
                // 注册自定义 Inspector，展示已注册的 BrutxUI 组件
                api.addInspector({
                    id: PLUGIN_ID,
                    label: PLUGIN_NAME,
                    icon: 'widgets',
                    treeFilterPlaceholder: '搜索 BrutxUI 组件...',
                })

                // 组件树：将已注册组件作为根节点，支持按 filter 关键字（大小写不敏感包含匹配）过滤
                api.on.getInspectorTree((payload) => {
                    if (payload.inspectorId !== PLUGIN_ID) return
                    if (!options.enableComponentTree) return
                    const query = payload.filter?.trim().toLowerCase()
                    const components = context.getComponents().filter(
                        (meta) => !query || meta.name.toLowerCase().includes(query),
                    )
                    payload.rootNodes.push(
                        ...components.map((meta) => ({
                            id: `${PLUGIN_ID}-${meta.name}`,
                            label: meta.name,
                            tags: [
                                {
                                    label: options.libraryName,
                                    textColor: 0xffffff,
                                    backgroundColor: 0x000000,
                                },
                            ],
                        })),
                    )
                })

                // 状态检查：展示组件元数据与可编辑 Props
                api.on.getInspectorState((payload) => {
                    if (payload.inspectorId !== PLUGIN_ID || !payload.nodeId) return
                    const name = payload.nodeId.replace(`${PLUGIN_ID}-`, '')
                    const meta = context.components.get(name)
                    if (!meta) return
                    // @vue/devtools-api 协议：state 为 Record<分组名, Record<字段名, { value, editable? }>> 嵌套对象
                    const propsState: Record<string, DevtoolsInspectorStateItem> = {}
                    for (const [propKey, propValue] of Object.entries(meta.props ?? {})) {
                        propsState[propKey] = { value: propValue, editable: true }
                    }
                    payload.state = {
                        [`${options.libraryName} 组件信息`]: {
                            '版本': { value: meta.version || '未知' },
                            '描述': { value: meta.description || '无描述' },
                            '注册时间': { value: new Date(meta.registeredAt).toLocaleString() },
                            '最后更新': { value: new Date(meta.lastUpdatedAt).toLocaleString() },
                        },
                        [`${options.libraryName} Props`]: propsState,
                    }
                })

                // Props 编辑：更新注册组件的元数据
                api.on.editInspectorState((payload) => {
                    if (payload.inspectorId !== PLUGIN_ID || !payload.nodeId) return
                    const name = payload.nodeId.replace(`${PLUGIN_ID}-`, '')
                    const meta = context.components.get(name)
                    if (!meta || payload.path[0] !== `${options.libraryName} Props`) return
                    const key = payload.path[1]
                    if (key && meta.props) {
                        meta.props[key] = payload.state.value
                        meta.lastUpdatedAt = Date.now()
                        console.log(
                            `[${options.libraryName}] Props 已更新: ${name}.${key} =`,
                            payload.state.value
                        )
                    }
                })
            },
        })

        if (!registered) {
            console.log(
                `[${options.libraryName}] Vue Devtools 未检测到，跳过 Devtools 集成初始化`
            )
            return
        }

        console.log(
            `[${options.libraryName}] Vue Devtools 集成已初始化`
        )
    } catch (error) {
        console.error(
            `[${options.libraryName}] Vue Devtools 集成初始化失败:`,
            error
        )
    }
}

/**
 * BrutxUI Vue Devtools 插件
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { devtoolsPlugin } from 'brutx-ui-vue/devtools-plugin'
 *
 * const app = createApp(App)
 *
 * app.use(devtoolsPlugin, {
 *   enablePerformance: true,
 *   enableEventLogging: true,
 *   performanceThreshold: 16,
 * })
 * ```
 */
export const devtoolsPlugin: Plugin = {
    install(app: App, options?: DevtoolsPluginOptions) {
        // 仅在开发环境加载（isDev 已判空 process：纯浏览器/CDN 直接引入时安全跳过）
        if (!isDev()) {
            return
        }

        const mergedOptions: Required<DevtoolsPluginOptions> = {
            ...DEFAULT_OPTIONS,
            ...options,
        }

        // 创建 Devtools 上下文
        const context = createDevtoolsContext(mergedOptions)

        // 注册到全局属性
        app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ = context

        // 提供注入
        app.provide('__BRUTX_UI_DEVTOOLS__', context)

        // 初始化 Vue Devtools 集成
        initDevtoolsIntegration(app, context, mergedOptions)

        console.log(
            `[${mergedOptions.libraryName}] Devtools 插件已安装 (v${context.version})`
        )
    },
}

/**
 * 快捷设置函数
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { setupDevtools } from 'brutx-ui-vue/devtools-plugin'
 *
 * const app = createApp(App)
 * setupDevtools(app)
 * ```
 */
export function setupDevtools(app: App, options?: DevtoolsPluginOptions): void {
    app.use(devtoolsPlugin, options)
}

/**
 * 获取 Devtools 上下文（用于组合式 API）
 *
 * @example
 * ```typescript
 * import { useDevtools } from 'brutx-ui-vue/devtools-plugin'
 *
 * const devtools = useDevtools()
 * if (devtools) {
 *   devtools.logEvent('MyComponent', 'click', { target: 'button' })
 * }
 * ```
 */
export function useDevtools(): BrutxUIDevtoolsContext | null {
    if (!isDev()) {
        return null
    }

    return inject<BrutxUIDevtoolsContext | null>('__BRUTX_UI_DEVTOOLS__', null)
}
