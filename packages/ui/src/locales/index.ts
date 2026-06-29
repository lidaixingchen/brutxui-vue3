import type { Locale } from './types'

export { zhCN } from './zh-CN'
export { en } from './en'
export type { Locale, CommandLocale, ComboboxLocale, PaginationLocale, CarouselLocale, SpinnerLocale, SubmitButtonLocale, CopyToClipboardLocale, BeforeAfterLocale, AuthCardLocale, WaitlistPageLocale, DashboardShellLocale, BrutalistHeroLocale, SaaSPricingLocale, ToastLocale, DialogLocale, SheetLocale, BreadcrumbLocale, TreeViewLocale, StepperLocale, EmptyStateLocale, TestimonialCardLocale, BlogCardLocale, FileCardLocale, QuickActionsLocale, FaqSectionLocale, HeaderSectionLocale, FooterSectionLocale, NotFoundPageLocale, LoadingPageLocale, ErrorCardLocale, SuccessCardLocale, SearchWidgetLocale, FeedbackFormLocale, StepperSectionLocale, CookieConsentLocale, DataTableSectionLocale, SettingsPageLocale, UploadCardLocale, OverviewPageLocale, BlogListPageLocale, ActivityLogPageLocale, ProfilePageLocale, ChartSectionLocale, GallerySectionLocale, ScratchCardLocale, SketchyChartLocale, Card3dLocale, HardcoreInputLocale, CodeBlockLocale, CalendarLocale, DatePickerLocale, ColorPickerLocale, KanbanLocale, PricingSectionLocale, DashboardStatsLocale, InputLocale, NumberInputLocale, TextareaLocale, SwitchLocale, CheckboxLocale, TagsInputLocale, BadgeLocale, AlertLocale } from './types'

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

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
