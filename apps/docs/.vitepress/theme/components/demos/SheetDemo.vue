<script setup lang="ts">
import {
    Sheet, SheetTrigger, SheetContent, SheetHeader,
    SheetTitle, SheetDescription, SheetFooter, Button,
} from 'brutx-ui-vue'
</script>

<template>
    <Sheet>
        <SheetTrigger>
            <Button>打开抽屉</Button>
        </SheetTrigger>
        <SheetContent side="right">
            <SheetHeader>
                <SheetTitle>抽屉标题</SheetTitle>
                <SheetDescription>
                    这是一个抽屉描述。您可以在此放置任何内容。
                </SheetDescription>
            </SheetHeader>
            <div class="py-4">
                <p class="text-sm font-medium">
                    这是抽屉的主要内容区域。您可以在此放置表单、导航链接或其他任何内容。
                </p>
            </div>
            <SheetFooter>
                <Button>保存更改</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
