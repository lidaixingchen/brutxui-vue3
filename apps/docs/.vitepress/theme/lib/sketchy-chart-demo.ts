import { computed, type ComputedRef } from 'vue'
import { provideLocale } from 'brutx-ui-vue/useLocale'
import { en, zhCN, type Locale } from 'brutx-ui-vue/locales'
import { useI18n } from './i18n'

export interface ChartDemoItem { label: string; value: number }
interface ChartDemoLocale {
    language: ComputedRef<string>
    text: (chinese: string, english: string) => string
}

export function useChartDemoLocale(): ChartDemoLocale {
    const { isEn }: { isEn: ComputedRef<boolean> } = useI18n()
    const locale: ComputedRef<Locale> = computed((): Locale => isEn.value ? en : zhCN)
    const language: ComputedRef<string> = computed((): string => isEn.value ? 'en-US' : 'zh-CN')
    provideLocale(locale)
    function text(chinese: string, english: string): string {
        return isEn.value ? english : chinese
    }
    return { language, text }
}
