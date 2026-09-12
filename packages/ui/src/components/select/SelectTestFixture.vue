<script setup lang="ts">
import { ref } from 'vue'
import Select from './Select.vue'

const selectedValue = ref('')
const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana (Disabled)', value: 'banana', disabled: true },
    { label: 'Cherry', value: 'cherry' },
]

defineExpose({
    selectedValue,
})
</script>

<template>
    <div class="p-8">
        <Select
            v-model="selectedValue"
            id="test-select"
            :options="options"
            placeholder="Choose a fruit"
        />
    </div>
</template>
