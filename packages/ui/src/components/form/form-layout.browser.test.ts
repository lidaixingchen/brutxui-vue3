import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { defineComponent, h, nextTick, provide, ref, type PropType } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import Form from './Form.vue'
import FormControl from './FormControl.vue'
import FormItem from './FormItem.vue'
import FormLabel from './FormLabel.vue'
import FormMessage from './FormMessage.vue'
import { formFieldKey } from './form-context'
import Input from '../input/Input.vue'

const FORM_WIDTH = 304
const MOBILE_VIEWPORT_WIDTH = 390
const DESKTOP_VIEWPORT_WIDTH = 1440
const VIEWPORT_HEIGHT = 844
const MINIMUM_CONTROL_WIDTH = 128
const LONG_LABEL = '企业账户安全联系人电子邮件地址（用于订单更新与安全通知）'
const SHORT_LABEL = '邮箱'
const LONG_ERROR = '请输入有效邮箱地址，并确认该地址与企业账户的注册信息一致；此邮箱还会用于接收订单、安全和发票通知。'
const HORIZONTAL_LAYOUT_CASES = [
    { labelPosition: 'left' as const, viewportWidth: MOBILE_VIEWPORT_WIDTH },
    { labelPosition: 'right' as const, viewportWidth: MOBILE_VIEWPORT_WIDTH },
    { labelPosition: 'left' as const, viewportWidth: DESKTOP_VIEWPORT_WIDTH },
    { labelPosition: 'right' as const, viewportWidth: DESKTOP_VIEWPORT_WIDTH },
]

let host: HTMLDivElement | null = null
let wrapper: ReturnType<typeof mount> | null = null
let originalViewport: { width: number; height: number } | null = null

const LayoutFieldContext = defineComponent({
    props: {
        error: { type: String, required: true },
    },
    setup(props, { slots }) {
        provide(formFieldKey, {
            name: ref('contact-email'),
            error: ref(props.error),
            value: ref(''),
            setValue: () => {},
            setError: () => {},
        })

        return () => slots.default?.()
    },
})

const FormLayoutFixture = defineComponent({
    props: {
        labelPosition: { type: String as PropType<'left' | 'right' | 'top'>, required: true },
        label: { type: String, required: true },
        error: { type: String, required: true },
    },
    setup(props) {
        return () => h(Form, { labelPosition: props.labelPosition }, {
            default: () => h(LayoutFieldContext, { error: props.error }, {
                default: () => h(FormItem, {}, {
                    default: () => [
                        h(FormLabel, {}, { default: () => props.label }),
                        h(FormControl, {}, {
                            default: () => h(Input, { 'aria-label': '企业账户安全联系人邮箱' }),
                        }),
                        h(FormMessage),
                    ],
                }),
            }),
        })
    },
})

async function mountFormFixture(options: {
    labelPosition: 'left' | 'right' | 'top'
    label: string
    error?: string
}, viewportWidth = DESKTOP_VIEWPORT_WIDTH) {
    originalViewport = { width: window.innerWidth, height: window.innerHeight }
    await page.viewport(viewportWidth, VIEWPORT_HEIGHT)
    host = document.createElement('div')
    Object.assign(host.style, {
        width: `${FORM_WIDTH}px`,
    })
    document.body.appendChild(host)
    wrapper = mount(FormLayoutFixture, {
        props: {
            ...options,
            error: options.error ?? '',
        },
        attachTo: host,
    })
    await nextTick()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    return host
}

function lineHeight(element: Element) {
    return Number.parseFloat(getComputedStyle(element).lineHeight)
}

afterEach(async () => {
    wrapper?.unmount()
    wrapper = null
    host?.remove()
    host = null
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

describe('Form horizontal label layout', () => {
    it.each(HORIZONTAL_LAYOUT_CASES)(
        'wraps long $labelPosition labels in a narrow form at a $viewportWidthpx viewport',
        async ({ labelPosition, viewportWidth }) => {
            const container = await mountFormFixture({ labelPosition, label: LONG_LABEL }, viewportWidth)
            const item = container.querySelector('form > div')!
            const label = container.querySelector('label')!
            const input = container.querySelector('input')!
            const labelRect = label.getBoundingClientRect()
            const inputRect = input.getBoundingClientRect()
            const itemRect = item.getBoundingClientRect()

            expect(labelRect.height).toBeGreaterThan(lineHeight(label))
            expect(inputRect.width).toBeGreaterThanOrEqual(MINIMUM_CONTROL_WIDTH)
            expect(inputRect.left).toBeGreaterThanOrEqual(labelRect.right)
            expect(inputRect.right).toBeLessThanOrEqual(itemRect.right)
            expect(item.scrollWidth).toBe(item.clientWidth)
        },
    )

    it('keeps a short horizontal label compact and gives the remaining row to the input', async () => {
        const container = await mountFormFixture(
            { labelPosition: 'right', label: SHORT_LABEL },
            DESKTOP_VIEWPORT_WIDTH,
        )
        const label = container.querySelector('label')!
        const input = container.querySelector('input')!

        expect(label.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight(label))
        expect(input.getBoundingClientRect().width).toBeGreaterThan(FORM_WIDTH / 2)
    })

    it('keeps long error text inside the horizontal control column', async () => {
        const container = await mountFormFixture({
            labelPosition: 'right',
            label: LONG_LABEL,
            error: LONG_ERROR,
        }, DESKTOP_VIEWPORT_WIDTH)
        const item = container.querySelector('form > div')!
        const label = container.querySelector('label')!
        const message = container.querySelector('[role="alert"]')!
        const itemRect = item.getBoundingClientRect()
        const labelRect = label.getBoundingClientRect()
        const messageRect = message.getBoundingClientRect()

        expect(messageRect.left).toBeGreaterThanOrEqual(labelRect.right)
        expect(messageRect.right).toBeLessThanOrEqual(itemRect.right)
        expect(message.scrollWidth).toBe(message.clientWidth)
        expect(item.scrollWidth).toBe(item.clientWidth)
    })

    it('stacks a long top label above the input', async () => {
        const container = await mountFormFixture(
            { labelPosition: 'top', label: LONG_LABEL },
            DESKTOP_VIEWPORT_WIDTH,
        )
        const label = container.querySelector('label')!
        const input = container.querySelector('input')!

        expect(label.getBoundingClientRect().height).toBeGreaterThan(lineHeight(label))
        expect(input.getBoundingClientRect().top).toBeGreaterThanOrEqual(label.getBoundingClientRect().bottom)
    })
})
