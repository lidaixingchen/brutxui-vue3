<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRouter } from 'vitepress'
import { Result, Button } from 'brutx-ui-vue'
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
            <div class="max-w-2xl mx-auto py-20">
                <Result
                    status="error"
                    :title="t('pageNotFound')"
                    :sub-title="t('pageNotFoundDesc')"
                >
                    <template #extra>
                        <Button @click="handleBack">{{ t('backToHome') }}</Button>
                    </template>
                </Result>
            </div>
        </template>
    </Layout>
</template>
