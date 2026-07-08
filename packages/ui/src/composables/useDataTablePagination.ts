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
    const currentPageSize = ref(toValue(options.pageSize) ?? DEFAULT_PAGE_SIZE)

    const totalPages = computed(() => {
        const total = toValue(options.totalItems)
        return Math.max(1, Math.ceil(total / Math.max(1, currentPageSize.value)))
    })

    watch(() => toValue(options.pageSize), (newSize) => {
        currentPageSize.value = newSize ?? DEFAULT_PAGE_SIZE
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
        const newPage = Math.max(1, Math.min(page, totalPages.value))
        if (newPage !== currentPage.value) {
            currentPage.value = newPage
            return true
        }
        return false
    }

    function setPageSize(size: number) {
        if (size <= 0) return
        currentPageSize.value = size
        currentPage.value = 1
    }

    return { currentPage, currentPageSize, totalPages, paginatedData, goToPage, setPageSize }
}
