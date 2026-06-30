# 交互组件区块

## QuickActions

```vue
<QuickActions
  title="快捷操作"
  :actions="[
    { label: '新建', icon: PlusIcon, variant: 'primary' },
    { label: '导入', icon: UploadIcon, variant: 'outline' },
  ]"
  @action-click="handleActionClick"
/>
```

- `title`: `string`
- `actions`: `ActionItem[]` — `{ label: string; icon: Component; variant?: 'primary' | 'secondary' | 'outline' | 'danger' }[]`
- Events: `actionClick(index)`
- Slot: `actions` — 操作网格下方操作区域

## SearchWidget

```vue
<SearchWidget
  placeholder="搜索..."
  :suggestions="[
    { label: 'Button', value: 'button', group: '组件' },
    { label: '安装指南', value: 'install', group: '文档' },
  ]"
  :loading="isSearching"
  :recent="recentSearches"
  @search="handleSearch"
  @select="handleSelect"
/>
```

- `placeholder`: `string`
- `suggestions`: `SearchSuggestion[]` — `{ label: string; value: string; group?: string }[]`
- `recent`: `SearchSuggestion[]` — 最近搜索列表，输入框为空时显示"最近搜索"分组，点击回填 query 并 emit select
- `loading`: `boolean` — 默认 `false`，搜索时显示 Spinner
- Events: `search(value)`, `select(suggestion)`
- Slot: `actions` — 额外操作区域

## FileCard

```vue
<FileCard file-name="report.pdf" file-size="2.5 MB" file-type="PDF" @download="handleDownload" />
```

- `fileName`/`fileSize`/`fileType`: `string`
- Events: `download()`
- Slot: `actions` — 卡片底部操作区域

## UploadCard

带进度条的上传卡片。

```vue
<UploadCard
  title="上传文件" description="支持 PDF、图片，最大 10MB"
  accept=".pdf,.jpg,.png" :max-size="10"
  :uploading="isUploading" :progress="uploadProgress"
  @upload="handleUpload" @drop="handleDrop"
/>
```

- `title`/`description`/`accept`: `string`
- `maxSize`: `number` — 最大文件大小（字节）
- `uploading`: `boolean` — 默认 `false`
- `progress`: `number` — 默认 `0`（0-100）
- Events: `upload(files: File[])`, `drop(files: File[])`
- Slot: `actions` — 拖拽区域下方的自定义操作区域
