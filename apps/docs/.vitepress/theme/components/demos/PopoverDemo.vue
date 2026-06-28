<script setup lang="ts">
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
} from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-8">
        <div>
            <p class="text-sm font-bold mb-2">基础用法</p>
            <Popover>
                <PopoverTrigger as-child>
                    <Button variant="outline">
                        打开
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <p class="text-sm font-medium">
                        弹出框内容在此显示。
                    </p>
                </PopoverContent>
            </Popover>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">对齐方式 (align)</p>
            <div class="flex flex-wrap items-center gap-3">
                <Popover>
                    <PopoverTrigger as-child>
                        <Button variant="outline">居中</Button>
                    </PopoverTrigger>
                    <PopoverContent align="center">
                        <p class="text-sm font-medium">align="center"</p>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger as-child>
                        <Button variant="outline">起始</Button>
                    </PopoverTrigger>
                    <PopoverContent align="start">
                        <p class="text-sm font-medium">align="start"</p>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger as-child>
                        <Button variant="outline">结束</Button>
                    </PopoverTrigger>
                    <PopoverContent align="end">
                        <p class="text-sm font-medium">align="end"</p>
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">偏移距离 (sideOffset=20)</p>
            <Popover>
                <PopoverTrigger as-child>
                    <Button variant="outline">大偏移</Button>
                </PopoverTrigger>
                <PopoverContent :side-offset="20">
                    <p class="text-sm font-medium">sideOffset=20</p>
                </PopoverContent>
            </Popover>
        </div>
    </div>
</template>
