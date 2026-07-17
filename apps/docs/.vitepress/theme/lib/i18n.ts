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
    | 'sourceOwnership'
    | 'themes'
    | 'pageNotFound'
    | 'pageNotFoundDesc'
    | 'backToHome'
    | 'translationBanner'
    | 'installMethod'
    | 'codeExamples'
    | 'catalogComponent'
    | 'catalogDescription'
    | 'themeLabTitle'
    | 'themeLabDescription'
    | 'themeLabReset'
    | 'themeLabCopyCss'
    | 'themeLabCopied'
    | 'themeLabCopyError'
    | 'themeLabLivePreview'
    | 'themeLabBadgePrimary'
    | 'themeLabBadgeSecondary'
    | 'themeLabBadgeAccent'
    | 'themeLabConsoleTitle'
    | 'themeLabConsoleDescription'
    | 'themeLabStatusOnline'
    | 'themeLabStatRevenue'
    | 'themeLabStatRevenueDelta'
    | 'themeLabStatActive'
    | 'themeLabStatActiveDesc'
    | 'themeLabStatShadow'
    | 'themeLabStatShadowDesc'
    | 'themeLabFilterPlaceholder'
    | 'themeLabCreateSegment'
    | 'themeLabColAccount'
    | 'themeLabColStatus'
    | 'themeLabColRisk'
    | 'themeLabStatusHealthy'
    | 'themeLabRiskLow'
    | 'themeLabStatusTrial'
    | 'themeLabRiskHigh'
    | 'themeLabPublishPreset'
    | 'themeLabPauseAccount'
    | 'themeLabViewCss'
    | 'themeLabMatrixTitle'
    | 'themeLabMatrixDescription'
    | 'themeLabTokenInputPlaceholder'
    | 'themeLabAlertInfoTitle'
    | 'themeLabAlertInfoDesc'
    | 'themeLabAlertDangerTitle'
    | 'themeLabAlertDangerDesc'
    | 'themeLabSwatchPanel'
    | 'themeLabQualityCheck'
    | 'themeLabCoverageLabel'
    | 'themeLabCoverageComplete'
    | 'themeLabCoverageMissing'
    | 'themeLabGeneratedCss'
    | 'themeLabGeneratedCssHint'
    | 'themeLabContrastPass'
    | 'themeLabContrastWarn'
    | 'themeLabContrastUnavailable'
    | 'themeLabHexError'

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
        sourceOwnership: '源码掌控',
        themes: '套主题',
        pageNotFound: '页面未找到',
        pageNotFoundDesc: '您访问的页面不存在或已被移除。',
        backToHome: '返回首页',
        translationBanner: '此页面暂无英文版本，正在显示中文内容。',
        installMethod: '安装方式',
        codeExamples: '代码示例',
        catalogComponent: '组件',
        catalogDescription: '说明',
        themeLabTitle: '调出属于你的 BrutxUI 主题',
        themeLabDescription: '选择基底主题，调节色彩、边框、圆角和硬阴影，右侧预览会局部响应，复制的 CSS 可以直接粘贴到使用 BrutxUI 的项目里。',
        themeLabReset: '重置',
        themeLabCopyCss: '复制 CSS',
        themeLabCopied: '已复制',
        themeLabCopyError: '无法自动复制，CSS 已被选中，请手动复制。',
        themeLabLivePreview: '实时预览',
        themeLabBadgePrimary: '主要',
        themeLabBadgeSecondary: '次要',
        themeLabBadgeAccent: '强调',
        themeLabConsoleTitle: '启动控制台',
        themeLabConsoleDescription: '产品控制台预览，用来判断主题在真实界面里的整体气质。',
        themeLabStatusOnline: '上线',
        themeLabStatRevenue: '收入',
        themeLabStatRevenueDelta: '本周 +18%',
        themeLabStatActive: '活跃',
        themeLabStatActiveDesc: '用户在线',
        themeLabStatShadow: '阴影',
        themeLabStatShadowDesc: '硬偏移',
        themeLabFilterPlaceholder: '筛选客户',
        themeLabCreateSegment: '创建分群',
        themeLabColAccount: '账户',
        themeLabColStatus: '状态',
        themeLabColRisk: '风险',
        themeLabStatusHealthy: '健康',
        themeLabRiskLow: '低',
        themeLabStatusTrial: '试用',
        themeLabRiskHigh: '高',
        themeLabPublishPreset: '发布预设',
        themeLabPauseAccount: '暂停账户',
        themeLabViewCss: '查看 CSS',
        themeLabMatrixTitle: '组件矩阵',
        themeLabMatrixDescription: '快速扫一眼常用组件状态是否清晰。',
        themeLabTokenInputPlaceholder: '令牌感知输入',
        themeLabAlertInfoTitle: '信息表面',
        themeLabAlertInfoDesc: '提示、卡片和徽标都继承本地主题变量。',
        themeLabAlertDangerTitle: '危险表面',
        themeLabAlertDangerDesc: '破坏性颜色对比度在下方检查。',
        themeLabSwatchPanel: '色板',
        themeLabQualityCheck: '质量检查',
        themeLabCoverageLabel: 'CSS 覆盖率',
        themeLabCoverageComplete: 'light 和 dark 输出都覆盖完整。',
        themeLabCoverageMissing: '存在缺失变量，请检查输出。',
        themeLabGeneratedCss: '生成的 CSS',
        themeLabGeneratedCssHint: '复制到项目 CSS 中即可使用 `.theme-custom`。',
        themeLabContrastPass: '通过',
        themeLabContrastWarn: '偏低',
        themeLabContrastUnavailable: '不可检查',
        themeLabHexError: '请输入 #RGB 或 #RRGGBB',
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
        sourceOwnership: 'Source Ownership',
        themes: 'Themes',
        pageNotFound: 'Page Not Found',
        pageNotFoundDesc: 'The page you are looking for does not exist or has been removed.',
        backToHome: 'Back to Home',
        translationBanner: 'This page is currently available in Chinese only.',
        installMethod: 'Installation method',
        codeExamples: 'Code examples',
        catalogComponent: 'Component',
        catalogDescription: 'Description',
        themeLabTitle: 'Craft Your BrutxUI Theme',
        themeLabDescription: 'Pick a base theme, tweak colors, borders, radii and hard shadows. The preview on the right reacts live, and the copied CSS can be pasted directly into any project using BrutxUI.',
        themeLabReset: 'Reset',
        themeLabCopyCss: 'Copy CSS',
        themeLabCopied: 'Copied',
        themeLabCopyError: 'Auto-copy failed. The CSS has been selected — please copy manually.',
        themeLabLivePreview: 'Live preview',
        themeLabBadgePrimary: 'Primary',
        themeLabBadgeSecondary: 'Secondary',
        themeLabBadgeAccent: 'Accent',
        themeLabConsoleTitle: 'Launch Console',
        themeLabConsoleDescription: 'A product console preview to gauge how the theme feels in a real interface.',
        themeLabStatusOnline: 'Online',
        themeLabStatRevenue: 'Revenue',
        themeLabStatRevenueDelta: '+18% this week',
        themeLabStatActive: 'Active',
        themeLabStatActiveDesc: 'users online',
        themeLabStatShadow: 'Shadow',
        themeLabStatShadowDesc: 'hard offset',
        themeLabFilterPlaceholder: 'Filter customers',
        themeLabCreateSegment: 'Create segment',
        themeLabColAccount: 'Account',
        themeLabColStatus: 'Status',
        themeLabColRisk: 'Risk',
        themeLabStatusHealthy: 'Healthy',
        themeLabRiskLow: 'Low',
        themeLabStatusTrial: 'Trial',
        themeLabRiskHigh: 'High',
        themeLabPublishPreset: 'Publish preset',
        themeLabPauseAccount: 'Pause account',
        themeLabViewCss: 'View CSS',
        themeLabMatrixTitle: 'Component matrix',
        themeLabMatrixDescription: 'Quickly check whether common component states read clearly.',
        themeLabTokenInputPlaceholder: 'Token-aware input',
        themeLabAlertInfoTitle: 'Info surface',
        themeLabAlertInfoDesc: 'Alerts, cards and badges all inherit local theme variables.',
        themeLabAlertDangerTitle: 'Danger surface',
        themeLabAlertDangerDesc: 'Destructive color contrast is checked below.',
        themeLabSwatchPanel: 'Swatches',
        themeLabQualityCheck: 'Quality check',
        themeLabCoverageLabel: 'CSS coverage',
        themeLabCoverageComplete: 'Both light and dark outputs are fully covered.',
        themeLabCoverageMissing: 'Missing variables detected. Please check the output.',
        themeLabGeneratedCss: 'Generated CSS',
        themeLabGeneratedCssHint: 'Copy into your project CSS to use `.theme-custom`.',
        themeLabContrastPass: 'Pass',
        themeLabContrastWarn: 'Low',
        themeLabContrastUnavailable: 'N/A',
        themeLabHexError: 'Enter #RGB or #RRGGBB',
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
