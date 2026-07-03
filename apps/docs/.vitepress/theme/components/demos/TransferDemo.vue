<script setup lang="ts">
import { ref } from 'vue'
import { Transfer, type TransferDataItem } from 'brutx-ui-vue'

const generateData = (): TransferDataItem[] => {
    const data: TransferDataItem[] = []
    for (let i = 1; i <= 15; i++) {
        data.push({
            key: i,
            label: `备选项 ${i}`,
            disabled: i % 4 === 0
        })
    }
    return data
}

const data = ref(generateData())
const value = ref<(string | number)[]>([1, 4])
const value2 = ref<(string | number)[]>([2])
const value3 = ref<(string | number)[]>([])

const handleChange = (val: (string | number)[], direction: 'left' | 'right', movedKeys: (string | number)[]) => {
    console.log('change:', val, direction, movedKeys)
}
</script>

<template>
    <div class="flex flex-col gap-8 w-full max-w-4xl">
        <div>
            <h3 class="text-lg font-bold mb-4">基础用法</h3>
            <Transfer
                v-model="value"
                :data="data"
                @change="handleChange"
            />
        </div>

        <div>
            <h3 class="text-lg font-bold mb-4">可搜索过滤</h3>
            <Transfer
                v-model="value2"
                :data="data"
                filterable
                @change="handleChange"
            />
        </div>

        <div>
            <h3 class="text-lg font-bold mb-4">自定义标题和按钮文字</h3>
            <Transfer
                v-model="value3"
                :data="data"
                :titles="['可选择项', '已选择项']"
                :button-texts="['撤销', '添加']"
                @change="handleChange"
            />
        </div>
    </div>
</template>
