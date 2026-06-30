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

// ── Card3D ────────────────────────────────────────────────────

/** Default CSS perspective value in pixels for 3D card effect */
export const CARD_3D_DEFAULT_PERSPECTIVE_PX = 1000

// ── SketchyChart ──────────────────────────────────────────────

/** Default chart width in pixels */
export const SKETCHY_CHART_DEFAULT_WIDTH = 600

/** Default chart height in pixels */
export const SKETCHY_CHART_DEFAULT_HEIGHT = 400

// ── Date ──────────────────────────────────────────────────────

/** Two-digit year pivot: >= this value → 19xx, < this value → 20xx */
export const TWO_DIGIT_YEAR_PIVOT = 50
