<script setup lang="ts">
import { useToast, ToastContainer, Toast, Button } from 'brutx-ui-vue'

const { toasts, removeToast, addToast, success, error, warning, info } = useToast()
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="font-black text-sm">Variants</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button @click="addToast({ variant: 'default', title: 'Default', description: 'This is a default toast.' })">Default</Button>
                <Button @click="success('Success!', 'Your action was completed successfully.')">Success</Button>
                <Button @click="error('Error!', 'Something went wrong.')">Error</Button>
                <Button @click="warning('Warning!', 'Please be careful.')">Warning</Button>
                <Button @click="info('Info', 'Here is some useful information.')">Info</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">Sizes</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button @click="addToast({ variant: 'success', size: 'sm', title: 'Small', description: 'A compact toast.' })">Small</Button>
                <Button @click="addToast({ variant: 'success', size: 'default', title: 'Default', description: 'A standard toast.' })">Default</Button>
                <Button @click="addToast({ variant: 'success', size: 'lg', title: 'Large', description: 'A spacious toast.' })">Large</Button>
            </div>
        </div>

        <ToastContainer position="bottom-right">
            <Toast
                v-for="toast in toasts"
                :key="toast.id"
                :variant="toast.variant"
                :size="toast.size"
                :title="toast.title"
                :description="toast.description"
                :duration="toast.duration"
                @close="removeToast(toast.id)"
            />
        </ToastContainer>
    </div>
</template>
