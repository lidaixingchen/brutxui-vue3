<script setup lang="ts">
import { ref } from 'vue'
import RekaDialogDemo from './components/RekaDialogDemo.vue'
import RekaSelectDemo from './components/RekaSelectDemo.vue'
import VeeValidateDemo from './components/VeeValidateDemo.vue'
import VCalendarDemo from './components/VCalendarDemo.vue'
import RekaComboboxDemo from './components/RekaComboboxDemo.vue'

const currentDemo = ref('0.2')

const demos = [
  { id: '0.2', label: 'Reka UI Dialog', component: RekaDialogDemo },
  { id: '0.3', label: 'Reka UI Select', component: RekaSelectDemo },
  { id: '0.4', label: 'vee-validate + zod', component: VeeValidateDemo },
  { id: '0.5', label: 'v-calendar', component: VCalendarDemo },
  { id: '0.6', label: 'Reka UI Combobox (cmdk 替代)', component: RekaComboboxDemo },
]
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Phase 0: 依赖验证 PoC</h1>
      <p>BrutxUI React → Vue 3 迁移 - 关键依赖可用性验证</p>
    </header>

    <nav class="app-nav">
      <button
        v-for="demo in demos"
        :key="demo.id"
        :class="['nav-btn', { active: currentDemo === demo.id }]"
        @click="currentDemo = demo.id"
      >
        {{ demo.id }} {{ demo.label }}
      </button>
    </nav>

    <main class="app-main">
      <component :is="demos.find(d => d.id === currentDemo)?.component" />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #FFFEF0;
  color: black;
}

.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid black;
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  margin: 0;
}

.app-header p {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #666;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.nav-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 700;
  background: white;
  border: 3px solid black;
  cursor: pointer;
  box-shadow: 3px 3px 0 black;
  transition: all 0.15s;
}

.nav-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 black;
}

.nav-btn.active {
  background: #4ECDC4;
  color: black;
  font-weight: 900;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 black;
}

.app-main {
  min-height: 400px;
}

.demo-section {
  padding: 1.5rem;
  background: white;
  border: 3px solid black;
  box-shadow: 6px 6px 0 black;
}

.demo-section h2 {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  margin: 0 0 0.5rem;
}

.demo-section h3 {
  font-size: 1rem;
  font-weight: 900;
  margin: 1.5rem 0 0.75rem;
  padding-top: 1rem;
  border-top: 3px solid black;
}

.demo-section > p {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #666;
}

.checklist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.375rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #A8E6CF;
  border: 2px solid black;
  font-size: 0.8125rem;
  font-weight: 700;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1rem 0;
}

.demo-item {
  flex: 1;
  min-width: 250px;
}

.demo-item > label {
  display: block;
  font-size: 0.875rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.status {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #FFE66D;
  border: 2px solid black;
  font-size: 0.8125rem;
  font-weight: 700;
}

.status p {
  margin: 0.25rem 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border: 3px solid black;
  cursor: pointer;
  box-shadow: 4px 4px 0 black;
  transition: all 0.15s;
}

.btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 black;
}

.btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.btn-primary {
  background: #4ECDC4;
  color: black;
}

.btn-secondary {
  background: white;
  color: black;
}

.btn-destructive {
  background: #FF6B6B;
  color: black;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
