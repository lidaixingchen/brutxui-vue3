---
"brutx-vue": patch
---

源码安装按公开契约交付组件 index，并完整安装内部 helper、共享类型与运行时依赖。共享类型路径支持项目别名与 sharedBase，保持 diff/update 的本地修改保护。

diff 命令正确传递组件列表、Registry 来源和 JSON 输出选项，用于跨快照比较与更新。
