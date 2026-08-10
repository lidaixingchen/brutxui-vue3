import { type ComputedRef, type InjectionKey, type MaybeRef, computed, inject, provide, unref } from 'vue'
import { zhCN } from '../locales/zh-CN'
import type { Locale } from '../locales/types'

export const LOCALE_INJECTION_KEY: InjectionKey<MaybeRef<Locale>> = Symbol('brutx-ui-locale')
export const FALLBACK_LOCALE_INJECTION_KEY: InjectionKey<MaybeRef<Partial<Locale>>> = Symbol('brutx-ui-fallback-locale')

export type TranslateFunction = (path: string, params?: Record<string, string | number>) => string

export interface LocaleOptions {
    locale: MaybeRef<Locale>
    fallbackLocale?: MaybeRef<Partial<Locale>>
}

export function provideLocale(localeOrOptions: MaybeRef<Locale> | LocaleOptions): void {
    // 检查是否是 LocaleOptions 格式（包含 locale 属性）
    if (
        typeof localeOrOptions === 'object' &&
        localeOrOptions !== null &&
        'locale' in localeOrOptions
    ) {
        const options = localeOrOptions as LocaleOptions
        provide(LOCALE_INJECTION_KEY, options.locale)
        // 未提供 fallbackLocale 时显式注入空对象：
        // 避免后代组件静默继承祖先作用域注入的 fallback，与「只使用新 locale + 内置 zhCN」的预期一致
        provide(FALLBACK_LOCALE_INJECTION_KEY, options.fallbackLocale ?? {})
    } else {
        // 直接传入 MaybeRef<Locale> 格式（向后兼容）
        provide(LOCALE_INJECTION_KEY, localeOrOptions as MaybeRef<Locale>)
    }
}

function resolveByPath(obj: unknown, path: string): string | undefined {
    const keys = path.split('.')
    let result: unknown = obj
    for (const key of keys) {
        if (typeof result !== 'object' || result === null) return undefined
        // 仅读取自身属性，避免命中原型链（theme-editor 等场景的普通对象以外部可控名称作键）
        if (!Object.prototype.hasOwnProperty.call(result, key)) return undefined
        result = (result as Record<string, unknown>)[key]
    }
    return typeof result === 'string' ? result : undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) return template
    // 单次正则遍历替换，结果与参数插入顺序无关：
    // 避免参数值本身包含其他占位符（如 {a} 的值为 '{b}'）时产生残留或意外二次替换
    return template.replace(/\{([^{}]+)\}/g, (_, key) =>
        Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : `{${key}}`,
    )
}

export function useLocale(): { locale: ComputedRef<Locale>; t: TranslateFunction } {
    const injected = inject<MaybeRef<Locale> | undefined>(LOCALE_INJECTION_KEY, undefined)
    const injectedFallback = inject<MaybeRef<Partial<Locale>> | undefined>(FALLBACK_LOCALE_INJECTION_KEY, undefined)

    const locale = computed<Locale>(() => {
        const resolved = injected ? unref(injected) : undefined
        return resolved ?? zhCN
    })

    const fallbackLocale = computed<Partial<Locale>>(() => {
        return injectedFallback ? unref(injectedFallback) : {}
    })

    function t(path: string, params?: Record<string, string | number>): string {
        // 1. 尝试从用户 locale 查找
        const currentVal = resolveByPath(locale.value, path)
        if (currentVal !== undefined) return interpolate(currentVal, params)

        // 2. 尝试从自定义 fallback locale 查找
        if (fallbackLocale.value && Object.keys(fallbackLocale.value).length > 0) {
            const fallbackVal = resolveByPath(fallbackLocale.value, path)
            if (fallbackVal !== undefined) return interpolate(fallbackVal, params)
        }

        // 3. 尝试从默认 zhCN 查找
        const zhCNVal = resolveByPath(zhCN, path)
        if (zhCNVal !== undefined) return interpolate(zhCNVal, params)

        // 4. 返回 path 原文
        return path
    }

    return { locale, t }
}
