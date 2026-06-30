/**
 * Shared default values for component configuration.
 */

/** Default autoplay interval in milliseconds (used by Carousel, GlitchText, GlitchButton) */
export const DEFAULT_AUTOPLAY_INTERVAL_MS = 3000

// ── Color Picker ──────────────────────────────────────────────

/** Precision multiplier for HSV saturation/value rounding (→ 0.1% steps) */
export const HSV_PERCENT_PRECISION = 1000

/** Maximum hue angle in degrees */
export const HUE_DEGREES = 360

/** Maximum saturation / value percentage */
export const HSV_COMPONENT_MAX = 100

/** Precision multiplier for alpha rounding (→ 0.01 steps) */
export const ALPHA_PRECISION = 100

// ── Dialog ────────────────────────────────────────────────────

/** Minimum draggable/resizable dialog width in pixels */
export const DIALOG_MIN_WIDTH_PX = 200

/** Minimum draggable/resizable dialog height in pixels */
export const DIALOG_MIN_HEIGHT_PX = 150

// ── Toast ─────────────────────────────────────────────────────

/** Maximum number of concurrent toasts displayed */
export const MAX_TOASTS = 10

// ── DataTable ─────────────────────────────────────────────────

/** Default page size options for paginated tables */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
