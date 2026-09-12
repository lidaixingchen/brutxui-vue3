---
"brutx-ui-vue": minor
---

通过显式契约生成公开入口与子路径，内部化 useClearableSelection、useSelectableTrigger、useSelectionDisplayText、useTransferPanelSelection。业务输入类型保持公开，组件 Props 通过组件类型推导；loading 子路径提供 Loading 与 vLoading。迁移说明见 docs/guides/API_MIGRATION.md。
