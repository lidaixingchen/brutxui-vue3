---
"brutx-ui-vue": patch
"brutx-vue": patch
---

fix(ui): 焦点环改用主题令牌并补充透明 outline 降级；统一 createDarkModeToggle 与 createThemeVariables 的暗色模式状态（引用计数共享 store + 跨标签页同步）；tree 节点选中边框改由变体显式控制，消除级联顺序依赖
