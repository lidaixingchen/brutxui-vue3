<script setup lang="ts">
import { useI18n } from '../lib/i18n'

const { isEn, t } = useI18n()
</script>

<template>
  <div class="home-showcase">
    <div class="showcase-header">
      <h3 class="showcase-title">{{ t('componentPreview') }}</h3>
      <p class="showcase-subtitle">{{ t('brutalVisualImpact') }}</p>
    </div>

    <div class="showcase-grid">
      <div class="showcase-item">
        <div class="showcase-label">{{ isEn ? 'Button' : 'Button 按钮' }}</div>
        <div class="showcase-content vp-raw">
          <ButtonDemo />
        </div>
      </div>

      <div class="showcase-item">
        <div class="showcase-label">{{ isEn ? 'Badge' : 'Badge 徽标' }}</div>
        <div class="showcase-content vp-raw">
          <BadgeDemo />
        </div>
      </div>

      <div class="showcase-item showcase-item-wide">
        <div class="showcase-label">{{ isEn ? 'Card' : 'Card 卡片' }}</div>
        <div class="showcase-content vp-raw">
          <CardDemo />
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
