<script setup lang="ts">
import { ref } from 'vue'
import { Watermark } from 'brutx-ui-vue'

const textContent = ref('BrutxUI Watermark')
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础文本水印 (全区域铺满)</h3>
            <div class="relative border-3 border-brutal rounded-brutal min-h-[200px] bg-brutal-bg overflow-hidden flex flex-col justify-center items-center p-6">
                <Watermark :content="textContent">
                    <div class="relative z-10 max-w-sm text-center">
                        <h4 class="text-lg font-black mb-2">机密合同内容详情</h4>
                        <p class="text-xs font-bold opacity-75 leading-relaxed">
                            本协议及其附件所含全部技术信息、商业机密和规划均属甲乙双方的核心资产。未经双方共同书面授权，严禁任何第三方以任何形式进行复制、分发或传播。
                        </p>
                    </div>
                </Watermark>
            </div>
            
            <div class="mt-4 flex items-center gap-4">
                <label class="text-xs font-black">修改水印内容：</label>
                <input
                    v-model="textContent"
                    type="text"
                    class="text-xs font-bold border-3 border-brutal px-2 py-1 rounded-brutal shadow-brutal bg-brutal-bg focus:outline-none"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">旋转度数与网格间距定制</h3>
            <div class="relative border-3 border-brutal rounded-brutal min-h-[200px] bg-brutal-bg overflow-hidden flex flex-col justify-center items-center p-6">
                <Watermark 
                    content="Confidential" 
                    :rotate="-20"
                    :gap="[100, 100]"
                    :font="{ color: 'rgba(239, 68, 68, 0.15)', fontSize: 16, fontWeight: 'bold' }"
                >
                    <div class="relative z-10 max-w-sm text-center">
                        <h4 class="text-lg font-black mb-2 text-brutal-danger">红色醒目警告水印</h4>
                        <p class="text-xs font-bold opacity-75 leading-relaxed">
                            此处平铺的是红色倾斜的 Confidential 英文防篡改水印，间距加宽为 100x100 像素网格，多层防护。
                        </p>
                    </div>
                </Watermark>
            </div>
        </div>
    </div>
</template>
