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

import type { App, Plugin } from 'vue'

// process 在 Vitest/Vite 环境中运行时存在，但 tsconfig 未包含 node 类型
declare const process: { env: { NODE_ENV: string | undefined } }

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
export interface ComponentMeta {
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
    components: Map<string, ComponentMeta>
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
    registerComponent: (name: string, meta?: Partial<ComponentMeta>) => void
    /** 获取组件列表函数 */
    getComponents: () => ComponentMeta[]
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

/** Vue Devtools API 接口（简化版） */
interface VueDevtoolsApi {
    notifyComponentUpdate: (componentId: string) => void
    sendInspectorTree: (inspectorId: string) => void
    sendInspectorState: (inspectorId: string) => void
    addInspector: (options: {
        id: string
        label: string
        icon?: string
        treeFilterPlaceholder?: string
    }) => void
    getInspectorTree: (inspectorId: string) => unknown
    getInspectorState: (inspectorId: string) => unknown
    on: {
        visitComponentTree: (handler: (payload: {
            componentData: { name: string }
            treeNodes: unknown[]
        }) => void) => void
        inspectComponent: (handler: (payload: {
            componentData: { name: string }
            state: unknown[]
        }) => void) => void
        editComponentState: (handler: (payload: {
            componentData: { name: string }
            path: string[]
            state: { value: unknown }
        }) => void) => void
    }
}

/** 声明全局 __VUE_DEVTOOLS_GLOBAL_HOOK__ */
declare global {
    // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
    var __VUE_DEVTOOLS_GLOBAL_HOOK__: any
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
    const components = new Map<string, ComponentMeta>()
    const eventLog: EventLogEntry[] = []
    const performanceEntries: PerformanceEntry[] = []

    const context: BrutxUIDevtoolsContext = {
        version: '0.8.2',
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
            const result = fn()
            const duration = performance.now() - startTime

            const entry: PerformanceEntry = {
                name,
                startTime,
                duration,
                component,
            }

            performanceEntries.push(entry)

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

            return result
        },

        async measureAsync<T>(name: string, fn: () => Promise<T>, component?: string): Promise<T> {
            if (!options.enablePerformance) {
                return fn()
            }

            const startTime = performance.now()
            const result = await fn()
            const duration = performance.now() - startTime

            const entry: PerformanceEntry = {
                name,
                startTime,
                duration,
                component,
            }

            performanceEntries.push(entry)

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

            return result
        },

        registerComponent(name: string, meta?: Partial<ComponentMeta>) {
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
            return JSON.stringify({
                version: context.version,
                libraryName: context.libraryName,
                components: Array.from(components.values()),
                eventLog,
                performanceReport: context.getPerformanceReport(),
                exportedAt: new Date().toISOString(),
            }, null, 2)
        },
    }

    return context
}

/**
 * 初始化 Vue Devtools 集成
 */
function initDevtoolsIntegration(
    _app: App,
    context: BrutxUIDevtoolsContext,
    options: Required<DevtoolsPluginOptions>
): void {
    // 检查 Vue Devtools 是否可用
    if (typeof __VUE_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
        console.log(
            `[${options.libraryName}] Vue Devtools 未检测到，跳过 Devtools 集成初始化`
        )
        return
    }

    try {
        const api = __VUE_DEVTOOLS_GLOBAL_HOOK__ as VueDevtoolsApi

        // 注册 Inspector
        api.addInspector({
            id: PLUGIN_ID,
            label: PLUGIN_NAME,
            icon: 'widgets',
            treeFilterPlaceholder: '搜索 BrutxUI 组件...',
        })

        // 处理组件树
        api.on.visitComponentTree((payload) => {
            if (!options.enableComponentTree) return

            const { componentData, treeNodes } = payload
            const meta = context.components.get(componentData.name)

            if (meta) {
                treeNodes.push({
                    id: `${PLUGIN_ID}-${meta.name}`,
                    label: meta.name,
                    tags: [
                        {
                            label: options.libraryName,
                            textColor: 0xffffff,
                            backgroundColor: 0x000000,
                        },
                    ],
                })
            }
        })

        // 处理组件状态检查
        api.on.inspectComponent((payload) => {
            const { componentData, state } = payload
            const meta = context.components.get(componentData.name)

            if (meta) {
                // 添加组件元数据
                state.push({
                    type: `${options.libraryName} 组件信息`,
                    editable: false,
                    value: {
                        版本: meta.version || '未知',
                        描述: meta.description || '无描述',
                        注册时间: new Date(meta.registeredAt).toLocaleString(),
                        最后更新: new Date(meta.lastUpdatedAt).toLocaleString(),
                    },
                })

                // 添加 Props 信息
                if (meta.props && Object.keys(meta.props).length > 0) {
                    state.push({
                        type: `${options.libraryName} Props`,
                        editable: true,
                        value: meta.props,
                    })
                }

                // 添加事件信息
                if (meta.events && meta.events.length > 0) {
                    state.push({
                        type: `${options.libraryName} 事件`,
                        editable: false,
                        value: meta.events,
                    })
                }
            }
        })

        // 处理组件状态编辑
        api.on.editComponentState((payload) => {
            const { componentData, path, state } = payload
            const meta = context.components.get(componentData.name)

            if (meta && path[0] === `${options.libraryName} Props`) {
                // 更新 Props
                if (meta.props) {
                    const key = path[1]
                    if (key) {
                        meta.props[key] = state.value
                        meta.lastUpdatedAt = Date.now()

                        console.log(
                            `[${options.libraryName}] Props 已更新: ${componentData.name}.${key} =`,
                            state.value
                        )
                    }
                }
            }
        })

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
        // 仅在开发环境加载
        if (process.env.NODE_ENV !== 'development') {
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
    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    // 从全局属性获取
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const app = (window as any).__VUE_APP__
        if (app?.config?.globalProperties?.__BRUTX_UI_DEVTOOLS__) {
            return app.config.globalProperties.__BRUTX_UI_DEVTOOLS__
        }
    }

    return null
}
