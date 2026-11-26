<script setup lang="ts">
import { computed, inject, useAttrs, useTemplateRef, watch, type ComponentPublicInstance, type Ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { injectSelectRootContext, SelectItem as SelectItemPrimitive, SelectItemIndicator as SelectItemIndicatorPrimitive, SelectItemText as SelectItemTextPrimitive } from 'reka-ui'
import { Check } from '@lucide/vue'
import { getMutationObserverCtor } from '@/lib/env'
import { cn } from '@/lib/utils'
import { selectItemVariants } from './select-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

type SelectItemVariantProps = VariantProps<typeof selectItemVariants>

interface SelectCollection {
    itemMap: Ref<Map<HTMLElement, { value?: { textValue: string } }>>
}

const REKA_COLLECTION_PROVIDER = 'CollectionProvider'

interface SelectItemProps {
    /** 选项值，必须为非空唯一字符串 */
    value: string
    disabled?: boolean
    variant?: NonNullable<SelectItemVariantProps['variant']>
    class?: string
    indicatorClass?: string
    iconClass?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<SelectItemProps>(), {
    disabled: false,
    variant: 'default',
    class: undefined,
    indicatorClass: undefined,
    iconClass: undefined,
    iconSize: 'md',
})

const classes = computed(() =>
    cn(selectItemVariants({ variant: props.variant }), 'min-w-0', props.class)
)

const indicatorClasses = computed(() =>
    cn('absolute left-2 flex h-4 w-4 items-center justify-center', props.indicatorClass)
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]', props.iconClass)
)

const rootContext = injectSelectRootContext()
const collection = inject<SelectCollection | null>(REKA_COLLECTION_PROVIDER, null)
const attrs = useAttrs()
const itemText = useTemplateRef<ComponentPublicInstance>('itemText')
const itemTextElement = computed(() => itemText.value?.$el as HTMLElement | undefined)
const collectionItem = computed(() => {
    const element = itemTextElement.value?.closest<HTMLElement>('[role="option"]')
    return element ? collection?.itemMap.value.get(element)?.value : undefined
})

function syncTypeaheadLabel(label: string) {
    const item = collectionItem.value
    if (item && !attrs.textValue && !attrs['text-value']) item.textValue = label.trim()
}

// Reka 按键搜索读取集合条目，原语重绘时可能重新登记该条目。
watch(collectionItem, () => {
    syncTypeaheadLabel(itemTextElement.value?.textContent ?? '')
}, { flush: 'post' })

watch(itemTextElement, (element, _, onCleanup) => {
    const Observer = getMutationObserverCtor()
    if (!Observer || !element) return

    // 插槽子树变化时同步显示文案和搜索文本，保留选项实例与焦点。
    const observer = new Observer(() => {
        const label = element.textContent ?? ''
        for (const option of rootContext.optionsSet.value) {
            if (option.value !== props.value) continue
            option.textContent = label
            break
        }
        syncTypeaheadLabel(label)
    })
    observer.observe(element, { childList: true, characterData: true, subtree: true })
    onCleanup(() => observer.disconnect())
}, { flush: 'post' })
</script>

<template>
    <SelectItemPrimitive :value="value" :disabled="disabled" :class="classes">
        <span :class="indicatorClasses">
            <SelectItemIndicatorPrimitive>
                <Check :class="iconClasses" />
            </SelectItemIndicatorPrimitive>
        </span>
        <SelectItemTextPrimitive ref="itemText" class="min-w-0 wrap-anywhere">
            <slot />
        </SelectItemTextPrimitive>
    </SelectItemPrimitive>
</template>
