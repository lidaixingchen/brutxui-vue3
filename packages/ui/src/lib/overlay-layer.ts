import { computed, inject, provide, type ComputedRef, type InjectionKey, type StyleValue } from 'vue'
import { Z_INDEX_TOKENS } from './z-index'

type ModalLayerToken = 'dialog'
type FloatingLayerToken = 'dropdown' | 'popover' | 'tooltip'
type ModalLayer = ComputedRef<number>

const modalLayerKey: InjectionKey<ModalLayer> = Symbol('BrutxModalLayer')
const highestFloatingLayer = Math.max(
    Z_INDEX_TOKENS.dropdown,
    Z_INDEX_TOKENS.popover,
    Z_INDEX_TOKENS.tooltip
)
const modalLayerStep = Z_INDEX_TOKENS.dialog - highestFloatingLayer
const rootLayer = 0

function layerStyle(token: ModalLayerToken | FloatingLayerToken, value: number): StyleValue {
    return { [`--z-index-${token}`]: value }
}

/** 每个模态内容建立一层 Vue 作用域层级，Teleport 后代仍能按组件关系计算相对层级。 */
export function useModalOverlayLayerStyle(): ComputedRef<StyleValue> {
    const parentLayer = inject(modalLayerKey, null)
    const modalLayer = computed(() =>
        parentLayer ? parentLayer.value + modalLayerStep : Z_INDEX_TOKENS.dialog
    )

    provide(modalLayerKey, modalLayer)

    return computed(() => layerStyle('dialog', modalLayer.value))
}

export function useCurrentModalOverlayLayerStyle(): ComputedRef<StyleValue> {
    const modalLayer = inject(modalLayerKey, null)

    return computed(() => layerStyle(
        'dialog',
        modalLayer?.value ?? Z_INDEX_TOKENS.dialog
    ))
}

export function useFloatingOverlayLayerStyle(token: FloatingLayerToken): ComputedRef<StyleValue> {
    const modalLayer = inject(modalLayerKey, null)
    const tokenValue = Z_INDEX_TOKENS[token]

    return computed(() => layerStyle(
        token,
        (modalLayer?.value ?? rootLayer) + tokenValue
    ))
}
