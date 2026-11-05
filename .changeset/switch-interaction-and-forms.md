---
"brutx-ui-vue": minor
---

完善 Switch 的实心滑钮、状态标签和原生表单交互。外框与硬阴影保持固定，支持自定义状态标签、可见 Label 命名、表单提交、必填校验与重置。

统一使用 `defaultValue` 设置初始状态，移除 `defaultChecked` 和 `shape`；`switchThumbVariants` 的尺寸由根节点令牌推导。使用这些接口的项目请按迁移指南调整。
