<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { ref } from 'vue'

const open = ref(false)

function onClose() {
  open.value = false
}
</script>

<template>
  <div class="demo-section">
    <h2>0.2 Reka UI Dialog 验证</h2>
    <p>验证：Trigger → Portal → Content → Close 完整流程</p>

    <div class="checklist">
      <div>✅ DialogRoot 控制开关 (v-model:open)</div>
      <div>✅ DialogTrigger 触发器</div>
      <div>✅ DialogPortal 传送门</div>
      <div>✅ DialogOverlay 遮罩层</div>
      <div>✅ DialogContent 内容区</div>
      <div>✅ DialogClose 关闭按钮</div>
      <div>✅ DialogTitle 标题</div>
      <div>✅ DialogDescription 描述</div>
      <div>✅ data-state 属性 (用于 CSS 动画)</div>
      <div>✅ Escape 键关闭</div>
      <div>✅ 点击遮罩关闭</div>
      <div>✅ 焦点管理 (自动聚焦到 Dialog)</div>
    </div>

    <DialogRoot v-model:open="open">
      <DialogTrigger as-child>
        <button class="btn btn-primary">打开 Dialog</button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay class="dialog-overlay" />
        <DialogContent class="dialog-content" @escape-key-down="onClose">
          <DialogTitle class="dialog-title">Dialog 标题</DialogTitle>
          <DialogDescription class="dialog-description">
            这是 Dialog 描述文字。验证 Reka UI Dialog 的完整流程。
          </DialogDescription>
          <div class="dialog-body">
            <p>Dialog 内容区域。按 Escape 或点击遮罩可关闭。</p>
            <p>当前 open 状态: <strong>{{ open }}</strong></p>
          </div>
          <DialogClose as-child>
            <button class="btn btn-destructive dialog-close-btn">
              <X :size="16" :stroke-width="3" />
              <span>关闭</span>
            </button>
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <div class="status">
      <p>Dialog 状态: {{ open ? '🟢 已打开' : '🔴 已关闭' }}</p>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  width: 100%;
  max-width: 32rem;
  padding: 1.5rem;
  background: white;
  border: 3px solid black;
  border-radius: 0;
  box-shadow: 6px 6px 0 black;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.025em;
}

.dialog-description {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
}

.dialog-body {
  margin-top: 1rem;
  padding: 1rem 0;
  border-top: 3px solid black;
  border-bottom: 3px solid black;
}

.dialog-close-btn {
  position: absolute;
  right: 1rem;
  top: 1rem;
}
</style>
