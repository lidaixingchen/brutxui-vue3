<script setup lang="ts">
import { ref } from 'vue'
import {
    Button,
    DataTable,
    Form,
    FormField,
    Select,
} from 'brutx-ui-vue'
import type { DataTableColumn, SelectOption } from 'brutx-ui-vue'
import { Button as SubButton } from 'brutx-ui-vue/button'
import { DataTable as SubDataTable } from 'brutx-ui-vue/data-table'
import { Form as SubForm } from 'brutx-ui-vue/form'
import { Select as SubSelect } from 'brutx-ui-vue/select'

interface ConsumerUser {
    id: number
    name: string
    active: boolean
}

const users: ConsumerUser[] = [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false },
]

const columns: DataTableColumn<ConsumerUser>[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => {
            const userName: string = row.name
            return userName
        },
    },
]

const selectedValue = ref<string>('option1')
const options: SelectOption[] = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
]

const selectedUserCount = ref(0)
const lastSubmittedValue = ref<unknown>(null)

function handleSelect(rows: ConsumerUser[]) {
    selectedUserCount.value = rows.length
}

function handleSubmit(values: Record<string, unknown>) {
    lastSubmittedValue.value = values['username']
}
</script>

<template>
    <div>
        <Button variant="primary" size="default">Button</Button>
        <SubButton variant="secondary" size="sm">Sub Button</SubButton>

        <DataTable
            :data="users"
            :columns="columns"
            row-key="id"
            selectable
            @select="handleSelect"
        >
            <template #cell-name="{ row }">
                <span>{{ row.name }}</span>
            </template>
        </DataTable>

        <SubDataTable
            :data="users"
            :columns="columns"
            row-key="id"
        />

        <Form @submit="handleSubmit">
            <FormField name="username" />
        </Form>
        <SubForm @submit="handleSubmit" />

        <Select
            v-model="selectedValue"
            :options="options"
        />
        <SubSelect
            v-model="selectedValue"
            :options="options"
        />

        <div>Count: {{ selectedUserCount }}</div>
        <div>Submitted: {{ String(lastSubmittedValue) }}</div>
    </div>
</template>
