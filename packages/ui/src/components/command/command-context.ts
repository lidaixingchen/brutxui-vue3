import type { ComputedRef, Ref } from 'vue'
import { createContext } from 'reka-ui'

export type CommandRootContext = {
    allItems: Ref<Map<string, string>>
    allGroups: Ref<Map<string, Set<string>>>
    filterSearch: Ref<string>
    filterState: ComputedRef<{
        count: number
        items: Map<string, number>
        groups: Set<string>
    }>
}

/**
 * 注入 Command 根上下文。必须在 `<Command>`（基于 ListboxRoot）内部使用；
 * 脱离 Command 调用时 reka-ui 的 createContext 会抛出明确的注入错误
 * （错误信息指向本提供方组件名 `Command`），无需在消费方逐处做空值守卫。
 */
export const [injectCommandRootContext, provideCommandRootContext]
    = createContext<CommandRootContext>('Command')

export type CommandGroupContext = {
    id: string
}

/**
 * 注入 CommandGroup 分组上下文。分组是可选的：CommandItem 以 `injectCommandGroupContext(null)`
 * 显式传入 null 默认值表示「不在分组内」；仅在提供 CommandGroupContext 的子树中未传 fallback 时才会抛错。
 */
export const [injectCommandGroupContext, provideCommandGroupContext]
    = createContext<CommandGroupContext>('CommandGroup')
