import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue'

export interface UseDataTablePaginationOptions {
    paginated: MaybeRefOrGetter<boolean | undefined>
    pageSize: MaybeRefOrGetter<number | undefined>
    totalItems: MaybeRefOrGetter<number>
}

export function useDataTablePagination(options: UseDataTablePaginationOptions) {
    const currentPage = ref(1)
    const currentPageSize = ref(toValue(options.pageSize) ?? 10)

    const totalPages = computed(() => {
        const total = toValue(options.totalItems)
        return Math.max(1, Math.ceil(total / currentPageSize.value))
    })

    watch(() => toValue(options.pageSize), (newSize) => {
        currentPageSize.value = newSize ?? 10
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
        currentPageSize.value = size
        currentPage.value = 1
    }

    return { currentPage, currentPageSize, totalPages, paginatedData, goToPage, setPageSize }
}
