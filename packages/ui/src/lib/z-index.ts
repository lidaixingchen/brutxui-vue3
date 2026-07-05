/**
 * Centralized z-index tokens for page-level overlays.
 *
 * Components that overlay the page (tours, image viewers, messages) must
 * reference these tokens instead of hard-coded numbers so that stacking
 * order stays predictable and never collides.
 *
 * Values sit in the 9000+ band to remain above reka-ui portals (dialogs,
 * popovers, tooltips), which typically use z-index < 9000. Each layer has
 * a distinct, ordered value so simultaneous overlays stack deterministically:
 * tour < image viewer < message.
 */
export const Z_INDEX = {
    /** Tour darkening canvas (behind the tour popover). */
    TOUR_CANVAS: 9998,
    /** Tour popover (above its own canvas). */
    TOUR_POPOVER: 9999,
    /** Image viewer backdrop / overlay. */
    IMAGE_PREVIEW_OVERLAY: 10001,
    /** Image viewer controls (close, prev, next, toolbar) — above the overlay. */
    IMAGE_PREVIEW_CONTROL: 10002,
    /** Toast / message container — above all other overlays. */
    MESSAGE: 10010,
} as const
