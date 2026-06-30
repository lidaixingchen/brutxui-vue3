<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

/** 应用标题 */
const title = ref<string>('{{projectName}}')
</script>

<template>
  <div id="app">
    <header>
      <h1>{{ title }}</h1>
    </header>

    <main>
      <HelloWorld :msg="title" />
    </main>
  </div>
</template>

<style scoped>
#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  color: #2c3e50;
  font-size: 2rem;
}
</style>
