# 反馈与状态区块

## EmptyState

```vue
<EmptyState title="还没有数据" description="创建第一个项目" action-text="创建" @action="handleCreate" />
```

- `title`/`description`/`actionText`: `string`
- `icon`: `Component` — 自定义图标
- Events: `action`

## ErrorCard

```vue
<ErrorCard title="加载失败" description="网络问题，请重试" retry-text="重试" @retry="handleRetry" />
```

- `title`/`description`/`retryText`: `string`
- Events: `retry`

## SuccessCard

```vue
<SuccessCard title="操作成功" description="已保存" confirm-text="知道了" />
```

- `title`/`description`/`confirmText`: `string`

## CookieConsent

```vue
<CookieConsent title="Cookie 说明" description="改善体验" accept-text="接受" decline-text="仅必要" />
```

- `title`/`description`/`acceptText`/`declineText`: `string`

## FeedbackForm

```vue
<FeedbackForm title="给我们反馈" description="帮助改进" submit-text="提交" />
```

- `title`/`description`/`submitText`: `string`
