<script setup lang="ts">
import { computed, watch, type DeepReadonly } from 'vue'
import { useLocale } from '@/composables/useLocale'
import type { DataTableColumn, DataTableFilterState, DataTableFilterValue } from './types'
import Input from '../input/Input.vue'
import Button from '../button/Button.vue'
import Checkbox from '../checkbox/Checkbox.vue'
import { SelectRoot, SelectValue } from 'reka-ui'
import SelectTrigger from '../select/SelectTrigger.vue'
import SelectContent from '../select/SelectContent.vue'
import SelectItem from '../select/SelectItem.vue'
import { Filter } from '@lucide/vue'
import Popover from '../popover/Popover.vue'
import PopoverTrigger from '../popover/PopoverTrigger.vue'
import PopoverContent from '../popover/PopoverContent.vue'

const props = defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    column: DataTableColumn<any>
    filterState: DeepReadonly<DataTableFilterState>
    headerLabel: string
}>()

const emit = defineEmits<{
    'update:filterState': [state: DataTableFilterState]
}>()

const { t } = useLocale()

type MultiSelectValue = Array<string | number | boolean>

function updateFilterValue(val: DataTableFilterValue) {
    // 只 emit 本列增量，父级（DataTable.vue）基于当前状态按列函数式合并；
    // 避免基于滞后 props 重建全量快照，导致同一 tick 内多次更新互相覆盖
    emit('update:filterState', {
        columns: { [props.column.id]: val === undefined || val === null || val === '' ? null : val },
    })
}

const textVal = computed<string>({
    get() {
        const v = props.filterState.columns?.[props.column.id]
        return typeof v === 'string' ? v : ''
    },
    set(val) {
        updateFilterValue(val)
    }
})

const selectVal = computed<string>({
    get() {
        const v = props.filterState.columns?.[props.column.id]
        return String(v ?? '')
    },
    set(val) {
        updateFilterValue(val)
    }
})

function isMultiSelectChecked(value: string | number | boolean): boolean {
    const vals = props.filterState.columns?.[props.column.id]
    if (!Array.isArray(vals)) return false
    return (vals as MultiSelectValue).includes(value)
}

function handleMultiSelectChange(value: string | number | boolean, checked: boolean | 'indeterminate') {
    const current = props.filterState.columns?.[props.column.id]
    const vals: MultiSelectValue = Array.isArray(current) ? [...(current as MultiSelectValue)] : []
    if (checked === true || checked === 'indeterminate') {
        if (!vals.includes(value)) {
            vals.push(value)
        }
    } else {
        const idx = vals.indexOf(value)
        if (idx !== -1) {
            vals.splice(idx, 1)
        }
    }
    // 只 emit 本列增量（空选清空时传 null，父级删除该列）
    emit('update:filterState', {
        columns: { [props.column.id]: vals.length === 0 ? null : [...vals] },
    })
}

function getDateRangeVal(bound: 'start' | 'end'): string {
    const val = props.filterState.columns?.[props.column.id]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        const obj = val as { start: string | null; end: string | null }
        return obj[bound] ?? ''
    }
    return ''
}

// 同一 tick 内 start/end 连续触发时，props 尚未回流（滞后一次更新），
// 以最近一次 emit 的本列范围为基准合并；props 回流后经 watch 重置，
// 外部程序化设置（setFilterState / setColumnFilter）仍以 props 为准
let pendingRange: { start: string | null; end: string | null } | null = null

watch(
    () => props.filterState.columns?.[props.column.id],
    () => {
        pendingRange = null
    },
)

function readCurrentRange(): { start: string | null; end: string | null } {
    const val = props.filterState.columns?.[props.column.id]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        return { ...(val as { start: string | null; end: string | null }) }
    }
    return { start: null, end: null }
}

function handleDateRangeChange(bound: 'start' | 'end', val: string) {
    const base = pendingRange ?? readCurrentRange()
    const next = { ...base, [bound]: val || null }
    pendingRange = next
    // 只 emit 本列增量，父级按列函数式合并
    emit('update:filterState', {
        columns: { [props.column.id]: next },
    })
}

function resetColumnFilter() {
    // 传 null 表示清除本列，父级按 delete 语义从状态中移除
    emit('update:filterState', {
        columns: { [props.column.id]: null },
    })
}
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button
                variant="default"
                size="icon"
                class="h-6 w-6 p-0 border-3 shadow-none focus-visible:ring-1"
                :aria-label="`Filter ${column.id}`"
                @click.stop
            >
                <Filter class="h-3 w-3" />
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-64 p-3 bg-brutal-bg border-3 border-brutal shadow-brutal flex flex-col gap-2 z-50">
            <div class="font-bold text-xs text-brutal-fg mb-1">
                {{ t('dataTable.filterTitle', { label: headerLabel }) }}
            </div>
            
            <!-- Text Match -->
            <template v-if="column.filterType === 'text'">
                <Input
                    v-model="textVal"
                    size="sm"
                    :placeholder="t('dataTable.filterSearchPlaceholder')"
                    clearable
                />
            </template>
            
            <!-- Select -->
            <template v-else-if="column.filterType === 'select'">
                <SelectRoot
                    :model-value="selectVal"
                    @update:model-value="val => updateFilterValue(val)"
                >
                    <SelectTrigger size="sm" class="w-full">
                        <SelectValue :placeholder="t('dataTable.filterAll')" />
                    </SelectTrigger>
                    <SelectContent class="z-50">
                        <SelectItem value="">{{ t('dataTable.filterAll') }}</SelectItem>
                        <SelectItem
                            v-for="opt in column.filterOptions"
                            :key="opt.value"
                            :value="String(opt.value)"
                        >
                            {{ opt.label }}
                        </SelectItem>
                    </SelectContent>
                </SelectRoot>
            </template>
            
            <!-- Multi-Select -->
            <template v-else-if="column.filterType === 'multi-select'">
                <div class="flex flex-col gap-1.5 max-h-40 overflow-y-auto border border-brutal p-1.5 bg-brutal-muted/20">
                    <label
                        v-for="opt in column.filterOptions"
                        :key="opt.value"
                        class="flex items-center gap-2 cursor-pointer text-xs"
                    >
                        <Checkbox
                            :checked="isMultiSelectChecked(opt.value)"
                            size="sm"
                            @update:checked="checked => handleMultiSelectChange(opt.value, checked)"
                        />
                        <span>{{ opt.label }}</span>
                    </label>
                </div>
            </template>
            
            <!-- Date Range -->
            <template v-else-if="column.filterType === 'date-range'">
                <div class="flex flex-col gap-2">
                    <Input
                        :model-value="getDateRangeVal('start')"
                        type="date"
                        size="sm"
                        :placeholder="t('dataTable.filterStartDate')"
                        @update:model-value="val => handleDateRangeChange('start', val)"
                    />
                    <span class="text-xs text-center text-brutal-fg/50">{{ t('dataTable.filterTo') }}</span>
                    <Input
                        :model-value="getDateRangeVal('end')"
                        type="date"
                        size="sm"
                        :placeholder="t('dataTable.filterEndDate')"
                        @update:model-value="val => handleDateRangeChange('end', val)"
                    />
                </div>
            </template>
            
            <div class="flex items-center justify-between border-t border-brutal pt-2 mt-1">
                <Button
                    variant="default"
                    size="sm"
                    class="h-7 px-2 text-xs border-3 shadow-none"
                    @click="resetColumnFilter"
                >
                    {{ t('dataTable.filterReset') }}
                </Button>
            </div>
        </PopoverContent>
    </Popover>
</template>
