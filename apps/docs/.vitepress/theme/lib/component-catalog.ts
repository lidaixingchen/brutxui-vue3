import { COMPONENT_REGISTRY, type ComponentRegistryEntry } from '../../../../../packages/shared/src/component-registry'

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
    'visual-effect',
    'utility',
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
        'visual-effect': '交互与可视化',
        utility: '主题与工具',
        marketing: '区块',
    },
    en: {
        action: 'Actions',
        form: 'Form & Input',
        'data-display': 'Data Display',
        navigation: 'Navigation',
        feedback: 'Feedback & Status',
        overlay: 'Overlay & Popup',
        layout: 'Layout & Structure',
        'visual-effect': 'Interaction & Visualization',
        utility: 'Theme & Utilities',
        marketing: 'Blocks',
    },
}

const descriptionLabels: Record<CatalogLocale, Record<string, string>> = {
    zh: {
        alert: '状态消息，7 种变体',
        avatar: '用户头像，支持 image/fallback、尺寸、形状',
        badge: '行内状态标签，7 种变体',
        button: '操作按钮，9 种变体、5 种尺寸、加载状态',
        calendar: '日历，支持单选和范围选择',
        card: '容器组件，6 种变体和可组合子组件',
        'card-3d': '3D 物理悬浮卡片，鼠标悬停偏转与反向阴影',
        checkbox: '复选框，通过 v-model 绑定选中状态',
        combobox: '可搜索的单选/多选',
        command: '命令面板，支持搜索',
        dialog: '模态对话框，支持拖拽、调整大小、全屏、关闭前钩子',
        'dropdown-menu': '右键菜单，支持子菜单项',
        input: '文本输入框，支持变体、尺寸、清除、密码切换、字数统计',
        image: '图片，支持懒加载、fallback 备用图、大图预览',
        label: '表单字段标签',
        loading: '加载容器和 v-loading 指令，显示加载状态遮罩',
        pagination: '分页导航，支持计算算法',
        popover: '浮动内容面板',
        'scroll-area': '带 ScrollBar 的自定义滚动区域',
        select: '下拉选择框，支持清除和搜索过滤',
        separator: '内容区域之间的视觉分隔线',
        skeleton: '内容占位符，支持子组件',
        spinner: '加载旋转器，4 种变体',
        switch: '切换开关，通过 v-model 绑定',
        table: '数据表格，8 个子组件',
        tabs: '标签页导航，支持 list/trigger/content',
        textarea: '多行文本输入框，支持尺寸',
        toast: '通知提示，搭配 useToast 组合式函数',
        tooltip: '悬停工具提示',
        form: '表单系统，集成 vee-validate，支持 resetFields/scrollToError',
        'alert-dialog': '确认对话框，支持操作/取消',
        sheet: '侧边面板，4 个方向变体',
        'radio-group': '单选按钮组',
        slider: '滑块，支持 v-model',
        progress: '进度条指示器',
        toggle: '可按下的切换按钮',
        'toggle-group': '切换按钮组，支持多选',
        'brutalist-hero': '全宽英雄区块，粗体排版和行动号召',
        'pricing-section': '定价表，方案对比和功能高亮',
        'auth-card': '认证卡片，登录/注册/密码找回表单',
        'dashboard-shell': '应用框架布局，侧边栏 + 顶栏 + 主内容区',
        accordion: '折叠面板，可展开/折叠的内容区域',
        'tags-input': '标签输入，动态增删标签',
        'number-input': '数字输入框，支持步进和范围限制',
        'copy-to-clipboard': '复制按钮，一键复制文本到剪贴板',
        breadcrumb: '面包屑导航，支持子组件',
        marquee: '跑马灯，无缝循环滚动',
        'before-after': '前后对比滑块',
        'code-block': '代码块，支持语法高亮与复制',
        timeline: '时间线，垂直展示事件序列',
        carousel: '轮播图，支持自动播放、缩略图和指示器',
        'tree-view': '树形目录，支持展开/折叠/多选',
        kanban: '看板，拖拽卡片在列间移动',
        'chat-bubble': '聊天气泡，支持左右对齐和头像',
        kbd: '键盘按键样式，展示快捷键',
        counter: '数字滚动动画，支持缓动',
        stepper: '步骤条，支持水平/垂直方向',
        'glitch-text': '故障撕裂文本，CSS clip-path 驱动',
        'scratch-card': '刮刮卡，Canvas 覆盖层擦除',
        'sketchy-chart': '手绘感折线/柱状图表，SVG + 分形噪声',
        'hardcore-input': '硬核输入框，8-bit 音效 + 表情反馈 + 物理震动',
        'header-section': '页头，导航、标题和副标题',
        'footer-section': '页脚，链接、版权和社交图标',
        'feedback-form': '反馈表单，评分和评论字段',
        'cookie-consent': 'Cookie 同意横幅，接受和自定义选项',
        'color-picker': '颜色选择器',
        'date-picker': '日期选择器，支持范围选择、时间输入、本地化格式',
        'tree-select': '树形选择器，支持单选/多选/搜索',
        'typewriter-text': '打字机效果文本，支持循环和光标',
        'noise-background': '噪点纹理背景，SVG 滤镜 + 动画',
        'virtual-scroll': '虚拟滚动，大数据列表高性能渲染',
        upload: '文件上传系统，支持拖拽、进度追踪、错误处理',
        popconfirm: '气泡确认框，轻量级确认操作',
        descriptions: '描述列表，键值对形式展示只读信息',
        'infinite-scroll': '无限滚动，滚动到底部自动加载更多数据',
        'color-mode-switcher': '颜色模式切换，支持 icon/button/select 三种显示模式',
        'data-table': '数据表格，排序/筛选/分页/固定列/展开行/合并单元格',
        cascader: '级联选择，多级选项导航 + 搜索',
        menu: '导航菜单，支持水平/垂直方向和子菜单',
        transfer: '穿梭框，在源列表和目标列表之间移动项',
        rate: '评分，支持半星和键盘导航',
        backtop: '回到顶部按钮，支持滚动检测',
        result: '结果反馈，支持状态色块和操作按钮',
        watermark: '水印，Canvas 渲染文字/图片，MutationObserver 防篡改',
        tour: '用户引导，Canvas 遮罩高亮 + 步骤交互',
        message: '消息通知，命令式 API + TransitionGroup 堆叠 + 自动 GC',
    },
    en: {},
}

function getHref(entry: ComponentRegistryEntry, locale: CatalogLocale): string {
    const prefix = locale === 'en' ? '/en' : ''
    const section = entry.kind === 'block' ? 'blocks' : 'components'
    const slug = entry.docsSlug ?? entry.name
    return `${prefix}/${section}/${slug}.html`
}

export function getComponentCatalog(locale: CatalogLocale): CatalogSection[] {
    const entries = Object.values(COMPONENT_REGISTRY)
        .filter(entry => entry.docsHidden !== true && entry.kind !== 'block')
        .map<CatalogItem>(entry => ({
            name: entry.name,
            title: entry.title,
            description: descriptionLabels[locale][entry.name] ?? entry.description,
            category: entry.category,
            href: getHref(entry, locale),
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
