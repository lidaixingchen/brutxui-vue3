<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue'
</script>

<template>
    <Tabs default-value="account" class="w-full max-w-sm">
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
</template>
