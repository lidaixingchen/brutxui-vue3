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
