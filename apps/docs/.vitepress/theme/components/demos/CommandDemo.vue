<script setup lang="ts">
import { ref } from 'vue'
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
    CommandDialog,
} from 'brutx-ui-vue'

const dialogOpen = ref(false)
const commandRef = ref<InstanceType<typeof Command> | null>(null)

function handleSelect(_value: string) {
    // 处理选择事件
}

function setFilter(value: string) {
    if (commandRef.value) {
        commandRef.value.filterSearch = value
    }
}
</script>

<template>
    <div class="flex flex-col gap-8">
        <div>
            <h3 class="mb-4 text-lg font-black">基础用法</h3>
            <Command class="w-full max-w-md border-3 border-brutal shadow-brutal">
                <CommandInput placeholder="输入命令或搜索..." />
                <CommandList>
                    <CommandEmpty />
                    <CommandGroup heading="建议">
                        <CommandItem value="calendar" @select="handleSelect">
                            日历
                        </CommandItem>
                        <CommandItem value="search-emoji" @select="handleSelect">
                            搜索表情
                        </CommandItem>
                        <CommandItem value="calculator" @select="handleSelect">
                            计算器
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="设置">
                        <CommandItem value="profile" @select="handleSelect">
                            个人资料
                            <CommandShortcut>⌘P</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="billing" @select="handleSelect">
                            账单
                            <CommandShortcut>⌘B</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="settings" @select="handleSelect">
                            设置
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>

        <div>
            <h3 class="mb-4 text-lg font-black">命令对话框</h3>
            <button
                class="border-3 border-brutal bg-brutal-primary px-4 py-2 font-black text-brutal-bg shadow-brutal active:translate-y-[2px] active:shadow-none transition-all"
                @click="dialogOpen = true"
            >
                打开命令面板
            </button>
            <CommandDialog v-model:open="dialogOpen">
                <CommandInput placeholder="输入命令..." />
                <CommandList>
                    <CommandEmpty />
                    <CommandGroup heading="操作">
                        <CommandItem value="new-file" @select="handleSelect">
                            新建文件
                            <CommandShortcut>⌘N</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="open-file" @select="handleSelect">
                            打开文件
                            <CommandShortcut>⌘O</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="save-file" @select="handleSelect">
                            保存
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="导航">
                        <CommandItem value="go-home" @select="handleSelect">
                            前往首页
                        </CommandItem>
                        <CommandItem value="go-settings" @select="handleSelect">
                            前往设置
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </div>

        <div>
            <h3 class="mb-4 text-lg font-black">程序化控制（filterSearch）</h3>
            <p class="mb-3 text-xs opacity-70 leading-relaxed">
                通过 ref 写入 <span class="font-mono font-black">filterSearch</span> 可在不操作输入框的情况下触发过滤。
            </p>
            <div class="mb-3 flex flex-wrap gap-2">
                <button
                    class="border-3 border-brutal bg-brutal-primary px-3 py-1 text-sm font-black text-brutal-bg shadow-brutal active:translate-y-[2px] active:shadow-none transition-all"
                    @click="setFilter('cal')"
                >
                    搜索 "cal"
                </button>
                <button
                    class="border-3 border-brutal bg-brutal-primary px-3 py-1 text-sm font-black text-brutal-bg shadow-brutal active:translate-y-[2px] active:shadow-none transition-all"
                    @click="setFilter('设置')"
                >
                    搜索 "设置"
                </button>
                <button
                    class="border-3 border-brutal px-3 py-1 text-sm font-black shadow-brutal active:translate-y-[2px] active:shadow-none transition-all"
                    @click="setFilter('')"
                >
                    清除
                </button>
            </div>
            <Command ref="commandRef" class="w-full max-w-md border-3 border-brutal shadow-brutal">
                <CommandInput placeholder="输入命令或搜索..." />
                <CommandList>
                    <CommandEmpty />
                    <CommandGroup heading="建议">
                        <CommandItem value="calendar" @select="handleSelect">
                            日历
                        </CommandItem>
                        <CommandItem value="search-emoji" @select="handleSelect">
                            搜索表情
                        </CommandItem>
                        <CommandItem value="calculator" @select="handleSelect">
                            计算器
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="设置">
                        <CommandItem value="profile" @select="handleSelect">
                            个人资料
                        </CommandItem>
                        <CommandItem value="settings" @select="handleSelect">
                            设置
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    </div>
</template>
