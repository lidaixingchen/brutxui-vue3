/**
 * 关键组件渲染性能基准（§4.1）
 *
 * 使用 Vitest 4+ 内置 bench 能力（底层 tinybench）。
 * bench 结果不作为 CI 门禁，仅作 PR 对比报告的信息性输出。
 *
 * 运行：
 *   pnpm --filter brutx-ui-vue bench           # 本地查看 markdown 表格
 *   pnpm --filter brutx-ui-vue bench:json      # 输出 JSON 供 CI 对比脚本消费
 *
 * 采样时长 1000ms（vitest bench 默认值）：兼顾统计稳定性与 CI 总耗时。
 * 100/1000 是大列表性能回归的典型观测点。
 */
import { bench, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../src/components/data-table/DataTable.vue'
import TreeView from '../src/components/tree-view/TreeView.vue'
import type { DataTableColumn } from '../src/components/data-table/types'
import type { TreeNode } from '../src/components/tree-view/types'

interface Row {
    id: number
    name: string
}

function makeRows(n: number): Row[] {
    return Array.from({ length: n }, (_, i) => ({ id: i, name: `Row ${i}` }))
}

function makeNodes(n: number): TreeNode[] {
    return Array.from({ length: n }, (_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
        isLeaf: true,
    }))
}

const columns: DataTableColumn<Row>[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'name', header: 'Name', accessorKey: 'name' },
]

describe('DataTable render', () => {
    bench('100 rows', () => {
        const wrapper = mount(DataTable, {
            props: { data: makeRows(100), columns, rowKey: 'id' },
        })
        wrapper.unmount()
    }, { time: 1000 })

    bench('1000 rows', () => {
        const wrapper = mount(DataTable, {
            props: { data: makeRows(1000), columns, rowKey: 'id' },
        })
        wrapper.unmount()
    }, { time: 1000 })
})

describe('TreeView render', () => {
    bench('100 nodes', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: makeNodes(100) },
        })
        wrapper.unmount()
    }, { time: 1000 })

    bench('1000 nodes', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: makeNodes(1000) },
        })
        wrapper.unmount()
    }, { time: 1000 })
})
