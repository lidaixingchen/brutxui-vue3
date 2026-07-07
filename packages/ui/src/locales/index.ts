import type { Locale } from './types'

export { zhCN } from './zh-CN'
export { en } from './en'
export type { Locale, CommandLocale, ComboboxLocale, PaginationLocale, CarouselLocale, SpinnerLocale, SubmitButtonLocale, CopyToClipboardLocale, BeforeAfterLocale, AuthCardLocale, DashboardShellLocale, BrutalistHeroLocale, ToastLocale, MessageLocale, DialogLocale, SheetLocale, BreadcrumbLocale, TreeViewLocale, TreeSelectLocale, StepperLocale, HeaderSectionLocale, FooterSectionLocale, FeedbackFormLocale, CookieConsentLocale, ScratchCardLocale, SketchyChartLocale, Card3dLocale, HardcoreInputLocale, CodeBlockLocale, CalendarLocale, DatePickerLocale, ColorPickerLocale, KanbanLocale, PricingSectionLocale, InputLocale, NumberInputLocale, TextareaLocale, SwitchLocale, CheckboxLocale, TagsInputLocale, BadgeLocale, AlertLocale, AvatarLocale, DataTableLocale, FormWizardLocale, ChatBubbleLocale, TimelineLocale, TabsLocale, ColorModeSwitcherLocale, VirtualScrollLocale, PopconfirmLocale, UploadLocale, InfiniteScrollLocale } from './types'

type DeepPartial<T> = T extends (infer _U)[]
    ? T
    : { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }

export function mergeLocale(base: Locale, override: DeepPartial<Locale>): Locale {
    const result = structuredClone(base)
    for (const key of Object.keys(override) as Array<keyof Locale>) {
        const overrideVal = override[key]
        if (overrideVal !== undefined && typeof overrideVal === 'object' && !Array.isArray(overrideVal)) {
            const baseVal = result[key]
            if (typeof baseVal === 'object' && baseVal !== null && !Array.isArray(baseVal)) {
                // Both are locale sub-objects (flat objects with string/string[] values).
                // Object.assign merges the partial override into the complete base in-place.
                Object.assign(baseVal, overrideVal)
            }
        }
    }
    return result
}
