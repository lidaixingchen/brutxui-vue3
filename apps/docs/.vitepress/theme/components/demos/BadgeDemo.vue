<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from 'brutx-ui-vue'
import { CheckCircle, AlertTriangle, Star } from '@lucide/vue'

const tags = ref(['Vue', 'TypeScript', 'Tailwind CSS'])

function handleClose(index: number) {
    tags.value.splice(index, 1)
}
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge>默认</Badge>
                <Badge variant="primary">主要</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="accent">强调</Badge>
                <Badge variant="danger">危险</Badge>
                <Badge variant="success">成功</Badge>
                <Badge variant="outline">轮廓</Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge size="sm">小</Badge>
                <Badge size="default">默认</Badge>
                <Badge size="lg">大</Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">圆点指示器</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge dot>在线</Badge>
                <Badge variant="success" dot>可用</Badge>
                <Badge variant="danger" dot>离线</Badge>
                <Badge variant="accent" dot size="sm">小尺寸</Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">脉冲动画</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge variant="success" pulse>实时同步中</Badge>
                <Badge variant="danger" pulse>新消息</Badge>
                <Badge variant="primary" pulse>直播中</Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">图标插槽</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge variant="success">
                    <template #icon>
                        <CheckCircle class="h-3.5 w-3.5" />
                    </template>
                    已完成
                </Badge>
                <Badge variant="danger">
                    <template #icon>
                        <AlertTriangle class="h-3.5 w-3.5" />
                    </template>
                    需要注意
                </Badge>
                <Badge variant="accent" closable>
                    <template #icon>
                        <Star class="h-3.5 w-3.5" />
                    </template>
                    收藏
                </Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">可关闭徽标</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge
                    v-for="(tag, index) in tags"
                    :key="tag"
                    variant="primary"
                    closable
                    @close="handleClose(index)"
                >
                    {{ tag }}
                </Badge>
                <span v-if="tags.length === 0" class="text-sm text-brutal-fg">所有标签已关闭</span>
            </div>
        </div>
    </div>
</template>
