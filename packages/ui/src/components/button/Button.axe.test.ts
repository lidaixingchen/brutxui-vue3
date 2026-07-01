import { axe } from '../../vitest.setup'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button a11y', () => {
    it('should have no axe violations', async () => {
        const wrapper = mount(Button, {
            slots: {
                default: 'Click me',
            },
        })
        // @ts-expect-error vitest-axe 类型声明不完整
        expect(await axe(wrapper.element)).toHaveNoViolations()
        wrapper.unmount()
    })
})
