<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRouter } from 'vitepress'
import { NotFoundPage } from 'brutx-ui-vue'
import { useI18n } from './lib/i18n'

const { Layout } = DefaultTheme
const router = useRouter()
const { t } = useI18n()

function handleBack() {
    router.go('/')
}
</script>

<template>
    <Layout>
        <template #not-found>
            <NotFoundPage
                :title="t('pageNotFound')"
                :description="t('pageNotFoundDesc')"
                :back-text="t('backToHome')"
                @back="handleBack"
            />
        </template>
    </Layout>
</template>
