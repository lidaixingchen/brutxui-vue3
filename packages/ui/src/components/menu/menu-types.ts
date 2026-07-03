import type { InjectionKey, Ref } from 'vue'

export interface MenuContext {
    activeIndex: Ref<string>
    mode: Ref<'horizontal' | 'vertical'>
    router: boolean
    selectItem: (index: string, route?: string | object) => void
    openedMenus: Ref<Set<string>>
    toggleSubMenu: (index: string) => void
}

export const MENU_KEY: InjectionKey<MenuContext> = Symbol('BrutxMenu')
