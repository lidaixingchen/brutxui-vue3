<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, Button } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

interface User {
    id: number
    name: string
    email: string
    role: string
    status: string
}

const users: User[] = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '活跃' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: '活跃' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '查看者', status: '未活跃' },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: '编辑', status: '活跃' },
    { id: 5, name: '孙七', email: 'sunqi@example.com', role: '管理员', status: '未活跃' },
    { id: 6, name: '周八', email: 'zhouba@example.com', role: '查看者', status: '活跃' },
    { id: 7, name: '吴九', email: 'wujiu@example.com', role: '编辑', status: '未活跃' },
    { id: 8, name: '郑十', email: 'zhengshi@example.com', role: '查看者', status: '活跃' },
    { id: 9, name: '钱十一', email: 'qian11@example.com', role: '管理员', status: '活跃' },
    { id: 10, name: '陈十二', email: 'chen12@example.com', role: '编辑', status: '未活跃' },
    { id: 11, name: '林十三', email: 'lin13@example.com', role: '查看者', status: '活跃' },
    { id: 12, name: '黄十四', email: 'huang14@example.com', role: '管理员', status: '未活跃' },
]

const columns: DataTableColumn<User>[] = [
    { id: 'name', header: '姓名', accessorKey: 'name', sortable: true },
    { id: 'email', header: '邮箱', accessorKey: 'email', sortable: true },
    { id: 'role', header: '角色', accessorKey: 'role', sortable: true },
    { id: 'status', header: '状态', accessorKey: 'status', sortable: true },
]

// @ts-expect-error vue-tsc cannot infer InstanceType of generic components — known limitation with <script setup generic="T">
const tableRef = ref<InstanceType<typeof DataTable> | null>(null)

function sortByNamAsc() {
    tableRef.value?.sort.toggleSort('name')
}

function clearFilter() {
    tableRef.value?.filter.setGlobalFilter('')
}

function selectAllOnPage() {
    tableRef.value?.selection.toggleAllRows()
}

function clearSelection() {
    tableRef.value?.selection.clearSelection()
}

function goPrevPage() {
    tableRef.value?.pagination.previousPage()
}

function goNextPage() {
    tableRef.value?.pagination.nextPage()
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="primary" size="sm" @click="sortByNamAsc">按姓名排序</Button>
        <Button variant="default" size="sm" @click="clearFilter">清空筛选</Button>
        <Button variant="default" size="sm" @click="selectAllOnPage">全选当前页</Button>
        <Button variant="default" size="sm" @click="clearSelection">清空选择</Button>
        <Button variant="default" size="sm" @click="goPrevPage">上一页</Button>
        <Button variant="default" size="sm" @click="goNextPage">下一页</Button>
    </div>

    <DataTable
        ref="tableRef"
        :data="users"
        :columns="columns"
        :row-key="'id'"
        sortable
        filterable
        selectable
        paginated
        :page-size="5"
    />
</template>
