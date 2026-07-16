<script setup lang="ts">
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
} from 'brutx-ui-vue'
import { DialogRoot as Dialog, DialogTrigger, DialogClose } from 'reka-ui'
</script>

<template>
    <div class="flex flex-wrap items-center gap-3">
        <Dialog>
            <DialogTrigger as-child>
                <Button variant="primary">默认尺寸</Button>
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

        <Dialog>
            <DialogTrigger as-child>
                <Button variant="outline">小型 sm</Button>
            </DialogTrigger>
            <DialogContent size="sm">
                <DialogHeader>
                    <DialogTitle>确认删除</DialogTitle>
                    <DialogDescription>此操作不可撤销，确定要继续吗？</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button variant="danger">确认删除</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger as-child>
                <Button variant="outline">大型 lg</Button>
            </DialogTrigger>
            <DialogContent size="lg">
                <DialogHeader>
                    <DialogTitle>详细设置</DialogTitle>
                    <DialogDescription>在此处配置高级选项，所有更改将立即生效。</DialogDescription>
                </DialogHeader>
                <div class="space-y-3">
                    <p class="text-sm font-medium">大型对话框适用于多列表单或详细设置面板。</p>
                    <p class="text-sm font-medium">您可以在此处放置更多内容，宽度最大为 max-w-2xl。</p>
                </div>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button variant="primary">应用</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger as-child>
                <Button variant="outline">超大型 xl</Button>
            </DialogTrigger>
            <DialogContent size="xl">
                <DialogHeader>
                    <DialogTitle>数据详情</DialogTitle>
                    <DialogDescription>查看完整的数据信息与关联记录。</DialogDescription>
                </DialogHeader>
                <div class="space-y-3">
                    <p class="text-sm font-medium">超大型对话框适用于复杂数据展示或大幅内容。</p>
                    <p class="text-sm font-medium">宽度最大为 max-w-4xl，可容纳更多列与信息。</p>
                </div>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">关闭</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
