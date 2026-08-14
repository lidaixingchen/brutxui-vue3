import type { ComputedRef, InjectionKey, Ref } from 'vue'

export interface MenuItemEntry {
    index: string
    el: HTMLElement
    disabled: boolean
    isSubMenuTrigger?: boolean
}

export interface MenuContext {
    activeIndex: Ref<string>
    focusedIndex: Ref<string | null>
    firstEnabledIndex: ComputedRef<string | null>
    mode: Ref<'horizontal' | 'vertical'>
    router: Ref<boolean>
    openedMenus: Ref<Set<string>>
    registerItem: (entry: MenuItemEntry) => void
    unregisterItem: (index: string) => void
    focusItem: (index: string) => void
    focusNextItem: (current: string) => void
    focusPrevItem: (current: string) => void
    focusFirstItem: () => void
    focusLastItem: () => void
    selectItem: (index: string, route?: string | object) => void
    toggleSubMenu: (index: string) => void
    openSubMenu: (index: string) => void
    closeSubMenu: (index: string) => void
    registerSubMenu: (index: string, children: ReadonlySet<string>) => void
    unregisterSubMenu: (index: string) => void
}

export const MENU_KEY: InjectionKey<MenuContext> = Symbol('BrutxMenu')
