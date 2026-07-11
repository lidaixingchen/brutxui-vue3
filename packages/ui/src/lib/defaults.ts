/**
 * Shared default values for component configuration.
 */

/** Default autoplay interval in milliseconds (used by Carousel, GlitchText) */
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

// ── Message ───────────────────────────────────────────────────

/** Default duration of a message item in milliseconds */
export const DEFAULT_MESSAGE_DURATION_MS = 3000

/** Grace period before destroying the message container after the last message is removed */
export const MESSAGE_GRACE_PERIOD_MS = 500

// ── Toast ─────────────────────────────────────────────────────

/** Default maximum number of visible toasts in the stack */
export const DEFAULT_TOAST_MAX_VISIBLE = 5

/** Default vertical gap between toast items in pixels */
export const DEFAULT_TOAST_GAP_PX = 12

// ── GlitchText ────────────────────────────────────────────────

/** Duration (ms) for which autoplay stays active after user interaction */
export const GLITCH_AUTOPLAY_ACTIVE_DURATION_MS = 1000

/** Minimum allowed autoplay interval in milliseconds */
export const GLITCH_MIN_INTERVAL_MS = 50

// ── Canvas Interaction ────────────────────────────────────────

/** Grid size (samples per axis) for canvas hover progress sampling */
export const CANVAS_SAMPLE_GRID_SIZE = 8

/** Frame interval (frames) between canvas progress checks */
export const CANVAS_PROGRESS_CHECK_FRAME_INTERVAL = 10

/** Throttle (ms) for canvas progress updates */
export const CANVAS_PROGRESS_THROTTLE_MS = 150

// ── Audio Engine ──────────────────────────────────────────────

/** Throttle (ms) between consecutive type sounds */
export const AUDIO_TYPE_THROTTLE_MS = 50

/** Base frequency (Hz) for the type sound */
export const AUDIO_TYPE_BASE_FREQ = 220

/** Frequency range (Hz) for the type sound variation */
export const AUDIO_TYPE_FREQ_RANGE = 80

/** Gain for the type sound */
export const AUDIO_TYPE_GAIN = 0.08

/** End gain for the type sound envelope */
export const AUDIO_TYPE_GAIN_END = 0.001

/** Duration (s) of the type sound */
export const AUDIO_TYPE_DURATION = 0.05

/** Start frequency (Hz) for the success sound */
export const AUDIO_SUCCESS_START_FREQ = 300

/** End frequency (Hz) for the success sound */
export const AUDIO_SUCCESS_END_FREQ = 600

/** Gain for the success sound */
export const AUDIO_SUCCESS_GAIN = 0.1

/** End gain for the success sound envelope */
export const AUDIO_SUCCESS_GAIN_END = 0.001

/** Duration (s) of the success sound */
export const AUDIO_SUCCESS_DURATION = 0.15

/** First frequency (Hz) of the fail sound */
export const AUDIO_FAIL_FREQ_1 = 150

/** Second frequency (Hz) of the fail sound */
export const AUDIO_FAIL_FREQ_2 = 100

/** Time (s) at which the fail sound shifts frequency */
export const AUDIO_FAIL_FREQ_SHIFT_TIME = 0.1

/** Gain for the fail sound */
export const AUDIO_FAIL_GAIN = 0.1

/** End gain for the fail sound envelope */
export const AUDIO_FAIL_GAIN_END = 0.001

/** Duration (s) of the fail sound */
export const AUDIO_FAIL_DURATION = 0.2

// ── Dialog ────────────────────────────────────────────────────

/** Default transition duration (ms) for dialog open/close animations */
export const DEFAULT_DIALOG_TRANSITION_MS = 300

// ── HardcoreInput ─────────────────────────────────────────────

/** Delay (ms) before triggering the shake animation reset */
export const HARDCORE_INPUT_SHAKE_DELAY_MS = 10

// ── DataTable ─────────────────────────────────────────────────

/** Default page size when no pageSize prop is provided */
export const DEFAULT_PAGE_SIZE = 10

/** Fallback column width (px) when column.width is not a number */
export const DATA_TABLE_COLUMN_WIDTH_FALLBACK_PX = 150

/** Width (px) of the expand toggle column */
export const DATA_TABLE_EXPAND_COLUMN_WIDTH_PX = 40

/** Width (px) of the selection checkbox column */
export const DATA_TABLE_SELECT_COLUMN_WIDTH_PX = 48

/** Fallback row height (px) for virtual scroll when rowHeight is 'auto' or undefined */
export const DATA_TABLE_ROW_HEIGHT_FALLBACK_PX = 48

// ── Carousel ──────────────────────────────────────────────────

/** Default autoplay delay in milliseconds */
export const DEFAULT_AUTOPLAY_DELAY_MS = 3000
