<script setup lang="ts">
import { DataTable } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

interface User {
    id: number
    name: string
    email: string
    role: string
    status: string
}

const users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'Active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Admin', status: 'Inactive' },
    { id: 6, name: 'Diana Miller', email: 'diana@example.com', role: 'Viewer', status: 'Active' },
    { id: 7, name: 'Edward Davis', email: 'edward@example.com', role: 'Editor', status: 'Inactive' },
    { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', role: 'Viewer', status: 'Active' },
    { id: 9, name: 'George Lee', email: 'george@example.com', role: 'Admin', status: 'Active' },
    { id: 10, name: 'Hannah Kim', email: 'hannah@example.com', role: 'Editor', status: 'Inactive' },
    { id: 11, name: 'Ian Martinez', email: 'ian@example.com', role: 'Viewer', status: 'Active' },
    { id: 12, name: 'Julia Taylor', email: 'julia@example.com', role: 'Admin', status: 'Inactive' },
]

const columns: DataTableColumn<User>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
    { id: 'email', header: 'Email', accessorKey: 'email', sortable: true },
    { id: 'role', header: 'Role', accessorKey: 'role', sortable: true },
    { id: 'status', header: 'Status', accessorKey: 'status', sortable: true },
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