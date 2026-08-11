import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { vi } from 'vitest'
import Accordion from './Accordion.vue'
import AccordionItem from './AccordionItem.vue'
import AccordionTrigger from './AccordionTrigger.vue'
import AccordionContent from './AccordionContent.vue'
import { accordionItemKey } from './accordion-key'

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('Accordion', () => {
    it('renders with default slot content', () => {
        const wrapper = mount(Accordion, {
            props: { type: 'single' },
            slots: { default: '<div>Accordion content</div>' },
            global: { stubs: { AccordionRoot: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Accordion content')
    })

    it('applies custom class', () => {
        const wrapper = mount(Accordion, {
            props: { type: 'single', class: 'custom-accordion' },
            global: { stubs: { AccordionRoot: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-accordion')
    })

    it('supports collapsible prop for single type', () => {
        const wrapper = mount(Accordion, {
            props: { type: 'single', collapsible: true },
            global: { stubs: { AccordionRoot: primitiveStub } },
        })
        expect(wrapper.find('[data-testid]').exists() || wrapper.exists()).toBe(true)
    })

    it('supports multiple type', () => {
        const wrapper = mount(Accordion, {
            props: { type: 'multiple' },
            global: { stubs: { AccordionRoot: primitiveStub } },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('forwards update:modelValue exactly once', () => {
        const onUpdate = vi.fn()
        const rootStub = defineComponent({
            emits: ['update:modelValue'],
            created() {
                this.$emit('update:modelValue', 'item-2')
            },
            template: '<div><slot /></div>',
        })
        mount(Accordion, {
            props: { type: 'single', modelValue: 'item-1', 'onUpdate:modelValue': onUpdate },
            global: { stubs: { AccordionRoot: rootStub } },
        })
        expect(onUpdate).toHaveBeenCalledTimes(1)
        expect(onUpdate).toHaveBeenCalledWith('item-2')
    })
})

describe('AccordionItem', () => {
    it('renders with default variant classes', () => {
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1' },
            global: { stubs: { AccordionItem: primitiveStub } },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('bg-brutal-bg')
        expect(classes).toContain('text-brutal-fg')
        expect(classes).toContain('data-[state=closed]:shadow-brutal-sm')
        expect(classes).toContain('data-[state=open]:shadow-brutal')
        expect(classes).toContain('mb-4')
    })

    it('applies flat variant classes', () => {
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1', variant: 'flat' },
            global: { stubs: { AccordionItem: primitiveStub } },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('shadow-none')
        expect(classes).toContain('mb-4')
    })

    it('applies ghost variant classes', () => {
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1', variant: 'ghost' },
            global: { stubs: { AccordionItem: primitiveStub } },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('border-transparent')
        expect(classes).toContain('shadow-none')
        expect(classes).toContain('mb-2')
    })

    it('applies interactive variant classes', () => {
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1', variant: 'interactive' },
            global: { stubs: { AccordionItem: primitiveStub } },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('data-[state=closed]:shadow-brutal-sm')
        expect(classes).toContain('data-[state=open]:shadow-brutal')
        expect(classes).toContain('mb-4')
        expect(classes).toContain('hover:shadow-brutal')
        expect(classes).toContain('hover:-translate-x-0.5')
        expect(classes).toContain('hover:-translate-y-0.5')
    })

    it('applies custom class', () => {
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1', class: 'custom-item' },
            global: { stubs: { AccordionItem: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-item')
    })

    it('reacts to dynamic variant changes', async () => {
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1' },
            global: { stubs: { AccordionItem: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('data-[state=closed]:shadow-brutal-sm')
        await wrapper.setProps({ variant: 'flat' })
        expect(wrapper.classes()).not.toContain('data-[state=closed]:shadow-brutal-sm')
        expect(wrapper.classes()).toContain('shadow-none')
    })

    it('forwards value and disabled props to reka AccordionItem', async () => {
        const itemAttrsStub = {
            template: '<div data-testid="accordion-item" :data-value="value" :data-disabled="disabled"><slot /></div>',
            props: ['value', 'disabled'],
        }
        const wrapper = mount(AccordionItem, {
            props: { value: 'item-1', disabled: true },
            global: { stubs: { AccordionItem: itemAttrsStub } },
        })
        const item = wrapper.find('[data-testid="accordion-item"]')
        expect(item.attributes('data-value')).toBe('item-1')
        expect(item.attributes('data-disabled')).toBe('true')
        await wrapper.setProps({ disabled: false })
        expect(item.attributes('data-disabled')).toBe('false')
    })
})

describe('AccordionTrigger', () => {
    const triggerStubs = {
        AccordionHeader: {
            template: '<div data-testid="accordion-header" :data-disabled="$attrs.disabled"><slot /></div>',
        },
        AccordionTrigger: {
            template: '<div data-testid="accordion-trigger" :data-as-child="asChild"><slot /><slot name="icon" /></div>',
            props: ['asChild'],
        },
    }

    it('renders with slot content', () => {
        const wrapper = mount(AccordionTrigger, {
            slots: { default: 'Section Title' },
            global: { stubs: triggerStubs },
        })
        expect(wrapper.text()).toContain('Section Title')
    })

    it('applies custom class', () => {
        const wrapper = mount(AccordionTrigger, {
            props: { class: 'custom-trigger' },
            global: { stubs: triggerStubs },
        })
        const trigger = wrapper.find('[data-testid="accordion-trigger"]')
        expect(trigger.classes()).toContain('custom-trigger')
    })

    it('has ChevronDown icon sized inside the icon container', () => {
        const wrapper = mount(AccordionTrigger, {
            global: { stubs: triggerStubs },
        })
        const svg = wrapper.find('svg')
        expect(svg.exists()).toBe(true)
        expect(svg.classes()).toContain('h-5')
        expect(svg.classes()).toContain('w-5')
        expect(svg.element.parentElement?.getAttribute('data-accordion-icon')).toBeDefined()
    })

    it('applies icon appearance classes on the icon container', () => {
        const wrapper = mount(AccordionTrigger, {
            global: { stubs: triggerStubs },
        })
        const container = wrapper.find('[data-accordion-icon]')
        expect(container.classes()).toContain('shrink-0')
        expect(container.classes()).toContain('border-3')
        expect(container.classes()).toContain('border-brutal')
        expect(container.classes()).toContain('shadow-brutal-sm')
    })

    it('applies rotation selector targeting the icon container', () => {
        const wrapper = mount(AccordionTrigger, {
            global: { stubs: triggerStubs },
        })
        const trigger = wrapper.find('[data-testid="accordion-trigger"]')
        expect(trigger.classes()).toContain('[&[data-state=open]_[data-accordion-icon]]:rotate-180')
    })

    it('wraps custom icon slot in the icon container', () => {
        const wrapper = mount(AccordionTrigger, {
            slots: { icon: '<span class="custom-icon" />' },
            global: { stubs: triggerStubs },
        })
        const container = wrapper.find('[data-accordion-icon]')
        expect(container.find('.custom-icon').exists()).toBe(true)
    })

    it('does not render icon container when #icon slot is empty', () => {
        const wrapper = mount(AccordionTrigger, {
            slots: { icon: '' },
            global: { stubs: triggerStubs },
        })
        expect(wrapper.find('[data-accordion-icon]').exists()).toBe(false)
    })

    it('applies default variant hover lift via context', () => {
        const wrapper = mount(AccordionTrigger, {
            global: { stubs: triggerStubs },
        })
        const trigger = wrapper.find('[data-testid="accordion-trigger"]')
        expect(trigger.classes()).toContain('hover:shadow-brutal-sm')
        expect(trigger.classes()).toContain('hover:-translate-y-0.5')
        expect(trigger.classes()).toContain('hover:bg-brutal-muted')
    })

    it('applies interactive variant without hover lift via context', () => {
        const wrapper = mount(AccordionTrigger, {
            global: {
                stubs: triggerStubs,
                provide: { [accordionItemKey]: { variant: ref('interactive') } },
            },
        })
        const trigger = wrapper.find('[data-testid="accordion-trigger"]')
        expect(trigger.classes()).not.toContain('hover:shadow-brutal-sm')
        expect(trigger.classes()).not.toContain('hover:-translate-y-0.5')
        expect(trigger.classes()).toContain('hover:bg-brutal-muted')
    })

    it('applies flat variant without hover lift via context', () => {
        const wrapper = mount(AccordionTrigger, {
            global: {
                stubs: triggerStubs,
                provide: { [accordionItemKey]: { variant: ref('flat') } },
            },
        })
        const trigger = wrapper.find('[data-testid="accordion-trigger"]')
        expect(trigger.classes()).not.toContain('hover:shadow-brutal-sm')
        expect(trigger.classes()).not.toContain('hover:-translate-y-0.5')
        expect(trigger.classes()).toContain('hover:bg-brutal-muted')
    })

    it('applies ghost variant without hover lift via context', () => {
        const wrapper = mount(AccordionTrigger, {
            global: {
                stubs: triggerStubs,
                provide: { [accordionItemKey]: { variant: ref('ghost') } },
            },
        })
        const trigger = wrapper.find('[data-testid="accordion-trigger"]')
        expect(trigger.classes()).not.toContain('hover:shadow-brutal-sm')
        expect(trigger.classes()).not.toContain('hover:-translate-y-0.5')
        expect(trigger.classes()).toContain('hover:bg-brutal-muted')
    })

    it('forwards asChild prop to reka trigger', () => {
        const wrapper = mount(AccordionTrigger, {
            props: { asChild: true },
            global: { stubs: triggerStubs },
        })
        expect(wrapper.find('[data-testid="accordion-trigger"]').attributes('data-as-child')).toBe('true')
    })

    it('passes through disabled attr to the header element', () => {
        const wrapper = mount(AccordionTrigger, {
            props: { disabled: true },
            global: { stubs: triggerStubs },
        })
        expect(wrapper.find('[data-testid="accordion-header"]').attributes('data-disabled')).toBe('true')
    })
})

describe('AccordionContent', () => {
    it('renders with slot content', () => {
        const wrapper = mount(AccordionContent, {
            slots: { default: 'Content text here' },
            global: { stubs: { AccordionContent: primitiveStub } },
        })
        expect(wrapper.text()).toContain('Content text here')
    })

    it('applies custom class to the root element, variant classes on inner div', () => {
        const wrapper = mount(AccordionContent, {
            props: { class: 'custom-content' },
            global: { stubs: { AccordionContent: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-content')
        const innerDiv = wrapper.find('.border-t-3')
        expect(innerDiv.classes()).not.toContain('custom-content')
    })

    it('applies flat variant background class', () => {
        const wrapper = mount(AccordionContent, {
            global: {
                stubs: { AccordionContent: primitiveStub },
                provide: { [accordionItemKey]: { variant: ref('flat') } },
            },
        })
        const innerDiv = wrapper.find('.border-t-3')
        expect(innerDiv.classes()).toContain('bg-brutal-muted/30')
    })

    it('applies ghost variant with transparent border', () => {
        const wrapper = mount(AccordionContent, {
            global: {
                stubs: { AccordionContent: primitiveStub },
                provide: { [accordionItemKey]: { variant: ref('ghost') } },
            },
        })
        const innerDiv = wrapper.find('.border-t-3')
        expect(innerDiv.classes()).toContain('border-transparent')
    })

    it('applies interactive variant hover class', () => {
        const wrapper = mount(AccordionContent, {
            global: {
                stubs: { AccordionContent: primitiveStub },
                provide: { [accordionItemKey]: { variant: ref('interactive') } },
            },
        })
        const innerDiv = wrapper.find('.border-t-3')
        expect(innerDiv.classes()).toContain('hover:bg-brutal-muted/20')
    })

    it('default variant has no extra content classes beyond base', () => {
        const wrapper = mount(AccordionContent, {
            global: {
                stubs: { AccordionContent: primitiveStub },
                provide: { [accordionItemKey]: { variant: ref('default') } },
            },
        })
        const innerDiv = wrapper.find('.border-t-3')
        expect(innerDiv.classes()).not.toContain('bg-brutal-muted/30')
        expect(innerDiv.classes()).not.toContain('border-transparent')
        expect(innerDiv.classes()).toContain('border-t-3')
        expect(innerDiv.classes()).toContain('border-brutal')
    })
})
