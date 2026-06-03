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

function handleSelect(value: string) {
    console.log('Selected:', value)
}
</script>

<template>
    <div class="flex flex-col gap-8">
        <div>
            <h3 class="mb-4 text-lg font-black">基础用法</h3>
            <Command class="w-full max-w-md border-3 border-brutal shadow-brutal">
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty />
                    <CommandGroup heading="Suggestions">
                        <CommandItem value="calendar" @select="handleSelect">
                            Calendar
                        </CommandItem>
                        <CommandItem value="search-emoji" @select="handleSelect">
                            Search Emoji
                        </CommandItem>
                        <CommandItem value="calculator" @select="handleSelect">
                            Calculator
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem value="profile" @select="handleSelect">
                            Profile
                            <CommandShortcut>⌘P</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="billing" @select="handleSelect">
                            Billing
                            <CommandShortcut>⌘B</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="settings" @select="handleSelect">
                            Settings
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
                Open Command Palette
            </button>
            <CommandDialog v-model:open="dialogOpen">
                <CommandInput placeholder="Type a command..." />
                <CommandList>
                    <CommandEmpty />
                    <CommandGroup heading="Actions">
                        <CommandItem value="new-file" @select="handleSelect">
                            New File
                            <CommandShortcut>⌘N</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="open-file" @select="handleSelect">
                            Open File
                            <CommandShortcut>⌘O</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="save-file" @select="handleSelect">
                            Save
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Navigation">
                        <CommandItem value="go-home" @select="handleSelect">
                            Go to Home
                        </CommandItem>
                        <CommandItem value="go-settings" @select="handleSelect">
                            Go to Settings
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </div>
    </div>
</template>
