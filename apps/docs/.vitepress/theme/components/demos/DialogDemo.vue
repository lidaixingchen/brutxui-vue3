<script setup lang="ts">
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    Button,
} from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">打开</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>编辑资料</DialogTitle>
                <DialogDescription>
                    在此处修改您的个人资料。完成后请点击保存。
                </DialogDescription>
            </DialogHeader>
            <p class="text-sm font-medium">
                这是对话框内容区域。您可以在此处添加表单字段或其他交互元素。
            </p>
            <DialogFooter>
                <DialogClose as-child>
                    <Button variant="outline">取消</Button>
                </DialogClose>
                <Button variant="primary">保存</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
