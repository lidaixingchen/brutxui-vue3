<script setup lang="ts">
import { ref } from 'vue'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    Input,
    Button,
} from 'brutx-ui-vue'

const email = ref('')
const password = ref('')

function onSubmit() {
    // eslint-disable-next-line no-alert
    alert(`邮箱: ${email.value}, 密码: ${password.value}`)
}
</script>

<template>
    <div class="w-full max-w-sm">
        <Form class="space-y-4" @submit="onSubmit">
            <FormField name="email">
                <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                        <Input
                            v-model="email"
                            type="email"
                            placeholder="请输入邮箱地址"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
            <FormField name="password">
                <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                        <Input
                            v-model="password"
                            type="password"
                            placeholder="请输入密码"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
            <Button type="submit" class="w-full">
                登录
            </Button>
        </Form>
    </div>
</template>
