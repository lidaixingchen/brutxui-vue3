<script setup lang="ts">
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from 'brutx-ui-vue'

const rows = [
    { name: '发票 #001', status: '已支付', amount: '$250.00' },
    { name: '发票 #002', status: '待处理', amount: '$150.00' },
]
</script>

<template>
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>金额</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-for="row in rows" :key="row.name">
                <TableCell>{{ row.name }}</TableCell>
                <TableCell>{{ row.status }}</TableCell>
                <TableCell>{{ row.amount }}</TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>
