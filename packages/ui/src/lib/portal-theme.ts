import { onBeforeUnmount, watchPostEffect, type ComputedRef, type Ref } from 'vue'
import { getComputedStyle, getMutationObserverCtor } from './env'

type ThemeAnchorRef = Readonly<Ref<HTMLElement | undefined>>
type PortalElementRef = Readonly<ComputedRef<HTMLElement | null>>

interface InlinePropertyValue {
    value: string
    priority: string
}

function readThemeClasses(anchor: HTMLElement): Set<string> {
    const classes = new Set<string>()

    if (anchor.closest('.dark')) classes.add('dark')

    let current: Element | null = anchor
    while (current) {
        const presetClasses = Array.from(current.classList).filter(className => className.startsWith('theme-'))
        if (presetClasses.length > 0) {
            presetClasses.forEach(className => classes.add(className))
            break
        }
        current = current.parentElement
    }

    return classes
}

function readThemeVariables(anchor: HTMLElement): Map<string, string> {
    const variables = new Map<string, string>()
    const computed = getComputedStyle(anchor)
    if (!computed) return variables

    for (let index = 0; index < computed.length; index += 1) {
        const property = computed.item(index)
        if (!property.startsWith('--brutal-')) continue

        const value = computed.getPropertyValue(property).trim()
        if (value) variables.set(property, value)
    }

    return variables
}

function resolveThemeHost(content: HTMLElement): HTMLElement {
    const popperWrapper = content.closest<HTMLElement>('[data-reka-popper-content-wrapper]')
    if (popperWrapper) return popperWrapper

    return content.parentElement && content.parentElement !== content.ownerDocument.body
        ? content.parentElement
        : content
}

function readAncestorPath(anchor: HTMLElement): Element[] {
    const path: Element[] = []
    let current: Element | null = anchor
    while (current) {
        path.push(current)
        current = current.parentElement
    }
    return path
}

function samePath(left: Element[], right: Element[]): boolean {
    return left.length === right.length && left.every((element, index) => element === right[index])
}

/** 让传送到 body 的弹层继承实际触发器所在的主题作用域。 */
export function usePortalThemeInheritance(
    anchorRef: ThemeAnchorRef,
    contentRef: PortalElementRef,
): void {
    let host: HTMLElement | null = null
    let observer: MutationObserver | null = null
    let observedPath: Element[] = []
    let appliedClasses = new Set<string>()
    let originalClasses = new Map<string, boolean>()
    let appliedVariables = new Set<string>()
    let originalVariables = new Map<string, InlinePropertyValue>()

    const restoreHost = (): void => {
        if (!host) return

        for (const className of appliedClasses) {
            if (!originalClasses.get(className)) host.classList.remove(className)
        }
        for (const [property, previous] of originalVariables) {
            if (previous.value) host.style.setProperty(property, previous.value, previous.priority)
            else host.style.removeProperty(property)
        }

        appliedClasses = new Set()
        originalClasses = new Map()
        appliedVariables = new Set()
        originalVariables = new Map()
        host = null
    }

    const applyTheme = (nextHost: HTMLElement, classes: Set<string>, variables: Map<string, string>): void => {
        if (host !== nextHost) {
            restoreHost()
            host = nextHost
        }

        for (const className of appliedClasses) {
            if (classes.has(className)) continue
            if (!originalClasses.get(className)) host.classList.remove(className)
            originalClasses.delete(className)
        }
        for (const className of classes) {
            if (appliedClasses.has(className)) continue
            originalClasses.set(className, host.classList.contains(className))
            host.classList.add(className)
        }
        appliedClasses = classes

        for (const property of appliedVariables) {
            if (variables.has(property)) continue
            const previous = originalVariables.get(property)!
            if (previous.value) host.style.setProperty(property, previous.value, previous.priority)
            else host.style.removeProperty(property)
            originalVariables.delete(property)
        }
        for (const [property, value] of variables) {
            if (!originalVariables.has(property)) {
                originalVariables.set(property, {
                    value: host.style.getPropertyValue(property),
                    priority: host.style.getPropertyPriority(property),
                })
            }
            host.style.setProperty(property, value)
        }
        appliedVariables = new Set(variables.keys())
    }

    const observeAnchor = (anchor: HTMLElement | undefined): void => {
        const nextPath = anchor ? readAncestorPath(anchor) : []
        if (samePath(observedPath, nextPath)) return

        observer?.disconnect()
        observer = null
        observedPath = nextPath

        const Observer = getMutationObserverCtor()
        if (nextPath.length > 0 && Observer) {
            observer = new Observer(sync)
            for (const element of nextPath) {
                observer.observe(element, {
                    attributes: true,
                    attributeFilter: ['class', 'style'],
                })
            }
        }
    }

    const sync = (): void => {
        const anchor = anchorRef.value
        const content = contentRef.value
        observeAnchor(anchor)

        if (!anchor?.isConnected || !content?.isConnected) {
            restoreHost()
            return
        }

        applyTheme(resolveThemeHost(content), readThemeClasses(anchor), readThemeVariables(anchor))
    }

    watchPostEffect(sync)
    onBeforeUnmount(() => {
        observer?.disconnect()
        observer = null
        observedPath = []
        restoreHost()
    })
}
