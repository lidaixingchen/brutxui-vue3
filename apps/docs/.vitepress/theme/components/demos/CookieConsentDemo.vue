<script setup lang="ts">
import { CookieConsent } from 'brutx-ui-vue'
</script>

<template>
    <div class="w-full overflow-x-auto relative" style="min-height: 200px;">
        <!-- cn 基于 tailwind-merge：class 中的 absolute 与默认 fixed 属同组定位类，后者胜出，
             无需 !important 即可覆盖默认固定定位，用于文档内嵌演示 -->
        <CookieConsent class="absolute" />
    </div>
</template>
