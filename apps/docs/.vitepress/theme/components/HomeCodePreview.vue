<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref<'cli' | 'usage'>('cli')

const cliCode = `# 初始化项目
npx brutx-vue init

# 添加组件
npx brutx-vue add button card badge`

const usageCode = `<script setup lang="ts">
import { BButton } from '@/components/ui/button'
<\/script>

<template>
  <BButton variant="primary" size="lg">
    粗野主义按钮
  </BButton>
</template>`
</script>

<template>
  <div class="home-code-preview">
    <div class="code-header">
      <h3 class="code-title">快速开始</h3>
      <p class="code-subtitle">复制粘贴优先，零依赖锁定</p>
    </div>

    <div class="code-tabs" role="tablist">
      <button
        :class="['tab-button', { active: activeTab === 'cli' }]"
        role="tab"
        :aria-selected="activeTab === 'cli'"
        @click="activeTab = 'cli'"
      >
        CLI 安装
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'usage' }]"
        role="tab"
        :aria-selected="activeTab === 'usage'"
        @click="activeTab = 'usage'"
      >
        组件使用
      </button>
    </div>

    <div class="code-block">
      <div class="code-label">{{ activeTab === 'cli' ? 'bash' : 'vue' }}</div>
      <pre><code>{{ activeTab === 'cli' ? cliCode : usageCode }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.home-code-preview {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 0;
}

.code-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.code-title {
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.code-subtitle {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.code-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 0;
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-weight: 800;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 3px solid #000;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 150ms;
}

.tab-button:first-child {
  border-right: none;
}

.tab-button.active {
  background: var(--brutal-primary);
  color: #000;
}

.tab-button:hover:not(.active) {
  background: var(--brutal-muted);
}

.code-block {
  position: relative;
  border: 3px solid #000;
  border-top: none;
  background: #1e1e1e;
  box-shadow: 4px 4px 0 0 #000;
  overflow-x: auto;
}

.code-label {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.25rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--brutal-accent);
  color: #000;
  border-left: 2px solid #000;
  border-bottom: 2px solid #000;
}

pre {
  margin: 0;
  padding: 1.5rem;
  padding-top: 2.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  line-height: 1.7;
  color: #f3f4f6;
}

code {
  background: transparent;
  border: none;
  padding: 0;
}

@media (max-width: 640px) {
  .home-code-preview {
    padding: 1rem 0;
  }

  .code-block {
    border-width: 2px;
    box-shadow: 2px 2px 0 0 #000;
  }

  pre {
    font-size: 0.8rem;
    padding: 1rem;
    padding-top: 2rem;
  }
}
</style>
