<script setup lang="ts">
import {
    TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button,
} from 'brutx-ui-vue'
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger>
                <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Tooltip content</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
