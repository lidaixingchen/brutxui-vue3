<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { paginationVariants, paginationButtonVariants } from './pagination-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

type PaginationVariantProps = VariantProps<typeof paginationVariants>

const FIRST_PAGE = 1
const MIN_PAGE_THRESHOLD = 2
const FIRST_PAGES_COUNT = 3
const ELLIPSIS_COUNT = 1

interface PaginationProps {
    modelValue: number
    totalPages: number
    siblingCount?: number
    showFirstLast?: boolean
    showPageNumbers?: boolean
    variant?: NonNullable<PaginationVariantProps['variant']>
    size?: NonNullable<PaginationVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<PaginationProps>(), {
    siblingCount: 1,
    showFirstLast: true,
    showPageNumbers: true,
    variant: 'default',
    size: 'default',
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [page: number]
    jump: []
}>()

function range(start: number, end: number) {
    const length = end - start + 1
    return Array.from({ length }, (_, idx) => idx + start)
}

const paginationRange = computed(() => {
    if (props.totalPages <= 0) return []

    const totalPageNumbers = props.siblingCount * 2 + FIRST_PAGES_COUNT + ELLIPSIS_COUNT * 2

    if (totalPageNumbers >= props.totalPages) {
        return range(FIRST_PAGE, props.totalPages)
    }

    const leftSiblingIndex = Math.max(props.modelValue - props.siblingCount, FIRST_PAGE)
    const rightSiblingIndex = Math.min(props.modelValue + props.siblingCount, props.totalPages)

    const shouldShowLeftDots = leftSiblingIndex > MIN_PAGE_THRESHOLD
    const shouldShowRightDots = rightSiblingIndex < props.totalPages - MIN_PAGE_THRESHOLD

    const lastPageIndex = props.totalPages

    if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftEndIndex = FIRST_PAGES_COUNT + 2 * props.siblingCount
        const leftRange = range(FIRST_PAGE, leftEndIndex)
        return [...leftRange, 'dots' as const, props.totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightEndIndex = FIRST_PAGES_COUNT + 2 * props.siblingCount
        const rightRange = range(props.totalPages - rightEndIndex + 1, props.totalPages)
        return [FIRST_PAGE, 'dots' as const, ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = range(leftSiblingIndex, rightSiblingIndex)
        return [FIRST_PAGE, 'dots' as const, ...middleRange, 'dots' as const, lastPageIndex]
    }

    return range(FIRST_PAGE, props.totalPages)
})

const navClasses = computed(() =>
    cn(paginationVariants({ variant: props.variant, size: props.size }), props.class)
)

const safeCurrentPage = computed(() =>
    Math.min(Math.max(props.modelValue, FIRST_PAGE), Math.max(props.totalPages, FIRST_PAGE))
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
    cn(paginationButtonVariants({ size: props.size, isActive: false }))
)

const prevButtonClasses = computed(() =>
    cn(paginationButtonVariants({ size: props.size, isActive: false }))
)

const nextButtonClasses = computed(() =>
    cn(paginationButtonVariants({ size: props.size, isActive: false }))
)

const lastButtonClasses = computed(() =>
    cn(paginationButtonVariants({ size: props.size, isActive: false }))
)

const dotsClasses = computed(() =>
    cn(
        'flex items-center justify-center font-black text-brutal-fg cursor-pointer',
        'hover:bg-brutal-muted transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
        dotsSizeClasses.value
    )
)

const pageButtonActiveClasses = computed(() =>
    cn(paginationButtonVariants({ size: props.size, isActive: true }))
)

const pageButtonInactiveClasses = computed(() =>
    cn(paginationButtonVariants({ size: props.size, isActive: false }))
)

function onPageChange(page: number) {
    if (page >= FIRST_PAGE && page <= props.totalPages) {
        emit('update:modelValue', page)
    }
}
</script>

<template>
    <nav role="navigation" :aria-label="t('pagination.label')" :class="navClasses">
        <button
            v-if="showFirstLast"
            type="button"
            :class="firstButtonClasses"
            :disabled="safeCurrentPage <= FIRST_PAGE"
            :aria-label="t('pagination.firstPage')"
            @click="onPageChange(1)"
        >
            <ChevronsLeft :class="iconClasses" />
        </button>

        <button
            type="button"
            :class="prevButtonClasses"
            :disabled="safeCurrentPage <= FIRST_PAGE"
            :aria-label="t('pagination.previousPage')"
            @click="onPageChange(safeCurrentPage - 1)"
        >
            <ChevronLeft :class="iconClasses" />
        </button>

        <template v-if="showPageNumbers">
            <template v-for="(pageNumber, index) in paginationRange" :key="index">
                <button
                    v-if="pageNumber === 'dots'"
                    type="button"
                    :class="dotsClasses"
                    :aria-label="t('pagination.jumpPages')"
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
                    @click="onPageChange(pageNumber)"
                >
                    {{ pageNumber }}
                </button>
            </template>
        </template>

        <span v-if="!showPageNumbers" class="px-4 font-black text-brutal-fg">
            {{ safeCurrentPage }} / {{ totalPages }}
        </span>

        <button
            type="button"
            :class="nextButtonClasses"
            :disabled="safeCurrentPage >= props.totalPages"
            :aria-label="t('pagination.nextPage')"
            @click="onPageChange(safeCurrentPage + 1)"
        >
            <ChevronRight :class="iconClasses" />
        </button>

        <button
            v-if="showFirstLast"
            type="button"
            :class="lastButtonClasses"
            :disabled="safeCurrentPage >= props.totalPages"
            :aria-label="t('pagination.lastPage')"
            @click="onPageChange(totalPages)"
        >
            <ChevronsRight :class="iconClasses" />
        </button>
    </nav>
</template>