import { mount } from '@vue/test-utils'
import DotsSpinner from './DotsSpinner.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

describe('DotsSpinner', () => {
    it('disables bouncing when reduced motion is preferred', () => {
        const wrapper = mount(DotsSpinner, {
            global: { provide: { [LOCALE_INJECTION_KEY]: en } },
        })

        const dots = wrapper.findAll('div.animate-bounce')
        expect(dots).toHaveLength(3)
        expect(dots.every(dot => dot.classes().includes('motion-reduce:animate-none'))).toBe(true)
    })
})
