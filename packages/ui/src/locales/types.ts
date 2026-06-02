export interface CommandLocale {
    placeholder: string
    emptyText: string
    dialogTitle: string
    dialogDescription: string
}

export interface ComboboxLocale {
    placeholder: string
    multiPlaceholder: string
    searchPlaceholder: string
    emptyText: string
    selectedCount: string
}

export interface PaginationLocale {
    firstPage: string
    previousPage: string
    nextPage: string
    lastPage: string
    page: string
    label: string
}

export interface CarouselLocale {
    previousSlide: string
    nextSlide: string
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
}

export interface BeforeAfterLocale {
    before: string
    after: string
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
}

export interface WaitlistPageLocale {
    title: string
    ctaText: string
    earlyAccess: string
    onWaitlist: string
    live: string
}

export interface DashboardShellLocale {
    sidebarNavigation: string
    signOut: string
}

export interface BrutalistHeroLocale {
    title: string
    primaryCtaText: string
    secondaryCtaText: string
    neoBrutalismUI: string
}

export interface SaaSPricingLocale {
    title: string
    monthly: string
    annually: string
    mostPopular: string
    perMonth: string
    perMonthBilledAnnually: string
    billingPeriod: string
}

export interface ToastLocale {
    close: string
}

export interface DialogLocale {
    close: string
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

export interface StepperLocale {
    progressSteps: string
    step: string
}

export interface EmptyStateLocale {
    defaultTitle: string
    defaultActionText: string
}

export interface TestimonialCardLocale {
    defaultQuote: string
    defaultAuthor: string
    defaultRole: string
}

export interface BlogCardLocale {
    defaultTitle: string
    defaultExcerpt: string
    readMore: string
}

export interface FileCardLocale {
    defaultFileName: string
    download: string
}

export interface QuickActionsLocale {
    defaultTitle: string
}

export interface FaqSectionLocale {
    defaultTitle: string
    defaultSubtitle: string
}

export interface HeaderSectionLocale {
    defaultLogoText: string
    defaultCtaText: string
    menuLabel: string
}

export interface FooterSectionLocale {
    defaultLogoText: string
    defaultDescription: string
    defaultCopyright: string
}

export interface NotFoundPageLocale {
    defaultTitle: string
    defaultDescription: string
    defaultBackText: string
}

export interface LoadingPageLocale {
    defaultTitle: string
    defaultDescription: string
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
    waitlistPage: WaitlistPageLocale
    dashboardShell: DashboardShellLocale
    brutalistHero: BrutalistHeroLocale
    saasPricing: SaaSPricingLocale
    toast: ToastLocale
    dialog: DialogLocale
    sheet: SheetLocale
    breadcrumb: BreadcrumbLocale
    treeView: TreeViewLocale
    stepper: StepperLocale
    emptyState: EmptyStateLocale
    testimonialCard: TestimonialCardLocale
    blogCard: BlogCardLocale
    fileCard: FileCardLocale
    quickActions: QuickActionsLocale
    faqSection: FaqSectionLocale
    headerSection: HeaderSectionLocale
    footerSection: FooterSectionLocale
    notFoundPage: NotFoundPageLocale
    loadingPage: LoadingPageLocale
}
