<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue'
import type { TabItem } from 'brutx-ui-vue'

const arrayTabs: TabItem[] = [
    { label: '概览', value: 'overview' },
    { label: '分析', value: 'analytics' },
    { label: '设置', value: 'settings' },
]
</script>

<template>
    <div class="space-y-8 w-full max-w-sm">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">水平布局（默认）</p>
            <Tabs default-value="account">
                <TabsList>
                    <TabsTrigger value="account">账户</TabsTrigger>
                    <TabsTrigger value="password">密码</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <p class="text-sm font-medium">
                        在此修改您的账户信息。完成后请点击保存。
                    </p>
                </TabsContent>
                <TabsContent value="password">
                    <p class="text-sm font-medium">
                        在此修改您的密码。保存后将自动退出登录。
                    </p>
                </TabsContent>
            </Tabs>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">垂直布局</p>
            <Tabs default-value="general" orientation="vertical" class="flex gap-4">
                <TabsList>
                    <TabsTrigger value="general">通用</TabsTrigger>
                    <TabsTrigger value="security">安全</TabsTrigger>
                    <TabsTrigger value="notifications">通知</TabsTrigger>
                </TabsList>
                <div class="flex-1">
                    <TabsContent value="general">
                        <p class="text-sm font-medium">
                            通用设置选项，包括语言、主题等基础配置。
                        </p>
                    </TabsContent>
                    <TabsContent value="security">
                        <p class="text-sm font-medium">
                            安全设置选项，包括密码、两步验证等。
                        </p>
                    </TabsContent>
                    <TabsContent value="notifications">
                        <p class="text-sm font-medium">
                            通知设置选项，包括邮件、推送等提醒方式。
                        </p>
                    </TabsContent>
                </div>
            </Tabs>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">数据驱动模式（tabs prop）</p>
            <Tabs :tabs="arrayTabs" model-value="overview" />
        </div>
    </div>
</template>
