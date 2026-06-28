<script setup lang="ts">
import { DataTable } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

interface User extends Record<string, unknown> {
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
</script>

<template>
    <DataTable
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