<script setup lang="ts">
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Button,
} from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6 w-full">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">默认</p>
            <Card class="max-w-sm">
                <CardHeader>
                    <CardTitle>卡片标题</CardTitle>
                    <CardDescription>卡片描述信息。</CardDescription>
                </CardHeader>
                <CardContent>
                    <p class="text-sm font-medium">
                        这是卡片内容区域，可以放置文本、图片或其他组件。
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="primary">操作</Button>
                </CardFooter>
            </Card>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-wrap gap-4">
                <Card variant="default" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>默认</CardTitle>
                        <CardDescription>标准阴影</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="elevated" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>提升</CardTitle>
                        <CardDescription>更大阴影</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="flat" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>扁平</CardTitle>
                        <CardDescription>无阴影</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="interactive" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>交互式</CardTitle>
                        <CardDescription>悬停查看效果</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="primary" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>主要</CardTitle>
                        <CardDescription>主要颜色边框和阴影</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="secondary" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>次要</CardTitle>
                        <CardDescription>次要颜色边框和阴影</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">内边距</p>
            <div class="flex flex-wrap gap-4">
                <Card padding="none" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">内边距: 无</p>
                    </CardContent>
                </Card>
                <Card padding="sm" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">内边距: 小</p>
                    </CardContent>
                </Card>
                <Card padding="default" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">内边距: 默认</p>
                    </CardContent>
                </Card>
                <Card padding="lg" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">内边距: 大</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>
