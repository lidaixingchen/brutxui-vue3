<script setup lang="ts">
import {
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    Button,
} from 'brutx-ui-vue'
import { DropdownMenuRoot as DropdownMenu, DropdownMenuTrigger, DropdownMenuGroup } from 'reka-ui'
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">
                打开菜单
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuGroup>
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem>编辑</DropdownMenuItem>
                <DropdownMenuItem>复制</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-brutal-destructive">
                    删除
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
