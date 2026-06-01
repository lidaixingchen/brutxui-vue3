<script setup lang="ts">
interface BreadcrumbProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbProps>(), {
    class: '',
})
</script>

<template>
    <nav aria-label="breadcrumb" :class="props.class">
        <slot />
    </nav>
</template>
