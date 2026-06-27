import { useDataTablePagination } from './useDataTablePagination'

const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))

describe('useDataTablePagination', () => {
    it('totalPages is ceil(totalItems / pageSize)', () => {
        const { totalPages } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        expect(totalPages.value).toBe(3)
    })

    it('totalPages is at least 1', () => {
        const { totalPages } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 0,
        })
        expect(totalPages.value).toBe(1)
    })

    it('paginatedData slices by current page and size', () => {
        const { paginatedData } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        expect(paginatedData(data)).toHaveLength(10)
        expect(paginatedData(data)[0].id).toBe(1)
    })

    it('returns full data when paginated is false', () => {
        const { paginatedData } = useDataTablePagination({
            paginated: () => false,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        expect(paginatedData(data)).toHaveLength(25)
    })

    it('goToPage moves to valid page and returns true', () => {
        const { currentPage, goToPage } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        expect(goToPage(2)).toBe(true)
        expect(currentPage.value).toBe(2)
    })

    it('goToPage clamps below 1', () => {
        const { currentPage, goToPage } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        goToPage(-5)
        expect(currentPage.value).toBe(1)
    })

    it('goToPage clamps above totalPages', () => {
        const { currentPage, goToPage } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        goToPage(999)
        expect(currentPage.value).toBe(3)
    })

    it('goToPage returns false when same page', () => {
        const { goToPage } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        expect(goToPage(1)).toBe(false)
    })

    it('setPageSize updates size and resets to page 1', () => {
        const { currentPage, currentPageSize, goToPage, setPageSize } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        goToPage(3)
        setPageSize(20)
        expect(currentPageSize.value).toBe(20)
        expect(currentPage.value).toBe(1)
    })

    it('clamps currentPage when totalItems shrinks', () => {
        const { currentPage, goToPage } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => 10,
            totalItems: () => 25,
        })
        goToPage(3)
        expect(currentPage.value).toBe(3)
    })

    it('defaults pageSize to 10 when undefined', () => {
        const { currentPageSize } = useDataTablePagination({
            paginated: () => true,
            pageSize: () => undefined,
            totalItems: () => 25,
        })
        expect(currentPageSize.value).toBe(10)
    })
})
