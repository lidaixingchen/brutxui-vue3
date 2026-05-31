<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { cn } from '../lib/utils'
import { paginationVariants, paginationButtonVariants } from './pagination-variants'

type PaginationVariantProps = VariantProps<typeof paginationVariants>

interface PaginationProps {
    currentPage: number
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
})

const emit = defineEmits<{ 'update:currentPage': [page: number] }>()

function range(start: number, end: number) {
    const length = end - start + 1
    return Array.from({ length }, (_, idx) => idx + start)
}

const paginationRange = computed(() => {
    const totalPageNumbers = props.siblingCount + 5

    if (totalPageNumbers >= props.totalPages) {
        return range(1, props.totalPages)
    }

    const leftSiblingIndex = Math.max(props.currentPage - props.siblingCount, 1)
    const rightSiblingIndex = Math.min(props.currentPage + props.siblingCount, props.totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < props.totalPages - 2

    const firstPageIndex = 1
    const lastPageIndex = props.totalPages

    if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + 2 * props.siblingCount
        const leftRange = range(1, leftItemCount)
        return [...leftRange, 'dots' as const, props.totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * props.siblingCount
        const rightRange = range(props.totalPages - rightItemCount + 1, props.totalPages)
        return [firstPageIndex, 'dots' as const, ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = range(leftSiblingIndex, rightSiblingIndex)
        return [firstPageIndex, 'dots' as const, ...middleRange, 'dots' as const, lastPageIndex]
    }

    return range(1, props.totalPages)
})

const navClasses = computed(() =>
    cn(paginationVariants({ variant: props.variant, size: props.size }), props.class)
)

const buttonSize = computed(() => props.size || 'default')

const dotsSizeClasses = computed(() => {
    if (buttonSize.value === 'sm') return 'h-8 w-8'
    if (buttonSize.value === 'lg') return 'h-12 w-12'
    return 'h-10 w-10'
})

function onPageChange(page: number) {
    emit('update:currentPage', page)
}
</script>

<template>
    <nav role="navigation" aria-label="pagination" :class="navClasses">
        <button
            v-if="showFirstLast"
            :class="cn(paginationButtonVariants({ size: buttonSize, isActive: false }))"
            :disabled="currentPage === 1"
            aria-label="Go to first page"
            @click="onPageChange(1)"
        >
            <ChevronsLeft class="h-4 w-4 stroke-[3]" />
        </button>

        <button
            :class="cn(paginationButtonVariants({ size: buttonSize, isActive: false }))"
            :disabled="currentPage === 1"
            aria-label="Go to previous page"
            @click="onPageChange(currentPage - 1)"
        >
            <ChevronLeft class="h-4 w-4 stroke-[3]" />
        </button>

        <template v-if="showPageNumbers">
            <template v-for="(pageNumber, index) in paginationRange" :key="index">
                <span
                    v-if="pageNumber === 'dots'"
                    :class="cn('flex items-center justify-center font-black text-brutal-fg', dotsSizeClasses)"
                >
                    •••
                </span>
                <button
                    v-else
                    :class="cn(paginationButtonVariants({ size: buttonSize, isActive: currentPage === pageNumber }))"
                    :aria-label="`Go to page ${pageNumber}`"
                    :aria-current="currentPage === pageNumber ? 'page' : undefined"
                    @click="onPageChange(pageNumber as number)"
                >
                    {{ pageNumber }}
                </button>
            </template>
        </template>

        <span v-if="!showPageNumbers" class="px-4 font-black text-brutal-fg">
            {{ currentPage }} / {{ totalPages }}
        </span>

        <button
            :class="cn(paginationButtonVariants({ size: buttonSize, isActive: false }))"
            :disabled="currentPage === totalPages"
            aria-label="Go to next page"
            @click="onPageChange(currentPage + 1)"
        >
            <ChevronRight class="h-4 w-4 stroke-[3]" />
        </button>

        <button
            v-if="showFirstLast"
            :class="cn(paginationButtonVariants({ size: buttonSize, isActive: false }))"
            :disabled="currentPage === totalPages"
            aria-label="Go to last page"
            @click="onPageChange(totalPages)"
        >
            <ChevronsRight class="h-4 w-4 stroke-[3]" />
        </button>
    </nav>
</template>
