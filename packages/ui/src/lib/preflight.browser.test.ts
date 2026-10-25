/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import Card from '../components/card/Card.vue'
import CardTitle from '../components/card/CardTitle.vue'
import Button from '../components/button/Button.vue'
import stylesCss from '../../dist/styles.css?inline'
import preflightCss from '../../dist/preflight.css?inline'

const stylesheets = {
    styles: stylesCss,
    preflight: preflightCss,
} as const

type StylesheetName = keyof typeof stylesheets

function readStyle(element: Element) {
    const style = getComputedStyle(element)
    return {
        borderWidths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
        borderStyles: [style.borderTopStyle, style.borderRightStyle, style.borderBottomStyle, style.borderLeftStyle],
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
    }
}

function measureAppearance(order: readonly StylesheetName[]) {
    const styleElements = order.map((name) => {
        const element = document.createElement('style')
        element.textContent = stylesheets[name]
        document.head.append(element)
        return element
    })

    let wrapper: ReturnType<typeof mount> | null = null
    try {
        wrapper = mount(defineComponent({
            setup: () => () => h('main', [
                h(Card, { class: 'preflight-regression-card' }, {
                    default: () => h(CardTitle, { class: 'preflight-regression-title' }, {
                        default: () => 'Card title',
                    }),
                }),
                h(Button, { class: 'preflight-regression-button' }, {
                    default: () => 'Button',
                }),
            ]),
        }))

        const card = wrapper.element.querySelector('.preflight-regression-card')!
        const title = wrapper.element.querySelector('.preflight-regression-title')!
        const button = wrapper.element.querySelector('.preflight-regression-button')!
        const body = getComputedStyle(document.body)

        return {
            card: readStyle(card),
            title: readStyle(title),
            button: readStyle(button),
            body: {
                fontSize: body.fontSize,
                fontWeight: body.fontWeight,
            },
        }
    } finally {
        wrapper?.unmount()
        styleElements.forEach(element => element.remove())
    }
}

describe('public preflight stylesheet', () => {
    it.each([
        ['preflight before styles', ['preflight', 'styles']],
        ['styles before preflight', ['styles', 'preflight']],
    ] as const)('preserves component appearance when loaded %s', (_name, order) => {
        const stylesOnly = measureAppearance(['styles'])
        const withPreflight = measureAppearance(order)

        expect(parseFloat(stylesOnly.card.borderWidths[0])).toBeGreaterThan(0)
        expect(parseFloat(stylesOnly.card.padding[0])).toBeGreaterThan(0)
        expect(parseFloat(stylesOnly.title.fontSize)).toBeGreaterThan(parseFloat(stylesOnly.body.fontSize))
        expect(Number(stylesOnly.title.fontWeight)).toBeGreaterThan(Number(stylesOnly.body.fontWeight))
        expect(parseFloat(stylesOnly.button.borderWidths[0])).toBeGreaterThan(0)
        expect(parseFloat(stylesOnly.button.padding[0])).toBeGreaterThan(0)
        expect(Number(stylesOnly.button.fontWeight)).toBeGreaterThan(Number(stylesOnly.body.fontWeight))
        expect(withPreflight).toEqual(stylesOnly)
    })
})
