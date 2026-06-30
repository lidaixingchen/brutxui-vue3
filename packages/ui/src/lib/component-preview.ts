import type { Component } from 'vue'

/**
 * Props 类型描述
 */
export interface PropDefinition {
    /** Prop 名称 */
    name: string
    /** Prop 类型 */
    type: PropType
    /** 默认值 */
    defaultValue?: unknown
    /** 是否必填 */
    required?: boolean
    /** 描述信息 */
    description?: string
}

/**
 * 支持的 Prop 类型
 */
export type PropType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unknown'

/**
 * 事件日志条目
 */
export interface EventLogEntry {
    /** 事件名称 */
    eventName: string
    /** 事件载荷 */
    payload: unknown
    /** 触发时间戳 */
    timestamp: number
}

/**
 * 组件预览配置
 */
export interface ComponentPreview {
    /** 组件名称 */
    name: string
    /** Vue 组件 */
    component: Component
    /** 当前 Props */
    props: Record<string, unknown>
    /** Props 类型定义 */
    propDefinitions: PropDefinition[]
    /** Slots 内容 */
    slots: Record<string, string>
    /** 支持的事件名称列表 */
    events: string[]
    /** 事件日志 */
    eventLog: EventLogEntry[]
}

/**
 * 组件注册选项
 */
export interface ComponentPreviewOptions {
    /** 组件名称 */
    name: string
    /** Vue 组件 */
    component: Component
    /** 默认 Props */
    defaultProps?: Record<string, unknown>
    /** Props 类型定义 */
    propDefinitions?: PropDefinition[]
    /** 默认 Slots 内容 */
    defaultSlots?: Record<string, string>
    /** 支持的事件名称列表 */
    eventNames?: string[]
}

/**
 * 组件注册表
 */
const componentRegistry = new Map<string, ComponentPreview>()

/**
 * 创建组件预览实例
 */
export function createComponentPreview(options: ComponentPreviewOptions): ComponentPreview {
    return {
        name: options.name,
        component: options.component,
        props: { ...options.defaultProps },
        propDefinitions: options.propDefinitions ?? [],
        slots: { ...options.defaultSlots },
        events: options.eventNames ?? [],
        eventLog: [],
    }
}

/**
 * 注册组件到预览注册表
 */
export function registerComponent(options: ComponentPreviewOptions): ComponentPreview {
    const preview = createComponentPreview(options)
    componentRegistry.set(options.name, preview)
    return preview
}

/**
 * 获取已注册的组件预览
 */
export function getComponent(name: string): ComponentPreview | undefined {
    return componentRegistry.get(name)
}

/**
 * 获取所有已注册的组件预览
 */
export function getAllComponents(): ComponentPreview[] {
    return Array.from(componentRegistry.values())
}

/**
 * 更新组件 Props
 */
export function updateComponentProps(name: string, props: Record<string, unknown>): boolean {
    const preview = componentRegistry.get(name)
    if (!preview) {
        return false
    }
    preview.props = { ...preview.props, ...props }
    return true
}

/**
 * 设置组件单个 Prop 值
 */
export function setComponentProp(name: string, propName: string, value: unknown): boolean {
    const preview = componentRegistry.get(name)
    if (!preview) {
        return false
    }
    preview.props[propName] = value
    return true
}

/**
 * 更新组件 Slots 内容
 */
export function updateComponentSlots(name: string, slots: Record<string, string>): boolean {
    const preview = componentRegistry.get(name)
    if (!preview) {
        return false
    }
    preview.slots = { ...preview.slots, ...slots }
    return true
}

/**
 * 记录组件事件
 */
export function logComponentEvent(name: string, eventName: string, payload: unknown): boolean {
    const preview = componentRegistry.get(name)
    if (!preview) {
        return false
    }

    const entry: EventLogEntry = {
        eventName,
        payload,
        timestamp: Date.now(),
    }
    preview.eventLog.push(entry)
    return true
}

/**
 * 获取组件事件日志
 */
export function getComponentEventLog(name: string): EventLogEntry[] {
    const preview = componentRegistry.get(name)
    return preview ? [...preview.eventLog] : []
}

/**
 * 清除组件事件日志
 */
export function clearComponentEventLog(name: string): boolean {
    const preview = componentRegistry.get(name)
    if (!preview) {
        return false
    }
    preview.eventLog = []
    return true
}

/**
 * 注销组件
 */
export function unregisterComponent(name: string): boolean {
    return componentRegistry.delete(name)
}

/**
 * 清空所有注册组件
 */
export function clearComponentRegistry(): void {
    componentRegistry.clear()
}

/**
 * 重置组件 Props 为默认值
 */
export function resetComponentProps(name: string, defaultProps: Record<string, unknown>): boolean {
    const preview = componentRegistry.get(name)
    if (!preview) {
        return false
    }
    preview.props = { ...defaultProps }
    return true
}

/**
 * 根据值类型解析 Prop 值
 */
export function parsePropValue(type: PropType, rawValue: string): unknown {
    switch (type) {
        case 'string':
            return rawValue
        case 'number': {
            const num = Number(rawValue)
            return Number.isNaN(num) ? rawValue : num
        }
        case 'boolean':
            return rawValue === 'true'
        case 'object':
        case 'array':
            try {
                return JSON.parse(rawValue)
            } catch {
                return rawValue
            }
        default:
            return rawValue
    }
}
