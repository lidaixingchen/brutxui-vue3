<script setup lang="ts">
import { ref } from 'vue'
import {
    DropdownMenuRoot,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger,
} from 'reka-ui'
import Button from '@/components/button/Button.vue'
import DropdownMenuContent from '@/components/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuSubContent from '@/components/dropdown-menu/DropdownMenuSubContent.vue'
import TooltipContent from '@/components/tooltip/TooltipContent.vue'

const scopes = [
    { id: 'default', className: '' },
    { id: 'pastel-dark', className: 'theme-pastel dark' },
    { id: 'mono', className: 'theme-mono' },
]
const panelBackgroundOverride = 'rgb(12, 34, 56)'
const scopeLayout = { display: 'flex', alignItems: 'flex-start', gap: '4rem', padding: '2rem' }

const tooltipOpen = ref(false)
const dropdownOpen = ref(false)
const submenuOpen = ref(false)

</script>

<template>
    <TooltipProvider :delay-duration="0">
        <div
            v-for="scope in scopes"
            :key="scope.id"
            :class="scope.className"
            :style="scopeLayout"
            :data-testid="`${scope.id}-scope`"
        >
            <TooltipRoot :default-open="true">
                <TooltipTrigger as-child>
                    <Button :data-testid="`${scope.id}-tooltip-trigger`">{{ scope.id }} tooltip</Button>
                </TooltipTrigger>
                <TooltipContent
                    :class="scope.id === 'mono' ? 'text-brutal-primary-foreground' : undefined"
                    :style="scope.id === 'mono' ? { backgroundColor: panelBackgroundOverride } : undefined"
                    :data-testid="`${scope.id}-tooltip-content`"
                >
                    {{ scope.id }} tooltip panel
                </TooltipContent>
            </TooltipRoot>

            <DropdownMenuRoot :modal="false">
                <DropdownMenuTrigger as-child>
                    <Button :data-testid="`${scope.id}-dropdown-trigger`">{{ scope.id }} menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    :class="scope.id === 'mono' ? 'text-brutal-primary-foreground' : undefined"
                    :style="scope.id === 'mono' ? { '--brutal-bg': panelBackgroundOverride } : undefined"
                    :data-testid="`${scope.id}-dropdown-content`"
                >
                    <DropdownMenuItem>Menu item</DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :data-testid="`${scope.id}-submenu-trigger`">
                            More
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent :data-testid="`${scope.id}-submenu-content`">
                            <DropdownMenuItem>Nested item</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenuRoot>
        </div>

        <div class="theme-pastel dark" :style="scopeLayout" data-testid="interactive-scope">
            <TooltipRoot v-model:open="tooltipOpen">
                <TooltipTrigger as-child>
                    <Button data-testid="interactive-tooltip-trigger">Interactive tooltip</Button>
                </TooltipTrigger>
                <TooltipContent data-testid="interactive-tooltip-content">
                    Interactive tooltip panel
                </TooltipContent>
            </TooltipRoot>

            <DropdownMenuRoot v-model:open="dropdownOpen" :modal="false">
                <DropdownMenuTrigger as-child>
                    <Button data-testid="interactive-dropdown-trigger">Interactive menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent data-testid="interactive-dropdown-content">
                    <DropdownMenuSub v-model:open="submenuOpen">
                        <DropdownMenuSubTrigger data-testid="interactive-submenu-trigger">
                            More
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent data-testid="interactive-submenu-content">
                                <DropdownMenuItem>Nested item</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenuRoot>
        </div>
    </TooltipProvider>
</template>
