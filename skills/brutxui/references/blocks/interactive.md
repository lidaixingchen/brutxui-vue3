# 交互组件区块

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
