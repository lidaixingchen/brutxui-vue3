<script setup lang="ts">
import { ref } from 'vue'
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputItemDelete } from 'brutx-ui-vue'

const tagsDefault = ref(['vue', 'tailwind', 'brutalism'])
const tagsPrimary = ref(['typescript', 'vite', 'cva'])
const tagsSecondary = ref(['reka-ui', 'lucide', 'pnpm'])
const tagsAccent = ref(['neo-brutalism', 'design', 'tokens'])
const tagsDanger = ref(['bug', 'deprecated', 'breaking'])
const tagsSuccess = ref(['stable', 'tested', 'released'])
</script>

<template>
    <div class="space-y-6">
        <div>
            <h3 class="text-sm font-black mb-3">Default</h3>
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
            <h3 class="text-sm font-black mb-3">Primary</h3>
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
            <h3 class="text-sm font-black mb-3">Secondary</h3>
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
            <h3 class="text-sm font-black mb-3">Accent</h3>
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
            <h3 class="text-sm font-black mb-3">Danger</h3>
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
            <h3 class="text-sm font-black mb-3">Success</h3>
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
    </div>
</template>
