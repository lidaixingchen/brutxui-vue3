<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'

const COLUMN_TWO = 2
const COLUMN_THREE = 3
const COLUMN_FOUR = 4

const demoRoot = ref<HTMLElement | null>(null)
const columnWidthProbe = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const minimumColumnWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

const getColumnCount = (maximum: number) => {
    if (containerWidth.value <= 0 || minimumColumnWidth.value <= 0) return maximum
    return Math.max(1, Math.min(maximum, Math.floor(containerWidth.value / minimumColumnWidth.value)))
}

const basicColumns = computed(() => getColumnCount(COLUMN_TWO))
const orderColumns = computed(() => getColumnCount(COLUMN_THREE))
const serverColumns = computed(() => getColumnCount(COLUMN_FOUR))
const orderAmountSpan = computed(() => Math.min(COLUMN_TWO, orderColumns.value))
const shippingAddressSpan = computed(() => Math.min(COLUMN_THREE, orderColumns.value))

onMounted(() => {
    const root = demoRoot.value
    const probe = columnWidthProbe.value
    if (!root || !probe) return

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
            if (entry.target === root) containerWidth.value = entry.contentRect.width
            if (entry.target === probe) minimumColumnWidth.value = entry.contentRect.width
        }
    }

    resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(root)
    resizeObserver.observe(probe)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
    <div ref="demoRoot" class="relative space-y-8 w-full max-w-2xl">
        <span
            ref="columnWidthProbe"
            class="pointer-events-none absolute invisible block"
            style="width: var(--container-xs)"
            aria-hidden="true"
        />
        <!-- 基础布局 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">基础布局（无边框，最多{{ COLUMN_TWO }}列）</p>
            <Descriptions title="用户信息" :column="basicColumns">
                <DescriptionsItem label="姓名">张三</DescriptionsItem>
                <DescriptionsItem label="邮箱">zhangsan@example.com</DescriptionsItem>
                <DescriptionsItem label="电话">+86 138 0000 0000</DescriptionsItem>
                <DescriptionsItem label="地址">北京市朝阳区</DescriptionsItem>
            </Descriptions>
        </div>

        <!-- 带边框布局 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">带边框布局（最多{{ COLUMN_THREE }}列，部分项跨列）</p>
            <Descriptions title="订单详情" border :column="orderColumns">
                <DescriptionsItem label="订单号">ORD-2024-001</DescriptionsItem>
                <DescriptionsItem label="支付方式">微信支付</DescriptionsItem>
                <DescriptionsItem label="状态">已完成</DescriptionsItem>
                <DescriptionsItem label="下单时间">2024-01-15 14:32:00</DescriptionsItem>
                <DescriptionsItem label="订单金额" :span="orderAmountSpan">¥299.99</DescriptionsItem>
                <DescriptionsItem label="收货地址" :span="shippingAddressSpan">北京市朝阳区幸福路100号</DescriptionsItem>
            </Descriptions>
        </div>

        <!-- 垂直方向带边框 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">垂直排列布局（最多{{ COLUMN_FOUR }}列）</p>
            <Descriptions title="服务器配置" direction="vertical" border :column="serverColumns">
                <DescriptionsItem label="CPU">4 核</DescriptionsItem>
                <DescriptionsItem label="内存">16 GB</DescriptionsItem>
                <DescriptionsItem label="系统">Ubuntu 22.04 LTS</DescriptionsItem>
                <DescriptionsItem label="带宽">100 Mbps</DescriptionsItem>
            </Descriptions>
        </div>

        <!-- 技术档案印章插槽 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">技术档案印章（stamp 插槽）</p>
            <Descriptions title="机密档案" border :column="basicColumns">
                <template #stamp>
                    <span class="inline-block rotate-6 border-3 border-brutal-destructive px-2 py-0.5 font-mono text-xs font-black uppercase text-brutal-destructive bg-brutal-bg">
                        [ CONFIDENTIAL ]
                    </span>
                </template>
                <DescriptionsItem label="编号">BX-2077-001</DescriptionsItem>
                <DescriptionsItem label="密级">Top Secret</DescriptionsItem>
            </Descriptions>
        </div>
    </div>
</template>
