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
            <p class="text-sm font-bold tracking-wide">Default</p>
            <Card class="max-w-sm">
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description goes here with some details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p class="text-sm font-medium">
                        This is the card content area. You can place any content here such as
                        text, images, or other components.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="primary">Action</Button>
                </CardFooter>
            </Card>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Variants</p>
            <div class="flex flex-wrap gap-4">
                <Card variant="default" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>Default</CardTitle>
                        <CardDescription>Standard shadow-brutal</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="elevated" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>Elevated</CardTitle>
                        <CardDescription>Larger shadow-brutal-lg</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="flat" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>Flat</CardTitle>
                        <CardDescription>No shadow</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="interactive" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>Interactive</CardTitle>
                        <CardDescription>Hover to see effect</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="primary" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>Primary</CardTitle>
                        <CardDescription>Primary colored border &amp; shadow</CardDescription>
                    </CardHeader>
                </Card>
                <Card variant="secondary" class="max-w-xs">
                    <CardHeader>
                        <CardTitle>Secondary</CardTitle>
                        <CardDescription>Secondary colored border &amp; shadow</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Padding</p>
            <div class="flex flex-wrap gap-4">
                <Card padding="none" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">Padding: none</p>
                    </CardContent>
                </Card>
                <Card padding="sm" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">Padding: sm</p>
                    </CardContent>
                </Card>
                <Card padding="default" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">Padding: default</p>
                    </CardContent>
                </Card>
                <Card padding="lg" class="max-w-xs">
                    <CardContent>
                        <p class="text-sm font-medium">Padding: lg</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>
