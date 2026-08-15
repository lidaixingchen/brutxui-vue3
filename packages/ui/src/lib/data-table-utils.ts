import { isDev } from '@/lib/env'
import type { DataTableColumn } from '@/components/data-table/types'

/** DEV 下已告警过的列，避免每单元格重复刷屏 */
const warnedColumns = new WeakSet<object>()

function warnColumnMisconfiguration(column: object): void {
    if (warnedColumns.has(column)) return
    warnedColumns.add(column)
    console.warn(
        '[BrutxUI] getCellValue: 列缺少取值配置（accessorFn/accessorKey 缺失或键取值缺失），已回退为空字符串，请检查列配置。',
        column,
    )
}

export function getCellValue<T extends object>(row: T, column: DataTableColumn<T>): unknown {
    if (row === null || row === undefined || column === null || column === undefined) return ''
    if (column.accessorFn) return column.accessorFn(row)
    if (column.accessorKey) {
        const value = row[column.accessorKey]
        // 仅 undefined（键缺失 / accessorKey 拼写错误）收敛为空字符串，
        // 避免 String(undefined) → 'undefined' 污染过滤/排序；
        // null 是合法数据值（可空字段），透传由排序/过滤逻辑自行处理
        // （useDataTableSort 依赖 null 排末尾的既有语义）
        if (value === undefined) {
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

/**
 * Select 过滤选项的 String(value) → 原始值映射：SelectItem 的 value 经 String() 展示，
 * 选中后需还原为选项原始类型（string | number），保证 filterState 类型保真。
 * 独立纯函数便于单测（含 value=0、空字符串等边界）。
 */
export function createSelectValueMap(
    options: Array<{ label: string; value: string | number }>,
): Map<string, string | number> {
    return new Map(options.map((opt) => [String(opt.value), opt.value]))
}
