<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex items-center gap-4">
                <Avatar size="sm">
                    <AvatarFallback>小</AvatarFallback>
                </Avatar>
                <Avatar size="default">
                    <AvatarFallback>默认</AvatarFallback>
                </Avatar>
                <Avatar size="lg">
                    <AvatarFallback>大</AvatarFallback>
                </Avatar>
                <Avatar size="xl">
                    <AvatarFallback>特大</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">形状</p>
            <div class="flex items-center gap-4">
                <Avatar size="lg" shape="square">
                    <AvatarFallback>方形</AvatarFallback>
                </Avatar>
                <Avatar size="lg" shape="rounded">
                    <AvatarFallback>圆角</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">带图片</p>
            <div class="flex items-center gap-4">
                <Avatar size="lg">
                    <AvatarImage src="https://i.pravatar.cc/150?img=32" alt="用户头像" />
                    <AvatarFallback>用户</AvatarFallback>
                </Avatar>
                <Avatar size="lg" shape="rounded">
                    <AvatarImage src="https://i.pravatar.cc/150?img=44" alt="用户头像" />
                    <AvatarFallback>用户</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex items-center gap-4">
                <Avatar size="lg" variant="default">
                    <AvatarFallback>默</AvatarFallback>
                </Avatar>
                <Avatar size="lg" variant="primary">
                    <AvatarFallback>主</AvatarFallback>
                </Avatar>
                <Avatar size="lg" variant="secondary">
                    <AvatarFallback>次</AvatarFallback>
                </Avatar>
                <Avatar size="lg" variant="accent">
                    <AvatarFallback>强</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">状态</p>
            <div class="flex items-center gap-4">
                <Avatar size="lg" status="online">
                    <AvatarFallback>在</AvatarFallback>
                </Avatar>
                <Avatar size="lg" status="offline">
                    <AvatarFallback>离</AvatarFallback>
                </Avatar>
                <Avatar size="lg" status="busy">
                    <AvatarFallback>忙</AvatarFallback>
                </Avatar>
                <Avatar size="lg" status="none">
                    <AvatarFallback>无</AvatarFallback>
                </Avatar>
            </div>
        </div>
    </div>
</template>
