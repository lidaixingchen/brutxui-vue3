import {
    computed,
    inject,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    provide,
    shallowRef,
    watchPostEffect,
    type ComputedRef,
    type InjectionKey,
    type ShallowRef,
    type StyleValue,
} from 'vue'
import { getComputedStyle, getMutationObserverCtor } from './env'
import { useForwardExpose } from 'reka-ui'

type ModalLayerToken = 'dialog'
type FloatingLayerToken = 'dropdown' | 'popover' | 'tooltip'

const FLOATING_LAYER_TOKENS: readonly FloatingLayerToken[] = ['dropdown', 'popover', 'tooltip']
const MINIMUM_OVERLAY_LAYER_INCREMENT = 1
const EMPTY_STYLE: StyleValue = Object.freeze({})

interface ModalLayerContext {
    element: ShallowRef<HTMLElement | null>
    zIndex: ShallowRef<number | null>
    revision: ShallowRef<number>
    style: ComputedRef<StyleValue>
    overlayStyle: ComputedRef<StyleValue>
    attach: (value: unknown) => void
}

interface ModalOverlayLayer {
    style: ComputedRef<StyleValue>
    overlayStyle: ComputedRef<StyleValue>
    ref: (value: unknown) => void
}

const modalLayerKey: InjectionKey<ModalLayerContext> = Symbol('BrutxModalLayer')

function layerStyle(token: ModalLayerToken | FloatingLayerToken, value: number): StyleValue {
    return { [`--z-index-${token}`]: value }
}

function resolveHTMLElement(value: unknown): HTMLElement | null {
    if (typeof Event !== 'undefined' && value instanceof Event) {
        return resolveHTMLElement(value.target)
    }
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
        return value
    }

    if (value && typeof value === 'object' && '$el' in value) {
        const root = (value as { $el?: HTMLElement | CharacterData }).$el
        const element = typeof HTMLElement !== 'undefined' && root instanceof HTMLElement
            ? root : root?.nextElementSibling
        return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement ? element : null
    }

    return null
}

function readZIndex(element: HTMLElement): number | null {
    const value = Number(getComputedStyle(element)?.zIndex)
    return Number.isFinite(value) ? value : null
}

function readLayerToken(element: HTMLElement, token: ModalLayerToken | FloatingLayerToken): number | null {
    const probe = element.ownerDocument.createElement('span')
    probe.style.position = 'absolute'
    probe.style.zIndex = `var(--z-index-${token})`
    element.appendChild(probe)

    const value = Number(getComputedStyle(probe)?.zIndex)
    probe.remove()

    return Number.isFinite(value) ? value : null
}

function readModalLayerIncrement(element: HTMLElement): number | null {
    const dialogLayer = readLayerToken(element, 'dialog')
    const floatingLayers = FLOATING_LAYER_TOKENS.map(token => readLayerToken(element, token))

    if (dialogLayer === null || floatingLayers.some(layer => layer === null)) {
        return null
    }

    const numericFloatingLayers = floatingLayers.filter((layer): layer is number => layer !== null)
    const highestFloatingLayer = Math.max(...numericFloatingLayers)

    // z-index 使用整数层级；语义令牌间距不足时仍需跨过一个可见层级。
    return Math.max(MINIMUM_OVERLAY_LAYER_INCREMENT, dialogLayer - highestFloatingLayer)
}

function createModalLayerContext(parentLayer: ModalLayerContext | null): ModalLayerContext {
    const element = shallowRef<HTMLElement | null>(null)
    const zIndex = shallowRef<number | null>(null)
    const revision = shallowRef(0)
    let observer: MutationObserver | null = null
    let observedPath: Element[] = []
    let tokenValues: Array<number | null> = []

    const refresh = (): void => {
        const currentElement = element.value
        const nextZIndex = currentElement?.isConnected ? readZIndex(currentElement) : null
        const nextTokenValues = currentElement?.isConnected
            ? ['dialog' as const, ...FLOATING_LAYER_TOKENS].map(token => readLayerToken(currentElement, token))
            : []

        if (zIndex.value !== nextZIndex) {
            zIndex.value = nextZIndex
        }
        if (nextTokenValues.length !== tokenValues.length
            || nextTokenValues.some((value, index) => value !== tokenValues[index])) {
            tokenValues = nextTokenValues
            revision.value += 1
        }
    }

    const readPath = (currentElement: HTMLElement): Element[] => {
        const path: Element[] = []
        let current: Element | null = currentElement

        while (current) {
            path.push(current)
            current = current.parentElement
        }

        return path
    }

    const samePath = (left: Element[], right: Element[]): boolean =>
        left.length === right.length && left.every((elementAtIndex, index) => elementAtIndex === right[index])

    const observeElement = (): void => {
        const currentElement = element.value
        observer?.disconnect()
        observer = null
        observedPath = currentElement ? readPath(currentElement) : []

        const Observer = getMutationObserverCtor()
        if (currentElement && Observer) {
            observer = new Observer((records) => {
                const nextPath = element.value ? readPath(element.value) : []
                if (!samePath(observedPath, nextPath)) {
                    observeElement()
                    return
                }

                if (records.some(record => record.type === 'attributes')) {
                    refresh()
                }
            })

            for (const pathElement of observedPath) {
                observer.observe(pathElement, {
                    attributes: true,
                    attributeFilter: ['class', 'style'],
                    childList: true,
                })
            }
        }

        refresh()
    }

    const style = computed<StyleValue>(() => {
        if (!parentLayer) {
            return EMPTY_STYLE
        }

        void parentLayer.revision.value
        const parentZIndex = parentLayer.zIndex.value
        const parentElement = parentLayer.element.value

        if (parentZIndex === null || !parentElement) {
            return EMPTY_STYLE
        }

        const increment = readModalLayerIncrement(parentElement)
        return increment === null
            ? EMPTY_STYLE
            : layerStyle('dialog', parentZIndex + increment)
    })

    const overlayStyle = computed<StyleValue>(() => {
        const modalZIndex = zIndex.value
        return modalZIndex === null ? EMPTY_STYLE : layerStyle('dialog', modalZIndex)
    })

    const context: ModalLayerContext = {
        element,
        zIndex,
        revision,
        style,
        overlayStyle,
        attach: (value: unknown) => {
            const nextElement = resolveHTMLElement(value)
            if (element.value !== nextElement) {
                element.value = nextElement
                observeElement()
            }
        },
    }

    onMounted(observeElement)
    onBeforeUnmount(() => observer?.disconnect())

    return context
}

/** 为模态内容记录实际绘制层级，使 Teleport 后代可依据所属内容派生相对层级。 */
export function useModalOverlayLayer(): ModalOverlayLayer {
    const parentLayer = inject(modalLayerKey, null)
    const modalLayer = createModalLayerContext(parentLayer)

    provide(modalLayerKey, modalLayer)

    return {
        style: modalLayer.style,
        overlayStyle: modalLayer.overlayStyle,
        ref: modalLayer.attach,
    }
}

export function useCurrentModalOverlayLayerStyle(): ComputedRef<StyleValue> {
    const modalLayer = inject(modalLayerKey, null)

    return computed(() => {
        if (!modalLayer) {
            return EMPTY_STYLE
        }

        return modalLayer.overlayStyle.value
    })
}

export function useFloatingOverlayLayer(
    token: FloatingLayerToken,
    itemAligned: () => boolean = () => false,
): { style: ComputedRef<StyleValue>; ref: ReturnType<typeof useForwardExpose>['forwardRef'] } {
    const modalLayer = inject(modalLayerKey, null)
    const { forwardRef, currentRef } = useForwardExpose()
    let observedElement: HTMLElement | null = null
    let observer: MutationObserver | null = null

    const style = computed(() => {
        if (!modalLayer) {
            return EMPTY_STYLE
        }

        void modalLayer.revision.value
        const parentZIndex = modalLayer.zIndex.value
        const parentElement = modalLayer.element.value

        if (parentZIndex === null || !parentElement) {
            return EMPTY_STYLE
        }

        const tokenValue = readLayerToken(parentElement, token)
        if (tokenValue === null) {
            return EMPTY_STYLE
        }

        return layerStyle(token, parentZIndex + Math.max(MINIMUM_OVERLAY_LAYER_INCREMENT, tokenValue))
    })

    const syncPositionerLayer = (): void => {
        void style.value
        const root = resolveHTMLElement(currentRef.value)
        let positioner = root?.closest<HTMLElement>('[data-reka-popper-content-wrapper]')
        let element = root === positioner ? resolveHTMLElement(positioner?.firstElementChild) : root
        if (!positioner && root && itemAligned()) {
            element = root.getAttribute('role') === 'listbox'
                ? root : root.querySelector<HTMLElement>('[role="listbox"]')
            positioner = element?.parentElement
        }
        if (!element || !positioner) return

        if (element !== observedElement) {
            observer?.disconnect()
            observedElement = element
            const Observer = getMutationObserverCtor()
            observer = Observer ? new Observer(syncPositionerLayer) : null
            let ancestor: Element | null = element
            while (ancestor) {
                observer?.observe(ancestor, { attributes: true, attributeFilter: ['class', 'style'] })
                ancestor = ancestor.parentElement
            }
        }

        const zIndex = getComputedStyle(element)?.zIndex
        if (zIndex && positioner.style.zIndex !== zIndex) positioner.style.zIndex = zIndex
    }

    // 定位容器是浮层的实际堆叠上下文；内容层级变化时须同步容器。
    watchPostEffect(syncPositionerLayer)
    onMounted(syncPositionerLayer)
    onUpdated(syncPositionerLayer)
    onBeforeUnmount(() => observer?.disconnect())

    return { style, ref: forwardRef }
}
