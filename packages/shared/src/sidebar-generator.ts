import { COMPONENT_METADATA, type ComponentMetadataEntry } from './component-metadata.js';
import type { ComponentCategory, SidebarGroup } from './types.js';

export type SidebarLocale = 'zh' | 'en';

export interface SidebarItem {
    text: string;
    link?: string;
    items?: SidebarItem[];
    collapsed?: boolean;
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
];

const BLOCK_GROUP_ORDER: SidebarGroup[] = [
    'blocks-cards',
    'blocks-sections',
    'blocks-pages',
];

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
};

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
};

function resolveSidebarGroup(entry: ComponentMetadataEntry): SidebarGroup {
    const group = entry.sidebarGroup ?? DEFAULT_CATEGORY_TO_SIDEBAR_GROUP[entry.category];
    // 类型上 Record 覆盖全部 ComponentCategory，indexing 不可能为 undefined；但运行时若
    // 传入未经类型校验的数据（如注册表 JSON 中的非法 category），显式兜底以免静默产生孤儿条目
    if (group === undefined) {
        throw new Error(
            `[sidebar-generator] Cannot resolve sidebar group for component "${entry.name}" (category "${entry.category}"). ` +
            'Register the category in DEFAULT_CATEGORY_TO_SIDEBAR_GROUP or set an explicit sidebarGroup.',
        );
    }
    return group;
}

function resolveSlug(entry: ComponentMetadataEntry): string {
    return entry.docsSlug ?? entry.name;
}

function getItemText(entry: ComponentMetadataEntry, locale: SidebarLocale): string {
    if (locale === 'en') return entry.title;
    return entry.titleZh ? `${entry.title} ${entry.titleZh}` : entry.title;
}

function getItemLink(entry: ComponentMetadataEntry, locale: SidebarLocale): string {
    const prefix = locale === 'en' ? '/en' : '';
    const section = entry.kind === 'block' ? 'blocks' : 'components';
    return `${prefix}/${section}/${resolveSlug(entry)}`;
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
        }));

    if (items.length === 0) return null;

    return {
        text: groupLabels[locale][group],
        items,
    };
}

function buildFallbackGroup(
    entries: ComponentMetadataEntry[],
    validGroups: Set<SidebarGroup>,
    locale: SidebarLocale,
): SidebarItem | null {
    const orphaned = entries.filter(entry => !validGroups.has(resolveSidebarGroup(entry)));

    if (orphaned.length === 0) return null;

    // 配置错误（映射遗漏/拼写错误/新增类别未登记）不应被静默吞掉——列出具体条目以便及早发现
    console.warn(
        `[sidebar-generator] ${orphaned.length} entr${orphaned.length === 1 ? 'y' : 'ies'} resolved outside the known sidebar groups ` +
        `and fell into "Other": ${orphaned.map(entry => entry.name).join(', ')}`,
    );

    const items = orphaned
        .sort((a, b) => a.title.localeCompare(b.title, 'en'))
        .map(entry => ({
            text: getItemText(entry, locale),
            link: getItemLink(entry, locale),
        }));

    return {
        text: locale === 'en' ? 'Other' : '其他',
        items,
    };
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
    const validGroups = new Set(groupOrder);
    const groups = groupOrder
        .map(group => buildGroup(group, entries, locale))
        .filter((group): group is SidebarItem => group !== null);

    const fallback = buildFallbackGroup(entries, validGroups, locale);

    return [
        { text: overview.text, link: overview.link },
        ...groups,
        ...(fallback ? [fallback] : []),
    ];
}

export function generateComponentsSidebar(locale: SidebarLocale): SidebarItem[] {
    const entries = Object.values(COMPONENT_METADATA)
        .filter(entry => entry.kind !== 'block')
        .filter(entry => entry.docsHidden !== true);

    return buildSidebar(entries, COMPONENT_GROUP_ORDER, {
        text: locale === 'en' ? 'Overview' : '组件总览',
        link: locale === 'en' ? '/en/components/' : '/components/',
    }, locale);
}

export function generateBlocksSidebar(locale: SidebarLocale): SidebarItem[] {
    const entries = Object.values(COMPONENT_METADATA)
        .filter(entry => entry.kind === 'block')
        .filter(entry => entry.docsHidden !== true);

    return buildSidebar(entries, BLOCK_GROUP_ORDER, {
        text: locale === 'en' ? 'Overview' : '概览',
        link: locale === 'en' ? '/en/blocks/' : '/blocks/',
    }, locale);
}
