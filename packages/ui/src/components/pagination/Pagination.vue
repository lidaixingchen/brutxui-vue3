<script setup lang="ts">
import { computed, ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { paginationVariants, paginationButtonVariants } from './pagination-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import Input from '../input/Input.vue'
import { SelectRoot, SelectValue } from 'reka-ui'
import SelectTrigger from '../select/SelectTrigger.vue'
import SelectContent from '../select/SelectContent.vue'
import SelectItem from '../select/SelectItem.vue'

const { t } = useLocale()

type PaginationVariantProps = VariantProps<typeof paginationVariants>

const FIRST_PAGE = 1
const MIN_PAGE_THRESHOLD = 2
const FIRST_PAGES_COUNT = 3
const ELLIPSIS_COUNT = 1

interface PaginationProps {
    modelValue: number
    /** 总页数（与 total + pageSize 二选一） */
    totalPages?: number
    /** 总条数 */
    total?: number
    /** 每页条数 */
    pageSize?: number
    /** 每页条数选项 */
    pageSizes?: number[]
    /** 自定义布局 */
    layout?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 页码按钮背景色 */
    background?: boolean
    /** 只有一页时隐藏 */
    hideOnSinglePage?: boolean
    siblingCount?: number
    showFirstLast?: boolean
    showPageNumbers?: boolean
    variant?: NonNullable<PaginationVariantProps['variant']>
    size?: NonNullable<PaginationVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<PaginationProps>(), {
    totalPages: undefined,
    total: undefined,
    pageSize: 10,
    pageSizes: () => [10, 20, 50, 100],
    layout: 'sizes, prev, pager, next, jumper, total',
    disabled: false,
    background: false,
    hideOnSinglePage: false,
    siblingCount: 1,
    showFirstLast: true,
    showPageNumbers: true,
    variant: 'default',
    size: 'default',
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [page: number]
    'update:pageSize': [size: number]
    jump: []
}>()

// 计算总页数
const computedTotalPages = computed(() => {
    if (props.totalPages !== undefined) return props.totalPages
    if (props.total !== undefined && props.pageSize > 0) {
        return Math.ceil(props.total / props.pageSize)
    }
    return 1
})

// 解析布局
const layoutComponents = computed(() => {
    return props.layout.split(',').map(item => item.trim()).filter(Boolean)
})

// 跳转输入值
const jumpValue = ref('')

function range(start: number, end: number) {
    const length = end - start + 1
    return Array.from({ length }, (_, idx) => idx + start)
}

const paginationRange = computed(() => {
    if (computedTotalPages.value <= 0) return []

    const totalPageNumbers = props.siblingCount * 2 + FIRST_PAGES_COUNT + ELLIPSIS_COUNT * 2

    if (totalPageNumbers >= computedTotalPages.value) {
        return range(FIRST_PAGE, computedTotalPages.value)
    }

    const leftSiblingIndex = Math.max(props.modelValue - props.siblingCount, FIRST_PAGE)
    const rightSiblingIndex = Math.min(props.modelValue + props.siblingCount, computedTotalPages.value)

    const shouldShowLeftDots = leftSiblingIndex > MIN_PAGE_THRESHOLD
    const shouldShowRightDots = rightSiblingIndex < computedTotalPages.value - MIN_PAGE_THRESHOLD

    const lastPageIndex = computedTotalPages.value

    if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftEndIndex = FIRST_PAGES_COUNT + 2 * props.siblingCount
        const leftRange = range(FIRST_PAGE, leftEndIndex)
        return [...leftRange, 'dots' as const, computedTotalPages.value]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightEndIndex = FIRST_PAGES_COUNT + 2 * props.siblingCount
        const rightRange = range(computedTotalPages.value - rightEndIndex + 1, computedTotalPages.value)
        return [FIRST_PAGE, 'dots' as const, ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = range(leftSiblingIndex, rightSiblingIndex)
        return [FIRST_PAGE, 'dots' as const, ...middleRange, 'dots' as const, lastPageIndex]
    }

    return range(FIRST_PAGE, computedTotalPages.value)
})

const navClasses = computed(() =>
    cn(
        paginationVariants({ variant: props.variant, size: props.size }),
        props.disabled && 'opacity-50 pointer-events-none',
        props.class,
    )
)

const safeCurrentPage = computed(() =>
    Math.min(Math.max(props.modelValue, FIRST_PAGE), Math.max(computedTotalPages.value, FIRST_PAGE))
)

const PAGINATION_SIZE_TO_ICON: Record<NonNullable<PaginationVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
}

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: PAGINATION_SIZE_TO_ICON[props.size] }))
)

const dotsSizeClasses = computed(() => {
    if (props.size === 'sm') return 'h-8 w-8'
    if (props.size === 'lg') return 'h-12 w-12'
    return 'h-10 w-10'
})

const firstButtonClasses = computed(() =>
    cn(
        paginationButtonVariants({ size: props.size, isActive: false }),
        props.background && 'bg-brutal-muted',
    )
)

const prevButtonClasses = computed(() =>
    cn(
        paginationButtonVariants({ size: props.size, isActive: false }),
        props.background && 'bg-brutal-muted',
    )
)

const nextButtonClasses = computed(() =>
    cn(
        paginationButtonVariants({ size: props.size, isActive: false }),
        props.background && 'bg-brutal-muted',
    )
)

const lastButtonClasses = computed(() =>
    cn(
        paginationButtonVariants({ size: props.size, isActive: false }),
        props.background && 'bg-brutal-muted',
    )
)

const dotsClasses = computed(() =>
    cn(
        'flex items-center justify-center font-black text-brutal-fg cursor-pointer',
        'hover:bg-brutal-muted transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
        dotsSizeClasses.value,
    )
)

const pageButtonActiveClasses = computed(() =>
    cn(
        paginationButtonVariants({ size: props.size, isActive: true }),
    )
)

const pageButtonInactiveClasses = computed(() =>
    cn(
        paginationButtonVariants({ size: props.size, isActive: false }),
        props.background && 'bg-brutal-muted',
    )
)

// 是否隐藏（只有一页时）
const isHidden = computed(() => {
    return props.hideOnSinglePage && computedTotalPages.value <= 1
})

function onPageChange(page: number) {
    if (page >= FIRST_PAGE && page <= computedTotalPages.value) {
        emit('update:modelValue', page)
    }
}

function onPageSizeChange(size: number) {
    emit('update:pageSize', size)
    // 重新计算当前页
    const newTotalPages = props.total !== undefined
        ? Math.max(1, Math.ceil(props.total / size))
        : computedTotalPages.value
    if (props.modelValue > newTotalPages) {
        emit('update:modelValue', newTotalPages)
    }
}

function onJumpToPage() {
    const page = parseInt(jumpValue.value, 10)
    if (!isNaN(page) && page >= FIRST_PAGE && page <= computedTotalPages.value) {
        emit('update:modelValue', page)
        jumpValue.value = ''
    }
}
</script>

<template>
    <nav
        v-if="!isHidden"
        role="navigation"
        :aria-label="t('pagination.label')"
        :class="navClasses"
    >
        <!-- 总条数 -->
        <span
            v-if="layoutComponents.includes('total') && total !== undefined"
            class="text-sm font-medium text-brutal-fg"
        >
            {{ t('pagination.total', { total }) }}
        </span>

        <!-- 每页条数选择 -->
        <div
            v-if="layoutComponents.includes('sizes')"
            class="flex items-center gap-2"
        >
            <SelectRoot
                :model-value="String(pageSize)"
                :disabled="disabled"
                @update:model-value="onPageSizeChange(Number($event))"
            >
                <SelectTrigger
                    size="sm"
                    class="w-auto"
                    :aria-label="t('pagination.perPage')"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="sizeOption in pageSizes"
                        :key="sizeOption"
                        :value="String(sizeOption)"
                    >
                        {{ t('pagination.perPageOption', { size: sizeOption }) }}
                    </SelectItem>
                </SelectContent>
            </SelectRoot>
        </div>

        <!-- 第一页 -->
        <button
            v-if="showFirstLast && layoutComponents.includes('prev')"
            type="button"
            :class="firstButtonClasses"
            :disabled="safeCurrentPage <= FIRST_PAGE || disabled"
            :aria-label="t('pagination.firstPage')"
            @click="onPageChange(FIRST_PAGE)"
        >
            <ChevronsLeft :class="iconClasses" />
        </button>

        <!-- 上一页 -->
        <button
            v-if="layoutComponents.includes('prev')"
            type="button"
            :class="prevButtonClasses"
            :disabled="safeCurrentPage <= FIRST_PAGE || disabled"
            :aria-label="t('pagination.previousPage')"
            @click="onPageChange(safeCurrentPage - 1)"
        >
            <ChevronLeft :class="iconClasses" />
        </button>

        <!-- 页码 -->
        <template v-if="layoutComponents.includes('pager') && showPageNumbers">
            <template v-for="(pageNumber, index) in paginationRange" :key="`${pageNumber}-${index}`">
                <button
                    v-if="pageNumber === 'dots'"
                    type="button"
                    :class="dotsClasses"
                    :aria-label="t('pagination.jumpPages')"
                    :disabled="disabled"
                    @click="emit('jump')"
                >
                    •••
                </button>
                <button
                    v-else
                    type="button"
                    :class="safeCurrentPage === pageNumber ? pageButtonActiveClasses : pageButtonInactiveClasses"
                    :aria-label="t('pagination.page', { number: pageNumber })"
                    :aria-current="safeCurrentPage === pageNumber ? 'page' : undefined"
                    :disabled="disabled"
                    @click="onPageChange(pageNumber)"
                >
                    {{ pageNumber }}
                </button>
            </template>
        </template>

        <!-- 简洁页码显示 -->
        <span
            v-if="layoutComponents.includes('pager') && !showPageNumbers"
            class="px-4 font-black text-brutal-fg"
        >
            {{ safeCurrentPage }} / {{ computedTotalPages }}
        </span>

        <!-- 下一页 -->
        <button
            v-if="layoutComponents.includes('next')"
            type="button"
            :class="nextButtonClasses"
            :disabled="safeCurrentPage >= computedTotalPages || disabled"
            :aria-label="t('pagination.nextPage')"
            @click="onPageChange(safeCurrentPage + 1)"
        >
            <ChevronRight :class="iconClasses" />
        </button>

        <!-- 最后一页 -->
        <button
            v-if="showFirstLast && layoutComponents.includes('next')"
            type="button"
            :class="lastButtonClasses"
            :disabled="safeCurrentPage >= computedTotalPages || disabled"
            :aria-label="t('pagination.lastPage')"
            @click="onPageChange(computedTotalPages)"
        >
            <ChevronsRight :class="iconClasses" />
        </button>

        <!-- 跳转 -->
        <div
            v-if="layoutComponents.includes('jumper')"
            class="flex items-center gap-2"
        >
            <span class="text-sm text-brutal-fg">{{ t('pagination.goto') }}</span>
            <Input
                v-model="jumpValue"
                size="sm"
                class="w-16"
                :disabled="disabled"
                :placeholder="''"
                @keyup.enter="onJumpToPage"
            />
            <span
                v-if="t('pagination.pageClassifier')"
                class="text-sm text-brutal-fg"
            >
                {{ t('pagination.pageClassifier') }}
            </span>
        </div>
    </nav>
</template>
