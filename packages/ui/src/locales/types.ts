export interface CommandLocale {
    placeholder: string
    emptyText: string
    dialogTitle: string
    dialogDescription: string
    searchLabel: string
}

export interface ComboboxLocale {
    placeholder: string
    multiPlaceholder: string
    searchPlaceholder: string
    emptyText: string
    /** 已选数量文案，占位符：{count}，如「{count} selected」 */
    selectedCount: string
    create: string
}

export interface PaginationLocale {
    firstPage: string
    previousPage: string
    nextPage: string
    lastPage: string
    page: string
    label: string
    jumpPages: string
    goto: string
    pageClassifier: string
    perPage: string
    /** 每页条数选项文案，占位符：{size}，如「{size} / page」 */
    perPageOption: string
    /** 总数文案，占位符：{total}，如「Total {total} items」 */
    total: string
}

export interface CarouselLocale {
    previousSlide: string
    nextSlide: string
    /** 跳转到某张幻灯片的提示文案，占位符：{index}，如「Go to slide {index}」 */
    goToSlide: string
}

export interface SpinnerLocale {
    loading: string
}

export interface SubmitButtonLocale {
    submitting: string
}

export interface CopyToClipboardLocale {
    copy: string
    copied: string
    /** 复制失败反馈文案（剪贴板权限被拒等场景） */
    copyFailed: string
}

export interface BeforeAfterLocale {
    before: string
    after: string
    comparisonSlider: string
}

export interface AuthCardLocale {
    welcomeBack: string
    signInToContinue: string
    google: string
    github: string
    orEmailLogin: string
    email: string
    password: string
    forgotPassword: string
    signIn: string
    noAccount: string
    register: string
    emailPlaceholder: string
    passwordPlaceholder: string
    invalidEmail: string
    passwordRequired: string
    passwordTooShort: string
    showPassword: string
    hidePassword: string
}

export interface DashboardShellLocale {
    sidebarNavigation: string
    signOut: string
    brand: string
}

export interface BrutalistHeroLocale {
    title: string
    primaryCtaText: string
    secondaryCtaText: string
    neoBrutalismUI: string
    defaultSubtitle: string
}

export interface ToastLocale {
    close: string
    container: string
}

export interface MessageLocale {
    close: string
}

export interface DialogLocale {
    close: string
    inputError: string
    confirm: string
    cancel: string
}

export interface SheetLocale {
    close: string
}

export interface BreadcrumbLocale {
    label: string
    more: string
}

export interface TreeViewLocale {
    fileTree: string
}

export interface TreeSelectLocale {
    placeholder: string
    searchPlaceholder: string
    search: string
    emptyText: string
    /** 已选数量文案，占位符：{count} */
    selectedCount: string
    clear: string
}

export interface CascaderLocale {
    placeholder: string
    emptyText: string
    /** 已选数量文案，占位符：{count} */
    selectedCount: string
    clear: string
}

export interface TransferLocale {
    sourceTitle: string
    targetTitle: string
    placeholder: string
    emptyText: string
}

export interface StepperLocale {
    progressSteps: string
    /** 步骤标题文案，占位符：{index}、{title}，如「Step {index}: {title}」 */
    step: string
}

export interface HeaderSectionLocale {
    defaultCtaText: string
    menuLabel: string
}

export interface FooterSectionLocale {
    defaultDescription: string
    /** 版权声明文案，占位符：{year}，如「© {year} BrutxUI. 保留所有权利。」，由组件注入当前年份 */
    defaultCopyright: string
}

export interface FeedbackFormLocale {
    defaultTitle: string
    defaultDescription: string
    defaultSubmitText: string
    successTitle: string
    successDescription: string
    successConfirmText: string
    nameLabel: string
    emailLabel: string
    subjectLabel: string
    messageLabel: string
    nameRequired: string
    emailRequired: string
    emailInvalid: string
    messageRequired: string
}

export interface CookieConsentLocale {
    defaultTitle: string
    defaultDescription: string
    defaultAcceptText: string
    defaultDeclineText: string
}

export interface DataTableLocale {
    label: string
    filterPlaceholder: string
    noData: string
    exportCsv: string
    exportJson: string
    selectedRows: string
    /** 分页信息文案，占位符：{current}、{total}，如「Page {current} of {total}」 */
    pageInfo: string
    perPage: string
    firstPage: string
    previousPage: string
    nextPage: string
    lastPage: string
    sortAscending: string
    sortDescending: string
    clearSort: string
    /** 筛选标题文案，占位符：{label}，如「Filter {label}」 */
    filterTitle: string
    filterSearchPlaceholder: string
    filterAll: string
    filterStartDate: string
    filterEndDate: string
    filterTo: string
    filterReset: string
}

export interface FormWizardLocale {
    label: string
    previousStep: string
    nextStep: string
    complete: string
    /** 步骤进度文案，占位符：{current}、{total}，如「Step {current} of {total}」 */
    stepOf: string
    validationErrors: string
}

export interface ChatBubbleLocale {
    chatLog: string
    today: string
    yesterday: string
    sending: string
    sent: string
    delivered: string
    read: string
    failed: string
}

export interface ScratchCardLocale {
    ariaLabel: string
}

export interface SketchyChartLocale {
    lineAriaLabel: string
    barAriaLabel: string
    pieAriaLabel: string
    emptyText: string
}

export interface Card3dLocale {
    ariaLabel: string
}

export interface AvatarLocale {
    statusOnline: string
    statusOffline: string
    statusBusy: string
}

export interface HardcoreInputLocale {
    invalidInput: string
}

export interface CodeBlockLocale {
    copied: string
    copy: string
    expand: string
    collapse: string
}

export interface CalendarLocale {
    previousMonth: string
    nextMonth: string
}

export interface DatePickerLocale {
    placeholder: string
    datePlaceholder: string
    weekPlaceholder: string
    monthPlaceholder: string
    yearPlaceholder: string
    dateTimePlaceholder: string
    timePlaceholder: string
    startPlaceholder: string
    endPlaceholder: string
    separator: string
    today: string
    tomorrow: string
    nextWeek: string
    thisMonth: string
    lastMonth: string
    shortcuts: string
    confirm: string
    clear: string
    week: string
    weeks: string
    hour: string
    minute: string
    second: string
    previousYear: string
    nextYear: string
    previousDecade: string
    nextDecade: string
    /** 12 个月份名称（按下标对应 1-12 月），语言包必须提供完整 12 项 */
    months: readonly string[]
    /** 年份范围文案，占位符：{start}、{end}，如「{start} - {end}」 */
    yearRange: string
}

export interface ColorPickerLocale {
    placeholder: string
    confirm: string
    clear: string
    presets: string
    history: string
    clearHistory: string
    hex: string
    red: string
    green: string
    blue: string
    hue: string
    saturation: string
    brightness: string
    alpha: string
}

export interface KanbanLocale {
    dropCardsHere: string
    addCard: string
    cardGrabbed: string
    cardReleased: string
    cardMoved: string
    /** 卡片移动到某列的文案，占位符：{column}，如「Card moved to {column}」 */
    cardMovedToColumn: string
}

export interface TimelineLocale {
    label: string
}

export interface TabsLocale {
    emptyTitle: string
}

export interface ColorModeSwitcherLocale {
    light: string
    dark: string
    system: string
    colorMode: string
    /** 当前颜色模式提示文案，占位符：{mode}，如「Current: {mode}. Click to toggle.」 */
    currentToggle: string
}

export interface PricingSectionLocale {
    defaultTitle: string
    mostPopular: string
    perLifetime: string
    emptyTitle: string
    perMonth: string
    perMonthBilledAnnually: string
    billingPeriod: string
    monthly: string
    annually: string
    saasTitle: string
    saasMostPopular: string
    planStarterName: string
    planStarterDescription: string
    planStarterCta: string
    planProName: string
    planProDescription: string
    planProCta: string
    planEnterpriseName: string
    planEnterpriseDescription: string
    planEnterpriseCta: string
    feature5Components: string
    featureBasicThemes: string
    featureCommunitySupport: string
    featurePriorityUpdates: string
    featureCustomThemes: string
    featureAllComponents: string
    featureAllThemes: string
    featurePrioritySupport: string
    featureDedicatedSupport: string
}

export interface InputLocale {
    placeholder: string
    showPassword: string
    hidePassword: string
    clear: string
}

export interface NumberInputLocale {
    placeholder: string
}

export interface TextareaLocale {
    placeholder: string
}

export interface VirtualScrollLocale {
    label: string
    empty: string
}

export interface SwitchLocale {
    toggle: string
}

export interface CheckboxLocale {
    check: string
}

export interface TagsInputLocale {
    label: string
    delete: string
}

export interface BadgeLocale {
    close: string
}

export interface AlertLocale {
    close: string
}

export interface PopconfirmLocale {
    confirm: string
    cancel: string
}

// 预留语言包键：上传组件（Upload/UploadFileItem/UploadFileList/UploadTrigger）
// 暂未消费这些文案，为后续提示文案本地化预留；接入组件前请勿删除。
export interface UploadLocale {
    dragText: string
    browseText: string
    maxSizeError: string
    /** 文件数量超限提示文案，占位符：{limit}，如「Maximum {limit} files can be uploaded」 */
    limitError: string
    retry: string
}

export interface InfiniteScrollLocale {
    loading: string
}

export interface TourLocale {
    prev: string
    next: string
    finish: string
    skip: string
}

export interface Locale {
    command: CommandLocale
    combobox: ComboboxLocale
    pagination: PaginationLocale
    carousel: CarouselLocale
    spinner: SpinnerLocale
    submitButton: SubmitButtonLocale
    copyToClipboard: CopyToClipboardLocale
    beforeAfter: BeforeAfterLocale
    authCard: AuthCardLocale
    dashboardShell: DashboardShellLocale
    brutalistHero: BrutalistHeroLocale
    toast: ToastLocale
    message: MessageLocale
    dialog: DialogLocale
    sheet: SheetLocale
    breadcrumb: BreadcrumbLocale
    treeView: TreeViewLocale
    treeSelect: TreeSelectLocale
    cascader: CascaderLocale
    transfer: TransferLocale
    stepper: StepperLocale
    headerSection: HeaderSectionLocale
    footerSection: FooterSectionLocale
    feedbackForm: FeedbackFormLocale
    cookieConsent: CookieConsentLocale
    dataTable: DataTableLocale
    formWizard: FormWizardLocale
    chatBubble: ChatBubbleLocale
    scratchCard: ScratchCardLocale
    sketchyChart: SketchyChartLocale
    card3d: Card3dLocale
    avatar: AvatarLocale
    hardcoreInput: HardcoreInputLocale
    codeBlock: CodeBlockLocale
    calendar: CalendarLocale
    datePicker: DatePickerLocale
    colorPicker: ColorPickerLocale
    kanban: KanbanLocale
    timeline: TimelineLocale
    tabs: TabsLocale
    pricingSection: PricingSectionLocale
    colorModeSwitcher: ColorModeSwitcherLocale
    input: InputLocale
    numberInput: NumberInputLocale
    textarea: TextareaLocale
    virtualScroll: VirtualScrollLocale
    switch: SwitchLocale
    checkbox: CheckboxLocale
    tagsInput: TagsInputLocale
    badge: BadgeLocale
    alert: AlertLocale
    popconfirm: PopconfirmLocale
    upload: UploadLocale
    infiniteScroll: InfiniteScrollLocale
    tour: TourLocale
}
