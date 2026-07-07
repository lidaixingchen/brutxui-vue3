import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSelectableTrigger } from './useSelectableTrigger'

describe('useSelectableTrigger', () => {
    it('detects empty and non-empty values', () => {
        expect(useSelectableTrigger({ modelValue: () => undefined }).hasValue.value).toBe(false)
        expect(useSelectableTrigger({ modelValue: () => null }).hasValue.value).toBe(false)
        expect(useSelectableTrigger({ modelValue: () => '' }).hasValue.value).toBe(false)
        expect(useSelectableTrigger({ modelValue: () => [] }).hasValue.value).toBe(false)
        expect(useSelectableTrigger({ modelValue: () => 'one' }).hasValue.value).toBe(true)
        expect(useSelectableTrigger({ modelValue: () => ['one'] }).hasValue.value).toBe(true)
    })

    it('supports explicit hasValue override', () => {
        const trigger = useSelectableTrigger({
            modelValue: () => [],
            hasValue: () => true,
        })

        expect(trigger.hasValue.value).toBe(true)
    })

    it('supports custom value detection', () => {
        const trigger = useSelectableTrigger({
            modelValue: () => ({ selected: true }),
            getHasValue: value => value?.selected === true,
        })

        expect(trigger.hasValue.value).toBe(true)
    })

    it('builds trigger classes from state-aware base class and custom class', () => {
        const modelValue = ref<string | undefined>(undefined)
        const customClass = ref('custom-trigger')
        const trigger = useSelectableTrigger({
            modelValue,
            baseClass: ({ hasValue }) => hasValue ? 'base-filled' : 'base-empty',
            class: customClass,
        })

        expect(trigger.triggerClasses.value).toContain('base-empty')
        expect(trigger.triggerClasses.value).toContain('text-brutal-muted-foreground')
        expect(trigger.triggerClasses.value).toContain('custom-trigger')

        modelValue.value = 'selected'

        expect(trigger.triggerClasses.value).toContain('base-filled')
        expect(trigger.triggerClasses.value).not.toContain('text-brutal-muted-foreground')
    })

    it('can disable default empty class', () => {
        const trigger = useSelectableTrigger({
            modelValue: () => undefined,
            baseClass: 'base-trigger',
            emptyClass: false,
        })

        expect(trigger.triggerClasses.value).toBe('base-trigger')
    })
})
