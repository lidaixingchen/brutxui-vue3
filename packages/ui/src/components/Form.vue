<script setup lang="ts">
interface FormProps {
    class?: string
}

const props = defineProps<FormProps>()
</script>

<template>
    <form :class="props.class">
        <slot />
    </form>
</template>
