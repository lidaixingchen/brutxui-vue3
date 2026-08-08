import type { ConcreteComponent, FunctionalComponent } from 'vue'

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
 * 图标组件类型（支持组件实例、异步组件、函数式组件）。
 * string：图标名或 URL（编译期无法校验具体图标名，按运行时图标方案解析）。
 * 函数式组件返回 VNode，故使用 FunctionalComponent 而非 `() => Component`。
 */
export type IconComponent = string | ConcreteComponent | FunctionalComponent

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
 * 组件 Props 提取工具类型（支持类组件与函数式组件）。
 * 类组件经构造签名匹配（new () 仅匹配无参构造，改用 `new (...args)` 覆盖带参构造），
 * 函数式组件提取其 props 参数。
 */
export type ComponentProps<C> = C extends new (...args: any[]) => any
    ? InstanceType<C>['$props']
    : C extends (props: infer P, ctx?: any) => any
        ? P
        : never

/**
 * 组件 Emits 提取工具类型（支持类组件与函数式组件）。
 * 注意：类组件实例的 $emit 为重载签名，此处提取事件名联合；
 * 若组件未声明 emits，$emit 为宽松的 string 兜底签名。
 */
export type ComponentEmits<C> = C extends new (...args: any[]) => any
    ? InstanceType<C>['$emit'] extends (event: infer E, ...args: any[]) => any
        ? E
        : never
    : C extends (props: any, ctx: { emit: (event: infer E, ...args: any[]) => any }) => any
        ? E
        : never

/**
 * 组件 Slots 提取工具类型（支持类组件与函数式组件）。
 * 函数式组件的 slots 从第二参数 ctx 中提取。
 */
export type ComponentSlots<C> = C extends new (...args: any[]) => any
    ? InstanceType<C>['$slots']
    : C extends (props: any, ctx: { slots: infer S }) => any
        ? S
        : never

/**
 * 可为空的类型
 */
export type Nullable<T> = T | null

/**
 * 可为空或未定义的类型
 */
export type MaybeUndefined<T> = T | undefined

/**
 * 深度可选：函数与 Date/Map/Set/RegExp 等内置类型保持原样（避免误递归成畸形对象类型），
 * 数组（含只读数组）逐元素递归并保留只读语义，普通对象逐层可选化。
 */
export type DeepPartial<T> = T extends (...args: any[]) => any
    ? T
    : T extends readonly (infer U)[]
        ? readonly DeepPartial<U>[]
        : T extends Date | Map<any, any> | Set<any> | RegExp
            ? T
            : {
                [P in keyof T]?: DeepPartial<T[P]>
            }

/**
 * 深度只读：函数与 Date/Map/Set/RegExp 等内置类型保持原样
 * （函数若被递归映射会丢失可调用签名，成为畸形 `{}` 类型）。
 */
export type DeepReadonly<T> = T extends (...args: any[]) => any
    ? T
    : T extends Date | Map<any, any> | Set<any> | RegExp
        ? T
        : {
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
