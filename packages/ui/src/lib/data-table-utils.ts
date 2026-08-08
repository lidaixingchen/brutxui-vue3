import { isDev } from '@/lib/env'
import type { DataTableColumn } from '@/components/data-table/types'

/** DEV 下已告警过的列，避免每单元格重复刷屏 */
const warnedColumns = new WeakSet<object>()

function warnColumnMisconfiguration(column: object): void {
    if (warnedColumns.has(column)) return
    warnedColumns.add(column)
    console.warn(
        '[BrutxUI] getCellValue: 列缺少取值配置（accessorFn/accessorKey 缺失或取值缺失），已回退为空字符串，请检查列配置。',
        column,
    )
}

export function getCellValue<T extends object>(row: T, column: DataTableColumn<T>): unknown {
    if (row === null || row === undefined || column === null || column === undefined) return ''
    if (column.accessorFn) return column.accessorFn(row)
    if (column.accessorKey) {
        const value = row[column.accessorKey]
        // 运行时行数据可能缺少该字段（如来自 API 的稀疏行或 accessorKey 拼写错误），
        // 统一收敛为空字符串，避免 String(undefined) → 'undefined' 污染过滤/排序
        if (value === null || value === undefined) {
            if (isDev()) warnColumnMisconfiguration(column)
            return ''
        }
        return value
    }
    // 仅配置 cell 渲染函数的列是合法用法（值由 cell 自行渲染），不告警；
    // 完全缺失取值配置的列才提示，便于早期发现配置错误
    if (column.cell === undefined && isDev()) {
        warnColumnMisconfiguration(column)
    }
    return ''
}
