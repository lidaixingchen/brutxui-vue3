import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import type { LanguageMenuTarget } from '../../site-translations'

export function useLangs({ correspondingLink = false } = {}) {
    const { site, theme, localeIndex, page, frontmatter, hash } = useData<{
        i18nRouting?: boolean
    }>()
    const localeHome = (key: string) => site.value.locales[key]?.link || (key === 'root' ? '/' : `/${key}/`)
    const currentLang = computed(() => ({
        label: site.value.locales[localeIndex.value]?.label,
        link: localeHome(localeIndex.value),
    }))
    const mounted = ref(false)
    // URL 片段只在浏览器中可见，水合结束后再加入菜单链接。
    onMounted(() => {
        mounted.value = true
    })

    const localeLinks = computed(() => {
        const target = frontmatter.value.languageMenuTarget as LanguageMenuTarget | undefined
        const usePageLink = correspondingLink && theme.value.i18nRouting !== false
        const anchor = mounted.value && target?.translated ? hash.value : ''

        return Object.entries(site.value.locales).flatMap(([key, locale]) => {
            if (key === localeIndex.value) return []
            if (usePageLink && !target && !page.value.isNotFound) return []

            const link = usePageLink && target ? target.path + anchor : localeHome(key)
            return { text: locale.label, link }
        })
    })

    return { currentLang, localeLinks }
}
