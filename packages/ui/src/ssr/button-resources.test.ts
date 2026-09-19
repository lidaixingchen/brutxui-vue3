import { createSSRApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import Button from '../components/button/Button.vue'
import { renderToStringChecked } from '../test/ssr-render'

describe('Button SSR resources', () => {
    it('does not create browser resources or data-text during SSR', async () => {
        const Root = defineComponent({
            setup() {
                return () => h(Button, {
                    effect: 'glitch',
                    glitchTrigger: 'autoplay',
                    glitchInterval: 50,
                }, { default: () => 'Server button' })
            },
        })

        const html = await renderToStringChecked(createSSRApp(Root))

        expect(html).toContain('Server button')
        expect(html).toContain('glitch-button')
        expect(html).not.toContain('data-text')
    })

    it('keeps the default effect SSR output free of effect attributes', async () => {
        const html = await renderToStringChecked(createSSRApp({
            render: () => h(Button, { glitchTrigger: 'autoplay' }, { default: () => 'Plain server button' }),
        }))

        expect(html).toContain('Plain server button')
        expect(html).not.toContain('data-text')
        expect(html).not.toContain('glitch-button')
    })
})
