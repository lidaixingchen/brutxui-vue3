<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRouter } from 'vitepress'
import { NotFoundPage } from 'brutx-ui-vue'

const { Layout } = DefaultTheme
const router = useRouter()

function handleBack() {
    router.go('/')
}
</script>

<template>
    <Layout>
        <template #not-found>
            <NotFoundPage
                title="页面未找到"
                description="您访问的页面不存在或已被移除。"
                back-text="返回首页"
                @back="handleBack"
            />
        </template>
    </Layout>
</template>
