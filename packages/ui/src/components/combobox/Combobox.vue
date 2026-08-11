<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Check, ChevronsUpDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from '../button/button-variants'
import { comboboxTriggerVariants, comboboxContentVariants, comboboxCheckboxVariants } from './combobox-variants'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import PopoverContent from '../popover/PopoverContent.vue'
import Command from '../command/Command.vue'
import CommandInput from '../command/CommandInput.vue'
import CommandList from '../command/CommandList.vue'
import CommandEmpty from '../command/CommandEmpty.vue'
import CommandGroup from '../command/CommandGroup.vue'
import CommandItem from '../command/CommandItem.vue'
import Spinner from '../spinner/Spinner.vue'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { useSelectableTrigger } from '@/composables/useSelectableTrigger'
import { useSelectionDisplayText } from '@/composables/useSelectionDisplayText'

import { type ComboboxOption } from './combobox-types'

interface ComboboxProps {
    options: ComboboxOption[]
    modelValue?: string | string[]
    multiple?: boolean
    open?: boolean
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    loading?: boolean
    creative?: boolean
    maxDisplay?: number
    ariaLabel?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<ComboboxProps>(), {
    modelValue: undefined,
    multiple: false,
    open: undefined,
    placeholder: undefined,
    searchPlaceholder: undefined,
    emptyText: undefined,
    disabled: false,
    loading: false,
    creative: false,
    maxDisplay: 3,
    ariaLabel: undefined,
    class: undefined,
    iconSize: 'md',
})

const { t } = useLocale()

const resolvedPlaceholder = computed(() =>
    props.placeholder ?? (props.multiple ? t('combobox.multiPlaceholder') : t('combobox.placeholder'))
)
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? t('combobox.searchPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText ?? t('combobox.emptyText'))

const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | undefined]
    'update:open': [value: boolean]
    'create': [value: string]
}>()

const internalOpen = ref(false)
// 受控/非受控统一：props.open 传入时为受控模式，get 读 props、set 只 emit update:open，
// 关闭动作需父组件绑定 v-model:open 或监听 update:open 回写才生效（契约见文档 open 属性）
const open = computed<boolean>({
    get: () => props.open !== undefined ? props.open : internalOpen.value,
    set: (val) => {
        if (props.open === undefined) {
            internalOpen.value = val
        }
        emit('update:open', val)
    },
})
const searchQuery = ref('')

const selectedOptions = computed(() => {
    if (props.multiple) {
        const selected = Array.isArray(props.modelValue) ? props.modelValue : []
        return props.options.filter((o) => selected.includes(o.value))
    }
    const found = props.options.find((o) => o.value === props.modelValue)
    return found ? [found] : []
})

const displayText = useSelectionDisplayText({
    selectedItems: selectedOptions,
    placeholder: resolvedPlaceholder,
    multiple: () => props.multiple,
    maxDisplay: () => props.maxDisplay,
    // 不传 getLabel：defaultGetLabel 对非字符串/缺失 label 已安全兜底（返回 ''），
    // 传 (option) => option.label 会绕过该兜底，运行时 label 异常时直接抛错
    formatList: (labels) => labels.join(', '),
    formatCount: (count) => t('combobox.selectedCount', { count }),
})

const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options
    const query = searchQuery.value.trim().toLowerCase()
    // label 的 string 类型仅编译期保证，异步/第三方数据运行时可能缺失或非字符串：
    // String(option.label ?? '') 兜底，避免调用 .toLowerCase() 抛 TypeError 致组件崩溃
    return props.options.filter((option) =>
        String(option.label ?? '').toLowerCase().includes(query)
    )
})

const showCreateItem = computed(() =>
    props.creative && filteredOptions.value.length === 0 && !!searchQuery.value.trim()
)

const createItemLabel = computed(() =>
    t('combobox.create', { query: searchQuery.value.trim() })
)

const { triggerClasses } = useSelectableTrigger<string | string[]>({
    modelValue: () => props.modelValue,
    baseClass: ({ hasValue }) => cn(
        buttonVariants({ variant: 'outline' }),
        comboboxTriggerVariants({ hasValue })
    ),
    class: () => props.class,
    emptyClass: false,
})

const contentClasses = comboboxContentVariants()

const checkboxSelectedClasses = comboboxCheckboxVariants({ selected: true })
const checkboxUnselectedClasses = comboboxCheckboxVariants({ selected: false })
const checkSelectedClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-[3] text-brutal-fg')
const checkUnselectedClasses = cn(iconSizeVariants({ size: 'sm' }), 'opacity-0')
const checkIconClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-[3] text-brutal-fg')

const triggerIconClasses = computed(() =>
    cn('ml-2 shrink-0 opacity-50 stroke-[3]', iconSizeVariants({ size: props.iconSize }))
)

const contentId = `combobox-content-${useId()}`

function isSelected(optionValue: string): boolean {
    if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.includes(optionValue)
    }
    return props.modelValue === optionValue
}

function handleSelect(value: string) {
    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? props.modelValue : []
        const newValue = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value]
        emit('update:modelValue', newValue)
    } else {
        emit('update:modelValue', value === props.modelValue ? undefined : value)
        open.value = false
        searchQuery.value = ''
    }
}

// creative 契约：组件只 emit 'create'，由父组件在回调中把新选项加入 options 并同步 modelValue
// （见 docs 常见问题）。这里对查询文本去首尾空格，避免创建出带脏空格的 value/label；
// 多选模式不自动合并 modelValue 也源于此——新选项的 value 由父组件决定，可能与文本不同
function handleCreate() {
    const value = searchQuery.value.trim()
    if (!value) return
    emit('create', value)
    if (!props.multiple) {
        open.value = false
    }
    searchQuery.value = ''
}

watch(open, (isOpen) => {
    if (!isOpen) {
        searchQuery.value = ''
    }
})

const triggerRef = ref<HTMLElement | null>(null)

defineExpose({
    open,
    searchQuery,
    selectedValue: computed(() => props.modelValue),
    focus: () => triggerRef.value?.focus(),
})
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <button
                ref="triggerRef"
                type="button"
                role="combobox"
                :aria-expanded="open"
                :aria-controls="open ? contentId : undefined"
                :aria-label="ariaLabel"
                :aria-multiselectable="multiple || undefined"
                aria-haspopup="listbox"
                :disabled="disabled"
                :class="triggerClasses"
            >
                <span :class="multiple ? 'truncate' : undefined">{{ displayText }}</span>
                <ChevronsUpDown :class="triggerIconClasses" />
            </button>
        </PopoverTrigger>
        <PopoverContent :class="contentClasses" align="start">
          <div :id="contentId">
            <Command disable-filter>
                <CommandInput v-model="searchQuery" :placeholder="resolvedSearchPlaceholder" />
                <CommandList>
                    <CommandEmpty v-if="!showCreateItem">
                        {{ resolvedEmptyText }}
                    </CommandEmpty>
                    <CommandItem
                        v-if="showCreateItem"
                        :value="searchQuery"
                        @select="handleCreate"
                    >
                        {{ createItemLabel }}
                    </CommandItem>
                    <CommandGroup>
                        <CommandItem
                            v-for="option in filteredOptions"
                            :key="option.value"
                            :value="option.value"
                            :disabled="option.disabled"
                            @select="handleSelect"
                        >
                            <template v-if="multiple">
                                <div
                                    :class="isSelected(option.value) ? checkboxSelectedClasses : checkboxUnselectedClasses"
                                >
                                    <Check v-if="isSelected(option.value)" :class="checkIconClasses" />
                                </div>
                            </template>
                            <Check
                                v-else
                                :class="isSelected(option.value) ? checkSelectedClasses : checkUnselectedClasses"
                            />
                            {{ option.label }}
                        </CommandItem>
                    </CommandGroup>
                    <div v-if="loading" class="flex items-center justify-center py-2">
                        <Spinner size="sm" />
                    </div>
                </CommandList>
            </Command>
          </div>
        </PopoverContent>
    </PopoverRoot>
</template>
