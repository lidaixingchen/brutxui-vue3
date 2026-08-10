import { ref, computed, watch, toValue, isRef, isReadonly, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
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

/** pageSize 合法性校验：必须是有限正整数（NaN/Infinity/0/负数/小数均非法） */
function isValidPageSize(size: number | undefined): size is number {
    return size !== undefined && Number.isFinite(size) && size > 0 && Number.isInteger(size)
}

export function useDataTablePagination(options: UseDataTablePaginationOptions): UseDataTablePaginationReturn {
    const currentPage = ref(1)
    const initialPageSize = toValue(options.pageSize)
    const currentPageSize = ref(
        isValidPageSize(initialPageSize)
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
        currentPageSize.value = isValidPageSize(newSize)
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
        if (!isValidPageSize(size)) return
        // 外部以响应式 ref 控制 pageSize 时回写外部值，明确外部为单一数据源：
        // 本地修改不再会被外部变化无条件覆盖，父组件也能感知到分页大小变更；
        // 若外部是 getter（无法回写），本地修改保持当前行为。
        // 注：isRef 的类型守卫对 MaybeRefOrGetter 联合中的 ComputedRef 分支
        // 收窄后 value 仍为只读，这里显式断言。readonly(ref) 经 isReadonly 预检
        // 直接跳过（写入会警告）；ComputedRef 传入时 Vue 会 throw，由 try/catch
        // 静默兜底——两者均属于调用方传入只读源，回写失败不影响本地分页状态
        const external = options.pageSize
        if (isRef(external) && !isReadonly(external)) {
            try {
                ;(external as Ref<number | undefined>).value = size
            } catch {
                // ComputedRef 等只读源：忽略回写失败
            }
        }
        currentPageSize.value = size
        currentPage.value = 1
    }

    return { currentPage, currentPageSize, totalPages, paginatedData, goToPage, setPageSize }
}
