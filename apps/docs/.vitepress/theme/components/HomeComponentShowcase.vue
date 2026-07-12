<script setup lang="ts">
import { useI18n } from '../lib/i18n'
import { Button, Badge } from 'brutx-ui-vue'
import { Mail, ArrowRight } from '@lucide/vue'

const { isEn, t } = useI18n()
</script>

<template>
  <div class="home-showcase">
    <div class="showcase-header">
      <h3 class="showcase-title">{{ t('componentPreview') }}</h3>
      <p class="showcase-subtitle">{{ t('brutalVisualImpact') }}</p>
    </div>

    <div class="showcase-grid">
      <!-- 1. Button Showcase -->
      <div class="showcase-item">
        <div class="showcase-label">{{ isEn ? 'Button' : 'Button 按钮' }}</div>
        <div class="showcase-content vp-raw flex flex-wrap gap-4 items-center justify-center min-h-[120px]">
          <Button variant="primary">主要</Button>
          <Button variant="secondary">
            <template #icon><Mail class="w-4 h-4" /></template>
            次要
          </Button>
          <Button variant="accent">强调</Button>
          <Button variant="outline" :loading="true">加载中</Button>
        </div>
      </div>

      <!-- 2. Badge Showcase -->
      <div class="showcase-item">
        <div class="showcase-label">{{ isEn ? 'Badge' : 'Badge 徽标' }}</div>
        <div class="showcase-content vp-raw flex flex-wrap gap-3 items-center justify-center min-h-[120px]">
          <Badge variant="primary">New</Badge>
          <Badge variant="success" dot>Online</Badge>
          <Badge variant="danger" pulse>Live</Badge>
          <Badge variant="accent" closable>Feature</Badge>
        </div>
      </div>

      <!-- 3. Card Showcase (Styled using the card wrapper grid block itself) -->
      <div class="showcase-item showcase-item-wide">
        <div class="showcase-label">{{ isEn ? 'Card' : 'Card 卡片' }}</div>
        
        <!-- Diagonal hazard stripes header -->
        <div class="h-28 flex items-center justify-center relative overflow-hidden" style="background: repeating-linear-gradient(45deg, var(--brutal-accent) 0, var(--brutal-accent) 10px, #000000 10px, #000000 12px)">
          <span class="text-lg font-black text-black bg-white border-2 border-black px-4 py-2 shadow-[3px_3px_0_0_#000] select-none tracking-widest uppercase">
            BrutxUI Design
          </span>
        </div>

        <div class="showcase-content vp-raw space-y-4 p-6">
          <div class="flex gap-2">
            <Badge variant="primary">Vue 3.5+</Badge>
            <Badge variant="accent">Tailwind 4</Badge>
          </div>
          
          <h4 class="text-xl font-black text-black dark:text-white m-0">用像素践行粗野设计哲学</h4>
          
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 m-0 leading-relaxed">
            BrutxUI 彻底打破常规的扁平化与柔和渐变设计，以极具视觉冲击力的 3px 厚重黑边框、4px 硬阴影以及高饱和度的主题配色，为 Vue 生态打造极具个性的现代化数字界面。
          </p>
          
          <!-- Bottom author & action bar -->
          <div class="flex justify-between items-center border-t-3 border-brutal pt-4 mt-2">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full border-2 border-black bg-brutal-primary flex items-center justify-center text-xs font-bold text-black">
                GX
              </div>
              <span class="text-xs font-bold text-black dark:text-white">Brutx Team</span>
            </div>
            <Button size="sm" variant="primary">
              开始使用
              <template #icon><ArrowRight class="w-4 h-4 ml-1" /></template>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-showcase {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 0;
}

.showcase-header {
  text-align: center;
  margin-bottom: 2rem;
}

.showcase-title {
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.showcase-subtitle {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.showcase-item {
  border: 3px solid #000;
  background: var(--vp-c-bg);
  box-shadow: 4px 4px 0 0 #000;
  overflow: hidden;
  transition: transform 150ms, box-shadow 150ms;
}

.showcase-item:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 0 #000;
}

.showcase-item-wide {
  grid-column: span 2;
}

.showcase-label {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--brutal-primary);
  color: #000;
  border-bottom: 3px solid #000;
}

.showcase-content {
  padding: 1.5rem;
}

/* Dark mode */
.dark .showcase-item {
  border-color: var(--brutal-border-color);
  box-shadow: 4px 4px 0 0 var(--brutal-border-color);
}

.dark .showcase-item:hover {
  box-shadow: 6px 6px 0 0 var(--brutal-border-color);
}

.dark .showcase-label {
  border-bottom-color: var(--brutal-border-color);
}

/* Mobile */
@media (max-width: 640px) {
  .showcase-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .showcase-item {
    border-width: 2px;
    box-shadow: 2px 2px 0 0 #000;
  }

  .showcase-item:hover {
    box-shadow: 3px 3px 0 0 #000;
  }

  .showcase-item-wide {
    grid-column: span 1;
  }

  .showcase-content {
    padding: 1rem;
  }
}
</style>
