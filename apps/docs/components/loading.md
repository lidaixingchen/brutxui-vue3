---
title: Loading 加载
description: 加载组件与自定义指令，在进行数据请求或进行耗时操作时提供明确的粗野主义蒙版加载状态。
---

# Loading 加载

提供包裹式的 `Loading` 组件和便捷的 `v-loading` 自定义指令，在耗时任务进行时锁定用户交互，显示加粗硬边框的加载标识和黄色底色文本。

## 预览

<ComponentPreview>
  <LoadingDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="loading" />

## 用法

### 声明式容器用法

包裹在需要展示加载遮罩的块级元素外部。通过 `loading` 属性控制加载状态的切换，并通过 `text` 属性自定义加载文案。

```vue
<script setup>
import { ref } from 'vue'
import { Loading } from 'brutx-ui-vue'

const loading = ref(true)
</script>

<template>
    <Loading :loading="loading" text="正在读取核心数据...">
        <div class="card">
            <h4>账户明细</h4>
            <p>可提现余额：¥ 1500.00</p>
        </div>
    </Loading>
</template>
```

### 自定义指令用法

在普通的 HTML 元素或第三方组件上挂载 `v-loading` 指令。可以使用 `v-loading-text` 提供定制的加载文案。

```vue
<script setup>
import { ref } from 'vue'

const isDataLoading = ref(true)
</script>

<template>
    <!-- 指令内部会自动计算宿主定位，并在加载结束后完美还原 -->
    <div v-loading="isDataLoading" v-loading-text="'云端解析中...'">
        <p>今日订单量：1,250单</p>
        <p>成功发货率：98.5%</p>
    </div>
</template>
```

## Props

### Loading 组件

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loading` | `boolean` | `false` | 是否开启加载状态遮罩 |
| `text` | `string` | `''` | 自定义加载文案，为空时不展示文本底盒 |

## 可访问性

- **交互锁定**：加载遮罩展示时会附带 `pointer-events-none` 限制容器子元素交互，避免二次提交
- **宿主保护**：指令内部会自动劫持宿主定位为 `relative`（并在卸载时精准还原），防范加载遮罩产生视觉溢出
