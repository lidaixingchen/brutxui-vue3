<script setup lang="ts">
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
const currentPageLarge = ref(5)
const currentPageNoNumbers = ref(3)
const currentPageRounded = ref(4)
const currentPageMinimal = ref(7)
const currentPageJump = ref(10)
const jumpMessage = ref('')
const currentPageLayout = ref(1)
const currentPageLayoutPageSize = ref(10)

function handleJump() {
    const input = window.prompt('跳转到第几页？', String(currentPageJump.value))
    if (input !== null) {
        const page = Number(input)
        if (Number.isFinite(page) && page >= 1 && page <= 50) {
            currentPageJump.value = page
            jumpMessage.value = `已跳转到第 ${page} 页`
        } else {
            jumpMessage.value = '请输入 1-50 之间的有效页码'
        }
    }
}
</script>

<template>
    <div class="space-y-8 max-w-full overflow-x-auto">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <Pagination
                v-model="currentPage"
                :total-pages="3"
            />
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">变体：默认 / 圆角 / 极简</h3>
            <div class="space-y-4">
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    variant="default"
                />
                <Pagination
                    v-model="currentPageRounded"
                    :total-pages="20"
                    variant="rounded"
                />
                <Pagination
                    v-model="currentPageMinimal"
                    :total-pages="20"
                    variant="minimal"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">尺寸：小 / 默认 / 大</h3>
            <div class="space-y-4">
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    size="sm"
                />
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    size="default"
                />
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    size="lg"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">siblingCount（相邻页码数）</h3>
            <div class="space-y-4">
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    :sibling-count="0"
                />
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    :sibling-count="1"
                />
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    :sibling-count="2"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">showFirstLast（首页/末页按钮）</h3>
            <div class="space-y-4">
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    :show-first-last="true"
                />
                <Pagination
                    v-model="currentPageLarge"
                    :total-pages="20"
                    :show-first-last="false"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">showPageNumbers（页码显示模式）</h3>
            <div class="space-y-4">
                <Pagination
                    v-model="currentPageNoNumbers"
                    :total-pages="20"
                    :show-page-numbers="true"
                />
                <Pagination
                    v-model="currentPageNoNumbers"
                    :total-pages="20"
                    :show-page-numbers="false"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">自定义布局与快速跳转（Jumper）</h3>
            <p class="text-xs opacity-70 mb-3 leading-relaxed">
                通过配置 <span class="font-mono font-black">layout</span> 属性，可以自由排列：总条数（total）、每页条数（sizes）、上一页（prev）、页码（pager）、下一页（next）和快速跳转（jumper）。
            </p>
            <div class="space-y-4">
                <Pagination
                    v-model="currentPageLayout"
                    v-model:page-size="currentPageLayoutPageSize"
                    :total="100"
                    layout="total, sizes, prev, pager, next, jumper"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">可点击省略号（jump 事件）</h3>
            <p class="text-xs opacity-70 mb-3 leading-relaxed">
                点击省略号 <span class="font-mono font-black">•••</span> 触发 jump 事件，弹出输入框直接跳转到目标页码。
            </p>
            <Pagination
                v-model="currentPageJump"
                :total-pages="50"
                :sibling-count="1"
                @jump="handleJump"
            />
            <p v-if="jumpMessage" class="text-xs font-bold mt-3 opacity-70">{{ jumpMessage }}</p>
        </div>
    </div>
</template>
