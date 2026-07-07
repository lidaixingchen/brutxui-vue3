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
