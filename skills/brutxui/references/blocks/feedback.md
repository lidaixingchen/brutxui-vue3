# 反馈与状态区块

## EmptyState

```vue
<EmptyState title="还没有数据" description="创建第一个项目" action-text="创建" :icon="Server" @action="handleCreate" />
```

- `title`/`description`/`actionText`: `string`
- `icon`: `Component` — 默认 `FolderOpen`（来自 @lucide/vue）
- Events: `action()`

## ErrorCard

```vue
<ErrorCard title="加载失败" description="网络问题，请重试" retry-text="重试" @retry="handleRetry" @close="handleClose" />
```

- `title`/`description`/`retryText`: `string`
- Events: `retry()`, `close()`
- Slot: `actions` — 额外操作按钮区域

## SuccessCard

```vue
<SuccessCard title="操作成功" description="已保存" confirm-text="知道了" @confirm="handleConfirm" />
```

- `title`/`description`/`confirmText`: `string`
- Events: `confirm()`
- Slot: `actions` — 额外操作按钮区域

## CookieConsent

```vue
<CookieConsent title="Cookie 说明" description="改善体验" accept-text="接受" decline-text="仅必要" @accept="handleAccept" @decline="handleDecline" />
```

- `title`/`description`/`acceptText`/`declineText`: `string`
- Events: `accept()`, `decline()`
- Slot: `actions` — 额外操作按钮区域

## FeedbackForm

```vue
<FeedbackForm
  title="给我们反馈"
  description="帮助改进"
  submit-text="提交"
  :loading="isSubmitting"
  :success="isSuccess"
  success-title="提交成功"
  success-description="感谢您的反馈"
  success-confirm-text="知道了"
  @submit="handleSubmit"
  @success-confirm="handleConfirm"
/>
```

- `title`/`description`/`submitText`: `string`
- `loading`: `boolean` — 默认 `false`，提交按钮显示 loading spinner
- `success`: `boolean` — 默认 `false`，为 true 时显示 SuccessCard 替换表单
- `successTitle`/`successDescription`/`successConfirmText`: `string` — 成功卡片文案
- 内置必填验证（姓名、邮箱、主题、消息）和邮箱格式验证
- 验证失败时输入框显示 error 样式，不触发 submit 事件
- Events: `submit({ name, email, subject, message })`, `successConfirm()`
- Slots: `header`, `default`, `footer`
