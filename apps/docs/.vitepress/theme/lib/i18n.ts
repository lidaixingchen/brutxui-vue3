import { computed } from 'vue'
import { useData } from 'vitepress'

export type LocaleKey =
    | 'manual'
    | 'installDeps'
    | 'copyFromGitHub'
    | 'saveToProject'
    | 'importAndUse'
    | 'viewOnGitHub'
    | 'cliInstall'
    | 'componentUsage'
    | 'quickStart'
    | 'copyPasteFirst'
    | 'componentPreview'
    | 'brutalVisualImpact'
    | 'components'
    | 'blocks'
    | 'typescript'
    | 'themes'
    | 'pageNotFound'
    | 'pageNotFoundDesc'
    | 'backToHome'
    | 'translationBanner'

const i18n: Record<string, Record<LocaleKey, string>> = {
    'zh-CN': {
        manual: '手动',
        installDeps: '安装依赖',
        copyFromGitHub: '从 GitHub 复制组件源码',
        saveToProject: '保存到你的项目',
        importAndUse: '导入并使用',
        viewOnGitHub: '在 GitHub 上查看',
        cliInstall: 'CLI 安装',
        componentUsage: '组件使用',
        quickStart: '快速开始',
        copyPasteFirst: '复制粘贴优先，零依赖锁定',
        componentPreview: '组件预览',
        brutalVisualImpact: '粗野主义视觉冲击力，一眼可见',
        components: '组件',
        blocks: '区块',
        typescript: 'TypeScript',
        themes: '套主题',
        pageNotFound: '页面未找到',
        pageNotFoundDesc: '您访问的页面不存在或已被移除。',
        backToHome: '返回首页',
        translationBanner: '此页面暂无英文版本，正在显示中文内容。',
    },
    en: {
        manual: 'Manual',
        installDeps: 'Install dependencies',
        copyFromGitHub: 'Copy source from GitHub',
        saveToProject: 'Save to your project',
        importAndUse: 'Import and use',
        viewOnGitHub: 'View on GitHub',
        cliInstall: 'CLI Install',
        componentUsage: 'Component Usage',
        quickStart: 'Quick Start',
        copyPasteFirst: 'Copy-paste first, zero dependency lock-in',
        componentPreview: 'Component Preview',
        brutalVisualImpact: 'Neo-Brutalism visual impact, at a glance',
        components: 'Components',
        blocks: 'Blocks',
        typescript: 'TypeScript',
        themes: 'Themes',
        pageNotFound: 'Page Not Found',
        pageNotFoundDesc: 'The page you are looking for does not exist or has been removed.',
        backToHome: 'Back to Home',
        translationBanner: 'This page is currently available in Chinese only.',
    },
}

const fallback: Record<LocaleKey, string> = i18n['zh-CN']!

/**
 * 获取当前语言环境下的翻译文本
 * 用于 VitePress 自定义主题组件的 i18n 支持
 */
export function useI18n() {
    const { lang } = useData()

    const isEn = computed(() => lang.value.startsWith('en'))

    function t(key: LocaleKey): string {
        const locale = isEn.value ? 'en' : 'zh-CN'
        return i18n[locale]?.[key] ?? fallback[key]
    }

    return { lang, isEn, t }
}
