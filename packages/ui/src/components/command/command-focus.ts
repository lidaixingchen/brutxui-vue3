import { readonly, ref, type DeepReadonly, type Ref } from 'vue'

export type CommandFocusMode = 'keyboard' | 'pointer'

const navigationKeys = new Set([
    'ArrowDown',
    'ArrowUp',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
])

const searchInputNavigationKeys = new Set([
    'ArrowDown',
    'ArrowUp',
    'Home',
    'End',
])

export function useCommandFocus() {
    const mode = ref<CommandFocusMode>('pointer')

    function handleKeydown(event: KeyboardEvent) {
        if (event.isComposing) return

        const target = event.target as HTMLElement | null
        const isSearchInput = target?.getAttribute('role') === 'searchbox'
            || target?.tagName === 'INPUT'
            || target?.tagName === 'TEXTAREA'
        const isNavigationKey = isSearchInput
            ? searchInputNavigationKeys.has(event.key)
            : navigationKeys.has(event.key)

        if (!isNavigationKey) return
        mode.value = 'keyboard'
    }

    function handlePointerMove() {
        mode.value = 'pointer'
    }

    return {
        mode: readonly(mode) as DeepReadonly<Ref<CommandFocusMode>>,
        handleKeydown,
        handlePointerMove,
    }
}
