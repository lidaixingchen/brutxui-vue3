---
layout: home

hero:
  name: BrutxUI
  text: Neo-Brutalism Vue 3 组件库
  tagline: 粗边框。硬阴影。零妥协。为 Vue 3 + Tailwind CSS 打造的复制粘贴优先组件库，每一个像素都遵循新粗野主义设计哲学。
  actions:
    - theme: brand
      text: 快速开始 →
      link: /guide/getting-started
    - theme: alt
      text: 浏览组件
      link: /components/
features:
  - icon:
      light: /icons/palette.svg
      dark: /icons/palette.svg
      wrap: true
    title: 粗野主义设计系统
    details: 3px 粗边框、4px 硬阴影、零圆角、鲜艳色彩。每个组件都基于 CSS 自定义属性令牌构建，支持 Classic / Pastel / Mono / Warm 四套主题预设。
  - icon:
      light: /icons/accessibility.svg
      dark: /icons/accessibility.svg
      wrap: true
    title: 无障碍优先
    details: 基于 reka-ui 无头原语构建。正确的 ARIA 属性、键盘导航、焦点管理和屏幕阅读器兼容性，符合 WCAG 标准。
  - icon:
      light: /icons/shield-check.svg
      dark: /icons/shield-check.svg
      wrap: true
    title: TypeScript 严格模式
    details: 全程严格类型安全。通过 defineProps、CVA 变体和每个 prop 的自动补全，零 any 类型。
  - icon:
      light: /icons/clipboard.svg
      dark: /icons/clipboard.svg
      wrap: true
    title: 复制粘贴优先
    details: 零依赖锁定。直接将组件源码复制到你的项目中，完全拥有代码，随心定制每一个细节。
  - icon:
      light: /icons/terminal.svg
      dark: /icons/terminal.svg
      wrap: true
    title: CLI 工具
    details: 一条命令添加组件。npx brutx-vue init 初始化项目，npx brutx-vue add button card 按需安装，AI 友好的项目结构。
  - icon:
      light: /icons/zap.svg
      dark: /icons/zap.svg
      wrap: true
    title: 现代技术栈
    details: Vue 3.5+ script setup、Tailwind CSS 4.3+、Vite 8+、Vitest 4+、pnpm。为现代 Vue 生态而生。
---

<HomeComponentShowcase />

<HomeCodePreview />

<HomeStats />
