<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface StatItem {
  value: string
  label: string
  suffix?: string
}

const stats: StatItem[] = [
  { value: '65', suffix: '+', label: '组件' },
  { value: '31', suffix: '+', label: '区块' },
  { value: '100', suffix: '%', label: 'TypeScript' },
  { value: '4', label: '套主题' },
]

const isVisible = ref(false)

onMounted(() => {
  isVisible.value = true
})
</script>

<template>
  <div :class="['home-stats', { visible: isVisible }]" role="list" aria-label="项目统计数据">
    <div class="stats-grid">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="stat-item"
        role="listitem"
        :aria-label="`${stat.value}${stat.suffix || ''} ${stat.label}`"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div class="stat-value">
          <span class="stat-number">{{ stat.value }}</span>
          <span v-if="stat.suffix" class="stat-suffix">{{ stat.suffix }}</span>
        </div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-stats {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  border: 3px solid #000;
  background: var(--vp-c-bg);
  box-shadow: 4px 4px 0 0 #000;
  opacity: 0;
  transform: translateY(20px);
  animation: none;
}

.home-stats.visible .stat-item {
  animation: fadeInUp 0.5s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--brutal-primary);
  line-height: 1;
}

.stat-suffix {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--brutal-primary);
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-2);
}

/* Dark mode */
.dark .stat-item {
  border-color: var(--brutal-border-color);
  box-shadow: 4px 4px 0 0 var(--brutal-border-color);
}

/* Mobile */
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-item {
    padding: 1rem;
    border-width: 2px;
    box-shadow: 2px 2px 0 0 #000;
  }

  .stat-number {
    font-size: 2rem;
  }

  .stat-suffix {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}
</style>
