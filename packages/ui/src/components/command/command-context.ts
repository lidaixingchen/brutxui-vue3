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

export const [injectCommandRootContext, provideCommandRootContext]
    = createContext<CommandRootContext>('CommandRoot')

export type CommandGroupContext = {
    id: string
}

export const [injectCommandGroupContext, provideCommandGroupContext]
    = createContext<CommandGroupContext>('CommandGroup')
