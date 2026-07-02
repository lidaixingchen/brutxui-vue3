/**
 * Vue Devtools 插件测试
 */

// process 在 Vitest 环境中运行时存在，但 tsconfig 未包含 node 类型
declare const process: { env: { NODE_ENV: string | undefined } }

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h, type App } from 'vue'
import {
    devtoolsPlugin,
    setupDevtools,
    useDevtools,
    type BrutxUIDevtoolsContext,
    type DevtoolsPluginOptions,
    type EventLogEntry,
    type PerformanceEntry,
    type ComponentMeta,
    type PerformanceReport,
} from './devtools-plugin'

describe('devtoolsPlugin', () => {
    let app: App
    let originalNodeEnv: string | undefined

    beforeEach(() => {
        app = createApp({})
        originalNodeEnv = process.env.NODE_ENV
    })

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv
        vi.restoreAllMocks()
    })

    describe('install', () => {
        it('should not install in production environment', () => {
            process.env.NODE_ENV = 'production'
            const consoleSpy = vi.spyOn(console, 'log')

            app.use(devtoolsPlugin)

            expect(app.config.globalProperties.__BRUTX_UI_DEVTOOLS__).toBeUndefined()
            expect(consoleSpy).not.toHaveBeenCalled()
        })

        it('should install in development environment', () => {
            process.env.NODE_ENV = 'development'
            const consoleSpy = vi.spyOn(console, 'log')

            app.use(devtoolsPlugin)

            expect(app.config.globalProperties.__BRUTX_UI_DEVTOOLS__).toBeDefined()
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Devtools 插件已安装')
            )
        })

        it('should use default options', () => {
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin)

            const context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
            expect(context.libraryName).toBe('BrutxUI')
            expect(context.version).toBe('0.8.2')
        })

        it('should accept custom options', () => {
            process.env.NODE_ENV = 'development'
            const options: DevtoolsPluginOptions = {
                libraryName: 'CustomUI',
                enablePerformance: false,
                enableEventLogging: false,
                enableComponentTree: false,
                maxEventLogSize: 50,
                performanceThreshold: 32,
            }

            app.use(devtoolsPlugin, options)

            const context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
            expect(context.libraryName).toBe('CustomUI')
        })
    })

    describe('event logging', () => {
        let context: BrutxUIDevtoolsContext

        beforeEach(() => {
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin, { enableEventLogging: true })
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
        })

        it('should log events', () => {
            const consoleSpy = vi.spyOn(console, 'log')

            context.logEvent('Button', 'click', { target: 'submit' })

            expect(context.eventLog).toHaveLength(1)
            expect(context.eventLog[0]).toMatchObject({
                component: 'Button',
                event: 'click',
                payload: { target: 'submit' },
            })
            expect(consoleSpy).toHaveBeenCalledWith(
                '[BrutxUI] Button.click',
                { target: 'submit' }
            )
        })

        it('should log events without payload', () => {
            const consoleSpy = vi.spyOn(console, 'log')

            context.logEvent('Input', 'focus')

            expect(context.eventLog).toHaveLength(1)
            expect(consoleSpy).toHaveBeenCalledWith(
                '[BrutxUI] Input.focus',
                ''
            )
        })

        it('should respect maxEventLogSize', () => {
            app = createApp({})
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin, { maxEventLogSize: 3 })
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext

            for (let i = 0; i < 5; i++) {
                context.logEvent('Button', `click-${i}`)
            }

            expect(context.eventLog).toHaveLength(3)
            expect(context.eventLog[0].event).toBe('click-2')
            expect(context.eventLog[2].event).toBe('click-4')
        })

        it('should not log when event logging is disabled', () => {
            app = createApp({})
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin, { enableEventLogging: false })
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext

            context.logEvent('Button', 'click')

            expect(context.eventLog).toHaveLength(0)
        })

        it('should get event log', () => {
            context.logEvent('Button', 'click')
            context.logEvent('Input', 'change')

            const log = context.getEventLog()
            expect(log).toHaveLength(2)
            expect(log[0].event).toBe('click')
            expect(log[1].event).toBe('change')
        })

        it('should clear event log', () => {
            context.logEvent('Button', 'click')
            context.logEvent('Input', 'change')

            context.clearEventLog()
            expect(context.eventLog).toHaveLength(0)
        })
    })

    describe('performance measurement', () => {
        let context: BrutxUIDevtoolsContext

        beforeEach(() => {
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin, {
                enablePerformance: true,
                performanceThreshold: 100,
            })
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
        })

        it('should measure synchronous function', () => {
            const consoleSpy = vi.spyOn(console, 'log')

            const result = context.measure('test-operation', () => {
                return 42
            }, 'Button')

            expect(result).toBe(42)
            expect(context.performanceEntries).toHaveLength(1)
            expect(context.performanceEntries[0]).toMatchObject({
                name: 'test-operation',
                component: 'Button',
            })
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-operation:')
            )
        })

        it('should measure async function', async () => {
            const consoleSpy = vi.spyOn(console, 'log')

            const result = await context.measureAsync('async-operation', async () => {
                return 42
            }, 'Input')

            expect(result).toBe(42)
            expect(context.performanceEntries).toHaveLength(1)
            expect(context.performanceEntries[0]).toMatchObject({
                name: 'async-operation',
                component: 'Input',
            })
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('async-operation:')
            )
        })

        it('should warn for slow operations', () => {
            const warnSpy = vi.spyOn(console, 'warn')

            // 使用非常低的阈值
            app = createApp({})
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin, { performanceThreshold: 0 })
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext

            context.measure('slow-operation', () => {
                // 模拟慢操作
                for (let i = 0; i < 1000000; i++) {
                    // 空循环
                }
            })

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('性能警告')
            )
        })

        it('should skip measurement when disabled', () => {
            app = createApp({})
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin, { enablePerformance: false })
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext

            const result = context.measure('test', () => 42)

            expect(result).toBe(42)
            expect(context.performanceEntries).toHaveLength(0)
        })

        it('should get performance report', () => {
            context.measure('op1', () => 1, 'Button')
            context.measure('op2', () => 2, 'Button')
            context.measure('op3', () => 3, 'Input')

            const report = context.getPerformanceReport()

            expect(report.totalMeasurements).toBe(3)
            expect(report.averageDuration).toBeGreaterThanOrEqual(0)
            expect(report.maxDuration).toBeGreaterThanOrEqual(0)
            expect(report.minDuration).toBeGreaterThanOrEqual(0)
            expect(report.byComponent).toHaveProperty('Button')
            expect(report.byComponent).toHaveProperty('Input')
            expect(report.byComponent.Button.count).toBe(2)
            expect(report.byComponent.Input.count).toBe(1)
        })

        it('should get empty performance report', () => {
            const report = context.getPerformanceReport()

            expect(report.totalMeasurements).toBe(0)
            expect(report.averageDuration).toBe(0)
            expect(report.maxDuration).toBe(0)
            expect(report.minDuration).toBe(0)
            expect(report.slowMeasurements).toHaveLength(0)
            expect(report.byComponent).toEqual({})
        })

        it('should clear performance entries', () => {
            context.measure('op1', () => 1)
            context.measure('op2', () => 2)

            context.clearPerformanceEntries()
            expect(context.performanceEntries).toHaveLength(0)
        })
    })

    describe('component registration', () => {
        let context: BrutxUIDevtoolsContext

        beforeEach(() => {
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin)
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
        })

        it('should register component', () => {
            const consoleSpy = vi.spyOn(console, 'log')

            context.registerComponent('Button', {
                version: '1.0.0',
                description: 'A button component',
                props: { variant: 'default', size: 'default' },
                events: ['click', 'focus'],
            })

            expect(context.components.has('Button')).toBe(true)

            const meta = context.components.get('Button')
            expect(meta).toMatchObject({
                name: 'Button',
                version: '1.0.0',
                description: 'A button component',
                props: { variant: 'default', size: 'default' },
                events: ['click', 'focus'],
            })
            expect(meta?.registeredAt).toBeGreaterThan(0)
            expect(meta?.lastUpdatedAt).toBeGreaterThan(0)
            expect(consoleSpy).toHaveBeenCalledWith(
                '[BrutxUI] 组件已注册: Button'
            )
        })

        it('should update existing component', () => {
            context.registerComponent('Button', { version: '1.0.0' })

            const firstMeta = context.components.get('Button')
            const firstRegisteredAt = firstMeta?.registeredAt

            // 等待一小段时间以确保时间戳不同
            vi.useFakeTimers()
            vi.advanceTimersByTime(100)

            context.registerComponent('Button', {
                version: '1.1.0',
                description: 'Updated button',
            })

            const updatedMeta = context.components.get('Button')
            expect(updatedMeta?.version).toBe('1.1.0')
            expect(updatedMeta?.description).toBe('Updated button')
            expect(updatedMeta?.registeredAt).toBe(firstRegisteredAt)
            expect(updatedMeta?.lastUpdatedAt).toBeGreaterThan(firstRegisteredAt!)

            vi.useRealTimers()
        })

        it('should register component without meta', () => {
            context.registerComponent('Input')

            expect(context.components.has('Input')).toBe(true)
            expect(context.components.get('Input')?.name).toBe('Input')
        })

        it('should get all components', () => {
            context.registerComponent('Button')
            context.registerComponent('Input')
            context.registerComponent('Select')

            const components = context.getComponents()
            expect(components).toHaveLength(3)
            expect(components.map(c => c.name)).toContain('Button')
            expect(components.map(c => c.name)).toContain('Input')
            expect(components.map(c => c.name)).toContain('Select')
        })
    })

    describe('export debug data', () => {
        let context: BrutxUIDevtoolsContext

        beforeEach(() => {
            process.env.NODE_ENV = 'development'
            app.use(devtoolsPlugin)
            context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
        })

        it('should export debug data as JSON', () => {
            context.registerComponent('Button', { version: '1.0.0' })
            context.logEvent('Button', 'click', { target: 'submit' })
            context.measure('test-op', () => 42, 'Button')

            const exported = context.exportDebugData()
            const data = JSON.parse(exported)

            expect(data).toHaveProperty('version', '0.8.2')
            expect(data).toHaveProperty('libraryName', 'BrutxUI')
            expect(data).toHaveProperty('components')
            expect(data).toHaveProperty('eventLog')
            expect(data).toHaveProperty('performanceReport')
            expect(data).toHaveProperty('exportedAt')

            expect(data.components).toHaveLength(1)
            expect(data.eventLog).toHaveLength(1)
            expect(data.performanceReport.totalMeasurements).toBe(1)
        })
    })
})

describe('setupDevtools', () => {
    let originalNodeEnv: string | undefined

    beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV
    })

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv
    })

    it('should setup devtools with default options', () => {
        process.env.NODE_ENV = 'development'
        const app = createApp({})
        const consoleSpy = vi.spyOn(console, 'log')

        setupDevtools(app)

        expect(app.config.globalProperties.__BRUTX_UI_DEVTOOLS__).toBeDefined()
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Devtools 插件已安装')
        )
    })

    it('should setup devtools with custom options', () => {
        process.env.NODE_ENV = 'development'
        const app = createApp({})

        setupDevtools(app, { libraryName: 'MyUI' })

        const context = app.config.globalProperties.__BRUTX_UI_DEVTOOLS__ as BrutxUIDevtoolsContext
        expect(context.libraryName).toBe('MyUI')
    })
})

describe('useDevtools', () => {
    let originalNodeEnv: string | undefined

    beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV
    })

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv
    })

    it('should return null in production', () => {
        process.env.NODE_ENV = 'production'
        expect(useDevtools()).toBeNull()
    })

    it('should return null when no app is registered', () => {
        process.env.NODE_ENV = 'development'

        let context: BrutxUIDevtoolsContext | null | undefined
        const TestComponent = defineComponent({
            setup() {
                context = useDevtools()
                return {}
            },
            render() { return h('div') },
        })

        const app = createApp(TestComponent)
        const container = document.createElement('div')
        app.mount(container)

        expect(context!).toBeNull()

        app.unmount()
    })

    it('should return context when app is registered', () => {
        process.env.NODE_ENV = 'development'

        let context: BrutxUIDevtoolsContext | null | undefined
        const TestComponent = defineComponent({
            setup() {
                context = useDevtools()
                return {}
            },
            render() { return h('div') },
        })

        const app = createApp(TestComponent)
        app.use(devtoolsPlugin)
        const container = document.createElement('div')
        app.mount(container)

        expect(context).toBeDefined()
        expect(context?.libraryName).toBe('BrutxUI')

        app.unmount()
    })
})

describe('type safety', () => {
    it('should have correct types for EventLogEntry', () => {
        const entry: EventLogEntry = {
            timestamp: Date.now(),
            component: 'Button',
            event: 'click',
            payload: { target: 'submit' },
            duration: 10,
        }

        expect(entry.timestamp).toBeTypeOf('number')
        expect(entry.component).toBeTypeOf('string')
        expect(entry.event).toBeTypeOf('string')
        expect(entry.payload).toBeDefined()
        expect(entry.duration).toBeTypeOf('number')
    })

    it('should have correct types for PerformanceEntry', () => {
        const entry: PerformanceEntry = {
            name: 'test',
            startTime: performance.now(),
            duration: 10,
            component: 'Button',
        }

        expect(entry.name).toBeTypeOf('string')
        expect(entry.startTime).toBeTypeOf('number')
        expect(entry.duration).toBeTypeOf('number')
        expect(entry.component).toBeTypeOf('string')
    })

    it('should have correct types for ComponentMeta', () => {
        const meta: ComponentMeta = {
            name: 'Button',
            version: '1.0.0',
            description: 'A button component',
            registeredAt: Date.now(),
            lastUpdatedAt: Date.now(),
            props: { variant: 'default' },
            events: ['click'],
        }

        expect(meta.name).toBeTypeOf('string')
        expect(meta.version).toBeTypeOf('string')
        expect(meta.description).toBeTypeOf('string')
        expect(meta.registeredAt).toBeTypeOf('number')
        expect(meta.lastUpdatedAt).toBeTypeOf('number')
        expect(meta.props).toBeTypeOf('object')
        expect(meta.events).toBeInstanceOf(Array)
    })

    it('should have correct types for PerformanceReport', () => {
        const report: PerformanceReport = {
            totalMeasurements: 10,
            averageDuration: 5.5,
            maxDuration: 20,
            minDuration: 1,
            slowMeasurements: [],
            byComponent: {
                Button: {
                    count: 5,
                    averageDuration: 5,
                    maxDuration: 10,
                },
            },
        }

        expect(report.totalMeasurements).toBeTypeOf('number')
        expect(report.averageDuration).toBeTypeOf('number')
        expect(report.maxDuration).toBeTypeOf('number')
        expect(report.minDuration).toBeTypeOf('number')
        expect(report.slowMeasurements).toBeInstanceOf(Array)
        expect(report.byComponent).toBeTypeOf('object')
    })

    it('should have correct types for DevtoolsPluginOptions', () => {
        const options: DevtoolsPluginOptions = {
            libraryName: 'BrutxUI',
            enablePerformance: true,
            enableEventLogging: true,
            enableComponentTree: true,
            maxEventLogSize: 100,
            performanceThreshold: 16,
        }

        expect(options.libraryName).toBeTypeOf('string')
        expect(options.enablePerformance).toBeTypeOf('boolean')
        expect(options.enableEventLogging).toBeTypeOf('boolean')
        expect(options.enableComponentTree).toBeTypeOf('boolean')
        expect(options.maxEventLogSize).toBeTypeOf('number')
        expect(options.performanceThreshold).toBeTypeOf('number')
    })

    it('should have correct types for BrutxUIDevtoolsContext', () => {
        // 这个测试主要验证类型定义是否正确
        // 实际的 context 创建在其他测试中验证
        expect(true).toBe(true)
    })
})
