/**
 * Environment detection utilities for SSR compatibility.
 * Use these instead of scattered `typeof document/window` checks.
 */

/** Whether the code is running in a browser environment (not SSR). */
export const isClient = typeof window !== 'undefined'

/** Whether `document` is available. */
export const hasDocument = typeof document !== 'undefined'

/** Whether `localStorage` is available (may be blocked in Safari private mode). */
export const hasLocalStorage = typeof localStorage !== 'undefined'

/** Whether `document.body` is available for imperative mounting. */
export function canUseDocumentBody(): boolean {
    return hasDocument && document.body !== null
}

/** Whether IntersectionObserver is available. */
export const hasIntersectionObserver = isClient && typeof window.IntersectionObserver !== 'undefined'

type AudioContextConstructor = typeof AudioContext
type ResizeObserverConstructor = typeof ResizeObserver
type MutationObserverConstructor = typeof MutationObserver

export interface ViewportSize {
    width: number
    height: number
}

/** Get the available AudioContext constructor, including Safari's prefixed API. */
export function getAudioContextCtor(): AudioContextConstructor | null {
    if (!isClient) return null
    return window.AudioContext
        ?? (window as Window & typeof globalThis & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
        ?? null
}

/** Get the available ResizeObserver constructor. */
export function getResizeObserverCtor(): ResizeObserverConstructor | null {
    if (!isClient) return null
    return window.ResizeObserver ?? null
}

/** Get the available MutationObserver constructor. */
export function getMutationObserverCtor(): MutationObserverConstructor | null {
    if (!isClient) return null
    return window.MutationObserver ?? null
}

/** Get the current device pixel ratio with an SSR-safe fallback. */
export function getDevicePixelRatio(): number {
    if (!isClient) return 1
    return window.devicePixelRatio || 1
}

/** Get viewport dimensions with an SSR-safe fallback. */
export function getViewportSize(): ViewportSize {
    if (!isClient) return { width: 0, height: 0 }
    return {
        width: window.innerWidth,
        height: window.innerHeight,
    }
}

/** Create a canvas element when the DOM supports it. */
export function createCanvasElement(): HTMLCanvasElement | null {
    if (!hasDocument) return null
    try {
        return document.createElement('canvas')
    } catch {
        return null
    }
}

/** Get a 2D rendering context without leaking capability errors to callers. */
export function getCanvas2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    try {
        return canvas.getContext('2d')
    } catch {
        return null
    }
}

/**
 * Safely get a value from localStorage.
 * Returns `null` if localStorage is unavailable or the key doesn't exist.
 */
export function safeGetStorageItem(key: string): string | null {
    try {
        if (!hasLocalStorage) return null
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

/**
 * Safely set a value in localStorage.
 * Silently fails if localStorage is unavailable (e.g. Safari private mode, storage full).
 */
export function safeSetStorageItem(key: string, value: string): void {
    try {
        if (!hasLocalStorage) return
        localStorage.setItem(key, value)
    } catch {
        // Storage full or blocked (e.g. Safari private mode)
    }
}

// ============================================================================
// SSR-safe 工具层扩展（§3.1）
// 所有 DOM/BOM 访问必须经此层封装，禁止生产代码直接引用 window/document 等。
// 现有 API 返回 null，新增 API 返回 undefined（与 plan 代码示例一致）。
// ============================================================================

/** Whether the code is running in an SSR environment (not a browser). */
export const isServer = !isClient

/** Get the `window` object when available. Returns `undefined` on SSR. */
export function getWindow(): Window | undefined {
    return isClient ? window : undefined
}

/** Get the `document` object when available. Returns `undefined` on SSR. */
export function getDocument(): Document | undefined {
    return isClient ? document : undefined
}

/** Get the `navigator` object when available. Returns `undefined` on SSR. */
export function getNavigator(): Navigator | undefined {
    return isClient ? navigator : undefined
}

/**
 * Call `window.matchMedia` when available. Returns `undefined` on SSR.
 * Callers must guard the result before attaching listeners.
 */
export function matchMedia(query: string): MediaQueryList | undefined {
    return isClient ? window.matchMedia(query) : undefined
}

/**
 * Get the `localStorage` Storage object when available. Returns `undefined` on SSR.
 * Complements the value-level `safeGetStorageItem`/`safeSetStorageItem` helpers
 * for callers that need direct Storage access (e.g. bulk iteration).
 */
export function getLocalStorage(): Storage | undefined {
    return isClient ? window.localStorage : undefined
}

/**
 * Get the `sessionStorage` Storage object when available. Returns `undefined` on SSR.
 * Complements the value-level `safeGetStorageItem`/`safeSetStorageItem` helpers.
 */
export function getSessionStorage(): Storage | undefined {
    return isClient ? window.sessionStorage : undefined
}

/**
 * SSR-safe `requestAnimationFrame`. Returns `0` on SSR (no-op).
 * Callers do not need to guard — the returned handle is safe to pass to `cancelAnimationFrame`.
 */
export function requestAnimationFrame(cb: FrameRequestCallback): number {
    return isClient ? window.requestAnimationFrame(cb) : 0
}

/**
 * SSR-safe `cancelAnimationFrame`. No-op on SSR.
 * Safe to call with the `0` handle returned by SSR `requestAnimationFrame`.
 */
export function cancelAnimationFrame(handle: number): void {
    if (isClient) window.cancelAnimationFrame(handle)
}

/**
 * Get the `IntersectionObserver` constructor when available. Returns `undefined` on SSR.
 * Callers must guard before `new`.
 */
export function getIntersectionObserverCtor(): typeof IntersectionObserver | undefined {
    return isClient ? window.IntersectionObserver : undefined
}

/**
 * Get the `PerformanceObserver` constructor when available. Returns `undefined` on SSR.
 * Callers must guard before `new`.
 */
export function getPerformanceObserverCtor(): typeof PerformanceObserver | undefined {
    return isClient ? window.PerformanceObserver : undefined
}

/**
 * SSR-safe `window.getComputedStyle`. Returns `undefined` on SSR.
 * Callers must guard before reading property values.
 */
export function getComputedStyle(elt: Element, pseudoElt?: string | null): CSSStyleDeclaration | undefined {
    return isClient ? window.getComputedStyle(elt, pseudoElt ?? undefined) : undefined
}

/**
 * Get the `history` object when available. Returns `undefined` on SSR.
 * Read-only access; write operations (pushState/replaceState) require caller-side guards.
 */
export function getHistory(): History | undefined {
    return isClient ? window.history : undefined
}

/**
 * Get the `location` object when available. Returns `undefined` on SSR.
 * Read-only access; navigation requires caller-side guards.
 */
export function getLocation(): Location | undefined {
    return isClient ? window.location : undefined
}

/**
 * SSR-safe `window.scrollTo`. No-op on SSR.
 */
export function scrollTo(x: number, y: number): void {
    if (isClient) window.scrollTo(x, y)
}

/**
 * SSR-safe `Element.scrollIntoView`. No-op on SSR.
 */
export function scrollIntoView(elt: Element, options?: ScrollIntoViewOptions): void {
    if (isClient) elt.scrollIntoView(options)
}
