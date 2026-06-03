<script setup lang="ts">
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
const currentPageLarge = ref(5)
const currentPageNoNumbers = ref(3)
const currentPageRounded = ref(4)
const currentPageMinimal = ref(7)
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <Pagination
                v-model:current-page="currentPage"
                :total-pages="3"
            />
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">变体：Default / Rounded / Minimal</h3>
            <div class="space-y-4">
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    variant="default"
                />
                <Pagination
                    v-model:current-page="currentPageRounded"
                    :total-pages="20"
                    variant="rounded"
                />
                <Pagination
                    v-model:current-page="currentPageMinimal"
                    :total-pages="20"
                    variant="minimal"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">尺寸：SM / Default / LG</h3>
            <div class="space-y-4">
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    size="sm"
                />
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    size="default"
                />
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    size="lg"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">siblingCount（相邻页码数）</h3>
            <div class="space-y-4">
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    :sibling-count="0"
                />
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    :sibling-count="1"
                />
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    :sibling-count="2"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">showFirstLast（首页/末页按钮）</h3>
            <div class="space-y-4">
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    :show-first-last="true"
                />
                <Pagination
                    v-model:current-page="currentPageLarge"
                    :total-pages="20"
                    :show-first-last="false"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">showPageNumbers（页码显示模式）</h3>
            <div class="space-y-4">
                <Pagination
                    v-model:current-page="currentPageNoNumbers"
                    :total-pages="20"
                    :show-page-numbers="true"
                />
                <Pagination
                    v-model:current-page="currentPageNoNumbers"
                    :total-pages="20"
                    :show-page-numbers="false"
                />
            </div>
        </div>
    </div>
</template>
