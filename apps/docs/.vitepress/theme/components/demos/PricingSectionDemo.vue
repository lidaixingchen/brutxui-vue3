<script setup lang="ts">
import { PricingSection } from 'brutx-ui-vue'
import type { BrutalistPricingPlan } from 'brutx-ui-vue'

const plans: BrutalistPricingPlan[] = [
    {
        name: '入门版',
        priceMonthly: '$0',
        priceAnnually: '$0',
        description: '适合个人用户入门',
        features: [
            { text: '5 个组件', included: true },
            { text: '经典主题', included: true },
            { text: '社区支持', included: true },
            { text: '优先更新', included: false },
        ],
        buttonText: '立即开始',
        buttonVariant: 'outline',
        variant: 'default',
    },
    {
        name: '专业版',
        priceMonthly: '$19',
        priceAnnually: '$15',
        description: '适合专业开发者',
        features: [
            { text: '全部组件', included: true },
            { text: '全部主题', included: true },
            { text: '优先支持', included: true },
            { text: 'CLI 工具访问', included: true },
        ],
        buttonText: '升级专业版',
        buttonVariant: 'primary',
        popular: true,
        variant: 'primary',
    },
    {
        name: '企业版',
        priceMonthly: '$49',
        priceAnnually: '$39',
        description: '适合团队和组织',
        features: [
            { text: '全部组件', included: true },
            { text: '全部主题', included: true },
            { text: '专属支持', included: true },
            { text: '自定义主题', included: true },
            { text: 'SLA 保障', included: true },
        ],
        buttonText: '联系销售',
        buttonVariant: 'secondary',
        variant: 'secondary',
    },
]
</script>

<template>
    <div class="w-full overflow-x-auto">
        <PricingSection
            title="统一定价方案"
            subtitle="一个组件，支持终身买断、按月或按年计费。"
            :plans="plans"
            default-billing="monthly"
            popular-text="最具性价比"
        />
    </div>
</template>
