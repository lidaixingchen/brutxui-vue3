import type { Locale } from './types'

export { zhCN } from './zh-CN'
export { en } from './en'
export type { Locale, CommandLocale, ComboboxLocale, PaginationLocale, CarouselLocale, SpinnerLocale, SubmitButtonLocale, CopyToClipboardLocale, BeforeAfterLocale, AuthCardLocale, DashboardShellLocale, BrutalistHeroLocale, ToastLocale, MessageLocale, DialogLocale, SheetLocale, BreadcrumbLocale, TreeViewLocale, TreeSelectLocale, StepperLocale, HeaderSectionLocale, FooterSectionLocale, FeedbackFormLocale, CookieConsentLocale, ScratchCardLocale, SketchyChartLocale, Card3dLocale, HardcoreInputLocale, CodeBlockLocale, CalendarLocale, DatePickerLocale, ColorPickerLocale, KanbanLocale, PricingSectionLocale, InputLocale, NumberInputLocale, TextareaLocale, SwitchLocale, CheckboxLocale, TagsInputLocale, BadgeLocale, AlertLocale, AvatarLocale, DataTableLocale, FormWizardLocale, ChatBubbleLocale, TimelineLocale, TabsLocale, ColorModeSwitcherLocale, VirtualScrollLocale, PopconfirmLocale, UploadLocale, InfiniteScrollLocale, TourLocale } from './types'

/**
 * 递归部分类型：数组（含只读数组）保持原样整体覆盖，普通对象逐层可选化。
 * 使用 `readonly unknown[]` 分支是必要的——`months` 已声明为 `readonly string[]`，
 * 若只匹配可变数组，只读数组会落入对象映射分支生成畸形索引类型。
 */
type DeepPartial<T> = T extends readonly unknown[]
    ? T
    : { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 深拷贝：优先使用 structuredClone，缺失时（Node < 17、Chrome < 98 等）降级为 JSON 序列化。
 * Locale 为纯数据对象，可安全序列化。
 */
function deepClone<T>(value: T): T {
    return typeof structuredClone === 'function'
        ? structuredClone(value)
        : (JSON.parse(JSON.stringify(value)) as T)
}

/** 递归合并：跳过 undefined 键、对未知键告警并忽略、子对象逐层合并。 */
function mergeObject(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(source)) {
        if (value === undefined) continue
        if (!Object.prototype.hasOwnProperty.call(target, key)) {
            if (typeof console !== 'undefined') {
                console.warn(`[brutx-ui] mergeLocale: 忽略未知的语言包键 "${key}"`)
            }
            continue
        }
        const targetValue = target[key]
        if (isPlainObject(value) && isPlainObject(targetValue)) {
            mergeObject(targetValue, value)
        } else {
            target[key] = value
        }
    }
}

export function mergeLocale(base: Locale, override: DeepPartial<Locale>): Locale {
    const result = deepClone(base) as unknown as Record<string, unknown>
    mergeObject(result, override as unknown as Record<string, unknown>)
    return result as unknown as Locale
}
