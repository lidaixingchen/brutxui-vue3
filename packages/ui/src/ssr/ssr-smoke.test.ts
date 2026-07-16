/**
 * SSR smoke tests (§3.3)
 *
 * Two layers:
 *   1. Component rendering — verifies pure-render components produce expected HTML
 *      on SSR without throwing. Covers components that can mount standalone.
 *   2. Composable setup — verifies DOM-heavy composables can be called in SSR
 *      setup() without throwing. Provider wrappers inject required context.
 *
 * Environment: node (no window/document). env.ts isClient/hasDocument return false,
 * exercising the SSR-safe code paths in all migrated components/composables.
 */
import { describe, it, expect } from 'vitest'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h, defineComponent, type Component } from 'vue'
import * as BrutxUI from '../index'

async function renderComponent(comp: Component, props?: Record<string, unknown>): Promise<string> {
    const app = createSSRApp({
        render: () => h(comp, props),
    })
    return renderToString(app)
}

// ---------------------------------------------------------------------------
// Layer 1: Component rendering smoke tests
// ---------------------------------------------------------------------------

describe('SSR smoke: components', () => {
    // Curated set of standalone-renderable components with expected HTML fragments.
    // Each assertion verifies the component renders meaningful content (not empty
    // string) and contains the expected tag/class — catching silent SSR failures.
    const cases: Array<{
        name: string
        comp: Component
        expectContains: string
        props?: Record<string, unknown>
    }> = [
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
        { name: 'CopyToClipboard', comp: BrutxUI.CopyToClipboard, expectContains: '<' },
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
// Layer 2: Composable setup smoke tests
// ---------------------------------------------------------------------------

describe('SSR smoke: composables', () => {
    // Each composable is called inside a component setup() during renderToString.
    // If the composable accesses an unguarded DOM global, renderToString throws.
    //
    // Composables that depend on inject() context need a Provider ancestor —
    // otherwise inject returns undefined and throws, which is a test setup defect
    // rather than an SSR incompatibility.

    const composableCases: Array<{
        name: string
        fn: () => unknown
        providerWrap?: (child: Component) => Component
    }> = [
        { name: 'useReducedMotion', fn: () => BrutxUI.useReducedMotion() },
        { name: 'useClipboard', fn: () => BrutxUI.useClipboard() },
        { name: 'useTheme', fn: () => BrutxUI.useTheme() },
        {
            name: 'useToast',
            fn: () => BrutxUI.useToast(),
            // useToast depends on ToastContainer providing the inject key
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
            const html = await renderToString(app)
            expect(html).toBeTruthy()
        })
    }
})
