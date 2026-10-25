<script setup lang="ts">
import { Button, Result } from 'brutx-ui-vue'

function handlePrimary() {
    alert('点击了主操作按钮')
}

function handleSecondary() {
    alert('点击了次操作按钮')
}
</script>

<template>
    <div class="w-full min-w-0 space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">成功状态 (Success)</h3>
            <Result
                status="success"
                title="支付成功"
                sub-title="您的订单已支付完成，我们将在 24 小时内为您安排发货。您可以点击下方按钮查看物流详情。"
            >
                <template #extra>
                    <Button variant="accent" size="sm" type="button" @click="handlePrimary">
                        查看订单
                    </Button>
                    <Button variant="outline" size="sm" type="button" @click="handleSecondary">
                        继续逛逛
                    </Button>
                </template>
            </Result>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">错误状态 (Error)</h3>
            <Result
                status="error"
                title="提交失败"
                sub-title="请检查您的表单输入，当前表单中包含冲突或格式不正确的配置。您可以修改后重新尝试。"
            >
                <template #extra>
                    <Button variant="accent" size="sm" type="button" @click="handlePrimary">
                        修改重试
                    </Button>
                </template>
            </Result>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">警告与提示状态 (Warning / Info)</h3>
            <div class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <Result
                    status="warning"
                    title="账户权限异常"
                    sub-title="检测到您的账户有安全隐患，请及时修改密码。"
                />
                <Result
                    status="info"
                    title="系统维护通知"
                    sub-title="本周六凌晨 2:00 - 4:00 系统将进行数据库维护。"
                />
            </div>
        </div>
    </div>
</template>
