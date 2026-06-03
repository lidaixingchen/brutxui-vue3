# 交互组件区块

## QuickActions

```vue
<QuickActions
  title="快捷操作"
  :actions="[
    { label: '新建', icon: PlusIcon, variant: 'primary' },
    { label: '导入', icon: UploadIcon, variant: 'outline' },
  ]"
/>
```

- `title`: `string`
- `actions`: `ActionItem[]` — `{ label: string; icon: Component; variant?: 'primary' | 'secondary' | 'outline' | 'danger' }[]`

## SearchWidget

```vue
<SearchWidget
  placeholder="搜索..."
  :suggestions="[
    { label: 'Button', value: 'button', group: '组件' },
    { label: '安装指南', value: 'install', group: '文档' },
  ]"
/>
```

- `placeholder`: `string`
- `suggestions`: `SearchSuggestion[]` — `{ label: string; value: string; group?: string }[]`

## FileCard

```vue
<FileCard file-name="report.pdf" file-size="2.5 MB" file-type="PDF" />
```

- `fileName`/`fileSize`/`fileType`: `string`

## UploadCard

带进度条的上传卡片。

```vue
<UploadCard
  title="上传文件" description="支持 PDF、图片，最大 10MB"
  accept=".pdf,.jpg,.png" :max-size="10"
  :uploading="isUploading" :progress="uploadProgress"
/>
```

- `title`/`description`/`accept`: `string`
- `maxSize`: `number` — 最大文件大小（MB）
- `uploading`: `boolean` — 默认 `false`
- `progress`: `number` — 默认 `0`（0-100）
