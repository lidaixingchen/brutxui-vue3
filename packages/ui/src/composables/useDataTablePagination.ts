import { ref, computed, watch, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { DEFAULT_PAGE_SIZE } from '../lib/defaults'

export { DEFAULT_PAGE_SIZE }

export interface UseDataTablePaginationOptions {
    paginated: MaybeRefOrGetter<boolean | undefined>
    pageSize: MaybeRefOrGetter<number | undefined>
    totalItems: MaybeRefOrGetter<number>
}

export interface UseDataTablePaginationReturn {
    currentPage: Ref<number>
    currentPageSize: Ref<number>
    totalPages: ComputedRef<number>
    paginatedData: <T>(data: T[]) => T[]
    goToPage: (page: number) => boolean
    setPageSize: (size: number) => void
}

export function useDataTablePagination(options: UseDataTablePaginationOptions): UseDataTablePaginationReturn {
    const currentPage = ref(1)
    const initialPageSize = toValue(options.pageSize)
    const currentPageSize = ref(
        initialPageSize !== undefined && Number.isFinite(initialPageSize) && initialPageSize > 0 && Number.isInteger(initialPageSize)
            ? initialPageSize
            : DEFAULT_PAGE_SIZE
    )

    const totalPages = computed(() => {
        const total = toValue(options.totalItems)
        // NaN/Infinity 会使 totalPages 为 NaN，进而无法钳制当前页，统一拦截为非有限值
        const safeTotal = Number.isFinite(total) && total > 0 ? total : 0
        return Math.max(1, Math.ceil(safeTotal / Math.max(1, currentPageSize.value)))
    })

    watch(() => toValue(options.pageSize), (newSize) => {
        currentPageSize.value = newSize !== undefined && Number.isFinite(newSize) && newSize > 0 && Number.isInteger(newSize)
            ? newSize
            : DEFAULT_PAGE_SIZE
    })

    watch(totalPages, (newTotal) => {
        if (currentPage.value > newTotal) {
            currentPage.value = Math.max(1, newTotal)
        }
    })

    function paginatedData<T>(data: T[]): T[] {
        if (toValue(options.paginated) !== true) return data
        const start = (currentPage.value - 1) * currentPageSize.value
        return data.slice(start, start + currentPageSize.value)
    }

    function goToPage(page: number): boolean {
        if (!Number.isInteger(page) || page < 1) return false
        const newPage = Math.max(1, Math.min(page, totalPages.value))
        if (newPage !== currentPage.value) {
            currentPage.value = newPage
            return true
        }
        return false
    }

    function setPageSize(size: number) {
        if (!Number.isFinite(size) || size <= 0 || !Number.isInteger(size)) return
        currentPageSize.value = size
        currentPage.value = 1
    }

    return { currentPage, currentPageSize, totalPages, paginatedData, goToPage, setPageSize }
}
