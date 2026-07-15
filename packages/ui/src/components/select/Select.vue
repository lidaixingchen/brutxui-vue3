<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { SelectRoot, SelectGroup, SelectValue } from 'reka-ui'
import SelectTrigger from './SelectTrigger.vue'
import SelectContent from './SelectContent.vue'
import SelectItem from './SelectItem.vue'
import SelectLabel from './SelectLabel.vue'
import { cn } from '@/lib/utils'

export interface SelectOption {
    label: string
    value: string
    disabled?: boolean
    [key: string]: unknown
}

export interface SelectProps {
    options?: SelectOption[]
    groupField?: string
    groupLabel?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    name?: string
    id?: string
    size?: 'sm' | 'default' | 'lg'
    variant?: 'default' | 'error' | 'success'
    errorMessage?: string
    clearable?: boolean
    position?: 'popper' | 'item-aligned'
    class?: string
    triggerClass?: string
    contentClass?: string
    itemVariant?: 'default' | 'primary' | 'secondary'
}

const {
    options = [],
    groupField = undefined,
    groupLabel = undefined,
    placeholder = 'Select an option',
    disabled = false,
    required = false,
    name = undefined,
    id = undefined,
    size = 'default',
    variant = 'default',
    errorMessage = undefined,
    clearable = false,
    position = 'popper',
    class: className = undefined,
    triggerClass = undefined,
    contentClass = undefined,
    itemVariant = 'default',
} = defineProps<SelectProps>()

const modelValue = defineModel<string>()

const slots = useSlots()
const hasDefaultSlot = computed(() => !!slots.default)
const hasTriggerSlot = computed(() => !!slots.trigger)

interface GroupedItems {
    key: string
    label: string
    options: SelectOption[]
}

const grouped = computed<GroupedItems[]>(() => {
    if (!groupField) {
        return [{ key: 'all', label: '', options }]
    }
    const groups: Record<string, SelectOption[]> = {}
    const noGroup: SelectOption[] = []

    options.forEach((opt) => {
        const val = opt[groupField]
        if (val !== undefined && val !== null) {
            const key = String(val)
            if (!groups[key]) {
                groups[key] = []
            }
            groups[key].push(opt)
        } else {
            noGroup.push(opt)
        }
    })

    const result: GroupedItems[] = []

    Object.keys(groups).forEach((key) => {
        const firstOpt = groups[key][0]
        const label =
            groupLabel && firstOpt && firstOpt[groupLabel] !== undefined
                ? String(firstOpt[groupLabel])
                : key
        result.push({
            key,
            label,
            options: groups[key],
        })
    })

    if (noGroup.length > 0) {
        result.push({
            key: '__ungrouped__',
            label: '',
            options: noGroup,
        })
    }

    return result
})
</script>

<template>
    <SelectRoot
        v-model="modelValue"
        :name="name"
        :disabled="disabled"
        :required="required"
    >
        <!-- 完全自定义模式：使用默认插槽接管全部内容 -->
        <slot v-if="hasDefaultSlot" />
        <template v-else>
            <!-- 触发器：优先使用具名 trigger 插槽，否则使用内置触发器 -->
            <slot v-if="hasTriggerSlot" name="trigger" />
            <SelectTrigger
                v-else
                :id="id"
                :size="size"
                :variant="variant"
                :error-message="errorMessage"
                :disabled="disabled"
                :clearable="clearable"
                :model-value="modelValue"
                :class="cn(className, triggerClass)"
                @clear="modelValue = undefined"
            >
                <SelectValue :placeholder="placeholder" />
            </SelectTrigger>

            <!-- 内容区：始终由 props 数据驱动渲染 -->
            <SelectContent :position="position" :class="contentClass">
                <template v-if="groupField">
                    <SelectGroup
                        v-for="group in grouped"
                        :key="group.key"
                    >
                        <SelectLabel v-if="group.label">
{{ group.label }}
</SelectLabel>
                        <SelectItem
                            v-for="opt in group.options"
                            :key="opt.value"
                            :value="opt.value"
                            :disabled="opt.disabled"
                            :variant="itemVariant"
                        >
                            {{ opt.label }}
                        </SelectItem>
                    </SelectGroup>
                </template>
                <template v-else>
                    <SelectItem
                        v-for="opt in options"
                        :key="opt.value"
                        :value="opt.value"
                        :disabled="opt.disabled"
                        :variant="itemVariant"
                    >
                        {{ opt.label }}
                    </SelectItem>
                </template>
            </SelectContent>
        </template>
    </SelectRoot>
</template>
