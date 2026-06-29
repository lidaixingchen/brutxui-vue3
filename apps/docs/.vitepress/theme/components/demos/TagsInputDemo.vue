<script setup lang="ts">
import { ref } from 'vue'
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputItemDelete } from 'brutx-ui-vue'

const tagsDefault = ref(['vue', 'tailwind', 'brutalism'])
const tagsPrimary = ref(['typescript', 'vite', 'cva'])
const tagsSecondary = ref(['reka-ui', 'lucide', 'pnpm'])
const tagsAccent = ref(['neo-brutalism', 'design', 'tokens'])
const tagsDanger = ref(['bug', 'deprecated', 'breaking'])
const tagsSuccess = ref(['stable', 'tested', 'released'])
const tagsLabeled = ref(['vue', 'a11y'])
</script>

<template>
    <div class="space-y-6">
        <div>
            <h3 class="text-sm font-black mb-3">默认</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsDefault">
                    <TagsInputItem v-for="tag in tagsDefault" :key="tag" :value="tag" variant="default">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">主要</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsPrimary">
                    <TagsInputItem v-for="tag in tagsPrimary" :key="tag" :value="tag" variant="primary">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">次要</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsSecondary">
                    <TagsInputItem v-for="tag in tagsSecondary" :key="tag" :value="tag" variant="secondary">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">强调</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsAccent">
                    <TagsInputItem v-for="tag in tagsAccent" :key="tag" :value="tag" variant="accent">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">危险</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsDanger">
                    <TagsInputItem v-for="tag in tagsDanger" :key="tag" :value="tag" variant="danger">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">成功</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsSuccess">
                    <TagsInputItem v-for="tag in tagsSuccess" :key="tag" :value="tag" variant="success">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">自定义 aria-label</h3>
            <div class="w-full max-w-[400px]">
                <TagsInput v-model="tagsLabeled" aria-label="文章标签">
                    <TagsInputItem v-for="tag in tagsLabeled" :key="tag" :value="tag" variant="primary">
                        <TagsInputItemText>{{ tag }}</TagsInputItemText>
                        <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput placeholder="添加标签..." />
                </TagsInput>
            </div>
        </div>
    </div>
</template>
