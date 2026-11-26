import { afterEach, describe, expect, it } from 'vitest'
import { h, ref } from 'vue'
import { TooltipProvider as RekaTooltipProvider, TooltipRoot, TooltipTrigger, type TooltipProviderProps } from 'reka-ui'
import { mount } from '@/test/browser-mount'
import TooltipContent from './TooltipContent.vue'
import TooltipProvider from './TooltipProvider.vue'

type Position = Pick<NonNullable<TooltipProviderProps['content']>, 'sideOffset' | 'collisionPadding'>

const INITIAL_POSITION = { sideOffset: 52, collisionPadding: 45 }
const UPDATED_POSITION = { sideOffset: 29, collisionPadding: 35 }
const CONTENT_POSITION = { sideOffset: 22, collisionPadding: 16 }
const LIBRARY_OFFSET = 6
const NO_PADDING = 0

let unmount: (() => void) | undefined

afterEach(() => {
    unmount?.()
    unmount = undefined
})

function mountTooltip(provider: typeof TooltipProvider | typeof RekaTooltipProvider) {
    const providerPosition = ref<Position>()
    const contentPosition = ref<Position>({})
    const { unmount: unmountTooltip } = mount({
        setup: () => () => h(TooltipProvider, { content: INITIAL_POSITION }, () =>
            h(provider, providerPosition.value ? { content: providerPosition.value } : {}, () =>
                h(TooltipRoot, { open: true }, () => [
                    h(TooltipTrigger, {
                        'data-testid': 'position-trigger',
                        style: { position: 'fixed', top: '50%', left: '50%' },
                    }, () => 'Trigger'),
                    h(TooltipContent, {
                        ...contentPosition.value,
                        side: 'top',
                        'data-testid': 'position-tooltip',
                    }, () => 'Tooltip'),
                ]),
            ),
        ),
    })
    unmount = unmountTooltip
    return { providerPosition, contentPosition }
}

async function expectPosition(gap: number, totalHorizontalPadding: number) {
    await expect.poll(() => {
        const trigger = document.querySelector('[data-testid="position-trigger"]')
        const content = document.querySelector('[data-testid="position-tooltip"]')
        const popper = content?.parentElement
        if (!trigger || !popper) return null

        return {
            gap: trigger.getBoundingClientRect().top - popper.getBoundingClientRect().bottom,
            availableWidth: Number.parseFloat(getComputedStyle(popper).getPropertyValue('--reka-popper-available-width')),
        }
    }).toEqual({ gap, availableWidth: document.documentElement.clientWidth - totalHorizontalPadding })
}

describe('Tooltip positioning defaults', () => {
    it.each([
        ['BrutxUI', TooltipProvider],
        ['Reka UI', RekaTooltipProvider],
    ] as const)('uses the nearest %s provider reactively and accepts content overrides', async (_, provider) => {
        const { providerPosition, contentPosition } = mountTooltip(provider)
        await expectPosition(LIBRARY_OFFSET, LIBRARY_OFFSET * 2)

        providerPosition.value = INITIAL_POSITION
        await expectPosition(INITIAL_POSITION.sideOffset, INITIAL_POSITION.collisionPadding * 2)

        providerPosition.value = UPDATED_POSITION
        await expectPosition(UPDATED_POSITION.sideOffset, UPDATED_POSITION.collisionPadding * 2)

        contentPosition.value = CONTENT_POSITION
        await expectPosition(CONTENT_POSITION.sideOffset, CONTENT_POSITION.collisionPadding * 2)

        providerPosition.value = { sideOffset: 0, collisionPadding: 0 }
        await expectPosition(CONTENT_POSITION.sideOffset, CONTENT_POSITION.collisionPadding * 2)

        contentPosition.value = {}
        await expectPosition(0, NO_PADDING)

        providerPosition.value = {}
        await expectPosition(LIBRARY_OFFSET, LIBRARY_OFFSET * 2)
    })

    it('uses directional padding and merges explicit edges with provider edges', async () => {
        const { providerPosition, contentPosition } = mountTooltip(TooltipProvider)
        const left = 40
        const right = 20
        providerPosition.value = { collisionPadding: { left, right } }
        await expectPosition(LIBRARY_OFFSET, left + right)

        contentPosition.value = { sideOffset: 0, collisionPadding: { left: 0 } }
        await expectPosition(0, right)

        contentPosition.value = { sideOffset: 0, collisionPadding: 0 }
        await expectPosition(0, NO_PADDING)
    })
})
