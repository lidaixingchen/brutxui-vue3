<script setup lang="ts">
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from 'brutx-ui-vue'
</script>

<template>
    <div class="w-full max-w-sm">
        <Select>
            <SelectTrigger>
                <SelectValue placeholder="请选择一个水果..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="apple">苹果</SelectItem>
                <SelectItem value="banana">香蕉</SelectItem>
                <SelectItem value="cherry">樱桃</SelectItem>
            </SelectContent>
        </Select>
    </div>
</template>
