import Button from './Button.vue'
import { expectNoA11yViolations } from '@/test-utils/a11y'

describe('Button Accessibility', () => {
    it('should have no accessibility violations with default props', async () => {
        await expectNoA11yViolations(Button, {
            slots: { default: 'Click me' },
        })
    })

    it('should have no accessibility violations when disabled', async () => {
        await expectNoA11yViolations(Button, {
            props: { disabled: true },
            slots: { default: 'Disabled' },
        })
    })

    it('should have no accessibility violations when loading', async () => {
        await expectNoA11yViolations(Button, {
            props: { loading: true },
            slots: { default: 'Loading' },
        })
    })
}, 30000)
