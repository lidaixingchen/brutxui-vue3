<script setup lang="ts">
import { ref } from 'vue'
import {
    Upload,
    UploadTrigger,
    UploadFileList,
    type UploadFile,
    type UploadRequestOptions,
} from 'brutx-ui-vue'

// 基础文本列表初始数据
const textFileList = ref<UploadFile[]>([
    {
        id: 'file-1',
        name: 'document.pdf',
        size: 1542000,
        type: 'application/pdf',
        status: 'success',
        progress: 100,
    },
    {
        id: 'file-2',
        name: 'avatar.png',
        size: 320000,
        type: 'image/png',
        status: 'success',
        progress: 100,
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
])

// 缩略图列表初始数据
const pictureFileList = ref<UploadFile[]>([
    {
        id: 'file-3',
        name: 'sunset.jpg',
        size: 2450000,
        type: 'image/jpeg',
        status: 'success',
        progress: 100,
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop',
    },
])

// 卡片列表初始数据
const cardFileList = ref<UploadFile[]>([
    {
        id: 'file-4',
        name: 'landscape.jpg',
        size: 3120000,
        type: 'image/jpeg',
        status: 'success',
        progress: 100,
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=100&h=100&fit=crop',
    },
])

// 限制文件大小和数量常量
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const PICTURE_CARD_LIMIT = 3
const PROGRESS_INCREMENT = 25
const INTERVAL_MS = 250

// 模拟上传请求
async function mockHttpRequest(options: UploadRequestOptions): Promise<void> {
    return new Promise<void>((resolve) => {
        let progress = 0
        const interval = setInterval(() => {
            progress += PROGRESS_INCREMENT
            if (progress >= 100) {
                clearInterval(interval)
                const url = options.file.type.startsWith('image/')
                    ? URL.createObjectURL(options.file)
                    : undefined
                options.onSuccess({ url })
                resolve()
            } else {
                options.onProgress(progress)
            }
        }, INTERVAL_MS)
    })
}
</script>

<template>
    <div class="space-y-8 w-full max-w-xl">
        <!-- 基础 text 类型 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">基础 text 类型</p>
            <Upload
                v-model:file-list="textFileList"
                :http-request="mockHttpRequest"
                accept="application/pdf,image/*"
                :max-size="MAX_FILE_SIZE"
            >
                <template #trigger="{ selectFiles, drag }">
                    <UploadTrigger :drag="drag" @select="selectFiles" />
                </template>
                <template #file-list="{ files, remove, retry }">
                    <UploadFileList :files="files" list-type="text" @remove="remove" @retry="retry" />
                </template>
            </Upload>
        </div>

        <!-- picture 类型 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">picture 缩略图列表类型</p>
            <Upload
                v-model:file-list="pictureFileList"
                :http-request="mockHttpRequest"
                list-type="picture"
                accept="image/*"
                :max-size="MAX_FILE_SIZE"
            >
                <template #trigger="{ selectFiles, drag }">
                    <UploadTrigger :drag="drag" @select="selectFiles" />
                </template>
                <template #file-list="{ files, remove, retry }">
                    <UploadFileList :files="files" list-type="picture" @remove="remove" @retry="retry" />
                </template>
            </Upload>
        </div>

        <!-- picture-card 类型 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">picture-card 照片墙类型（最大限制 {{ PICTURE_CARD_LIMIT }} 张）</p>
            <Upload
                v-model:file-list="cardFileList"
                :http-request="mockHttpRequest"
                list-type="picture-card"
                :limit="PICTURE_CARD_LIMIT"
                accept="image/*"
                :max-size="MAX_FILE_SIZE"
            >
                <template #trigger="{ selectFiles }">
                    <UploadTrigger @select="selectFiles" />
                </template>
                <template #file-list="{ files, remove }">
                    <UploadFileList :files="files" list-type="picture-card" @remove="remove" />
                </template>
            </Upload>
        </div>
    </div>
</template>
