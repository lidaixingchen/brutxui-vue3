<script setup lang="ts">
import { ref } from 'vue'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'brutx-ui-vue'

const activeItem = ref('item-1')
const activeFlat = ref('flat-1')
const activeGhost = ref('ghost-1')
const activeInteractive = ref('interactive-1')
</script>

<template>
    <div class="w-full max-w-[500px] space-y-8">
        <div class="space-y-2">
            <p class="font-black text-sm">默认</p>
            <Accordion type="single" collapsible v-model="activeItem">
                <AccordionItem value="item-1">
                    <AccordionTrigger>什么是 BrutxUI？</AccordionTrigger>
                    <AccordionContent>
                        BrutxUI 是一个面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist（新粗野主义）风格 UI 组件库。它具有高对比度的边框、实心阴影、大胆的配色以及极具物理触感的交互设计。
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>它支持无障碍吗？</AccordionTrigger>
                    <AccordionContent>
                        是的。BrutxUI 采用 reka-ui 无头组件原语作为底层骨架，内置完善的 WAI-ARIA 规范和键盘导航逻辑。
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" variant="interactive">
                    <AccordionTrigger>为什么它会有点击位移？</AccordionTrigger>
                    <AccordionContent>
                        这是粗野主义交互的灵魂——所有的可点击元素在被按下时都会发生位移（并清除阴影），以便为用户提供极度拟真的物理反馈。
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">扁平</p>
            <Accordion type="single" collapsible v-model="activeFlat">
                <AccordionItem value="flat-1" variant="flat">
                    <AccordionTrigger>什么是 BrutxUI？</AccordionTrigger>
                    <AccordionContent>
                        BrutxUI 是一个面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist（新粗野主义）风格 UI 组件库。
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="flat-2" variant="flat">
                    <AccordionTrigger>它支持无障碍吗？</AccordionTrigger>
                    <AccordionContent>
                        是的。BrutxUI 采用 reka-ui 无头组件原语作为底层骨架，内置完善的 WAI-ARIA 规范和键盘导航逻辑。
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">幽灵</p>
            <Accordion type="single" collapsible v-model="activeGhost">
                <AccordionItem value="ghost-1" variant="ghost">
                    <AccordionTrigger>什么是 BrutxUI？</AccordionTrigger>
                    <AccordionContent>
                        BrutxUI 是一个面向 Vue 3 + Tailwind CSS 的 Neo-Brutalist（新粗野主义）风格 UI 组件库。
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="ghost-2" variant="ghost">
                    <AccordionTrigger>它支持无障碍吗？</AccordionTrigger>
                    <AccordionContent>
                        是的。BrutxUI 采用 reka-ui 无头组件原语作为底层骨架，内置完善的 WAI-ARIA 规范和键盘导航逻辑。
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">交互（interactive）</p>
            <Accordion type="single" collapsible v-model="activeInteractive">
                <AccordionItem value="interactive-1" variant="interactive">
                    <AccordionTrigger>悬停时会发生什么？</AccordionTrigger>
                    <AccordionContent>
                        整个面板会出现阴影放大与位移，内容区也会带有轻微高亮，强化可点击的物理反馈。
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="interactive-2" variant="interactive">
                    <AccordionTrigger>内容区样式如何继承？</AccordionTrigger>
                    <AccordionContent>
                        内容区自动继承父级 AccordionItem 的 variant，无需手动设置。interactive 变体的内容区会在 hover 时叠加 muted 高亮。
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    </div>
</template>
