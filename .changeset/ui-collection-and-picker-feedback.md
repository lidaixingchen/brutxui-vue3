---
"brutx-ui-vue": patch
"brutx-vue": patch
"brutx-registry-vue": patch
---

统一集合选项的高亮、选择标记、禁用与键盘焦点反馈，保持行位置和字重稳定；同步源码安装的共享依赖与注册表分发。

新增集合选项高亮背景和前景令牌。完整自定义主题需补齐 `itemHighlight` 与 `itemHighlightForeground`，自定义选项样式按 `data-highlighted` 和 `data-focus-visible` 适配。

优化颜色选择器的响应式双栏布局，使清除按钮与输入框同步悬浮和按压；统一组合框触发器的悬浮反馈。

完善跨包浏览器测试的源码类型检查，并补齐嵌套树选择项的指针高亮恢复验证。
