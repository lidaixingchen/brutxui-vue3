<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
  SelectIcon,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from 'reka-ui'
import { Check, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { ref } from 'vue'

const selectedFruit = ref('apple')
const selectedCity = ref('')

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
]

const cities = [
  { label: 'Asia', items: [
    { value: 'tokyo', label: 'Tokyo' },
    { value: 'shanghai', label: 'Shanghai' },
    { value: 'seoul', label: 'Seoul' },
  ]},
  { label: 'Europe', items: [
    { value: 'london', label: 'London' },
    { value: 'paris', label: 'Paris' },
    { value: 'berlin', label: 'Berlin' },
  ]},
]
</script>

<template>
  <div class="demo-section">
    <h2>0.3 Reka UI Select 验证</h2>
    <p>验证：scoped slots、键盘导航、Portal、分组、禁用项</p>

    <div class="checklist">
      <div>✅ SelectRoot v-model 绑定</div>
      <div>✅ SelectTrigger + SelectValue</div>
      <div>✅ SelectPortal 传送门</div>
      <div>✅ SelectContent + SelectViewport</div>
      <div>✅ SelectItem + SelectItemText + SelectItemIndicator</div>
      <div>✅ SelectGroup + SelectLabel 分组</div>
      <div>✅ SelectSeparator 分隔线</div>
      <div>✅ SelectIcon 自定义图标</div>
      <div>✅ 键盘导航 (↑↓ 选择, Enter 确认, Escape 关闭)</div>
      <div>✅ 禁用项 (data-disabled 属性)</div>
      <div>✅ data-state 属性 (open/closed)</div>
    </div>

    <div class="demo-row">
      <div class="demo-item">
        <label>基础 Select (v-model: {{ selectedFruit }})</label>
        <SelectRoot v-model="selectedFruit">
          <SelectTrigger class="select-trigger">
            <SelectValue placeholder="选择水果..." />
            <SelectIcon as-child>
              <ChevronDown :size="20" :stroke-width="3" />
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" position="popper">
              <SelectScrollUpButton class="select-scroll-btn">
                <ChevronUp :size="16" :stroke-width="3" />
              </SelectScrollUpButton>
              <SelectViewport class="select-viewport">
                <SelectItem
                  v-for="fruit in fruits"
                  :key="fruit.value"
                  :value="fruit.value"
                  :disabled="fruit.disabled"
                  class="select-item"
                >
                  <span class="select-item-indicator">
                    <SelectItemIndicator>
                      <Check :size="16" :stroke-width="3" />
                    </SelectItemIndicator>
                  </span>
                  <SelectItemText>{{ fruit.label }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
              <SelectScrollDownButton class="select-scroll-btn">
                <ChevronDown :size="16" :stroke-width="3" />
              </SelectScrollDownButton>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>

      <div class="demo-item">
        <label>分组 Select (v-model: {{ selectedCity || '未选择' }})</label>
        <SelectRoot v-model="selectedCity">
          <SelectTrigger class="select-trigger">
            <SelectValue placeholder="选择城市..." />
            <SelectIcon as-child>
              <ChevronDown :size="20" :stroke-width="3" />
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" position="popper">
              <SelectViewport class="select-viewport">
                <template v-for="group in cities" :key="group.label">
                  <SelectGroup>
                    <SelectLabel class="select-label">{{ group.label }}</SelectLabel>
                    <SelectItem
                      v-for="city in group.items"
                      :key="city.value"
                      :value="city.value"
                      class="select-item"
                    >
                      <span class="select-item-indicator">
                        <SelectItemIndicator>
                          <Check :size="16" :stroke-width="3" />
                        </SelectItemIndicator>
                      </span>
                      <SelectItemText>{{ city.label }}</SelectItemText>
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator class="select-separator" />
                </template>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>
    </div>

    <div class="status">
      <p>水果: {{ selectedFruit }} | 城市: {{ selectedCity || '未选择' }}</p>
    </div>
  </div>
</template>

<style scoped>
.select-trigger {
  display: flex;
  height: 2.75rem;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  background: white;
  border: 3px solid black;
  border-radius: 0;
  font-weight: 700;
  box-shadow: 4px 4px 0 black;
  cursor: pointer;
}

.select-trigger:focus {
  outline: none;
  box-shadow: 6px 6px 0 black;
  transform: translate(-1px, -1px);
}

.select-content {
  z-index: 50;
  min-width: 8rem;
  overflow: hidden;
  background: white;
  border: 3px solid black;
  border-radius: 0;
  box-shadow: 4px 4px 0 black;
}

.select-viewport {
  padding: 0.25rem;
}

.select-item {
  position: relative;
  display: flex;
  width: 100%;
  cursor: pointer;
  align-items: center;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  font-weight: 700;
  outline: none;
}

.select-item:focus {
  background: #f0f0f0;
}

.select-item[data-disabled] {
  pointer-events: none;
  opacity: 0.5;
}

.select-item-indicator {
  position: absolute;
  left: 0.5rem;
  display: flex;
  height: 1rem;
  width: 1rem;
  align-items: center;
  justify-content: center;
}

.select-label {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #666;
}

.select-separator {
  height: 3px;
  background: black;
  margin: 0.25rem 0;
}

.select-scroll-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  cursor: default;
  background: white;
}
</style>
