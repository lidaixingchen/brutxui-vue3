<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex items-center gap-4">
                <Avatar size="sm">
                    <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <Avatar size="default">
                    <AvatarFallback>DF</AvatarFallback>
                </Avatar>
                <Avatar size="lg">
                    <AvatarFallback>LG</AvatarFallback>
                </Avatar>
                <Avatar size="xl">
                    <AvatarFallback>XL</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Shapes</p>
            <div class="flex items-center gap-4">
                <Avatar size="lg" shape="square">
                    <AvatarFallback>SQ</AvatarFallback>
                </Avatar>
                <Avatar size="lg" shape="rounded">
                    <AvatarFallback>RD</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">With Image</p>
            <div class="flex items-center gap-4">
                <Avatar size="lg">
                    <AvatarImage src="https://i.pravatar.cc/150?img=32" alt="User avatar" />
                    <AvatarFallback>UA</AvatarFallback>
                </Avatar>
                <Avatar size="lg" shape="rounded">
                    <AvatarImage src="https://i.pravatar.cc/150?img=44" alt="User avatar" />
                    <AvatarFallback>UA</AvatarFallback>
                </Avatar>
            </div>
        </div>
    </div>
</template>
