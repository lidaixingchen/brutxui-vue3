import { COMPONENT_REGISTRY, type ComponentRegistryEntry } from '../../../../../packages/shared/src/index'

export type CatalogLocale = 'zh' | 'en'

export interface CatalogItem {
    name: string
    title: string
    description: string
    category: ComponentRegistryEntry['category']
    href: string
    status?: ComponentRegistryEntry['status']
    replacement?: string
}

export interface CatalogSection {
    key: ComponentRegistryEntry['category']
    title: string
    items: CatalogItem[]
}

const categoryOrder: ComponentRegistryEntry['category'][] = [
    'action',
    'form',
    'data-display',
    'navigation',
    'feedback',
    'overlay',
    'layout',
    'media',
    'visual-effect',
    'utility',
    'marketing',
    'page',
]

const categoryLabels: Record<CatalogLocale, Record<ComponentRegistryEntry['category'], string>> = {
    zh: {
        action: '操作',
        form: '表单与输入',
        'data-display': '数据展示',
        navigation: '导航',
        feedback: '反馈与状态',
        overlay: '弹出层与浮层',
        layout: '布局与结构',
        media: '媒体',
        'visual-effect': '交互与可视化',
        utility: '主题与工具',
        marketing: '区块',
        page: '页面',
    },
    en: {
        action: 'Actions',
        form: 'Form & Input',
        'data-display': 'Data Display',
        navigation: 'Navigation',
        feedback: 'Feedback & Status',
        overlay: 'Overlay & Popup',
        layout: 'Layout & Structure',
        media: 'Media',
        'visual-effect': 'Interaction & Visualization',
        utility: 'Theme & Utilities',
        marketing: 'Blocks',
        page: 'Pages',
    },
}

const hiddenDocsEntries = new Set([
    'input-adornment',
])

const slugAliases: Record<string, string> = {
    kanban: 'kanban-board',
}

const blockEntries = new Set([
    'activity-log-page',
    'auth-card',
    'blog-card',
    'blog-list-page',
    'brutalist-hero',
    'chart-section',
    'cookie-consent',
    'dashboard-shell',
    'empty-state',
    'faq-section',
    'feedback-form',
    'file-card',
    'footer-section',
    'gallery-section',
    'header-section',
    'not-found-page',
    'overview-page',
    'pricing-section',
    'profile-page',
    'quick-actions',
    'search-widget',
    'settings-page',
    'testimonial-card',
    'waitlist-page',
])

function getSlug(name: string): string {
    return slugAliases[name] ?? name
}

function getHref(name: string, locale: CatalogLocale): string {
    const prefix = locale === 'en' ? '/en' : ''
    const section = blockEntries.has(name) ? 'blocks' : 'components'
    return `${prefix}/${section}/${getSlug(name)}`
}

export function getComponentCatalog(locale: CatalogLocale): CatalogSection[] {
    const entries = Object.values(COMPONENT_REGISTRY)
        .filter(entry => !hiddenDocsEntries.has(entry.name))
        .map<CatalogItem>(entry => ({
            name: entry.name,
            title: entry.title,
            description: entry.description,
            category: entry.category,
            href: getHref(entry.name, locale),
            status: entry.status,
            replacement: entry.replacement,
        }))

    return categoryOrder
        .map<CatalogSection>(category => ({
            key: category,
            title: categoryLabels[locale][category],
            items: entries
                .filter(entry => entry.category === category)
                .sort((a, b) => a.title.localeCompare(b.title)),
        }))
        .filter(section => section.items.length > 0)
}
