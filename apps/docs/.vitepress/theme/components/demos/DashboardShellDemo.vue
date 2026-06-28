<script setup lang="ts">
import { ref } from 'vue'
import { DashboardShell } from 'brutx-ui-vue'

type PageKey = 'dashboard' | 'analytics' | 'settings'

const activePage = ref<PageKey>('dashboard')

const pages: Record<PageKey, { title: string; content: string }> = {
    dashboard: { title: 'Dashboard', content: 'Welcome back! This is your dashboard overview.' },
    analytics: { title: 'Analytics', content: 'View your analytics and statistics here.' },
    settings: { title: 'Settings', content: 'Manage your account settings and preferences.' },
}

function handleSignOut() {
    // 处理登出事件
}
</script>

<template>
    <div class="w-full overflow-x-auto">
        <DashboardShell
            user-email="user@example.com"
            @sign-out="handleSignOut"
        >
            <template #sidebar>
                <button
                    v-for="(page, key) in pages"
                    :key="key"
                    class="block w-full text-left px-2 py-1.5 text-sm font-bold transition-all"
                    :class="activePage === key
                        ? 'bg-brutal-muted border-3 border-brutal shadow-brutal-sm'
                        : 'text-brutal-muted-foreground hover:bg-brutal-muted'"
                    @click="activePage = key"
                >
                    {{ page.title }}
                </button>
            </template>

            <template #header>
                <span class="font-bold">{{ pages[activePage].title }}</span>
            </template>

            <div class="p-4">
                <h3 class="text-xl font-black mb-4">{{ pages[activePage].title }}</h3>
                <p class="text-brutal-muted-foreground">{{ pages[activePage].content }}</p>
            </div>
        </DashboardShell>
    </div>
</template>
