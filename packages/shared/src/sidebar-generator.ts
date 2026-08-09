import { COMPONENT_METADATA, type ComponentMetadataEntry } from './component-metadata.js'
import type { ComponentCategory, SidebarGroup } from './types.js'

export type SidebarLocale = 'zh' | 'en'

export interface SidebarItem {
    text: string
    link?: string
    items?: SidebarItem[]
    collapsed?: boolean
}

const COMPONENT_GROUP_ORDER: SidebarGroup[] = [
    'action',
    'layout',
    'form',
    'data-display',
    'navigation',
    'feedback',
    'overlay',
    'date-time',
    'visual-effect',
    'utility',
]

const BLOCK_GROUP_ORDER: SidebarGroup[] = [
    'blocks-cards',
    'blocks-sections',
    'blocks-pages',
]

const groupLabels: Record<SidebarLocale, Record<SidebarGroup, string>> = {
    zh: {
        action: 'Action 操作',
        layout: 'Layout 布局',
        form: 'Form 表单',
        'data-display': 'Data Display 数据展示',
        navigation: 'Navigation 导航',
        feedback: 'Feedback 反馈',
        overlay: 'Overlay 弹出层',
        'date-time': 'Date & Time 日期时间',
        'visual-effect': 'Visual Effect 视觉效果',
        utility: 'Utility 工具',
        'blocks-cards': '卡片',
        'blocks-sections': '区块',
        'blocks-pages': '页面',
    },
    en: {
        action: 'Action',
        layout: 'Layout',
        form: 'Form',
        'data-display': 'Data Display',
        navigation: 'Navigation',
        feedback: 'Feedback',
        overlay: 'Overlay',
        'date-time': 'Date & Time',
        'visual-effect': 'Visual Effect',
        utility: 'Utility',
        'blocks-cards': 'Cards',
        'blocks-sections': 'Sections',
        'blocks-pages': 'Pages',
    },
}

const componentLabelsZh: Record<string, string> = {
    accordion: '折叠面板',
    alert: '提示',
    'alert-dialog': '提示对话框',
    avatar: '头像',
    backtop: '回到顶部',
    badge: '徽标',
    'before-after': '对比滑块',
    breadcrumb: '面包屑',
    button: '按钮',
    calendar: '日历',
    card: '卡片',
    'card-3d': '3D 悬浮卡片',
    carousel: '轮播图',
    cascader: '级联选择器',
    checkbox: '复选框',
    'chat-bubble': '聊天气泡',
    'code-block': '代码块',
    'color-mode-switcher': '颜色模式切换',
    'color-picker': '颜色选择器',
    combobox: '组合框',
    command: '命令面板',
    'cookie-consent': 'Cookie 同意',
    'copy-to-clipboard': '复制按钮',
    counter: '数字滚动',
    'data-table': '数据表格',
    'date-picker': '日期选择器',
    descriptions: '描述列表',
    dialog: '对话框',
    'dropdown-menu': '下拉菜单',
    'feedback-form': '反馈表单',
    'footer-section': '底部信息栏',
    form: '表单',
    'glitch-text': '故障文本',
    'hardcore-input': '硬核输入框',
    'header-section': '顶部导航',
    image: '图片',
    'infinite-scroll': '无限滚动',
    input: '输入框',
    kanban: '看板',
    kbd: '键盘按键',
    label: '标签',
    loading: '加载',
    marquee: '跑马灯',
    menu: '导航菜单',
    message: '消息提示',
    'noise-background': '噪点背景',
    'number-input': '数字输入框',
    pagination: '分页',
    popconfirm: '气泡确认框',
    popover: '弹出层',
    'pricing-section': '定价区',
    progress: '进度条',
    'radio-group': '单选组',
    rate: '评分',
    result: '结果',
    'scroll-area': '滚动区域',
    'scratch-card': '刮刮卡',
    select: '选择器',
    separator: '分隔线',
    sheet: '抽屉',
    skeleton: '骨架屏',
    'sketchy-chart': '手绘图表',
    slider: '滑块',
    spinner: '加载指示器',
    stepper: '步骤条',
    switch: '开关',
    table: '表格',
    tabs: '标签页',
    'tags-input': '标签输入',
    textarea: '文本域',
    timeline: '时间线',
    toast: '轻提示',
    toggle: '切换',
    'toggle-group': '切换组',
    tooltip: '工具提示',
    tour: '导览',
    'tree-select': '树形选择器',
    'tree-view': '树形目录',
    transfer: '穿梭框',
    'typewriter-text': '打字机文本',
    upload: '上传',
    'virtual-scroll': '虚拟滚动',
    watermark: '水印',
    'auth-card': '认证卡片',
    'brutalist-hero': '英雄区',
    'dashboard-shell': '仪表盘框架',
}

// 开发期校验：componentLabelsZh 必须覆盖全部组件名，防止新增组件漏写 zh 标签时
// 中文侧边栏静默退化为英文标题（本地化缺失难以被察觉）
for (const name of Object.keys(COMPONENT_METADATA)) {
    if (!(name in componentLabelsZh)) {
        console.warn(
            `[sidebar-generator] Missing zh label for component "${name}" — zh sidebar will fall back to its English title. ` +
            'Add an entry to componentLabelsZh (packages/shared/src/sidebar-generator.ts).'
        )
    }
}

const DEFAULT_CATEGORY_TO_SIDEBAR_GROUP: Record<ComponentCategory, SidebarGroup> = {
    action: 'action',
    form: 'form',
    'data-display': 'data-display',
    navigation: 'navigation',
    feedback: 'feedback',
    overlay: 'overlay',
    layout: 'layout',
    'visual-effect': 'visual-effect',
    utility: 'utility',
    // marketing 映射到 blocks-sections 仅对区块侧边栏有意义；若未来出现非 block 的
    // marketing 组件，会在组件侧边栏中落空（不在 COMPONENT_GROUP_ORDER），由
    // buildFallbackGroup 的孤儿告警暴露为配置错误
    marketing: 'blocks-sections',
}

function resolveSidebarGroup(entry: ComponentMetadataEntry): SidebarGroup {
    const group = entry.sidebarGroup ?? DEFAULT_CATEGORY_TO_SIDEBAR_GROUP[entry.category]
    // 类型上 Record 覆盖全部 ComponentCategory，indexing 不可能为 undefined；但运行时若
    // 传入未经类型校验的数据（如注册表 JSON 中的非法 category），显式兜底以免静默产生孤儿条目
    if (group === undefined) {
        throw new Error(
            `[sidebar-generator] Cannot resolve sidebar group for component "${entry.name}" (category "${entry.category}"). ` +
            'Register the category in DEFAULT_CATEGORY_TO_SIDEBAR_GROUP or set an explicit sidebarGroup.'
        )
    }
    return group
}

function resolveSlug(entry: ComponentMetadataEntry): string {
    return entry.docsSlug ?? entry.name
}

function getItemText(entry: ComponentMetadataEntry, locale: SidebarLocale): string {
    if (locale === 'en') return entry.title
    const zhLabel = componentLabelsZh[entry.name]
    return zhLabel ? `${entry.title} ${zhLabel}` : entry.title
}

function getItemLink(entry: ComponentMetadataEntry, locale: SidebarLocale): string {
    const prefix = locale === 'en' ? '/en' : ''
    const section = entry.kind === 'block' ? 'blocks' : 'components'
    return `${prefix}/${section}/${resolveSlug(entry)}`
}

function buildGroup(
    group: SidebarGroup,
    entries: ComponentMetadataEntry[],
    locale: SidebarLocale,
): SidebarItem | null {
    const items = entries
        .filter(entry => resolveSidebarGroup(entry) === group)
        // 显式指定 'en' collation：标题均为英文，避免排序结果依赖运行环境的默认语言与 ICU 配置
        .sort((a, b) => a.title.localeCompare(b.title, 'en'))
        .map(entry => ({
            text: getItemText(entry, locale),
            link: getItemLink(entry, locale),
        }))

    if (items.length === 0) return null

    return {
        text: groupLabels[locale][group],
        items,
    }
}

function buildFallbackGroup(
    entries: ComponentMetadataEntry[],
    validGroups: Set<SidebarGroup>,
    locale: SidebarLocale,
): SidebarItem | null {
    const orphaned = entries.filter(entry => !validGroups.has(resolveSidebarGroup(entry)))

    if (orphaned.length === 0) return null

    // 配置错误（映射遗漏/拼写错误/新增类别未登记）不应被静默吞掉——列出具体条目以便及早发现
    console.warn(
        `[sidebar-generator] ${orphaned.length} entr${orphaned.length === 1 ? 'y' : 'ies'} resolved outside the known sidebar groups ` +
        `and fell into "Other": ${orphaned.map(entry => entry.name).join(', ')}`
    )

    const items = orphaned
        .sort((a, b) => a.title.localeCompare(b.title, 'en'))
        .map(entry => ({
            text: getItemText(entry, locale),
            link: getItemLink(entry, locale),
        }))

    return {
        text: locale === 'en' ? 'Other' : '其他',
        items,
    }
}

/**
 * 组件/区块侧边栏公共构建流程：按固定分组顺序分组 → 兜底分组（捕获落空的孤儿条目）→ 前置 overview。
 * 抽成单一函数，避免两组侧边栏各自维护一遍过滤/分组/排序/兜底逻辑导致行为漂移。
 */
function buildSidebar(
    entries: ComponentMetadataEntry[],
    groupOrder: readonly SidebarGroup[],
    overview: { text: string; link: string },
    locale: SidebarLocale,
): SidebarItem[] {
    const validGroups = new Set(groupOrder)
    const groups = groupOrder
        .map(group => buildGroup(group, entries, locale))
        .filter((group): group is SidebarItem => group !== null)

    const fallback = buildFallbackGroup(entries, validGroups, locale)

    return [
        { text: overview.text, link: overview.link },
        ...groups,
        ...(fallback ? [fallback] : []),
    ]
}

export function generateComponentsSidebar(locale: SidebarLocale): SidebarItem[] {
    const entries = Object.values(COMPONENT_METADATA)
        .filter(entry => entry.kind !== 'block')
        .filter(entry => entry.docsHidden !== true)

    return buildSidebar(entries, COMPONENT_GROUP_ORDER, {
        text: locale === 'en' ? 'Overview' : '组件总览',
        link: locale === 'en' ? '/en/components/' : '/components/',
    }, locale)
}

export function generateBlocksSidebar(locale: SidebarLocale): SidebarItem[] {
    const entries = Object.values(COMPONENT_METADATA)
        .filter(entry => entry.kind === 'block')
        .filter(entry => entry.docsHidden !== true)

    return buildSidebar(entries, BLOCK_GROUP_ORDER, {
        text: locale === 'en' ? 'Overview' : '概览',
        link: locale === 'en' ? '/en/blocks/' : '/blocks/',
    }, locale)
}
