<script setup lang="ts">
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from 'brutx-ui-vue'
</script>

<template>
    <div class="w-full space-y-8">
        <div>
            <h3 class="text-sm font-black mb-4">垂直时间线 — 所有 Dot 变体</h3>
            <Timeline orientation="vertical">
                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="default" shape="circle">1</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="pl-2">
                        <div class="font-black text-base">默认 (default) 变体</div>
                        <p class="text-sm text-brutal-fg/80 mt-1 font-normal">默认白底黑字圆点样式。</p>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="primary" shape="circle">2</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="pl-2">
                        <div class="font-black text-base">主要 (primary) 变体</div>
                        <p class="text-sm text-brutal-fg/80 mt-1 font-normal">珊瑚红主色圆点样式。</p>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="secondary" shape="square">3</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="pl-2">
                        <div class="font-black text-base">次要 (secondary) 变体</div>
                        <p class="text-sm text-brutal-fg/80 mt-1 font-normal">薄荷青辅助色方形样式。</p>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="accent" shape="diamond">4</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="pl-2">
                        <div class="font-black text-base">强调 (accent) 变体</div>
                        <p class="text-sm text-brutal-fg/80 mt-1 font-normal">黄色强调色菱形样式。</p>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="success" shape="circle">5</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="pl-2">
                        <div class="font-black text-base">成功 (success) 变体</div>
                        <p class="text-sm text-brutal-fg/80 mt-1 font-normal">绿色成功色圆点样式。</p>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="danger" shape="circle">6</TimelineDot>
                    </TimelineSeparator>
                    <TimelineContent class="pl-2">
                        <div class="font-black text-base">危险 (danger) 变体</div>
                        <p class="text-sm text-brutal-fg/80 mt-1 font-normal">红色危险色圆点样式。</p>
                    </TimelineContent>
                </TimelineItem>
            </Timeline>
        </div>

        <div>
            <h3 class="text-sm font-black mb-4">水平时间线</h3>
            <Timeline orientation="horizontal">
                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="text-center">
                        <div class="font-black text-sm">需求分析</div>
                        <div class="text-xs text-brutal-fg/60 mt-1">2026-06-01</div>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="accent" shape="square">2</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="text-center">
                        <div class="font-black text-sm">设计开发</div>
                        <div class="text-xs text-brutal-fg/60 mt-1">2026-06-15</div>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="success" shape="diamond">3</TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent class="text-center">
                        <div class="font-black text-sm">测试发布</div>
                        <div class="text-xs text-brutal-fg/60 mt-1">2026-07-01</div>
                    </TimelineContent>
                </TimelineItem>

                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot variant="danger" shape="circle">4</TimelineDot>
                    </TimelineSeparator>
                    <TimelineContent class="text-center">
                        <div class="font-black text-sm">迭代优化</div>
                        <div class="text-xs text-brutal-fg/60 mt-1">2026-07-15</div>
                    </TimelineContent>
                </TimelineItem>
            </Timeline>
        </div>
    </div>
</template>
