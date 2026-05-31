# 区块与模板

BrutxUI 提供了预构建的区块组件，将多个基础组件组合成完整的 UI 区段。这些是常见页面模式的即用型构建模块。

## 可用区块

| 区块 | 描述 |
|------|------|
| [Brutalist Hero](/blocks/brutalist-hero) | 带有 CTA 按钮和代码预览的落地页 Hero 区段 |
| [Pricing Section](/blocks/pricing-section) | 带有功能对比的定价表格 |
| [Auth Card](/blocks/auth-card) | 带有社交登录和邮箱表单的登录/注册卡片 |
| [Dashboard Shell](/blocks/dashboard-shell) | 带有侧边栏和顶栏的完整仪表盘布局 |
| [Empty State](/blocks/empty-state) | 带有图标和操作按钮的空状态占位符 |
| [Waitlist Page](/blocks/waitlist-page) | 带有邮箱输入和社交证明的候补注册页面 |

## 安装

使用 CLI 添加区块：

```bash
npx brutx@latest add --block auth-card
```

或同时添加多个区块：

```bash
npx brutx@latest add --block brutalist-hero pricing-section
```

## 自定义

区块是复制粘贴式组件。添加到项目后，你对其源代码拥有完全控制权。可以修改 props、样式和行为以满足你的需求。

所有区块都使用相同的 `--brutal-*` CSS 变量令牌，因此它们会自动适配你选择的主题预设。
