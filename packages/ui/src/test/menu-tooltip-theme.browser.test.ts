import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import '../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import MenuTooltipThemeTestFixture from '@/test/fixtures/MenuTooltipThemeTestFixture.vue'

const scopes = ['default', 'pastel-dark', 'mono'] as const
const MUTATED_SCOPE_STYLE = {
    '--brutal-bg': 'rgb(22, 22, 30)',
    '--brutal-fg': 'rgb(240, 240, 245)',
    '--brutal-border-color': 'rgb(102, 102, 124)',
    '--brutal-border-width': '2px',
    '--brutal-radius': '8px',
}
const PANEL_BACKGROUND_OVERRIDE = 'rgb(12, 34, 56)'

let mounted: ReturnType<typeof mount> | undefined
let originalDocumentClass = ''
let originalDocumentStyle: string | null = null

function visiblePanels(testId: string): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)).filter((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.visibility !== 'hidden'
            && style.display !== 'none'
            && Number(style.opacity) > 0
            && rect.width > 0
            && rect.height > 0
    })
}

function readSurface(element: HTMLElement) {
    const style = getComputedStyle(element)
    return {
        background: style.backgroundColor,
        foreground: style.color,
        borderColor: style.borderTopColor,
        borderWidth: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
    }
}

function readThemeSurface(scope: HTMLElement, inverse = false) {
    const reference = document.createElement('div')
    Object.assign(reference.style, {
        position: 'absolute',
        visibility: 'hidden',
        backgroundColor: inverse ? 'var(--brutal-fg)' : 'var(--brutal-bg)',
        color: inverse ? 'var(--brutal-bg)' : 'var(--brutal-fg)',
        borderColor: 'var(--brutal-border-color)',
        borderStyle: 'solid',
        borderWidth: 'var(--brutal-border-width)',
        borderRadius: 'var(--brutal-radius)',
    })
    scope.append(reference)
    const surface = readSurface(reference)
    reference.remove()
    return surface
}

function readThemeTokenColor(scope: HTMLElement, token: string) {
    const reference = document.createElement('span')
    reference.style.color = `var(${token})`
    scope.append(reference)
    const color = getComputedStyle(reference).color
    reference.remove()
    return color
}

async function waitForPanel(testId: string): Promise<HTMLElement> {
    await expect.poll(() => visiblePanels(testId).length).toBe(1)
    return visiblePanels(testId)[0]!
}

function mountFixture() {
    originalDocumentClass = document.documentElement.className
    originalDocumentStyle = document.documentElement.getAttribute('style')
    mounted = mount(MenuTooltipThemeTestFixture)
    return mounted
}

afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    document.documentElement.className = originalDocumentClass
    if (originalDocumentStyle === null) document.documentElement.removeAttribute('style')
    else document.documentElement.setAttribute('style', originalDocumentStyle)
    originalDocumentStyle = null
})

describe('Tooltip 与 DropdownMenu 浮层的局部主题继承', () => {
    it('默认、局部 pastel dark 与 mono 主题在并存 Portal 中保持各自外观', async () => {
        mountFixture()

        for (const scopeId of scopes) {
            const scope = document.querySelector<HTMLElement>(`[data-testid="${scopeId}-scope"]`)!
            document.querySelector<HTMLElement>(`[data-testid="${scopeId}-tooltip-trigger"]`)!.focus()
            const tooltip = await waitForPanel(`${scopeId}-tooltip-content`)
            const expectedTooltip = readThemeSurface(scope, true)
            if (scopeId === 'mono') {
                expectedTooltip.background = PANEL_BACKGROUND_OVERRIDE
                expectedTooltip.foreground = readThemeTokenColor(scope, '--brutal-primary-foreground')
            }
            await expect.poll(() => readSurface(tooltip)).toEqual(expectedTooltip)

            const dropdownTrigger = document.querySelector<HTMLElement>(`[data-testid="${scopeId}-dropdown-trigger"]`)!
            await userEvent.click(dropdownTrigger)
            const dropdown = await waitForPanel(`${scopeId}-dropdown-content`)
            const expectedDropdown = readThemeSurface(scope)
            if (scopeId === 'mono') {
                expectedDropdown.background = PANEL_BACKGROUND_OVERRIDE
                expectedDropdown.foreground = readThemeTokenColor(scope, '--brutal-primary-foreground')
            }
            expect(readSurface(dropdown)).toEqual(expectedDropdown)

            const subTrigger = document.querySelector<HTMLElement>(`[data-testid="${scopeId}-submenu-trigger"]`)!
            subTrigger.focus()
            await userEvent.keyboard('{ArrowRight}')
            const submenu = await waitForPanel(`${scopeId}-submenu-content`)
            expect(readSurface(submenu)).toEqual(readThemeSurface(subTrigger))

            await userEvent.keyboard('{Escape}')
            await expect.poll(() => visiblePanels(`${scopeId}-dropdown-content`).length).toBe(0)
            await expect.poll(() => document.activeElement).toBe(dropdownTrigger)
        }

        document.documentElement.classList.add('dark')
        const defaultScope = document.querySelector<HTMLElement>('[data-testid="default-scope"]')!
        document.querySelector<HTMLElement>('[data-testid="default-tooltip-trigger"]')!.focus()
        const defaultTooltip = await waitForPanel('default-tooltip-content')
        await expect.poll(() => readSurface(defaultTooltip)).toEqual(readThemeSurface(defaultScope, true))
        await userEvent.click(document.querySelector<HTMLElement>('[data-testid="default-dropdown-trigger"]')!)
        const defaultDropdown = await waitForPanel('default-dropdown-content')
        await expect.poll(() => readSurface(defaultDropdown)).toEqual(readThemeSurface(defaultScope))
    })

    it('祖先 class 与 style 更新会同步到 Tooltip、主菜单和嵌套子菜单', async () => {
        mountFixture()
        const scope = document.querySelector<HTMLElement>('[data-testid="pastel-dark-scope"]')!
        const tooltip = await waitForPanel('pastel-dark-tooltip-content')
        const dropdownTrigger = document.querySelector<HTMLElement>('[data-testid="pastel-dark-dropdown-trigger"]')!
        await userEvent.click(dropdownTrigger)
        const dropdown = await waitForPanel('pastel-dark-dropdown-content')
        const subTrigger = document.querySelector<HTMLElement>('[data-testid="pastel-dark-submenu-trigger"]')!
        subTrigger.focus()
        await userEvent.keyboard('{ArrowRight}')
        const submenu = await waitForPanel('pastel-dark-submenu-content')

        scope.className = 'theme-mono'
        for (const [property, value] of Object.entries(MUTATED_SCOPE_STYLE)) {
            scope.style.setProperty(property, value)
        }

        await expect.poll(() => readSurface(tooltip)).toEqual(readThemeSurface(scope, true))
        await expect.poll(() => readSurface(dropdown)).toEqual(readThemeSurface(scope))
        await expect.poll(() => readSurface(submenu)).toEqual(readThemeSurface(subTrigger))
        expect(readSurface(dropdown)).toMatchObject({
            background: MUTATED_SCOPE_STYLE['--brutal-bg'],
            foreground: MUTATED_SCOPE_STYLE['--brutal-fg'],
            borderColor: MUTATED_SCOPE_STYLE['--brutal-border-color'],
            borderWidth: MUTATED_SCOPE_STYLE['--brutal-border-width'],
            radius: MUTATED_SCOPE_STYLE['--brutal-radius'],
        })
    })

    it('首次打开与重开继承局部主题，子菜单 Escape 后焦点返回根触发器', async () => {
        mountFixture()

        const tooltipTrigger = document.querySelector<HTMLElement>('[data-testid="interactive-tooltip-trigger"]')!
        tooltipTrigger.focus()
        const tooltip = await waitForPanel('interactive-tooltip-content')
        const scope = document.querySelector<HTMLElement>('[data-testid="interactive-scope"]')!
        expect(readSurface(tooltip)).toEqual(readThemeSurface(scope, true))

        tooltipTrigger.blur()
        await expect.poll(() => visiblePanels('interactive-tooltip-content')).toHaveLength(0)
        tooltipTrigger.focus()
        const reopenedTooltip = await waitForPanel('interactive-tooltip-content')
        await expect.poll(() => readSurface(reopenedTooltip)).toEqual(readThemeSurface(scope, true))

        const dropdownTrigger = document.querySelector<HTMLElement>('[data-testid="interactive-dropdown-trigger"]')!
        await userEvent.click(dropdownTrigger)
        const dropdown = await waitForPanel('interactive-dropdown-content')
        expect(readSurface(dropdown)).toEqual(readThemeSurface(scope))

        const submenuTrigger = document.querySelector<HTMLElement>('[data-testid="interactive-submenu-trigger"]')!
        submenuTrigger.focus()
        await userEvent.keyboard('{ArrowRight}')
        const submenu = await waitForPanel('interactive-submenu-content')
        await expect.poll(() => readSurface(submenu)).toEqual(readThemeSurface(submenuTrigger))

        await userEvent.keyboard('{ArrowLeft}')
        await expect.poll(() => visiblePanels('interactive-submenu-content')).toHaveLength(0)
        await expect.poll(() => document.activeElement).toBe(submenuTrigger)
        await userEvent.keyboard('{ArrowRight}')
        const restoredSubmenu = await waitForPanel('interactive-submenu-content')
        await expect.poll(() => readSurface(restoredSubmenu)).toEqual(readThemeSurface(submenuTrigger))

        await userEvent.keyboard('{Escape}')
        await expect.poll(() => visiblePanels('interactive-dropdown-content')).toHaveLength(0)
        await expect.poll(() => document.activeElement).toBe(dropdownTrigger)

        await userEvent.click(dropdownTrigger)
        const reopenedDropdown = await waitForPanel('interactive-dropdown-content')
        expect(readSurface(reopenedDropdown)).toEqual(readThemeSurface(scope))
        const reopenedSubmenuTrigger = document.querySelector<HTMLElement>('[data-testid="interactive-submenu-trigger"]')!
        reopenedSubmenuTrigger.focus()
        await userEvent.keyboard('{ArrowRight}')
        const reopenedSubmenu = await waitForPanel('interactive-submenu-content')
        await expect.poll(() => readSurface(reopenedSubmenu)).toEqual(readThemeSurface(reopenedSubmenuTrigger))
    })
})
