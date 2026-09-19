/**
 * SSR smoke tests
 *
 * Three layers:
 *   1a. Simple component rendering — standalone-renderable components produce
 *       expected HTML on SSR without throwing.
 *   1b. Provider-wrapped component rendering — overlay/portal components that
 *       require reka-ui Root context (DialogRoot, SelectRoot, etc.) are wrapped
 *       with their provider and rendered.
 *   2.  Composable setup — verifies DOM-heavy composables can be called in SSR
 *       setup() without throwing. Provider wrappers inject required context.
 *
 * Environment: node (no window/document). env.ts isClient/hasDocument return false,
 * exercising the SSR-safe code paths in all migrated components/composables.
 *
 * Coverage goal: all publicly-exported components + all composables
 * under src/composables/.
 */
import { describe, it, expect } from 'vitest'
import { createSSRApp, h, defineComponent, ref, type Component, type VNode } from 'vue'
import {
    DialogRoot,
    AlertDialogRoot,
    AlertDialogContent,
    PopoverRoot,
    TooltipRoot,
    TooltipProvider as RekaTooltipProvider,
    SelectRoot,
    DropdownMenuRoot,
    DropdownMenuContent as RekaDropdownMenuContent,
    DropdownMenuSub,
    DropdownMenuRadioGroup,
    TabsRoot,
    TabsList as RekaTabsList,
    AccordionRoot,
    AccordionItem as RekaAccordionItem,
    AvatarRoot,
    RadioGroupRoot,
    ToastProvider,
} from 'reka-ui'
import * as BrutxUI from '../index'
import { renderToStringChecked } from '../test/ssr-render'

async function renderComponent(comp: Component, props?: Record<string, unknown>): Promise<string> {
    const app = createSSRApp({
        render: () => h(comp, props),
    })
    return renderToStringChecked(app)
}

async function renderWithProvider(
    comp: Component,
    provider: Component,
    providerProps?: Record<string, unknown>,
    compProps?: Record<string, unknown>,
    slotText?: string,
): Promise<string> {
    const app = createSSRApp({
        render: () => h(
            provider,
            providerProps || {},
            () => h(comp, compProps, slotText === undefined ? undefined : () => slotText),
        ),
    })
    return renderToStringChecked(app)
}

function defineRenderRoot(render: () => VNode): Component {
    return defineComponent({ render })
}

type ColorPickerEmit = {
    (event: 'open' | 'close'): void
    (event: 'change' | 'update:modelValue', value: string | null): void
}

type DatePickerEmit = {
    (event: 'open' | 'close'): void
    (event: 'change' | 'update:modelValue', value: Date | null): void
}

const emitColorPicker: ColorPickerEmit = (
    _event: 'open' | 'close' | 'change' | 'update:modelValue',
    _value?: string | null,
): void => undefined

const emitDatePicker: DatePickerEmit = (
    _event: 'open' | 'close' | 'change' | 'update:modelValue',
    _value?: Date | null,
): void => undefined

describe('SSR diagnostics guard', () => {
    it('propagates ordinary render errors', async () => {
        const app = createSSRApp({
            render: () => {
                throw new Error('fixture render failure')
            },
        })

        await expect(renderToStringChecked(app)).rejects.toThrow('fixture render failure')
    })

    it('fails on console warnings and restores the console listener', async () => {
        const originalWarn = console.warn
        const app = createSSRApp(defineComponent({
            setup() {
                console.warn('fixture console warning')
                return () => h('div', 'warning')
            },
        }))

        await expect(renderToStringChecked(app)).rejects.toThrow(/console\.warn: fixture console warning/)
        expect(console.warn).toBe(originalWarn)
    })

    it('fails on Vue warnings and restores the app warning handler', async () => {
        const app = createSSRApp(defineComponent({
            props: {
                requiredLabel: { type: String, required: true },
            },
            setup() {
                return () => h('div')
            },
        }))
        const originalWarnHandler = () => undefined
        app.config.warnHandler = originalWarnHandler

        await expect(renderToStringChecked(app)).rejects.toThrow(/vue: Missing required prop: "requiredLabel"/)
        expect(app.config.warnHandler).toBe(originalWarnHandler)
    })
})

// ---------------------------------------------------------------------------
// Layer 1a: Simple component rendering smoke tests
// ---------------------------------------------------------------------------

describe('SSR smoke: simple components', () => {
    const cases: Array<{
        name: string
        comp: Component
        expectContains: string
        props?: Record<string, unknown>
    }> = [
        // 原有覆盖
        { name: 'Button', comp: BrutxUI.Button, expectContains: '<button' },
        { name: 'Badge', comp: BrutxUI.Badge, expectContains: '<span' },
        { name: 'Card', comp: BrutxUI.Card, expectContains: '<div' },
        { name: 'Input', comp: BrutxUI.Input, expectContains: '<input' },
        { name: 'Textarea', comp: BrutxUI.Textarea, expectContains: '<textarea' },
        { name: 'Label', comp: BrutxUI.Label, expectContains: '<label' },
        { name: 'Separator', comp: BrutxUI.Separator, expectContains: '<' },
        { name: 'Switch', comp: BrutxUI.Switch, expectContains: '<button' },
        { name: 'Checkbox', comp: BrutxUI.Checkbox, expectContains: '<button' },
        { name: 'Spinner', comp: BrutxUI.Spinner, expectContains: '<' },
        { name: 'Skeleton', comp: BrutxUI.Skeleton, expectContains: '<div' },
        { name: 'Alert', comp: BrutxUI.Alert, expectContains: '<div' },
        { name: 'Kbd', comp: BrutxUI.Kbd, expectContains: '<kbd' },
        { name: 'Progress', comp: BrutxUI.Progress, expectContains: '<' },
        { name: 'Avatar', comp: BrutxUI.Avatar, expectContains: '<span' },
        { name: 'Marquee', comp: BrutxUI.Marquee, expectContains: '<div' },
        { name: 'GlitchText', comp: BrutxUI.GlitchText, expectContains: '<' },
        { name: 'TypewriterText', comp: BrutxUI.TypewriterText, expectContains: '<', props: { text: 'Hello' } },
        { name: 'Timeline', comp: BrutxUI.Timeline, expectContains: '<div' },
        { name: 'Result', comp: BrutxUI.Result, expectContains: '<div' },
        { name: 'Loading', comp: BrutxUI.Loading, expectContains: '<div' },
        { name: 'CopyToClipboard', comp: BrutxUI.CopyToClipboard, expectContains: '<', props: { text: 'Copy me' } },
        { name: 'Statistic', comp: BrutxUI.Statistic, expectContains: '<div', props: { value: 12345 } },
        { name: 'Countdown', comp: BrutxUI.Countdown, expectContains: '<div', props: { value: 1700000000000 } },

        // Spinner 变体
        { name: 'BlockSpinner', comp: BrutxUI.BlockSpinner, expectContains: '<' },
        { name: 'DotsSpinner', comp: BrutxUI.DotsSpinner, expectContains: '<' },
        { name: 'BarsSpinner', comp: BrutxUI.BarsSpinner, expectContains: '<' },

        // Skeleton 变体
        { name: 'SkeletonText', comp: BrutxUI.SkeletonText, expectContains: '<' },
        { name: 'SkeletonAvatar', comp: BrutxUI.SkeletonAvatar, expectContains: '<' },
        { name: 'SkeletonCard', comp: BrutxUI.SkeletonCard, expectContains: '<' },
        { name: 'SkeletonTable', comp: BrutxUI.SkeletonTable, expectContains: '<' },

        // Card 子组件
        { name: 'CardHeader', comp: BrutxUI.CardHeader, expectContains: '<' },
        { name: 'CardTitle', comp: BrutxUI.CardTitle, expectContains: '<' },
        { name: 'CardDescription', comp: BrutxUI.CardDescription, expectContains: '<' },
        { name: 'CardContent', comp: BrutxUI.CardContent, expectContains: '<' },
        { name: 'CardFooter', comp: BrutxUI.CardFooter, expectContains: '<' },

        // Alert 子组件
        { name: 'AlertTitle', comp: BrutxUI.AlertTitle, expectContains: '<' },
        { name: 'AlertDescription', comp: BrutxUI.AlertDescription, expectContains: '<' },

        // 注：AvatarImage / AvatarFallback 需要 AvatarRoot context，移至 provider-wrapped

        // Breadcrumb 全套
        { name: 'Breadcrumb', comp: BrutxUI.Breadcrumb, expectContains: '<' },
        { name: 'BreadcrumbList', comp: BrutxUI.BreadcrumbList, expectContains: '<' },
        { name: 'BreadcrumbItem', comp: BrutxUI.BreadcrumbItem, expectContains: '<' },
        { name: 'BreadcrumbLink', comp: BrutxUI.BreadcrumbLink, expectContains: '<' },
        { name: 'BreadcrumbPage', comp: BrutxUI.BreadcrumbPage, expectContains: '<' },
        { name: 'BreadcrumbSeparator', comp: BrutxUI.BreadcrumbSeparator, expectContains: '<' },
        { name: 'BreadcrumbEllipsis', comp: BrutxUI.BreadcrumbEllipsis, expectContains: '<' },

        // 表单类
        { name: 'Toggle', comp: BrutxUI.Toggle, expectContains: '<button' },
        { name: 'RadioGroup', comp: BrutxUI.RadioGroup, expectContains: '<' },
        // 注：RadioGroupItem 需要 RadioGroupRoot context，移至 provider-wrapped
        { name: 'Slider', comp: BrutxUI.Slider, expectContains: '<' },
        { name: 'Pagination', comp: BrutxUI.Pagination, expectContains: '<', props: { modelValue: 1, totalPages: 1 } },
        { name: 'NumberInput', comp: BrutxUI.NumberInput, expectContains: '<' },

        // 视觉/营销类
        { name: 'ColorModeSwitcher', comp: BrutxUI.ColorModeSwitcher, expectContains: '<' },
        { name: 'DashboardShell', comp: BrutxUI.DashboardShell, expectContains: '<' },
        { name: 'BrutalistHero', comp: BrutxUI.BrutalistHero, expectContains: '<' },
        { name: 'AuthCard', comp: BrutxUI.AuthCard, expectContains: '<' },
        { name: 'PricingSection', comp: BrutxUI.PricingSection, expectContains: '<' },
        { name: 'HeaderSection', comp: BrutxUI.HeaderSection, expectContains: '<' },
        { name: 'FooterSection', comp: BrutxUI.FooterSection, expectContains: '<' },
        { name: 'FeedbackForm', comp: BrutxUI.FeedbackForm, expectContains: '<' },
        { name: 'CookieConsent', comp: BrutxUI.CookieConsent, expectContains: '<' },
        { name: 'BeforeAfter', comp: BrutxUI.BeforeAfter, expectContains: '<', props: { before: '/before.png', after: '/after.png' } },
        { name: 'Card3D', comp: BrutxUI.Card3D, expectContains: '<' },
        { name: 'NoiseBackground', comp: BrutxUI.NoiseBackground, expectContains: '<' },
        { name: 'ScratchCard', comp: BrutxUI.ScratchCard, expectContains: '<' },
        { name: 'SketchyChart', comp: BrutxUI.SketchyChart, expectContains: '<' },
        { name: 'HardcoreInput', comp: BrutxUI.HardcoreInput, expectContains: '<' },

        // 数据展示类（提供最小 props）
        { name: 'Descriptions', comp: BrutxUI.Descriptions, expectContains: '<' },
        { name: 'DescriptionsItem', comp: BrutxUI.DescriptionsItem, expectContains: '<', props: { label: 'Name' } },
        { name: 'Rate', comp: BrutxUI.Rate, expectContains: '<' },
        { name: 'Watermark', comp: BrutxUI.Watermark, expectContains: '<' },
        { name: 'Backtop', comp: BrutxUI.Backtop, expectContains: '<' },
        { name: 'Image', comp: BrutxUI.Image, expectContains: '<', props: { src: '/image.png', alt: 'Image' } },
        { name: 'Counter', comp: BrutxUI.Counter, expectContains: '<', props: { to: 100 } },
        { name: 'ChatBubble', comp: BrutxUI.ChatBubble, expectContains: '<', props: { message: { id: '1', content: 'Hello', role: 'user' } } },
        {
            name: 'ChatContainer',
            comp: BrutxUI.ChatContainer,
            expectContains: '<',
            props: { messages: [{ id: 'message-1', content: 'Hello', role: 'user' }] },
        },

        // Stepper（需要 steps + modelValue）
        {
            name: 'Stepper',
            comp: BrutxUI.Stepper,
            expectContains: '<',
            props: { steps: [{ title: 'Step 1' }, { title: 'Step 2' }], modelValue: 0 },
        },

        // TreeView（需要 nodes）
        {
            name: 'TreeView',
            comp: BrutxUI.TreeView,
            expectContains: '<',
            props: { nodes: [{ id: '1', label: 'Root' }] },
        },

        // KanbanBoard（需要 modelValue columns）
        {
            name: 'KanbanBoard',
            comp: BrutxUI.KanbanBoard,
            expectContains: '<',
            props: { modelValue: [{ id: 'todo', title: 'Todo', cards: [] }] },
        },

        // Transfer（需要 source + target）
        {
            name: 'Transfer',
            comp: BrutxUI.Transfer,
            expectContains: '<',
            props: { data: [{ key: '1', label: 'Item 1' }], modelValue: [] },
        },
    ]

    for (const { name, comp, expectContains, props } of cases) {
        it(`${name} renders expected HTML on SSR`, async () => {
            const html = await renderComponent(comp, props)
            expect(html.length).toBeGreaterThan(0)
            expect(html.toLowerCase()).toContain(expectContains)
        })
    }
})

// ---------------------------------------------------------------------------
// Layer 1b: Provider-wrapped component rendering smoke tests
// ---------------------------------------------------------------------------

describe('SSR smoke: provider-wrapped components', () => {
    // 简单单层 provider 的组件（provider 直接包裹 comp）
    const singleProviderCases: Array<{
        name: string
        comp: Component
        provider: Component
        providerProps?: Record<string, unknown>
        compProps?: Record<string, unknown>
        expectedHtml?: RegExp
    }> = [
        // Dialog 系列（需要 DialogRoot + open）
        { name: 'DialogOverlay', comp: BrutxUI.DialogOverlay, provider: DialogRoot, providerProps: { open: true } },
        { name: 'DialogContent', comp: BrutxUI.DialogContent, provider: DialogRoot, providerProps: { open: true }, compProps: { forceMount: true }, expectedHtml: /<!--/ },
        { name: 'DialogHeader', comp: BrutxUI.DialogHeader, provider: DialogRoot, providerProps: { open: true } },
        { name: 'DialogFooter', comp: BrutxUI.DialogFooter, provider: DialogRoot, providerProps: { open: true } },
        { name: 'DialogTitle', comp: BrutxUI.DialogTitle, provider: DialogRoot, providerProps: { open: true } },
        { name: 'DialogDescription', comp: BrutxUI.DialogDescription, provider: DialogRoot, providerProps: { open: true } },
        { name: 'DialogEnhanced', comp: BrutxUI.DialogEnhanced, provider: DialogRoot, providerProps: { open: true }, compProps: { forceMount: true }, expectedHtml: /<!--/ },

        // AlertDialog 系列（Header/Footer/Title/Description 在 AlertDialogContent 外层也可）
        { name: 'AlertDialogContent', comp: BrutxUI.AlertDialogContent, provider: AlertDialogRoot, providerProps: { open: true }, compProps: { forceMount: true }, expectedHtml: /<!--/ },
        { name: 'AlertDialogHeader', comp: BrutxUI.AlertDialogHeader, provider: AlertDialogRoot, providerProps: { open: true } },
        { name: 'AlertDialogFooter', comp: BrutxUI.AlertDialogFooter, provider: AlertDialogRoot, providerProps: { open: true } },
        { name: 'AlertDialogTitle', comp: BrutxUI.AlertDialogTitle, provider: AlertDialogRoot, providerProps: { open: true } },
        { name: 'AlertDialogDescription', comp: BrutxUI.AlertDialogDescription, provider: AlertDialogRoot, providerProps: { open: true } },
        { name: 'AlertDialogAction', comp: BrutxUI.AlertDialogAction, provider: AlertDialogRoot, providerProps: { open: true } },

        // Sheet 系列（基于 DialogRoot）
        { name: 'SheetContent', comp: BrutxUI.SheetContent, provider: DialogRoot, providerProps: { open: true }, compProps: { forceMount: true }, expectedHtml: /<!--/ },
        { name: 'SheetHeader', comp: BrutxUI.SheetHeader, provider: DialogRoot, providerProps: { open: true } },
        { name: 'SheetFooter', comp: BrutxUI.SheetFooter, provider: DialogRoot, providerProps: { open: true } },
        { name: 'SheetTitle', comp: BrutxUI.SheetTitle, provider: DialogRoot, providerProps: { open: true } },
        { name: 'SheetDescription', comp: BrutxUI.SheetDescription, provider: DialogRoot, providerProps: { open: true } },

        // Popover
        { name: 'PopoverContent', comp: BrutxUI.PopoverContent, provider: PopoverRoot, providerProps: { open: true }, compProps: { forceMount: true }, expectedHtml: /<!--/ },

        // Select 系列（Trigger/Label/Separator 在 SelectRoot 下即可）
        {
            name: 'SelectTrigger',
            comp: BrutxUI.SelectTrigger,
            provider: SelectRoot,
            providerProps: { modelValue: 'a' },
        },
        {
            name: 'SelectLabel',
            comp: BrutxUI.SelectLabel,
            provider: SelectRoot,
            providerProps: { open: true },
        },

        // DropdownMenuShortcut 不需要 Content context
        { name: 'DropdownMenuSeparator', comp: BrutxUI.DropdownMenuSeparator, provider: DropdownMenuRoot, providerProps: { open: true } },
        { name: 'DropdownMenuShortcut', comp: BrutxUI.DropdownMenuShortcut, provider: DropdownMenuRoot, providerProps: { open: true } },
        { name: 'DropdownMenuLabel', comp: BrutxUI.DropdownMenuLabel, provider: DropdownMenuRoot, providerProps: { open: true } },

        // TabsList（在 TabsRoot 下即可）
        {
            name: 'TabsList',
            comp: BrutxUI.TabsList,
            provider: TabsRoot,
            providerProps: { modelValue: 'tab1' },
        },

        // AccordionItem（在 AccordionRoot 下即可）
        {
            name: 'AccordionItem',
            comp: BrutxUI.AccordionItem,
            provider: AccordionRoot,
            providerProps: { defaultValue: 'item1' },
            compProps: { value: 'item1' },
        },

        // Toast（需要 ToastProvider）
        { name: 'Toast', comp: BrutxUI.Toast, provider: ToastProvider },
        { name: 'ToastContainer', comp: BrutxUI.ToastContainer, provider: ToastProvider },

        // AvatarImage / AvatarFallback 需要 AvatarRoot context
        { name: 'AvatarImage', comp: BrutxUI.AvatarImage, provider: AvatarRoot, compProps: { src: '/avatar.png', alt: 'Avatar' } },
        { name: 'AvatarFallback', comp: BrutxUI.AvatarFallback, provider: AvatarRoot },

        // RadioGroupItem 需要 RadioGroupRoot context
        { name: 'RadioGroupItem', comp: BrutxUI.RadioGroupItem, provider: RadioGroupRoot, compProps: { value: 'a' } },
    ]

    // 嵌套 provider 的组件（需要多层 context）
    const nestedProviderCases: Array<{
        name: string
        render: () => Component
        expectedHtml?: RegExp
    }> = [
        // AlertDialogCancel 需要 AlertDialogContent context
        {
            name: 'AlertDialogCancel',
            render: () => defineComponent({
                render: () => h(AlertDialogRoot, { open: true }, () =>
                    h(AlertDialogContent, () => h(BrutxUI.AlertDialogCancel, undefined, () => 'Cancel')),
                ),
            }),
        },
        // TooltipContent 需要 TooltipProvider + TooltipRoot
        {
            name: 'TooltipContent',
            render: () => defineComponent({
                render: () => h(RekaTooltipProvider, () =>
                    h(TooltipRoot, { open: true }, () => h(BrutxUI.TooltipContent, { forceMount: true }, () => 'Tooltip')),
                ),
            }),
            expectedHtml: /<!--/,
        },
        // SelectContent 需要 SelectRoot；SelectItem/ScrollUp/Down 需要 SelectContent context
        {
            name: 'SelectContent',
            render: () => defineComponent({
                render: () => h(SelectRoot, { open: true, modelValue: 'a' }, () => h(BrutxUI.SelectContent, undefined, () => 'Select')),
            }),
            expectedHtml: /<!--/,
        },
        {
            name: 'SelectItem',
            render: () => defineComponent({
                render: () => h(SelectRoot, { open: true, modelValue: 'a' }, () =>
                    h(BrutxUI.SelectContent, { forceMount: true }, () => h(BrutxUI.SelectItem, { value: 'a' }, () => 'A')),
                ),
            }),
            expectedHtml: /<!--/,
        },
        {
            name: 'SelectScrollUpButton',
            render: () => defineComponent({
                render: () => h(SelectRoot, { open: true }, () =>
                    h(BrutxUI.SelectContent, { forceMount: true }, () => h(BrutxUI.SelectScrollUpButton, undefined, () => 'Up')),
                ),
            }),
            expectedHtml: /<!--/,
        },
        {
            name: 'SelectScrollDownButton',
            render: () => defineComponent({
                render: () => h(SelectRoot, { open: true }, () =>
                    h(BrutxUI.SelectContent, { forceMount: true }, () => h(BrutxUI.SelectScrollDownButton, undefined, () => 'Down')),
                ),
            }),
            expectedHtml: /<!--/,
        },
        // DropdownMenuItem/CheckboxItem/RadioItem 需要 Content context
        {
            name: 'DropdownMenuContent',
            render: () => defineComponent({
                render: () => h(DropdownMenuRoot, { open: true }, () => h(BrutxUI.DropdownMenuContent, { forceMount: true }, () => h(BrutxUI.DropdownMenuItem, undefined, () => 'Item'))),
            }),
            expectedHtml: /<!--/,
        },
        {
            name: 'DropdownMenuItem',
            render: () => defineComponent({
                render: () => h(DropdownMenuRoot, { open: true }, () =>
                    h(RekaDropdownMenuContent, { forceMount: true }, () => h(BrutxUI.DropdownMenuItem, undefined, () => 'Item')),
                ),
            }),
        },
        {
            name: 'DropdownMenuCheckboxItem',
            render: () => defineComponent({
                render: () => h(DropdownMenuRoot, { open: true }, () =>
                    h(RekaDropdownMenuContent, { forceMount: true }, () => h(BrutxUI.DropdownMenuCheckboxItem, undefined, () => 'Check')),
                ),
            }),
        },
        {
            name: 'DropdownMenuRadioItem',
            render: () => defineComponent({
                render: () => h(DropdownMenuRoot, { open: true }, () =>
                    h(RekaDropdownMenuContent, { forceMount: true }, () =>
                        h(DropdownMenuRadioGroup, { modelValue: 'a' }, () => h(BrutxUI.DropdownMenuRadioItem, { value: 'a' }, () => 'Radio')),
                    ),
                ),
            }),
        },
        // SubTrigger/SubContent 需要 DropdownMenuSub context
        {
            name: 'DropdownMenuSubTrigger',
            render: () => defineComponent({
                render: () => h(DropdownMenuRoot, { open: true }, () =>
                    h(RekaDropdownMenuContent, { forceMount: true }, () =>
                        h(DropdownMenuSub, () => h(BrutxUI.DropdownMenuSubTrigger, undefined, () => 'Sub')),
                    ),
                ),
            }),
        },
        {
            name: 'DropdownMenuSubContent',
            render: () => defineComponent({
                render: () => h(DropdownMenuRoot, { open: true }, () =>
                    h(RekaDropdownMenuContent, { forceMount: true }, () =>
                        h(DropdownMenuSub, { open: true }, () => h(BrutxUI.DropdownMenuSubContent, { forceMount: true }, () => 'Sub content')),
                    ),
                ),
            }),
        },
        // TabsTrigger/Content 需要 TabsList context
        {
            name: 'TabsTrigger',
            render: () => defineComponent({
                render: () => h(TabsRoot, { modelValue: 'tab1' }, () =>
                    h(RekaTabsList, () => h(BrutxUI.TabsTrigger, { value: 'tab1' }, () => 'Tab')),
                ),
            }),
        },
        {
            name: 'TabsContent',
            render: () => defineComponent({
                render: () => h(TabsRoot, { modelValue: 'tab1' }, () =>
                    h(BrutxUI.TabsContent, { value: 'tab1' }, () => 'Content'),
                ),
            }),
        },
        // AccordionTrigger/Content 需要 AccordionItem context
        {
            name: 'AccordionTrigger',
            render: () => defineComponent({
                render: () => h(AccordionRoot, { defaultValue: 'item1' }, () =>
                    h(RekaAccordionItem, { value: 'item1' }, () => h(BrutxUI.AccordionTrigger, undefined, () => 'Trigger')),
                ),
            }),
        },
        {
            name: 'AccordionContent',
            render: () => defineComponent({
                render: () => h(AccordionRoot, { defaultValue: 'item1' }, () =>
                    h(RekaAccordionItem, { value: 'item1' }, () => h(BrutxUI.AccordionContent, undefined, () => 'Content')),
                ),
            }),
        },
        // TooltipProvider（本身就是 provider，单独渲染）
        {
            name: 'TooltipProvider',
            render: () => defineRenderRoot(() => h(BrutxUI.TooltipProvider, undefined, () => h('span', 'tooltip'))),
        },
    ]

    for (const { name, comp, provider, providerProps, compProps, expectedHtml } of singleProviderCases) {
        it(`${name} renders within provider on SSR`, async () => {
            const html = await renderWithProvider(comp, provider, providerProps, compProps, name)
            expect(html).toMatch(expectedHtml ?? /<[a-z][^>]*>/)
        })
    }

    for (const { name, render, expectedHtml } of nestedProviderCases) {
        it(`${name} renders within nested providers on SSR`, async () => {
            const app = createSSRApp(render())
            const html = await renderToStringChecked(app)
            expect(html).toMatch(expectedHtml ?? /<[a-z][^>]*>/)
        })
    }
})

// ---------------------------------------------------------------------------
// Layer 1c: Wrapper component rendering smoke tests
// ---------------------------------------------------------------------------

describe('SSR smoke: wrapper components', () => {
    const cases: Array<{
        name: string
        comp?: Component
        props?: Record<string, unknown>
        render?: () => Component
        expectedHtml?: RegExp
    }> = [
        // Accordion (root wrapper)
        { name: 'Accordion', comp: BrutxUI.Accordion },
        // ScrollArea (root wrapper)
        { name: 'ScrollArea', comp: BrutxUI.ScrollArea },
        {
            name: 'ScrollBar',
            render: () => defineRenderRoot(() => h(BrutxUI.ScrollArea, undefined, () => h(BrutxUI.ScrollBar))),
        },
        // Tabs (wrapper，内含 TabsRoot)
        { name: 'Tabs', comp: BrutxUI.Tabs, props: { modelValue: 'tab1', tabs: [{ label: 'Tab 1', value: 'tab1' }] } },
        // Select (wrapper，内含 SelectRoot)
        { name: 'Select', comp: BrutxUI.Select, props: { options: [{ label: 'A', value: 'a' }] } },
        // ColorPicker (wrapper)
        { name: 'ColorPicker', comp: BrutxUI.ColorPicker },
        { name: 'ColorPickerPanel', comp: BrutxUI.ColorPickerPanel },
        { name: 'ColorPickerSwatch', comp: BrutxUI.ColorPickerSwatch, props: { value: '#ff0000' } },
        { name: 'ColorPickerInput', comp: BrutxUI.ColorPickerInput, props: { modelValue: '#ff0000' } },
        { name: 'ColorPickerHistory', comp: BrutxUI.ColorPickerHistory, props: { history: ['#ff0000'] } },
        // Command 系列（Command 是 root wrapper）
        { name: 'Command', comp: BrutxUI.Command },
        {
            name: 'CommandInput',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandInput))),
        },
        {
            name: 'CommandList',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandList))),
        },
        {
            name: 'CommandEmpty',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandEmpty))),
        },
        {
            name: 'CommandGroup',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandGroup, { title: 'Group' }))),
        },
        {
            name: 'CommandItem',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandItem, { value: 'item1' }, () => 'Item 1'))),
        },
        {
            name: 'CommandSeparator',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandSeparator))),
        },
        {
            name: 'CommandShortcut',
            render: () => defineRenderRoot(() => h(BrutxUI.Command, undefined, () => h(BrutxUI.CommandShortcut, undefined, () => '⌘K'))),
        },
        // TagsInput (root wrapper)
        { name: 'TagsInput', comp: BrutxUI.TagsInput, props: { modelValue: ['tag1'] } },
        {
            name: 'TagsInputInput',
            render: () => defineRenderRoot(() => h(BrutxUI.TagsInput, { modelValue: [] }, () => h(BrutxUI.TagsInputInput, { placeholder: 'Add tag' }))),
        },
        // ToggleGroup (root wrapper)
        { name: 'ToggleGroup', comp: BrutxUI.ToggleGroup },
        {
            name: 'ToggleGroupItem',
            render: () => defineRenderRoot(() => h(BrutxUI.ToggleGroup, { type: 'single', modelValue: 'a' }, () => h(BrutxUI.ToggleGroupItem, { value: 'a' }, () => 'A'))),
        },
        // Menu (root wrapper)
        { name: 'Menu', comp: BrutxUI.Menu },
        // Table 系列（HTML 原生，无 reka-ui context 依赖）
        { name: 'Table', comp: BrutxUI.Table },
        { name: 'TableHeader', comp: BrutxUI.TableHeader },
        { name: 'TableBody', comp: BrutxUI.TableBody },
        { name: 'TableFooter', comp: BrutxUI.TableFooter },
        { name: 'TableRow', comp: BrutxUI.TableRow },
        { name: 'TableHead', comp: BrutxUI.TableHead },
        { name: 'TableCell', comp: BrutxUI.TableCell },
        { name: 'TableCaption', comp: BrutxUI.TableCaption },
        // DataTable（需要 columns + data）
        {
            name: 'DataTable',
            comp: BrutxUI.DataTable,
            props: {
                columns: [{ id: 'name', header: 'Name', accessorKey: 'name' }],
                data: [{ id: 'row-1', name: 'Test' }],
                rowKey: 'id',
            },
        },
        // Carousel（需要 slides）
        {
            name: 'Carousel',
            comp: BrutxUI.Carousel,
            props: { slides: [{ src: '', alt: 'Slide 1' }] },
        },
        // TreeSelect
        {
            name: 'TreeSelect',
            comp: BrutxUI.TreeSelect,
            props: { nodes: [{ id: '1', label: 'Root' }] },
        },
        {
            name: 'TreeSelectNode',
            comp: BrutxUI.TreeSelectNode,
            props: {
                node: { id: '1', label: 'Root' },
                selectedIds: new Set<string>(),
                expandedIds: new Set<string>(),
                depth: 0,
            },
        },
        {
            name: 'TreeViewNode',
            comp: BrutxUI.TreeViewNode,
            props: {
                node: { id: '1', label: 'Root' },
                expandedIds: new Set<string>(),
                depth: 0,
            },
        },
        // Combobox
        { name: 'Combobox', comp: BrutxUI.Combobox, props: { options: [{ label: 'A', value: 'a' }] } },
        // Cascader
        { name: 'Cascader', comp: BrutxUI.Cascader, props: { options: [{ value: 'a', label: 'A' }] } },
        // Upload 系列
        { name: 'Upload', comp: BrutxUI.Upload },
        { name: 'UploadTrigger', comp: BrutxUI.UploadTrigger },
        {
            name: 'UploadFileList',
            comp: BrutxUI.UploadFileList,
            props: {
                files: [{ id: 'file-1', name: 'test.txt', size: 4, type: 'text/plain', status: 'ready', progress: 0 }],
            },
        },
        {
            name: 'UploadFileItem',
            comp: BrutxUI.UploadFileItem,
            props: {
                file: { id: 'file-1', name: 'test.txt', size: 4, type: 'text/plain', status: 'ready', progress: 0 },
            },
        },
        // InfiniteScroll
        { name: 'InfiniteScroll', comp: BrutxUI.InfiniteScroll },
        // VirtualScroll（需要 items）
        {
            name: 'VirtualScroll',
            comp: BrutxUI.VirtualScroll,
            props: { items: [{ id: '1' }], itemHeight: 40 },
        },
        // Tour（需要 steps）
        {
            name: 'Tour',
            comp: BrutxUI.Tour,
            props: { steps: [{ target: '#el', title: 'Step 1' }] },
        },
        // Popconfirm
        { name: 'Popconfirm', comp: BrutxUI.Popconfirm, props: { title: 'Confirm action', open: true }, expectedHtml: /<!--/ },
    ]

    for (const { name, comp, props, render, expectedHtml } of cases) {
        it(`${name} renders on SSR`, async () => {
            const root = render ? render() : comp
            if (!root) throw new Error(`${name} SSR fixture has no root component`)
            const html = await renderComponent(root, props)
            expect(html).toMatch(expectedHtml ?? /<[a-z][^>]*>/)
        })
    }
})

// ---------------------------------------------------------------------------
// Layer 2: Composable setup smoke tests
// ---------------------------------------------------------------------------

describe('SSR smoke: composables', () => {
    const composableCases: Array<{
        name: string
        fn: () => unknown
        providerWrap?: (child: Component) => Component
    }> = [
        // 原有覆盖
        { name: 'useReducedMotion', fn: () => BrutxUI.useReducedMotion() },
        { name: 'useClipboard', fn: () => BrutxUI.useClipboard() },
        { name: 'useTheme', fn: () => BrutxUI.useTheme() },
        {
            name: 'useToast',
            fn: () => BrutxUI.useToast(),
            providerWrap: (child) => defineComponent({
                setup() {
                    return () => h('div', [h(BrutxUI.ToastContainer), h(child)])
                },
            }),
        },
        { name: 'useDebounce', fn: () => BrutxUI.useDebounce(() => {}, 100) },
        { name: 'useThrottle', fn: () => BrutxUI.useThrottle(() => {}, 100) },
        { name: 'useClearable', fn: () => BrutxUI.useClearable() },
        { name: 'useLocale', fn: () => BrutxUI.useLocale() },

        // 新增 composable 覆盖
        { name: 'useColorHistory', fn: () => BrutxUI.useColorHistory() },
        // useColorPicker 需要 emit（required field）
        {
            name: 'useColorPicker',
            fn: () => BrutxUI.useColorPicker({
                modelValue: null,
                emit: emitColorPicker,
            }),
        },
        { name: 'useFormFieldValidation', fn: () => BrutxUI.useFormFieldValidation() },
        { name: 'useAudioEngine', fn: () => BrutxUI.useAudioEngine(ref(false)) },
        // useCanvasInteraction 需要完整的 options（所有字段 required）
        {
            name: 'useCanvasInteraction',
            fn: () => BrutxUI.useCanvasInteraction({
                containerRef: ref<HTMLDivElement | null>(null),
                canvasRef: ref<HTMLCanvasElement | null>(null),
                brushRadius: ref(10),
                percentage: ref(50),
                fadeDuration: ref(300),
                prefersReducedMotion: ref(false),
                onProgress: () => {},
                onCompleted: () => {},
                drawOverlay: (_ctx, _width, _height) => {},
            }),
        },
        {
            name: 'useDialog',
            fn: () => BrutxUI.useDialog(),
            providerWrap: (child) => defineComponent({
                setup() {
                    return () => h(DialogRoot, { open: false }, () => h(child))
                },
            }),
        },
        {
            name: 'useMessageBox',
            fn: () => BrutxUI.useMessageBox(),
        },
        {
            name: 'useMessage',
            fn: () => BrutxUI.useMessage(),
        },
        // useDatePicker 需要 emit（required field）
        {
            name: 'useDatePicker',
            fn: () => BrutxUI.useDatePicker({
                modelValue: null,
                emit: emitDatePicker,
            }),
        },
        {
            name: 'useCarousel',
            fn: () => BrutxUI.useCarousel(),
        },
        {
            name: 'useUpload',
            fn: () => BrutxUI.useUpload(),
        },
        {
            name: 'useDataTableSort',
            fn: () => BrutxUI.useDataTableSort({ columns: [], sortable: false }),
        },
        {
            name: 'useDataTableFilter',
            fn: () => BrutxUI.useDataTableFilter({ columns: [], filterable: false }),
        },
        {
            name: 'useDataTableSelection',
            fn: () => BrutxUI.useDataTableSelection({ selectable: false, rowKey: 'id', displayData: [], data: [] }),
        },
        {
            name: 'useDataTablePagination',
            fn: () => BrutxUI.useDataTablePagination({ paginated: false, pageSize: 10, totalItems: 0 }),
        },
        {
            name: 'useInfiniteScroll',
            fn: () => BrutxUI.useInfiniteScroll(ref<HTMLElement | null>(null), { onLoad: () => {} }),
        },
    ]

    for (const { name, fn, providerWrap } of composableCases) {
        it(`${name} does not throw on SSR setup`, async () => {
            const Wrapper = defineComponent({
                setup() {
                    fn()
                    return () => h('div')
                },
            })
            const Root = providerWrap ? providerWrap(Wrapper) : Wrapper
            const app = createSSRApp(Root)
            const html = await renderToStringChecked(app)
            expect(html).toBeTruthy()
        })
    }
})
