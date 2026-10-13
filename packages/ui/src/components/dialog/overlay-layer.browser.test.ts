import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
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
            { state: 'popoverOpen' as const, testId: 'nested-popover-content', token: '--z-index-popover' },
            { state: 'dropdownOpen' as const, testId: 'nested-dropdown-content', token: '--z-index-dropdown' },
            { state: 'tooltipOpen' as const, testId: 'nested-tooltip-content', token: '--z-index-tooltip' },
            { state: 'selectOpen' as const, testId: 'nested-select-content', token: '--z-index-dropdown' },
        ]

        for (const floatingCase of floatingCases) {
            vm[floatingCase.state] = true
            await nextTick()
            await new Promise(resolve => setTimeout(resolve, OVERLAY_SETTLE_DURATION_MS))

            const content = document.querySelector<HTMLElement>(`[data-testid="${floatingCase.testId}"]`)
            expect(content).not.toBeNull()
            const modalLayer = Number(modal?.style.getPropertyValue('--z-index-dialog'))
            const floatingLayer = Number(content?.style.getPropertyValue(floatingCase.token))
            expect(modalLayer).toBeGreaterThan(0)
            expect(Number(overlay?.style.getPropertyValue('--z-index-dialog'))).toBe(modalLayer)
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

        const outerLayer = Number(document.querySelector<HTMLElement>('#outer-content')?.parentElement?.style.getPropertyValue('--z-index-dialog'))
        const innerLayer = Number(document.querySelector<HTMLElement>('#inner-content')?.parentElement?.style.getPropertyValue('--z-index-dialog'))
        expect(innerLayer).toBeGreaterThan(outerLayer)
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
    expect(Number(floating?.style.getPropertyValue('--z-index-popover')))
        .toBeGreaterThan(Number(modal?.style.getPropertyValue('--z-index-dialog')))
}
