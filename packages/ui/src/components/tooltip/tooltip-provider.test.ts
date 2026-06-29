import { mount } from '@vue/test-utils'
import type { SetupContext } from 'vue'
import TooltipProvider from './TooltipProvider.vue'

let capturedProps: Record<string, unknown> = {}

const primitiveStub = {
    name: 'TooltipProviderPrimitive',
    setup(_: unknown, { attrs, slots }: SetupContext) {
        capturedProps = { ...attrs }
        return () => slots.default?.()
    },
}

function mountProvider(props: Record<string, unknown> = {}) {
    capturedProps = {}
    return mount(TooltipProvider, {
        props,
        global: {
            stubs: {
                TooltipProvider: primitiveStub,
            },
        },
    })
}

describe('TooltipProvider', () => {
    it('forwards default delayDuration of 400ms', () => {
        mountProvider()
        expect(capturedProps.delayDuration).toBe(400)
    })

    it('allows overriding delayDuration via prop', () => {
        mountProvider({ delayDuration: 0 })
        expect(capturedProps.delayDuration).toBe(0)
    })

    it('forwards other provider props when provided', () => {
        mountProvider({
            delayDuration: 800,
            skipDelayDuration: 500,
            disableHoverableContent: true,
        })
        expect(capturedProps.delayDuration).toBe(800)
        expect(capturedProps.skipDelayDuration).toBe(500)
        expect(capturedProps.disableHoverableContent).toBe(true)
    })

    it('omits undefined props so reka-ui defaults apply', () => {
        mountProvider()
        expect(capturedProps.skipDelayDuration).toBeUndefined()
        expect(capturedProps.disableHoverableContent).toBeUndefined()
        expect(capturedProps.disableClosingTrigger).toBeUndefined()
    })

    it('renders slot content', () => {
        const wrapper = mount(TooltipProvider, {
            global: {
                stubs: {
                    TooltipProvider: primitiveStub,
                },
            },
            slots: { default: '<div data-testid="child">child</div>' },
        })
        expect(wrapper.find('[data-testid="child"]').text()).toBe('child')
    })
})
