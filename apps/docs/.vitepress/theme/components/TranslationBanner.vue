<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter, lang } = useData()

const translated = frontmatter.value.translated ?? true
const isEn = lang.value.startsWith('en')
</script>

<template>
    <div v-if="isEn && !translated" class="translation-banner">
        <span class="banner-icon">🌐</span>
        <span class="banner-text">
            This page is currently available in Chinese only.
        </span>
        <a class="banner-link" href="#" onclick="history.back()">Switch back</a>
    </div>
</template>

<style scoped>
.translation-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    background: var(--brutal-muted, #f5f5f5);
    border: 2px solid var(--brutal-border-color, #000);
    box-shadow: 2px 2px 0 0 var(--brutal-border-color, #000);
}

.banner-icon {
    font-size: 1rem;
}

.banner-text {
    color: var(--vp-c-text-2);
}

.banner-link {
    color: var(--brutal-primary, #ff6b6b);
    text-decoration: underline;
    font-weight: 700;
}

.banner-link:hover {
    text-decoration: none;
}
</style>
