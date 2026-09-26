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
            <Accordion v-model="activeItem" type="single" collapsible>
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
                    <AccordionTrigger>展开时如何保持阅读位置？</AccordionTrigger>
                    <AccordionContent>
                        标题栏与面板边框保持对齐，通过背景色、箭头旋转和内容展开动画提供反馈。
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">扁平</p>
            <Accordion v-model="activeFlat" type="single" collapsible>
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
            <Accordion v-model="activeGhost" type="single" collapsible>
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
            <Accordion v-model="activeInteractive" type="single" collapsible>
                <AccordionItem value="interactive-1" variant="interactive">
                    <AccordionTrigger>悬停时会发生什么？</AccordionTrigger>
                    <AccordionContent>
                        面板阴影增强，内容区带有轻微高亮，标题栏与面板保持原位。
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
