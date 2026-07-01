import Button from './Button.vue'
import { expectNoA11yViolations } from '@/test-utils/a11y'

describe('Button Accessibility', () => {
    it('should have no accessibility violations with default props', async () => {
        await expectNoA11yViolations(Button, {
            slots: { default: 'Click me' },
        })
    }, 30000)

    it('should have no accessibility violations when disabled', async () => {
        await expectNoA11yViolations(Button, {
            props: { disabled: true },
            slots: { default: 'Disabled' },
        })
    }, 30000)

    it('should have no accessibility violations when loading', async () => {
        await expectNoA11yViolations(Button, {
            props: { loading: true },
            slots: { default: 'Loading' },
        })
    }, 30000)

    it('should have no accessibility violations with different variants', async () => {
        const variants = ['default', 'primary', 'secondary', 'danger', 'success'] as const

        for (const variant of variants) {
            await expectNoA11yViolations(Button, {
                props: { variant },
                slots: { default: `${variant} button` },
            })
        }
    }, 30000)
})
