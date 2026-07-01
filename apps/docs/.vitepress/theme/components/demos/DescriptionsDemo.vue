<script setup lang="ts">
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'

const COLUMN_TWO = 2
const COLUMN_THREE = 3
const COLUMN_FOUR = 4
</script>

<template>
    <div class="space-y-8 w-full max-w-2xl">
        <!-- 基础布局 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">基础布局（无边框，{{ COLUMN_TWO }}列）</p>
            <Descriptions title="用户信息" :column="COLUMN_TWO">
                <DescriptionsItem label="姓名">张三</DescriptionsItem>
                <DescriptionsItem label="邮箱">zhangsan@example.com</DescriptionsItem>
                <DescriptionsItem label="电话">+86 138 0000 0000</DescriptionsItem>
                <DescriptionsItem label="地址">北京市朝阳区</DescriptionsItem>
            </Descriptions>
        </div>

        <!-- 带边框布局 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">带边框布局（{{ COLUMN_THREE }}列，部分项跨列）</p>
            <Descriptions title="订单详情" border :column="COLUMN_THREE">
                <DescriptionsItem label="订单号">ORD-2024-001</DescriptionsItem>
                <DescriptionsItem label="支付方式">微信支付</DescriptionsItem>
                <DescriptionsItem label="状态">已完成</DescriptionsItem>
                <DescriptionsItem label="下单时间">2024-01-15 14:32:00</DescriptionsItem>
                <DescriptionsItem label="订单金额" :span="2">¥299.99</DescriptionsItem>
                <DescriptionsItem label="收货地址" :span="3">北京市朝阳区幸福路100号</DescriptionsItem>
            </Descriptions>
        </div>

        <!-- 垂直方向带边框 -->
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">垂直排列布局（{{ COLUMN_FOUR }}列）</p>
            <Descriptions title="服务器配置" direction="vertical" border :column="COLUMN_FOUR">
                <DescriptionsItem label="CPU">4 核</DescriptionsItem>
                <DescriptionsItem label="内存">16 GB</DescriptionsItem>
                <DescriptionsItem label="系统">Ubuntu 22.04 LTS</DescriptionsItem>
                <DescriptionsItem label="带宽">100 Mbps</DescriptionsItem>
            </Descriptions>
        </div>
    </div>
</template>
