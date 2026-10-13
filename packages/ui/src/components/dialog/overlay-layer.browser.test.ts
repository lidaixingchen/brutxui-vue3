import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import '../../../dist/styles.css'
import OverlayLayerTestFixture from '@/test/fixtures/OverlayLayerTestFixture.vue'
import NestedDialogTestFixture from './NestedDialogTestFixture.vue'
import { mount } from '@/test/browser-mount'

const OVERLAY_SETTLE_DURATION_MS = 100

interface OverlayLayerFixtureVm {
    dialogOpen: boolean
    popoverOpen: boolean
    dropdownOpen: boolean
    tooltipOpen: boolean
    selectOpen: boolean
    selectPosition: 'popper' | 'item-aligned'
    sheetOpen: boolean
    sheetPopoverOpen: boolean
    alertOpen: boolean
    alertPopoverOpen: boolean
    longMenuOpen: boolean
}

describe('Overlay Layer Browser Integration (Chromium)', () => {
    let host: HTMLDivElement | null = null
    let activeWrapper: ReturnType<typeof mount> | null = null

    beforeEach(() => {
        host = document.createElement('div')
        document.body.appendChild(host)
    })

    afterEach(() => {
        activeWrapper?.unmount()
        activeWrapper = null
        if (host?.parentNode) {
            host.parentNode.removeChild(host)
            host = null
        }
        document.body.style.overflow = ''
        document.body.style.pointerEvents = ''
        layerTokenValues?.forEach((value, token) => {
            if (value) {
                document.documentElement.style.setProperty(token, value)
            } else {
                document.documentElement.style.removeProperty(token)
            }
        })
        layerTokenValues = null
    })

    it('places each portaled floating surface above its owning dialog', async () => {
        activeWrapper = mount(OverlayLayerTestFixture, { attachTo: host! })
        const vm = activeWrapper.vm as unknown as OverlayLayerFixtureVm
        vm.dialogOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))

        const modal = document.querySelector<HTMLElement>('[data-testid="dialog-modal-content"]')
        const overlay = [...document.querySelectorAll<HTMLElement>('.z-dialog')]
            .find(element => element.classList.contains('bg-brutal-overlay'))
        expect(modal).not.toBeNull()
        expect(overlay).toBeDefined()

        const floatingCases = [
            { state: 'popoverOpen' as const, testId: 'nested-popover-content' },
            { state: 'dropdownOpen' as const, testId: 'nested-dropdown-content' },
            { state: 'tooltipOpen' as const, testId: 'nested-tooltip-content' },
            { state: 'selectOpen' as const, testId: 'nested-select-content', position: 'popper' as const },
            { state: 'selectOpen' as const, testId: 'nested-select-content', position: 'item-aligned' as const },
        ]

        for (const floatingCase of floatingCases) {
            if ('position' in floatingCase && floatingCase.position) vm.selectPosition = floatingCase.position
            vm[floatingCase.state] = true
            await nextTick()
            await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))

            const content = document.querySelector<HTMLElement>(`[data-testid="${floatingCase.testId}"]`)
            expect(content).not.toBeNull()
            const modalLayer = readZIndex(modal!)
            const floatingLayer = readZIndex(content!)
            expect(modalLayer).toBeGreaterThan(0)
            expect(readZIndex(overlay!)).toBe(modalLayer)
            expect(floatingLayer).toBeGreaterThan(modalLayer)

            vm[floatingCase.state] = false
            await nextTick()
            await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        }

        vm.dialogOpen = false
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        vm.sheetOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        vm.sheetPopoverOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        expectNestedLayer('sheet-modal-content', 'sheet-popover-content')

        vm.sheetOpen = false
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        vm.alertOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        vm.alertPopoverOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        expectNestedLayer('alert-modal-content', 'alert-popover-content')
    })

    it('places a nested dialog above its parent dialog', async () => {
        activeWrapper = mount(NestedDialogTestFixture, { attachTo: host! })
        const vm = activeWrapper.vm as unknown as { outerOpen: boolean; innerOpen: boolean }
        vm.outerOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
        vm.innerOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))

        const outerLayer = readZIndex(document.querySelector<HTMLElement>('#outer-content')!.parentElement!)
        const innerLayer = readZIndex(document.querySelector<HTMLElement>('#inner-content')!.parentElement!)
        expect(innerLayer).toBeGreaterThan(outerLayer)
    })

    it('preserves CSS tokens and follows live modal class and style changes', async () => {
        const tokenNames = ['--z-index-dialog', '--z-index-popover']
        layerTokenValues = new Map(tokenNames.map(token => [
            token,
            document.documentElement.style.getPropertyValue(token),
        ]))
        document.documentElement.style.setProperty('--z-index-dialog', '3123')
        document.documentElement.style.setProperty('--z-index-popover', '4321')

        activeWrapper = mount(NestedDialogTestFixture, { attachTo: host! })
        const vm = activeWrapper.vm as unknown as {
            outerOpen: boolean
            innerOpen: boolean
            innerPopoverOpen: boolean
            rootPopoverOpen: boolean
        }
        vm.rootPopoverOpen = true
        await nextTick()
        await settleOverlay()

        const rootPopover = document.querySelector<HTMLElement>('[data-testid="root-popover-content"]')
        expect(rootPopover).not.toBeNull()
        expect(rootPopover!.style.getPropertyValue('--z-index-popover')).toBe('')
        expect(readZIndex(rootPopover!)).toBe(4321)

        vm.outerOpen = true
        await nextTick()
        await settleOverlay()
        vm.innerOpen = true
        await nextTick()
        await settleOverlay()
        vm.innerPopoverOpen = true
        await nextTick()
        await settleOverlay()

        const outer = document.querySelector<HTMLElement>('#outer-content')!.parentElement!
        const inner = document.querySelector<HTMLElement>('#inner-content')!.parentElement!
        const innerPopover = document.querySelector<HTMLElement>('[data-testid="inner-dialog-popover"]')!
        const outerOverlay = [...document.querySelectorAll<HTMLElement>('.bg-brutal-overlay')]
            .find(element => readZIndex(element) === readZIndex(outer))

        expect(readZIndex(outer)).toBe(3123)
        expect(outerOverlay).toBeDefined()
        expect(readZIndex(outerOverlay!)).toBe(readZIndex(outer))
        expect(outer.style.getPropertyValue('--z-index-dialog')).toBe('')
        expect(readZIndex(inner)).toBeGreaterThan(readZIndex(outer))
        expect(readZIndex(innerPopover)).toBeGreaterThan(readZIndex(inner))
        expect(readZIndex(innerPopover.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!)).toBe(readZIndex(innerPopover))

        outer.style.setProperty('--z-index-dialog', '3333')
        await settleOverlay()
        expect(readZIndex(outer)).toBe(3333)
        expect(readZIndex(outerOverlay!)).toBe(readZIndex(outer))
        expect(readZIndex(inner)).toBeGreaterThan(readZIndex(outer))
        expect(readZIndex(innerPopover)).toBeGreaterThan(readZIndex(inner))
        expect(readZIndex(innerPopover.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!)).toBe(readZIndex(innerPopover))

        outer.classList.remove('z-dialog')
        outer.classList.add('z-toast')
        await settleOverlay()
        expect(readZIndex(outer)).toBe(10010)
        expect(readZIndex(outerOverlay!)).toBe(readZIndex(outer))
        expect(readZIndex(inner)).toBeGreaterThan(readZIndex(outer))
        expect(readZIndex(innerPopover)).toBeGreaterThan(readZIndex(inner))
        expect(readZIndex(innerPopover.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!)).toBe(readZIndex(innerPopover))

        outer.style.zIndex = '12000'
        await settleOverlay()
        expect(readZIndex(outer)).toBe(12000)
        expect(readZIndex(outerOverlay!)).toBe(readZIndex(outer))
        expect(readZIndex(inner)).toBeGreaterThan(readZIndex(outer))
        expect(readZIndex(innerPopover)).toBeGreaterThan(readZIndex(inner))
        expect(readZIndex(innerPopover.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!)).toBe(readZIndex(innerPopover))

        outer.style.removeProperty('z-index')
        outer.classList.remove('z-toast')
        outer.classList.add('z-dialog')
        outer.style.removeProperty('--z-index-dialog')
        document.documentElement.style.setProperty('--z-index-dialog', '5000')
        await settleOverlay()
        expect(readZIndex(outer)).toBe(5000)
        expect(readZIndex(inner)).toBeGreaterThan(readZIndex(outer))
        expect(readZIndex(innerPopover)).toBeGreaterThan(readZIndex(inner))
        expect(readZIndex(innerPopover.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!)).toBe(readZIndex(innerPopover))
    })

    it('constrains a long dropdown to Reka UI available height with an internal scroll area', async () => {
        activeWrapper = mount(OverlayLayerTestFixture, { attachTo: host! })
        const vm = activeWrapper.vm as unknown as OverlayLayerFixtureVm
        vm.longMenuOpen = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))

        const content = document.querySelector<HTMLElement>('[data-testid="long-dropdown-content"]')
        expect(content).not.toBeNull()
        expect(content?.classList.contains('overflow-y-auto')).toBe(true)
        expect(content?.classList.contains('max-h-[var(--reka-dropdown-menu-content-available-height)]')).toBe(true)
        expect(content?.getAttribute('style')).toContain('--reka-dropdown-menu-content-available-height')
        const availableHeight = Number.parseFloat(
            window.getComputedStyle(content!).getPropertyValue('--reka-popper-available-height')
        )
        expect(availableHeight).toBeGreaterThan(0)
        expect(availableHeight).toBeLessThanOrEqual(window.innerHeight)

    })
})

function expectNestedLayer(modalTestId: string, floatingTestId: string): void {
    const modal = document.querySelector<HTMLElement>(`[data-testid="${modalTestId}"]`)
    const floating = document.querySelector<HTMLElement>(`[data-testid="${floatingTestId}"]`)
    expect(modal).not.toBeNull()
    expect(floating).not.toBeNull()
    expect(readZIndex(floating!)).toBeGreaterThan(readZIndex(modal!))
}

let layerTokenValues: Map<string, string> | null = null

function readZIndex(element: HTMLElement): number {
    return Number(window.getComputedStyle(element).zIndex)
}

async function settleOverlay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))
    await nextTick()
}
