<script setup lang="ts">
import { computed } from 'vue'
import { Mail, Lock } from 'lucide-vue-next'
import { cn } from '../lib/utils'
import Button from './Button.vue'
import Card from './Card.vue'
import CardHeader from './CardHeader.vue'
import CardContent from './CardContent.vue'
import CardTitle from './CardTitle.vue'
import CardDescription from './CardDescription.vue'
import CardFooter from './CardFooter.vue'
import Input from './Input.vue'
import LabelRoot from './Label.vue'

interface AuthCardProps {
    title?: string
    description?: string
    class?: string
}

const props = withDefaults(defineProps<AuthCardProps>(), {
    title: 'Welcome back',
    description: 'Sign in to your account to continue',
    class: '',
})

const emit = defineEmits<{
    loginSubmit: []
    forgotPassword: []
    googleClick: []
    githubClick: []
}>()

const rootClasses = computed(() => cn('w-full max-w-md mx-auto', props.class))

function handleSubmit() {
    emit('loginSubmit')
}
</script>

<template>
    <Card :class="rootClasses" variant="default">
        <CardHeader>
            <CardTitle class="text-2xl">
{{ title }}
</CardTitle>
            <CardDescription>{{ description }}</CardDescription>
        </CardHeader>
        <CardContent>
            <div class="grid grid-cols-2 gap-3 mb-6">
                <Button variant="outline" class="w-full" @click="emit('googleClick')">
                    <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Google
                </Button>
                <Button variant="outline" class="w-full" @click="emit('githubClick')">
                    <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    GitHub
                </Button>
            </div>

            <div class="relative mb-6">
                <div class="absolute inset-0 flex items-center">
<div class="w-full border-t-3 border-brutal" />
</div>
                <div class="relative flex justify-center text-xs">
<span class="bg-brutal-bg px-2 font-bold text-gray-500">or email login</span>
</div>
            </div>

            <form class="space-y-4" @submit.prevent="handleSubmit">
                <div class="space-y-2">
                    <LabelRoot for="email">
Email
</LabelRoot>
                    <div class="relative">
                        <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[3] text-gray-400" />
                        <Input id="email" type="email" placeholder="you@example.com" input-size="default" class="pl-10" />
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <LabelRoot for="password">
Password
</LabelRoot>
                        <button type="button" class="text-sm font-bold text-brutal-primary" @click="emit('forgotPassword')">
Forgot password?
</button>
                    </div>
                    <div class="relative">
                        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[3] text-gray-400" />
                        <Input id="password" type="password" placeholder="••••••••" input-size="default" class="pl-10" />
                    </div>
                </div>
                <Button type="submit" variant="primary" class="w-full">
Sign In
</Button>
            </form>
        </CardContent>
        <CardFooter class="justify-center">
            <p class="text-sm font-medium text-gray-500">
                Don't have an account? <span class="font-bold text-brutal-primary cursor-pointer">Register</span>
            </p>
        </CardFooter>
    </Card>
</template>
