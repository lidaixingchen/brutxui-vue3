<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sparkles, Users, Star } from 'lucide-vue-next'
import { cn } from '../lib/utils'
import Button from './Button.vue'
import Input from './Input.vue'

interface WaitlistPageProps {
    title?: string
    description?: string
    ctaText?: string
    class?: string
}

const props = withDefaults(defineProps<WaitlistPageProps>(), {
    title: 'Join the BrutxUI Waitlist Club',
    ctaText: 'Secure Priority Access',
})

const emit = defineEmits<{
    submit: [email: string]
}>()

const email = ref('')

const rootClasses = computed(() => cn('w-full max-w-lg mx-auto text-center', props.class))

function handleSubmit() {
    if (email.value) {
        emit('submit', email.value)
    }
}
</script>

<template>
    <div :class="rootClasses">
        <div class="inline-flex items-center gap-2 mb-6 bg-brutal-accent px-3 py-1 border-2 border-brutal rotate-[-1deg]">
            <Sparkles class="h-4 w-4 stroke-[3] animate-spin" />
            <span class="font-black text-sm">Early Access</span>
        </div>

        <h1 class="text-3xl font-black tracking-tight">{{ title }}</h1>
        <p v-if="description" class="mt-3 text-gray-600 dark:text-gray-400 font-medium">{{ description }}</p>

        <form class="mt-8 flex flex-col sm:flex-row gap-3" @submit.prevent="handleSubmit">
            <Input v-model="email" type="email" placeholder="you@example.com" class="flex-1" />
            <Button type="submit" variant="primary">{{ ctaText }}</Button>
        </form>

        <div class="mt-8 flex items-center justify-center gap-6 text-sm font-bold text-gray-500">
            <div class="flex items-center gap-1">
                <Users class="h-4 w-4 stroke-[3]" />
                <span>2,847 on waitlist</span>
            </div>
            <div class="flex items-center gap-1">
                <Star v-for="i in 5" :key="i" class="h-3 w-3 fill-brutal-accent text-brutal-accent" />
            </div>
            <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded-full bg-brutal-success animate-pulse" />
                <span>Live</span>
            </div>
        </div>
    </div>
</template>
