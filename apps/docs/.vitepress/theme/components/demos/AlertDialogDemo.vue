<script setup lang="ts">
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
    Button,
} from 'brutx-ui-vue'
</script>

<template>
    <AlertDialog>
        <AlertDialogTrigger as-child>
            <Button variant="primary">显示警告弹窗</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>你确定要执行此操作吗？</AlertDialogTitle>
                <AlertDialogDescription>
                    此操作无法撤销。这将永久删除你的账户并从我们的服务器中移除你的数据。
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction variant="danger">删除</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
