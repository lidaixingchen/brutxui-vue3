import type { Component, ConcreteComponent } from 'vue'

/**
 * 通用尺寸变体
 */
export type Size = 'xs' | 'sm' | 'default' | 'lg' | 'xl'

/**
 * 紧凑尺寸变体（用于不需要 xs/xl 的场景）
 */
export type CompactSize = 'sm' | 'default' | 'lg'

/**
 * 通用变体类型
 */
export type Variant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'

/**
 * 方向类型
 */
export type Orientation = 'horizontal' | 'vertical'

/**
 * 对齐方式
 */
export type Alignment = 'start' | 'center' | 'end'

/**
 * 图标组件类型（支持组件实例、异步组件、渲染函数）
 */
export type IconComponent = string | ConcreteComponent | (() => Component)

/**
 * 调整大小角落方向
 */
export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

/**
 * 移动方向（用于列表项上下移动）
 */
export type MoveDirection = -1 | 1

/**
 * 通用事件处理器类型
 */
export type EventHandler<T = void> = (payload: T) => void

/**
 * 可选事件处理器类型
 */
export type OptionalEventHandler<T = void> = EventHandler<T> | undefined

/**
 * 组件 Props 提取工具类型
 * 从组件定义中提取 Props 类型
 */
export type ComponentProps<C> = C extends { new (): { $props: infer P } } ? P : never

/**
 * 组件 Emits 提取工具类型
 * 从组件定义中提取 Emits 类型
 */
export type ComponentEmits<C> = C extends { new (): { $emit: infer E } } ? E : never

/**
 * 组件 Slots 提取工具类型
 * 从组件定义中提取 Slots 类型
 */
export type ComponentSlots<C> = C extends { new (): { $slots: infer S } } ? S : never

/**
 * 可为空的类型
 */
export type Nullable<T> = T | null

/**
 * 可为空或未定义的类型
 */
export type MaybeUndefined<T> = T | undefined

/**
 * 深度可选
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? DeepPartial<U>[]
        : T[P] extends object
            ? DeepPartial<T[P]>
            : T[P]
}

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 从数组类型中提取元素类型
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never

/**
 * Record 的值类型
 */
export type RecordValue<T> = T extends Record<string, infer V> ? V : never

/**
 * Make specified keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specified keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
