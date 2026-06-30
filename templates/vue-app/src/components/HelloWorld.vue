<script setup lang="ts">
import { ref } from 'vue'

/** 组件属性接口 */
interface Props {
  /** 显示的消息 */
  msg: string
}

const props = defineProps<Props>()

/** 计数器 */
const count = ref<number>(0)

/**
 * 增加计数
 */
function increment(): void {
  count.value++
}
</script>

<template>
  <div class="hello-world">
    <h2>{{ props.msg }}</h2>
    <p>这是一个 Vue 3 + TypeScript 示例项目</p>

    <div class="counter">
      <button @click="increment">
        计数: {{ count }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hello-world {
  text-align: center;
  padding: 2rem;
}

h2 {
  color: #42b883;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 1.5rem;
}

.counter {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #36a072;
}
</style>
