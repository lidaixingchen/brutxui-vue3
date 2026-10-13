<script setup lang="ts">
import { ref } from 'vue'
import {
    DialogRoot,
    DialogTrigger,
    AlertDialogRoot,
    AlertDialogTrigger,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    PopoverRoot,
    PopoverTrigger,
    SelectRoot,
    SelectTrigger,
    SelectValue,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger,
} from 'reka-ui'
import DialogContent from '@/components/dialog/DialogContent.vue'
import DialogDescription from '@/components/dialog/DialogDescription.vue'
import DialogTitle from '@/components/dialog/DialogTitle.vue'
import AlertDialogContent from '@/components/alert-dialog/AlertDialogContent.vue'
import AlertDialogDescription from '@/components/alert-dialog/AlertDialogDescription.vue'
import AlertDialogTitle from '@/components/alert-dialog/AlertDialogTitle.vue'
import DropdownMenuContent from '@/components/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/dropdown-menu/DropdownMenuItem.vue'
import PopoverContent from '@/components/popover/PopoverContent.vue'
import SelectContent from '@/components/select/SelectContent.vue'
import SelectItem from '@/components/select/SelectItem.vue'
import SheetContent from '@/components/sheet/SheetContent.vue'
import SheetDescription from '@/components/sheet/SheetDescription.vue'
import SheetTitle from '@/components/sheet/SheetTitle.vue'
import TooltipContent from '@/components/tooltip/TooltipContent.vue'

const LONG_MENU_ITEM_COUNT = 32

const dialogOpen = ref(false)
const popoverOpen = ref(false)
const dropdownOpen = ref(false)
const tooltipOpen = ref(false)
const selectOpen = ref(false)
const sheetOpen = ref(false)
const sheetPopoverOpen = ref(false)
const alertOpen = ref(false)
const alertPopoverOpen = ref(false)
const longMenuOpen = ref(false)
const longMenuItems = Array.from({ length: LONG_MENU_ITEM_COUNT }, (_, index) => ({
    id: `item-${index + 1}`,
    label: `Item ${index + 1}`,
}))

defineExpose({
    dialogOpen,
    popoverOpen,
    dropdownOpen,
    tooltipOpen,
    selectOpen,
    sheetOpen,
    sheetPopoverOpen,
    alertOpen,
    alertPopoverOpen,
    longMenuOpen,
})
</script>

<template>
    <div>
        <DialogRoot v-model:open="dialogOpen">
            <DialogTrigger as-child>
                <button id="overlay-dialog-trigger">Open dialog</button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-modal-content" :show-close-button="false">
                <DialogTitle>Overlay layer fixture</DialogTitle>
                <DialogDescription class="sr-only">Dialog content for overlay layer tests</DialogDescription>
                <PopoverRoot v-model:open="popoverOpen">
                    <PopoverTrigger as-child>
                        <button>Open popover</button>
                    </PopoverTrigger>
                    <PopoverContent data-testid="nested-popover-content">
                        Popover content
                    </PopoverContent>
                </PopoverRoot>

                <DropdownMenuRoot v-model:open="dropdownOpen">
                    <DropdownMenuTrigger as-child>
                        <button>Open menu</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent data-testid="nested-dropdown-content">
                        <DropdownMenuItem>Menu item</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenuRoot>

                <TooltipProvider :delay-duration="0">
                    <TooltipRoot v-model:open="tooltipOpen">
                        <TooltipTrigger as-child>
                            <button>Open tooltip</button>
                        </TooltipTrigger>
                        <TooltipContent data-testid="nested-tooltip-content">
                            Tooltip content
                        </TooltipContent>
                    </TooltipRoot>
                </TooltipProvider>

                <SelectRoot v-model:open="selectOpen">
                    <SelectTrigger as-child>
                        <button><SelectValue placeholder="Open select" /></button>
                    </SelectTrigger>
                    <SelectContent data-testid="nested-select-content">
                        <SelectItem value="one">One</SelectItem>
                    </SelectContent>
                </SelectRoot>
            </DialogContent>
        </DialogRoot>

        <DialogRoot v-model:open="sheetOpen">
            <DialogTrigger as-child>
                <button>Open sheet</button>
            </DialogTrigger>
            <SheetContent data-testid="sheet-modal-content">
                <SheetTitle>Sheet layer fixture</SheetTitle>
                <SheetDescription class="sr-only">Sheet content for overlay layer tests</SheetDescription>
                <PopoverRoot v-model:open="sheetPopoverOpen">
                    <PopoverTrigger as-child>
                        <button>Open sheet popover</button>
                    </PopoverTrigger>
                    <PopoverContent data-testid="sheet-popover-content">
                        Sheet popover content
                    </PopoverContent>
                </PopoverRoot>
            </SheetContent>
        </DialogRoot>

        <AlertDialogRoot v-model:open="alertOpen">
            <AlertDialogTrigger as-child>
                <button>Open alert dialog</button>
            </AlertDialogTrigger>
            <AlertDialogContent data-testid="alert-modal-content">
                <AlertDialogTitle>Overlay layer fixture</AlertDialogTitle>
                <AlertDialogDescription>Alert dialog content for overlay layer tests</AlertDialogDescription>
                <PopoverRoot v-model:open="alertPopoverOpen">
                    <PopoverTrigger as-child>
                        <button>Open alert popover</button>
                    </PopoverTrigger>
                    <PopoverContent data-testid="alert-popover-content">
                        Alert popover content
                    </PopoverContent>
                </PopoverRoot>
            </AlertDialogContent>
        </AlertDialogRoot>

        <DropdownMenuRoot v-model:open="longMenuOpen">
            <DropdownMenuTrigger as-child>
                <button id="long-menu-trigger">Open long menu</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                data-testid="long-dropdown-content"
                side="bottom"
                align="start"
            >
                <DropdownMenuItem
                    v-for="item in longMenuItems"
                    :key="item.id"
                >
                    {{ item.label }}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuRoot>
    </div>
</template>
