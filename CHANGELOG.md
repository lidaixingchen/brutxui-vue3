# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.4...HEAD)

## [0.11.4](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.3...v0.11.4) - 2026-11-01

### 0.11.4 升级迁移

UI 包 `brutx-ui-vue` 与 CLI 包 `brutx-vue` 同步使用 `0.11.4`。本轮包含以下主题、状态与首帧行为调整，升级时应按实际使用方式迁移。

#### 自定义主题高亮色

**影响范围**：手工构造完整 `ThemeTokens` 对象的工具，以及覆盖集合选项高亮颜色的自定义主题。内置主题预设已提供新增字段。

**变更原因**：集合选项使用独立的背景、前景色对，使鼠标当前项与键盘焦点在亮暗主题中保持清晰。

升级前，自定义主题仅包含既有字段：

```ts
const tokens = { ...customTokens }
```

升级后，完整对象补齐两项高亮令牌；以下示例复用自定义主题的强调色对：

```ts
const tokens = {
  ...customTokens,
  itemHighlight: customTokens.accent,
  itemHighlightForeground: customTokens.accentForeground,
}
```

直接覆盖 CSS 变量时，升级前的强调色仍控制原有强调区域：

```css
.theme-custom {
  --brutal-accent: var(--app-accent);
  --brutal-accent-foreground: var(--app-accent-foreground);
}
```

升级后，集合选项的高亮色单独配置：

```css
.theme-custom {
  --brutal-accent: var(--app-accent);
  --brutal-accent-foreground: var(--app-accent-foreground);
  --brutal-item-highlight: var(--app-accent);
  --brutal-item-highlight-foreground: var(--app-accent-foreground);
}
```

**自动迁移可行性**：可以为完整令牌对象和自定义 CSS 主题批量补齐字段；具体色值需结合各主题的前景对比度审查。

#### 集合选项样式

**影响范围**：Select、Command、Combobox、Cascader、TreeSelect、TreeView、Transfer 与 DropdownMenu 的自定义选项行样式。值绑定和选择事件沿用各组件原有契约。

**变更原因**：当前项高亮、业务选中与键盘可见焦点分别表达，交互期间保持行位置、字重、边框宽度和投影稳定。

升级前，应用可能按旧高亮色和交互字重覆盖 CommandItem：

```vue
<CommandItem value="settings" class="data-[highlighted]:bg-brutal-secondary data-[highlighted]:font-black">
  设置
</CommandItem>
```

升级后，使用配对的集合高亮令牌，字重由普通行样式统一提供：

```vue
<CommandItem value="settings" class="data-[highlighted]:bg-brutal-item-highlight data-[highlighted]:text-brutal-item-highlight-foreground">
  设置
</CommandItem>
```

自定义焦点样式应同时考虑真实焦点的 `:focus-visible` 与虚拟焦点的 `data-focus-visible`。业务选中状态仍依据各原语的选中属性和独立标记判断。CLI 源码安装用户通过 `brutx-vue update` 审查组件及共享依赖的差异。

**自动迁移可行性**：可以统一替换已知高亮类；自定义位移、字重、选中判断和焦点选择器需要人工审查。

#### Countdown 首帧与 Calendar 语言

**影响范围**：Countdown 自定义默认插槽，以及依赖 Calendar 默认语言的页面。

**变更原因**：Countdown 在挂载后按当前时钟计算剩余时间，首帧显示占位状态；Calendar 默认沿用提供的语言包。

Countdown 升级前，自定义插槽直接展示数值：

```vue
<Countdown :value="targetTime" v-slot="{ remaining }">
  {{ remaining }}
</Countdown>
```

升级后，通过 `isReady` 区分占位状态和已计算值：

```vue
<Countdown :value="targetTime" v-slot="{ remaining, isReady }">
  {{ isReady ? remaining : '正在准备倒计时' }}
</Countdown>
```

Calendar 升级前，页面可能直接依赖默认语言：

```vue
<Calendar v-model="date" />
```

需要固定中文的页面在升级后显式指定语言：

```vue
<Calendar v-model="date" locale="zh-CN" />
```

**自动迁移可行性**：Calendar 的固定语言可以批量补充；Countdown 的占位文案与业务数值分支需要按页面语义审查。

#### 开发环境

仓库开发和构建要求 Node.js `^22.13.0 || ^24.0.0 || >=26.0.0`。维护本仓库的开发与发布流水线时，按该范围选择运行时并重新安装依赖。

完整指南：[公开 API 迁移指南](https://github.com/lidaixingchen/brutxui-vue3/blob/v0.11.4/docs/guides/API_MIGRATION.md)。

### ⚠️ Breaking Changes

* **ui:** 统一集合选项状态与焦点反馈 ([d3e4818](https://github.com/lidaixingchen/brutxui-vue3/commit/d3e48182dc4f22be8075f807262feacacb035ca3))
* **theme:** 新增集合选项高亮色对 ([d82eb96](https://github.com/lidaixingchen/brutxui-vue3/commit/d82eb96ea22920b50e6d8d2ae4a9f1f4a59ca440))
* **ui:** 完善组件水合与层级覆盖 ([51929d3](https://github.com/lidaixingchen/brutxui-vue3/commit/51929d39db14f005c4598f38bdb1663abe911fa8))
* **deps:** 修复依赖安全告警并升级发布工具链 (#119) ([36e9c83](https://github.com/lidaixingchen/brutxui-vue3/commit/36e9c830995f043cfbfcc9526cc9ce572366361e))
* **deps:** 修复依赖安全告警并升级发布工具链 ([789a88c](https://github.com/lidaixingchen/brutxui-vue3/commit/789a88ca42b42eca470f08b561ee1f0c34770c1b))

### ✨ Features

* **sketchy-chart:** 重构数据契约、等价数据表与全通道读数交互 ([5426af2](https://github.com/lidaixingchen/brutxui-vue3/commit/5426af2a86658fe137e2a598a2b368f0a068864b))
* **slider:** 扩展无障碍外部标签与自定义可读值格式化 ([4345a03](https://github.com/lidaixingchen/brutxui-vue3/commit/4345a03f6e353d6398e43e49a71ea3be627fdf72))
* **tabs:** 解耦 Tabs 内容区外壳并完善公开类型分发契约 ([c75297a](https://github.com/lidaixingchen/brutxui-vue3/commit/c75297afe216258e8f7b1bd1a2850aa55788d208))
* **accordion:** 重塑折叠面板视觉层级、消除展开布局跳动并解耦分隔线 ([35ad2a5](https://github.com/lidaixingchen/brutxui-vue3/commit/35ad2a566c37a04915e2f3fdd01182683809a552))

### ♻️ Code Refactoring

* **ci:** 合并工作流工具与交付文件清理 (#118) ([5e5cd27](https://github.com/lidaixingchen/brutxui-vue3/commit/5e5cd27426c9b8b308e7e412547f76f73bc2e1c3))
* **ci:** 收敛门禁工具与分发解析 ([4b53a86](https://github.com/lidaixingchen/brutxui-vue3/commit/4b53a86b7370e08a43a5c252561118d5d36c83e1))
* **ci:** 精简消费者产物验收回执 ([690e6e6](https://github.com/lidaixingchen/brutxui-vue3/commit/690e6e63e4e838d49350ecd1d0ea537ae60f62ba))
* **ci:** 收敛生成与语义门禁 ([42f740a](https://github.com/lidaixingchen/brutxui-vue3/commit/42f740a3387fa388bc4c6c0540e3d24a8844d28a))

### 🐛 Bug Fixes

* **ci:** 使用源码解析组件自引用 ([614d9bc](https://github.com/lidaixingchen/brutxui-vue3/commit/614d9bc89a01bf4f54d124d853e853b148f74ee8))
* **ci:** 完善跨包类型检查与焦点测试 ([3297e90](https://github.com/lidaixingchen/brutxui-vue3/commit/3297e90df86c1b0dbf7bb9895f3b525808333f6b))
* **build:** 完善跨包类型检查与树节点交互回归 ([17e996d](https://github.com/lidaixingchen/brutxui-vue3/commit/17e996da7d287f3bf11fb27571d0977247dc8537))
* **docs:** 优化评分轮播与图片底栏排版 ([89aab39](https://github.com/lidaixingchen/brutxui-vue3/commit/89aab395819b9581a937470393506cfbdb43b8a8))
* **ui:** 完善窄屏布局与主题状态呈现 ([bab5fd5](https://github.com/lidaixingchen/brutxui-vue3/commit/bab5fd557ebb7152a82b5f228b52014207a39968))
* **ui:** 统一组合框触发器悬浮样式 ([d456733](https://github.com/lidaixingchen/brutxui-vue3/commit/d4567331395c784db3f39b6a481c11713d992eab))
* **ui:** 同步颜色选择器清除按钮位移 ([b298984](https://github.com/lidaixingchen/brutxui-vue3/commit/b298984b6566293a4b8d0eafae1975c657a9e57f))
* **docs:** 强化 API 面板色块层级 ([e736a94](https://github.com/lidaixingchen/brutxui-vue3/commit/e736a94808e0de165987edfc78a87dcffe9c2966))
* **docs:** 修复 API 分类栏按压位移与边框叠加 ([4a1e98c](https://github.com/lidaixingchen/brutxui-vue3/commit/4a1e98cc8914af53325ad48e83c770c13388d034))
* **docs:** 修复安装页签阴影重叠 ([4e4bf52](https://github.com/lidaixingchen/brutxui-vue3/commit/4e4bf525d073c2b6fbe6d64cb3923b15329efbda))
* **ui:** 优化颜色选择器响应式双栏布局 ([650f27b](https://github.com/lidaixingchen/brutxui-vue3/commit/650f27bfafb8a63009d9fe2897a50c88b6b19693))
* **docs:** 修复文档表格宽度与滚动布局 ([11dd4b4](https://github.com/lidaixingchen/brutxui-vue3/commit/11dd4b409f27647dc6a41ab031c7793a9e82aebf))
* **docs:** 改善时间线日期文字可读性 ([73176c7](https://github.com/lidaixingchen/brutxui-vue3/commit/73176c78f9dc4d6815c5a4f7dd465084be8281a3))
* **ui:** 完善日期选择布局与状态前景 ([83ee71e](https://github.com/lidaixingchen/brutxui-vue3/commit/83ee71ec4cf2ffd1b8b83613f1df57c0e2548acd))
* **docs:** 完善组件示例的主题前景配色 ([c3bca5c](https://github.com/lidaixingchen/brutxui-vue3/commit/c3bca5c056d308b67874d8cbc9569ee49b6ffde0))
* **ui:** 完善确认操作布局与状态可读性 ([ae78f15](https://github.com/lidaixingchen/brutxui-vue3/commit/ae78f15bb7d04d4af5c3339947523ec8bae5303e))
* **docs:** 完善窄屏示例与主题配色 ([3a29069](https://github.com/lidaixingchen/brutxui-vue3/commit/3a29069b684fd4b5929a0ff18571696666b08e3c))
* **ui:** 改善组件布局与主题可读性 ([4d13e6a](https://github.com/lidaixingchen/brutxui-vue3/commit/4d13e6a6b53626d77f3afc8b4298906b861230a2))
* **docs:** 隔离预览排版并统一示例视觉 ([af7d6b2](https://github.com/lidaixingchen/brutxui-vue3/commit/af7d6b22ea429bc25d8baf903751f2670ec628ef))
* **ui:** 修复样式层级与窄屏组件布局 ([adb8c35](https://github.com/lidaixingchen/brutxui-vue3/commit/adb8c3568ed5090c6681da977ffd7e41c769ed34))
* **docs:** 统一组件示例的语义配色 ([869f725](https://github.com/lidaixingchen/brutxui-vue3/commit/869f72586d8d7dbe4329313274cb5fc297768f63))
* **ui:** 修复浮层布局与组件状态配色 ([9855461](https://github.com/lidaixingchen/brutxui-vue3/commit/9855461d69b33bb386cb601842b064d15393c448))
* **docs:** 改善窄屏组件示例展示布局 ([93220d8](https://github.com/lidaixingchen/brutxui-vue3/commit/93220d8267f2da38a32ddca284cc7b3c92c1eb86))
* **ui:** 修复区块文字对比度与推荐徽标布局 ([f12ee73](https://github.com/lidaixingchen/brutxui-vue3/commit/f12ee7319647c8652ecf7f05f2e407ef1e634edd))
* **ui:** 修复组件与文档的响应式视觉布局 ([03a8925](https://github.com/lidaixingchen/brutxui-vue3/commit/03a89253402ff549cb60570d4b2d7174ef352845))
* **ui:** 修复组件布局与主题视觉效果 ([4888f11](https://github.com/lidaixingchen/brutxui-vue3/commit/4888f11d2f4f1927748d68de16d2cc6911b7ea00))
* **ui:** 修复组件键盘导航与动态状态 ([0f9317c](https://github.com/lidaixingchen/brutxui-vue3/commit/0f9317cc5419e26c61f7d5bdc2e04d4f4f559fbc))
* **ui:** 修复组件动态状态与键盘交互 ([80f9de9](https://github.com/lidaixingchen/brutxui-vue3/commit/80f9de9e2b490a545454987b2a3ec4fd7ca6c425))
* **ui:** 修复组件视觉状态与浮层交互 ([8a782a2](https://github.com/lidaixingchen/brutxui-vue3/commit/8a782a22ca8b5ffcacff405c6d2d4bda7bdc73cd))
* 修复配置分发与异步状态一致性 (#121) ([a123b5e](https://github.com/lidaixingchen/brutxui-vue3/commit/a123b5eeafe667db79ed3770e0c767303fa2e41a))
* 完善别名解析与浏览器验证契约 ([0da9ad9](https://github.com/lidaixingchen/brutxui-vue3/commit/0da9ad9ed447895b28da183d59139916a5ae6e2b))
* 修复配置分发与异步状态一致性 ([b385b08](https://github.com/lidaixingchen/brutxui-vue3/commit/b385b08c3b86e30b5a6bec036037b9d86c57187a))
* 修复组件交互与分发发布缺陷 (#120) ([308ae54](https://github.com/lidaixingchen/brutxui-vue3/commit/308ae54f8a4702d403f6a2311e2e696b9f750273))
* 修复组件交互与分发发布缺陷 ([4c36e41](https://github.com/lidaixingchen/brutxui-vue3/commit/4c36e4161431c1c8988fb56cc8d9105b31613300))
* **ui:** 对齐样式审计与自动修复的例外值判断 ([0130f77](https://github.com/lidaixingchen/brutxui-vue3/commit/0130f771db82a9422e8b1ba5477537ef61bb7f09))
* **build:** 传递文档构建的平台环境变量 ([f29df84](https://github.com/lidaixingchen/brutxui-vue3/commit/f29df848099bad94fc55e3e2c4e2d3ee02bce3d0))
* **docs:** 完善API目录缓存更新与错误恢复 ([23458e6](https://github.com/lidaixingchen/brutxui-vue3/commit/23458e6ba31301baecb0ace2a298d4be5ee82ef8))
* **cli:** 修复依赖图解析与并发请求隔离 ([75ad115](https://github.com/lidaixingchen/brutxui-vue3/commit/75ad11554b4499ec5caf8d206b086e21fb9cf97f))
* **cli:** 完善响应体接收的超时与取消处理 ([af896f5](https://github.com/lidaixingchen/brutxui-vue3/commit/af896f5f9b3599402ae11c6c064712e434723f36))
* **cli:** 完善组件事务报告与更新快照复用 ([cf1184b](https://github.com/lidaixingchen/brutxui-vue3/commit/cf1184b38d83392a0218b479644147962d427b33))
* **ui:** 修复组件生命周期与派生状态同步 ([d465a9f](https://github.com/lidaixingchen/brutxui-vue3/commit/d465a9ff8c2b77e48e29ca39e83bfa4f16d98b3c))
* **docs:** 补齐图表手动安装依赖与复制说明 ([ad90da9](https://github.com/lidaixingchen/brutxui-vue3/commit/ad90da9f1ba6ead32971122254277978ec0a557b))
* **ui:** 统一饼图扇区绘制与读数命中范围 ([ebcf994](https://github.com/lidaixingchen/brutxui-vue3/commit/ebcf994d390a7c20a03ddde7803bbfe7de56a6fa))
* **docs:** 合并组件API排版与响应式布局修复 (#115) ([64943ff](https://github.com/lidaixingchen/brutxui-vue3/commit/64943ffb56ea6205c45ca542280137cebefc7cd7))
* **docs:** 支持类型代码区域键盘滚动 ([a4a02e1](https://github.com/lidaixingchen/brutxui-vue3/commit/a4a02e195a0980d29d71643818bc62b9dd42de15))
* **docs:** 完善文档表格与导航响应式布局 ([32c7a95](https://github.com/lidaixingchen/brutxui-vue3/commit/32c7a95b443bf114deedf787b969b3e4835c0c53))
* **docs:** 优化组件API主表与详情排版 ([9d59231](https://github.com/lidaixingchen/brutxui-vue3/commit/9d59231f2a37a98c2d7b721f1763e6b4476ffd9c))
* **docs:** 生成语义等价的API类型摘要 ([b4ac39d](https://github.com/lidaixingchen/brutxui-vue3/commit/b4ac39dc359db3e8630fc4f007fbd29bdcdfc975))
* **menu:** 采用环境检测模块获取 matchMedia 以保证 SSR 安全 ([df0834f](https://github.com/lidaixingchen/brutxui-vue3/commit/df0834fd1dcb7e58604af6a60daabebad152c320))
* **menu:** 完善 SubMenu 横向浮层过渡、上下文同步与无障碍支持 ([8cdb0c3](https://github.com/lidaixingchen/brutxui-vue3/commit/8cdb0c34e3ee8697ecb39851c84e4130908baa23))

### 📝 Documentation

* 同步0.11.4诊断报告验证说明 ([30f3fd0](https://github.com/lidaixingchen/brutxui-vue3/commit/30f3fd04f6393e3635476f38dcb6d601df2f64ce))
* 更新0.11.4发布说明与版本归档 ([4e72d0e](https://github.com/lidaixingchen/brutxui-vue3/commit/4e72d0e92955500ac6f2c1b5424d7fe4c1d1dad0))
* **ui:** 补充选择项交互调研报告与索引 ([5d1096f](https://github.com/lidaixingchen/brutxui-vue3/commit/5d1096f0e28edd32722210f3e7f4c06680b6d8e7))
* **ui:** 完成集合交互说明与方案归档 ([c4f4f20](https://github.com/lidaixingchen/brutxui-vue3/commit/c4f4f204aef970444b17c2f20e1c9cd30207ce93))
* **form:** 同步字段插槽绑定说明 ([9ea73cf](https://github.com/lidaixingchen/brutxui-vue3/commit/9ea73cf7d04324a37633515ab03fa43ee32ab654))
* **ci:** 清理工作流审计记录并统一操作说明 ([98f2394](https://github.com/lidaixingchen/brutxui-vue3/commit/98f239410f7a95eb97972f79b6bd6acd3511defd))
* **ci:** 记录门禁优化实测验收 ([662f82d](https://github.com/lidaixingchen/brutxui-vue3/commit/662f82d516fbac63cca9127dc90eb17e20bc453e))
* **ci:** 对齐静态契约命令职责 ([b403975](https://github.com/lidaixingchen/brutxui-vue3/commit/b403975a3af39b1b99bdc062123b5cb852bf57c8))
* **ci:** 保存工作流耗时与测试覆盖证据 ([e240c07](https://github.com/lidaixingchen/brutxui-vue3/commit/e240c07191ad58ad85d3904d12c5f0676b16fb9a))
* **ci:** 记录门禁冗余与性能基线 ([7c7c4d8](https://github.com/lidaixingchen/brutxui-vue3/commit/7c7c4d83e5dd349fc057dea97c2ce84e2ef24670))
* **ui:** 补充图表数据契约与读数交互示例 ([032191f](https://github.com/lidaixingchen/brutxui-vue3/commit/032191f60e2c59ca6b987a83e998388b9e9f4b65))
* **sketchy-chart:** 补充图表读数原型、验收记录并归档数据契约方案 ([f1fdf03](https://github.com/lidaixingchen/brutxui-vue3/commit/f1fdf03d66098d3cb9605ff689c4516f86e8d6db))
* 同步 Tabs 与 Accordion 文档示例并归档视觉层级改造方案 ([078b410](https://github.com/lidaixingchen/brutxui-vue3/commit/078b410caad48b12787ec40ec44add9640bb3c84))

### ✅ Tests

* **cli:** 稳定诊断报告文件输出验证 ([48f237c](https://github.com/lidaixingchen/brutxui-vue3/commit/48f237cfabaf6ed6142cacc88f63b51de74ba12c))
* **cli:** 验证集合组件与共享依赖升级 ([3daa68b](https://github.com/lidaixingchen/brutxui-vue3/commit/3daa68b9862037e55844da487f826adfdb6075be))
* **ui:** 按实际字宽构建浏览器布局场景 ([8ba02ad](https://github.com/lidaixingchen/brutxui-vue3/commit/8ba02adee682a17cef0fe880a8f251ad4d8722e1))
* **ui:** 同步安全升级后的成本测试依赖 ([20baad2](https://github.com/lidaixingchen/brutxui-vue3/commit/20baad2b5ffaf1014d6856b959822d6c8dbc5642))
* **release:** 验证主分支验收等待流程 ([6282349](https://github.com/lidaixingchen/brutxui-vue3/commit/628234983116a718ea0aa451e2293ea5c3173e39))
* **ci:** 精简任务图验证并核对生成输入 ([f3fe8b0](https://github.com/lidaixingchen/brutxui-vue3/commit/f3fe8b02978d05e98a751a720598faa94c13a757))
* **ui:** 配置 vitest 别名直连源码以支持独立测试与覆盖率采集 ([5bbfe26](https://github.com/lidaixingchen/brutxui-vue3/commit/5bbfe26caea92a8b1a26f76a6e23781d99feeed6))
* **release:** 同步0.11.3消费者锁文件 ([4f7f5b6](https://github.com/lidaixingchen/brutxui-vue3/commit/4f7f5b655f51f84d96b841296630561ea6344d71))

### ⚡ Performance

* **ui:** 复用图表布局与文本测量 ([d602dbd](https://github.com/lidaixingchen/brutxui-vue3/commit/d602dbd46d03bd6c7cb62b2d6251d85eb0016828))
* **registry:** 复用编译会话的AST依赖分析 ([6beec49](https://github.com/lidaixingchen/brutxui-vue3/commit/6beec49bd6717b30d4ad3a463abed475c6c07f90))
* **ci:** 优化流水线关键路径并解除单测构建依赖 ([6ea7001](https://github.com/lidaixingchen/brutxui-vue3/commit/6ea70013c17ea464ab9eea8b4477c5b3b0c277dc))

### 🔧 CI

* 合并工作流门禁优化 (#116) ([90ffdb3](https://github.com/lidaixingchen/brutxui-vue3/commit/90ffdb349f82240b1bc1c0427785ae6fa0fcd6bd))
* 按构建领域恢复任务缓存 ([c2ab45f](https://github.com/lidaixingchen/brutxui-vue3/commit/c2ab45f1f10e918715576eaa6f9265a752af7189))
* 并行分片 UI 测试并汇总覆盖率 ([598b219](https://github.com/lidaixingchen/brutxui-vue3/commit/598b219cb3dfe51e0d62dfee4110c44667315758))
* **release:** 衔接同提交的主分支验收 ([51665b3](https://github.com/lidaixingchen/brutxui-vue3/commit/51665b3758da410e8d3f7afc6744f36523c5e56a))
* 对齐源码测试缓存与任务图检查范围 ([9f81857](https://github.com/lidaixingchen/brutxui-vue3/commit/9f81857779906aeb3ede0317b975a28d71efe327))
* 提供按提交范围的耗时复测入口 ([ab4f033](https://github.com/lidaixingchen/brutxui-vue3/commit/ab4f033d9f99cacc03520283f7fda8c9e0424ca0))
* 完善产物与站点的依赖闭包 ([8ecb63e](https://github.com/lidaixingchen/brutxui-vue3/commit/8ecb63ed014657d824e8ab03af3eccb8bab7f6b9))
* 优化任务依赖与变更领域调度 ([e286013](https://github.com/lidaixingchen/brutxui-vue3/commit/e286013e49a3070a8bee8643623dcdfdc648a170))
* 在 coverage 任务中补全组件索引与样式生成前置步骤 ([40b3e91](https://github.com/lidaixingchen/brutxui-vue3/commit/40b3e914daeb94a8b19150467a83a97f27f1fe9a))
* 将单测覆盖率提取为独立任务并校准流水线契约 ([b9e20f1](https://github.com/lidaixingchen/brutxui-vue3/commit/b9e20f153977a636ed722a33aaf68091fffa8be2))
* 增加门禁聚合任务并完善交互单测与过渡断言 ([eba49c8](https://github.com/lidaixingchen/brutxui-vue3/commit/eba49c85abc8866f38cfebcc4066bdaece8ce739))

### 🎨 Styles

* **tokens:** 迁移 border-brutal 至 @utility 并扩充嵌入式触发器视觉规范 ([e348448](https://github.com/lidaixingchen/brutxui-vue3/commit/e3484489600d5465ecb7f66d5af5fae381670480))

## [0.11.3](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.2...v0.11.3) - 2026-09-28

### 0.11.3 升级迁移

本次按 patch 发布，包含以下公开 API 与默认视觉行为调整。

#### ⚠️ Breaking Change: 公开入口 — 测试夹具与内部辅助函数

**影响范围与原因**：测试夹具 DialogTestFixture、NestedDialogTestFixture、SelectTestFixture、VirtualScrollTestFixture，以及 useClearableSelection、useSelectableTrigger、useSelectionDisplayText、useTransferPanelSelection 收敛为内部实现。应用应使用公开组件或自行维护测试夹具和选择逻辑。

Before：
```ts
import { DialogTestFixture } from 'brutx-ui-vue'
```
After（由应用提供夹具文件）：
```ts
import DialogTestFixture from './fixtures/DialogTestFixture.vue'
```
**自动迁移可行性**：辅助函数没有一对一替代，需人工审查；组件 Props 改用 `InstanceType<typeof Button>['$props']` 推导。详见[公开 API 迁移指南](https://github.com/lidaixingchen/brutxui-vue3/blob/v0.11.3/docs/guides/API_MIGRATION.md)。

#### ⚠️ Breaking Change: Accordion — 标题与面板位置稳定

**影响范围与原因**：默认及 interactive 变体采用底色、阴影和展开动画反馈，保持标题与边框对齐。

Before / After（调用方式保持一致，接受新的位置稳定行为）：
```vue
<AccordionItem value="details"><AccordionTrigger>详情</AccordionTrigger><AccordionContent>内容</AccordionContent></AccordionItem>
```
**自动迁移可行性**：无需 API 替换；定制位移样式需人工复核。

#### ⚠️ Breaking Change: Breadcrumb — 实体标签

**影响范围与原因**：默认链接具有完整边框、底色与硬阴影，按压时文字与框整体移动。

Before / After（调用方式保持一致，接受实体标签外观）：
```vue
<BreadcrumbLink href="/components">组件</BreadcrumbLink>
```
**自动迁移可行性**：无需 API 替换；布局和视觉快照需人工复核。

#### ⚠️ Breaking Change: TableHead — 继承表头配色

**影响范围与原因**：单元格默认继承 TableHeader，确保整行底纹一致。需要保留独立默认配色时显式指定 variant。

Before：
```vue
<TableHead>名称</TableHead>
```
After：
```vue
<TableHead variant="default">名称</TableHead>
```
**自动迁移可行性**：仅对需要独立配色的单元格添加属性。

#### ⚠️ Breaking Change: FormItem — 标签布局

**影响范围与原因**：FormItem 遵循 Form.labelPosition；默认 right 为左侧标签右对齐。保留上下布局时指定 top。

Before：
```vue
<Form><FormItem><FormLabel>名称</FormLabel><Input /></FormItem></Form>
```
After：
```vue
<Form label-position="top"><FormItem><FormLabel>名称</FormLabel><Input /></FormItem></Form>
```
**自动迁移可行性**：可对需要上下布局的 Form 添加属性。

#### ⚠️ Breaking Change: showDialog — 结构化终态

**影响范围与原因**：ShowDialogOptions 移除 onConfirm，返回句柄的 promise 统一携带 action 与可选 data。

Before：
```ts
showDialog({ title: '确认', onConfirm: () => console.log('确认') })
```
After：
```ts
const dialog = showDialog({ title: '确认' })
dialog.promise.then(result => {
    if (result.action === 'confirm') console.log('确认')
})
// 自定义确认操作通过句柄或 footer 的 close 回传终态。
dialog.close({ action: 'confirm' })
```
**自动迁移可行性**：需人工检查确认操作与终态分支，不能只重命名回调。

### ⚠️ Breaking Changes

* **docs:** 建立组件API生成展示体系并迁移双语文档 ([b69414b](https://github.com/lidaixingchen/brutxui-vue3/commit/b69414b7a4fe17a8bd20b937ffeb21e3afb1673f))
* **ui:** 完善折叠面板与面包屑交互 ([44832c9](https://github.com/lidaixingchen/brutxui-vue3/commit/44832c977c01bff0135ea5bc5e9f467bc59a53ce))
* **ui:** 改善表格状态与移动导航布局 ([6ed299b](https://github.com/lidaixingchen/brutxui-vue3/commit/6ed299b043ce3a2429b4021053d49d5ebbf1e357))
* **ui:** 完善表单布局与输入控件状态 ([28dbf36](https://github.com/lidaixingchen/brutxui-vue3/commit/28dbf36aeca3ea31b49124a0b80e8707acab9b14))
* **ui:** 对齐对话框结构化终态并为门面注入上下文自动捕获 ([4299097](https://github.com/lidaixingchen/brutxui-vue3/commit/42990970926b0b6b5797644fae1830d9e4e685cb))

### ✨ Features

* **docs:** 知识地图归档区方案主题收敛至最新5个并完善跨环境确定性排序 ([5b82e4c](https://github.com/lidaixingchen/brutxui-vue3/commit/5b82e4cfe7a3318984fd932f171a2bb259bc586c))
* **shared:** 增强内存文件系统跨平台语义与真实路径映射 ([e9c733a](https://github.com/lidaixingchen/brutxui-vue3/commit/e9c733a93ec1bf33b45c95faf3cb482fcc79a8b5))
* **shared:** 提供跨平台路径工具模块与双轨对称实现 ([9287937](https://github.com/lidaixingchen/brutxui-vue3/commit/92879376c0c0e910b29bdbd896515f1c314a57ec))
* **scripts:** 增强文档自愈引擎与命令有效性门禁 ([303d995](https://github.com/lidaixingchen/brutxui-vue3/commit/303d995a0decee156afb5e432ebba0193fc25b01))
* **ui:** 扩充国际化字典并对齐设计令牌回退基线 ([d399949](https://github.com/lidaixingchen/brutxui-vue3/commit/d399949994d373b52a051fbe54668b2d8bc8c900))
* **shared:** 增补 floating 语义层级令牌并同步全包设计令牌 ([b017784](https://github.com/lidaixingchen/brutxui-vue3/commit/b017784d2a15b05172fb9cef8235b0aa50eb09de))
* **ui/audio:** 落地单 realm 共享音频运行时与动态响应式启停 ([c649440](https://github.com/lidaixingchen/brutxui-vue3/commit/c649440428bff3a05bdc0f1ea352dd4cd7e8331c))
* **release:** 引入统一发布状态机协调器与双哈希不可变发布校验 ([4ffa1d9](https://github.com/lidaixingchen/brutxui-vue3/commit/4ffa1d9c4df9004cb9b05b8ea063da2dae134471))
* **cli:** 实现本地基线镜像持久化与确定性 3-way replay 合并 ([5e4a912](https://github.com/lidaixingchen/brutxui-vue3/commit/5e4a91230a0d00d4b822d651c13077df336993f6))
* **registry:** 支持版本化不可变快照元数据与 Canonical JSON 校验 ([c8120f9](https://github.com/lidaixingchen/brutxui-vue3/commit/c8120f903c1e0f79d45af3240d83844e4b93df5d))
* **ui:** 实现 SSR 应用级上下文隔离与主题安全水合 ([d8d2e56](https://github.com/lidaixingchen/brutxui-vue3/commit/d8d2e56d1b8825cce360940e9d87b8b42f24cded))
* **ui:** 补齐消费端类型测试门禁与主入口组合式函数导出守卫 ([fccbfd5](https://github.com/lidaixingchen/brutxui-vue3/commit/fccbfd598b2065570f4f21abd3ba4af7afc6c37c))
* **ui:** 新增 Statistic 与 Countdown 组件并完善国际化与元数据 ([4759f92](https://github.com/lidaixingchen/brutxui-vue3/commit/4759f9257692d4588468be1ed756e8f9d92b017c))
* **cli:** 支持初始化交互式令牌文件拆分与相对路径解析 ([b95f6d1](https://github.com/lidaixingchen/brutxui-vue3/commit/b95f6d12561efbf6e1e7ef76bb0a7733d9e73842))
* **cli:** 实现 CssTokenInjector 样式深模块并分离规划与执行接缝 ([1b37ba8](https://github.com/lidaixingchen/brutxui-vue3/commit/1b37ba8b5b31f9a58c2cfe8fd3476c1b2a0569c6))
* **cli:** 新增 Nuxt 框架配置语法深模块与词法状态机解析器 ([9198305](https://github.com/lidaixingchen/brutxui-vue3/commit/9198305013c1aa2dbeb36d55b2d64018990c4706))
* **cli:** 重构自愈引擎支持全景差异预览与四阶段原子调度 ([ef351a9](https://github.com/lidaixingchen/brutxui-vue3/commit/ef351a9e3f6fb9fef99e48f24c5763d770dab71b))
* **cli:** 命令服务层收敛至上下文门面并补充沙箱单测 ([ac17821](https://github.com/lidaixingchen/brutxui-vue3/commit/ac178211cd02bdc43edf7a4c1cacc3e583c7de43))
* **docs:** 实现方案自动归档与知识地图自愈引擎 ([8c2a848](https://github.com/lidaixingchen/brutxui-vue3/commit/8c2a848308f01db230c453b2229ab00c9894a881))

### ♻️ Code Refactoring

* **ui:** 收敛组合式函数内部状态只读视图并增强单例销毁 ([f910def](https://github.com/lidaixingchen/brutxui-vue3/commit/f910defb7c48595f01d30fb4c817b4dd059981ca))
* **ui:** 收敛反馈图表与日期选择组件模板样式计算 ([6aa1835](https://github.com/lidaixingchen/brutxui-vue3/commit/6aa1835db11c393e19b854ed5af2a28dbf77674d))
* **ui:** 收敛布局与导航类组件模板样式计算 ([ed4b6a2](https://github.com/lidaixingchen/brutxui-vue3/commit/ed4b6a28107057d3048729bf17f357ee78027be8))
* **ui:** 收敛表单与选择类组件模板样式计算 ([98673b4](https://github.com/lidaixingchen/brutxui-vue3/commit/98673b4de4b4a0651f95e79b3f2457accdf8a16f))
* **ui/data-table:** 引入 useDataTablePipeline 编排数据处理流 ([6593021](https://github.com/lidaixingchen/brutxui-vue3/commit/659302159b22fae46d332ccef68153cb48a1e72f))
* **ui/kanban:** 抽离看板纯操作函数并规范化移动控制器 ([da9ab08](https://github.com/lidaixingchen/brutxui-vue3/commit/da9ab08bced507e40cac667d28aa65898ff26815))
* **ui:** 提取 selection-value 统一空值与有效选择值判定 ([204ebd5](https://github.com/lidaixingchen/brutxui-vue3/commit/204ebd5e5ed1b889887cecfb4610ba795d6bf6a9))
* **tooling:** 收敛门禁职责与 CI 覆盖 ([936abf9](https://github.com/lidaixingchen/brutxui-vue3/commit/936abf9bbd0f61c01dcf7af74a15ae451aeb1262))
* **core:** 建立生成编排、显式 API 契约与按钮成本控制 ([553091e](https://github.com/lidaixingchen/brutxui-vue3/commit/553091ec0b53edf6f41e817e6f1c776f244b7fde))
* **cli:** 消除内部依赖泄露并实现纯结构文件系统契约 ([e6115d2](https://github.com/lidaixingchen/brutxui-vue3/commit/e6115d2f4df9ff520cf8c9432d5991bbc4944f6d))
* **scripts:** 契约与文档门禁接入调度引擎 ([bc76e44](https://github.com/lidaixingchen/brutxui-vue3/commit/bc76e44e3446f61e1208133852e9d3f63bb441d5))
* **scripts:** 抽取门禁调度引擎深模块与配套测试 ([c4168b0](https://github.com/lidaixingchen/brutxui-vue3/commit/c4168b08d39b55cd730ae85d51b38f6cbb04e52a))
* **cli:** 实现令牌本地自治生成并切断门禁对 UI 的跨包依赖 ([2893414](https://github.com/lidaixingchen/brutxui-vue3/commit/289341437f7867a9a80887328502c61f85ff34a5))
* **ui:** 消除生成脚本对 CLI 的跨包写并清理寄生编译器 ([0b55443](https://github.com/lidaixingchen/brutxui-vue3/commit/0b554430415a88d85c95a3ac15ddbd6c09418fa2))
* **shared:** 下沉设计令牌纯计算编译器深模块 ([fab20e6](https://github.com/lidaixingchen/brutxui-vue3/commit/fab20e67dc64924c8c67d0063c1434e4fe232e87))
* **cli:** 将add与update命令收敛为薄终端适配器 ([844b526](https://github.com/lidaixingchen/brutxui-vue3/commit/844b526739b15b45d874646e3bcf2b2ba5a4432d))
* **cli:** 构建Plan-Execute组件变更编排引擎 ([ba52243](https://github.com/lidaixingchen/brutxui-vue3/commit/ba52243ba0385255170dde926c0f7b8be10bb0aa))
* **ui:** 深化命令式宿主控制器与生命周期管理 ([b6f516c](https://github.com/lidaixingchen/brutxui-vue3/commit/b6f516cca181d90c442addb8c6f9fb01890057f7))
* **ui:** 规范化复合区块变体与测试覆盖 ([3e20490](https://github.com/lidaixingchen/brutxui-vue3/commit/3e20490cf169a1d33a1a7f732f60adf26684c64d))
* **cli:** 引入 jsonc-parser 保护代码片段注释并接入事务落盘 ([071cebb](https://github.com/lidaixingchen/brutxui-vue3/commit/071cebb69ab1730d779cffeb01dd5ef92d23c846))
* **cli:** 重构 init-service 与 tailwind-rules 消除双重手写实现 ([dc334b5](https://github.com/lidaixingchen/brutxui-vue3/commit/dc334b5a31f6e25b2a3cec05d41712b35c88971f))
* **cli:** 迁移诊断规则至纯声明式PlanFix动作原语 ([e0c8a41](https://github.com/lidaixingchen/brutxui-vue3/commit/e0c8a4123f9b2be8cdf4e7631fc55a1f75fa8706))
* **cli:** 抽取环境探测与组件扫描专职模块并升级上下文门面 ([6e59987](https://github.com/lidaixingchen/brutxui-vue3/commit/6e599878602f246ca598d52a627d7dd5e8da5978))
* **cli:** 迁移上层命令与服务至 RegistryClient ([e683ee1](https://github.com/lidaixingchen/brutxui-vue3/commit/e683ee13a42f9e2e5dd950fee391979c7bf68ac3))
* **cli:** 重构注册表客户端深模块与只读契约 ([ec9843a](https://github.com/lidaixingchen/brutxui-vue3/commit/ec9843aab085beee11f21861516acd7bedf688d6))

### 🐛 Bug Fixes

* **docs:** 修正函数式API文档校验与提取测试初始化 ([82a7562](https://github.com/lidaixingchen/brutxui-vue3/commit/82a7562bc1cefd89b341bbbb2fda62dd9681db65))
* **ui:** 统一脚手架引擎内部路径为标准Posix格式 ([46a0e2c](https://github.com/lidaixingchen/brutxui-vue3/commit/46a0e2c9dd55ba5178da699e88501b572970a92c))
* **scripts:** 修复快照检查与短路径兼容性 ([aec5e6c](https://github.com/lidaixingchen/brutxui-vue3/commit/aec5e6c96d7188dd0db9dc38ecce9a866766545b))
* **cli:** 统一模块解析与诊断报告器跨平台路径处理 ([a079e6a](https://github.com/lidaixingchen/brutxui-vue3/commit/a079e6ac4c43a1bd355030e26fae5b05badfdf77))
* **ui:** 规范倒计时格式化正则字符类语法满足代码风格检查 ([3614b86](https://github.com/lidaixingchen/brutxui-vue3/commit/3614b86fc8b14904156a2f47f6e291152e4b3136))
* 修复代码扫描报告中的安全漏洞与回溯隐患 ([c1f39d2](https://github.com/lidaixingchen/brutxui-vue3/commit/c1f39d24928ea8dc246c9e67fbd83e45c6fceffd))
* **ui:** 恢复 z-index 常量自包含定义消除消费端模块缺失 ([4703885](https://github.com/lidaixingchen/brutxui-vue3/commit/470388525dfa7ecd90acd5a9ed8f1ff6c42e8482))
* **ui:** 规范组件结构合法性与可访问名称并对齐层叠令牌 ([2cfb519](https://github.com/lidaixingchen/brutxui-vue3/commit/2cfb51986b9f166380cfdbc2ef44fa148d968b3f))
* **ci:** 调整契约门禁执行顺序至构建物化完成之后 ([f02b56b](https://github.com/lidaixingchen/brutxui-vue3/commit/f02b56b67c2bf92292400a7898aea234f783db9e))
* **docs:** 移除组件总览 vp-raw 以恢复全局粗野主义表格样式 ([23e8f6d](https://github.com/lidaixingchen/brutxui-vue3/commit/23e8f6d458b95481394c1620cabb0fe92972a6e8))
* **core:** 修复跨平台路径大小写判定并清除文档死链 ([d7e90af](https://github.com/lidaixingchen/brutxui-vue3/commit/d7e90af4149d40f6590c889855b587c1e183f94f))
* **docs:** 隔离组件预览样式并同步主题实验室 ([644d857](https://github.com/lidaixingchen/brutxui-vue3/commit/644d857981307b457246a4b942b423b2e22d1e09))
* **ui:** 优化代码图表与复合组件视觉 ([2a6d3a6](https://github.com/lidaixingchen/brutxui-vue3/commit/2a6d3a6713bc200b1f49f7b7a6dacdb37ecd4724))
* **ui:** 修复浮层生命周期与消息可读性 ([7ab9b6a](https://github.com/lidaixingchen/brutxui-vue3/commit/7ab9b6a29cc5d0049109070bd5e8f1c45cc2902e))
* **ui:** 修复日期主题与树选择焦点状态 ([dcfa3cb](https://github.com/lidaixingchen/brutxui-vue3/commit/dcfa3cbf40ad6834869b7d1be7a5386937286a41))
* **theme:** 提升主题对比度并修复纹理类合并 ([7142054](https://github.com/lidaixingchen/brutxui-vue3/commit/7142054dc3565933b95e44ef3fb063cc33c28f8c))
* 修复生成锁异常链与基线恢复测试 ([7d30ca7](https://github.com/lidaixingchen/brutxui-vue3/commit/7d30ca7e31dac58c75c17c9d67e1535f7ffd5bb6))
* **ui:** 消除默认值魔法数字并导出集中式 z-index 层叠常量 ([55f9058](https://github.com/lidaixingchen/brutxui-vue3/commit/55f9058a8cd586717b62f7d6e51c4d60d2eed169))
* 修复通过状态携带自愈标记缺陷并补齐现行方案文档 ([17679a0](https://github.com/lidaixingchen/brutxui-vue3/commit/17679a0e746cacd31e9c0d237763a31c73118d2d))
* 隔离测试环境看板输出并修复跨包代码检查与测试断言 ([dd7f7bd](https://github.com/lidaixingchen/brutxui-vue3/commit/dd7f7bd667baf0e5f72d3b9ba5d54ee8a496b44f))
* **cli:** 为 FileTransaction 的 ensureDir 与 remove 补齐路径安全校验 ([4fb721c](https://github.com/lidaixingchen/brutxui-vue3/commit/4fb721ca95b0530d766f94657367d2b6d0db49c1))
* **ui:** 优化多层投影比例与警戒按钮文字对比 ([0331728](https://github.com/lidaixingchen/brutxui-vue3/commit/03317288b0dd631d4d7bbda818c7a6f72a1d14bb))
* **ui:** 修复 VirtualScroll 斑马纹背景显示 ([414dc02](https://github.com/lidaixingchen/brutxui-vue3/commit/414dc0292f3c1a15041a195edd3522ee14b475dc))
* **ui:** 保留按钮悬停时的多层投影 ([146e2f3](https://github.com/lidaixingchen/brutxui-vue3/commit/146e2f3068f8d8379fcdb2d910b958db4668b1d1))

### 📝 Documentation

* 完善组件API维护指南并归档改造方案 ([bee27f9](https://github.com/lidaixingchen/brutxui-vue3/commit/bee27f967ba7080d32c0b7420a3bb589067b37de))
* 归档测试质量治理方案并记录验收 ([0265b6f](https://github.com/lidaixingchen/brutxui-vue3/commit/0265b6fde2e84af699e61c35ce6eaeb91eb575cf))
* 清理根级领域词汇表 CONTEXT.md 并回归常青架构单一信源 ([d4d1605](https://github.com/lidaixingchen/brutxui-vue3/commit/d4d1605985ef28f1eef98311a7c3c547c5e89583))
* 同步根目录 README 至英文镜像并完善文档治理四象限契约 ([cc3e103](https://github.com/lidaixingchen/brutxui-vue3/commit/cc3e1031bb6e53b5b185b54b8d0ec0a841a988fe))
* 归档跨平台路径输入与解析一致性修复方案并同步知识地图 ([9e10d14](https://github.com/lidaixingchen/brutxui-vue3/commit/9e10d14ac9841e741f946b80e4f0a601e15650f3))
* **agents:** 完善任务入口与优先复用原则 ([3cc34da](https://github.com/lidaixingchen/brutxui-vue3/commit/3cc34da1360cb9d45f37ebc7b90c415c9b0ba005))
* **archive:** 统一历史方案归档状态并刷新知识地图 ([b383354](https://github.com/lidaixingchen/brutxui-vue3/commit/b3833547b1eac6306a3521d729485728ddedd5af))
* **agents:** 精简统一 AI 入口并校准协同技能与包导向 ([aa53007](https://github.com/lidaixingchen/brutxui-vue3/commit/aa53007bb936f780826b1c94bb6cd4317c6b634e))
* **site:** 补充受测代码示例并优化双语指引与部署门禁 ([31716cb](https://github.com/lidaixingchen/brutxui-vue3/commit/31716cbafa83132dfc085202d382ed4b5383b88d))
* **architecture:** 新增现行架构说明并校准工程指南 ([6cf09d8](https://github.com/lidaixingchen/brutxui-vue3/commit/6cf09d8e73423f65c1f554428f7c57ef7c8002b7))
* 归档组件库规范偏离与无障碍深度治理并同步知识地图 ([8a1f9bb](https://github.com/lidaixingchen/brutxui-vue3/commit/8a1f9bb6b6fc7881adebd119c1b51dfc30a9cb28))
* 归档CI工作流性能优化与去冗余方案并同步知识地图 ([c6ba942](https://github.com/lidaixingchen/brutxui-vue3/commit/c6ba9427d640e8960591564cbd8b72ad74fe7d82))
* **guide:** 规范贡献指南脚手架门禁并清空历史迁移正文 ([7cb4be8](https://github.com/lidaixingchen/brutxui-vue3/commit/7cb4be84e26b61a77b71a8ef55de86b3287e07df))
* **guide:** 更新图表组件体系、设计令牌预设与全量国际化索引 ([a0ad4ae](https://github.com/lidaixingchen/brutxui-vue3/commit/a0ad4aea7a92172711db79a87b482eecf2122984))
* **guide:** 重构最佳实践体系并对齐最新 API 契约 ([8e54847](https://github.com/lidaixingchen/brutxui-vue3/commit/8e548470ff34f8e053219be3016c01e47e91b85f))
* **cli:** 补齐中英文 CLI 命令参数与错误排查手册 ([be69674](https://github.com/lidaixingchen/brutxui-vue3/commit/be69674bf8066eec0891108fe21a17f8d6a8127c))
* **guide:** 修正起步安装导入路径与 Tailwind v4 编译配置 ([a9a160b](https://github.com/lidaixingchen/brutxui-vue3/commit/a9a160b3e2c45827f1869210524adfeb2b5eb77e))
* **guide:** 新增中英文供应链安全指南与侧边栏配置 ([b94066b](https://github.com/lidaixingchen/brutxui-vue3/commit/b94066b23cb992f27ccb1b950e22642c4b0f5cd5))
* 抽离 AI 技能维护规范至 skills/README.md ([0d7aaa6](https://github.com/lidaixingchen/brutxui-vue3/commit/0d7aaa635b50b982b5d2cb98eb6d674cb75b12dc))
* **ui:** 归档组件状态与音频资源深化方案并更新验收报告 ([a471c65](https://github.com/lidaixingchen/brutxui-vue3/commit/a471c655e692b992b06d1bf11461a51efbeb6ca8))
* 归档架构交付契约第三批修复并同步知识地图 ([d1f6133](https://github.com/lidaixingchen/brutxui-vue3/commit/d1f6133d2d44ac616b812edb7b1647ac10edaa55))
* 完成第三批架构交付验收与文档更新 ([e134164](https://github.com/lidaixingchen/brutxui-vue3/commit/e134164aaf3c081ce0590b0f70f8a7e3ce65cfc7))
* 归档第二批交付方案并更新发布架构与 CLI 指南 ([2a3af93](https://github.com/lidaixingchen/brutxui-vue3/commit/2a3af930937543f33721bc3ec8e81ae111faa0a1))
* 归档架构交付契约首批修复方案并同步知识地图 ([f1ee89c](https://github.com/lidaixingchen/brutxui-vue3/commit/f1ee89ca1b81ad0cf6574f0b82d0688c2f5f74cf))
* 更新门禁调度引擎常青架构与指令说明文档 ([ff426cb](https://github.com/lidaixingchen/brutxui-vue3/commit/ff426cbb259e4ebac2f6c2532e1beb6bf8a6b629))
* 归档工程门禁与巡检调度引擎收敛方案并同步知识地图 ([31d532d](https://github.com/lidaixingchen/brutxui-vue3/commit/31d532dbf0fe9ccf2d1b90162af4dfd720b0522c))
* **cli:** 归档CLI组件安装与变更编排引擎重构方案 ([43f272c](https://github.com/lidaixingchen/brutxui-vue3/commit/43f272c90241301698346a30db0b83c1d5e29886))
* 归档命令式宿主控制器与弹层调度栈重构并同步知识地图 ([cc311e7](https://github.com/lidaixingchen/brutxui-vue3/commit/cc311e73dfe4a633a9b6da68284712583b38924c))
* 归档系统演进与存量任务收敛方案并同步知识地图 ([f196416](https://github.com/lidaixingchen/brutxui-vue3/commit/f1964166ae75ba5d061891a47f5e77be880b5642))
* 交付组件动态 API 元数据并规范化 Statistic 与 Countdown 使用文档 ([372ba03](https://github.com/lidaixingchen/brutxui-vue3/commit/372ba03c1740b6538e87d8dd09e4096fd2cee797))
* **cli:** 归档 CLI代码修改与配置注入深模块重构方案并同步知识地图 ([bd4691e](https://github.com/lidaixingchen/brutxui-vue3/commit/bd4691ea220f1799af053415653d7bb338395a66))
* **cli:** 归档CLI诊断自愈纯声明式方案与差异预览重构并同步知识地图 ([25fda9d](https://github.com/lidaixingchen/brutxui-vue3/commit/25fda9dd9dda5e4f994fde01d46078ea334ebd36))
* **cli:** 归档CLI项目上下文深模块凝聚与辅助函数收敛方案 ([eaaf051](https://github.com/lidaixingchen/brutxui-vue3/commit/eaaf0515e2eebe09048f0c4139273f7ea6c67201))
* **cli:** 归档注册表深模块演进方案并同步知识地图 ([77cff5a](https://github.com/lidaixingchen/brutxui-vue3/commit/77cff5ac0b36beecdb097809916760db5d8d033e))
* 完善提交前归档闭环规范并精简 AGENTS 指针 ([97cd014](https://github.com/lidaixingchen/brutxui-vue3/commit/97cd01496a652624cada84d47b5c3982e393098a))
* **core:** 归档已结项方案并声明式同步知识地图 ([2f6efe4](https://github.com/lidaixingchen/brutxui-vue3/commit/2f6efe472fba81e0b9ae35c435a3f0d328ab184a))
* **core:** 更新工程门禁重构方案状态为已完成 ([e4ab98c](https://github.com/lidaixingchen/brutxui-vue3/commit/e4ab98ca5f93c0cca95fed87069174321d49a95f))

### ✅ Tests

* **ui:** 完善交互测试与覆盖率门禁 ([906eaf8](https://github.com/lidaixingchen/brutxui-vue3/commit/906eaf86b70d16e5ef0ea649688911a10215eebd))
* **testing:** 引入真实消费者矩阵与 Chromium 浏览器回归测试套件 ([1c7f696](https://github.com/lidaixingchen/brutxui-vue3/commit/1c7f69656da3a90c1a0b9b3696f547ff34f546ad))
* **cli:** 补充变更引擎VFS测试并更新命令契约断言 ([681629c](https://github.com/lidaixingchen/brutxui-vue3/commit/681629c1a5ad5a864e8fa7654b360c93918e6f53))
* **cli:** 补齐声明式自愈与碰撞拦截测试套件 ([106a9e7](https://github.com/lidaixingchen/brutxui-vue3/commit/106a9e76d2a1d8ca143e1238a411d346737845aa))
* **cli:** 重构注册表单测套件并补齐测试覆盖 ([401ee30](https://github.com/lidaixingchen/brutxui-vue3/commit/401ee3021532dd85ac2e571627cc0558d5ec9c70))

### ⚡ Performance

* **shared:** 增加模块解析器路径缓存并优化跨平台构建任务契约 ([b9f9885](https://github.com/lidaixingchen/brutxui-vue3/commit/b9f9885fbb74d722ca11c86882052c11dc4d218a))

### 📦 Build

* **docs:** 接通API生成任务与开发监听检查 ([b8d5fdc](https://github.com/lidaixingchen/brutxui-vue3/commit/b8d5fdc82e52a694b577f789e41a098d84e382c6))
* 补齐 Turbo 任务依赖拓扑并新增排他并发生成锁 ([f0c415b](https://github.com/lidaixingchen/brutxui-vue3/commit/f0c415beb0ae77078ad794d90c9a1ae98c4986dd))

### 🔧 CI

* 豁免自动化提交的 PR commitlint 校验 ([76655d3](https://github.com/lidaixingchen/brutxui-vue3/commit/76655d3340ef52115162cd17d023ae942401fccc))
* **deps:** bump pnpm/action-setup to 6.1.0 ([bc2c052](https://github.com/lidaixingchen/brutxui-vue3/commit/bc2c052be871bb91496bcda5cb4be293a36db7a8))
* 优化工作流任务拓扑与缓存机制并对齐门禁契约 ([830c17d](https://github.com/lidaixingchen/brutxui-vue3/commit/830c17d084d898d5db8a0b7921907f2829812f47))
* **release:** 规范化 GitHub Release 说明提取与发版工作流 ([5b77c53](https://github.com/lidaixingchen/brutxui-vue3/commit/5b77c530b4444a6e9c1a41a68f1d64e99b012441))

## [0.11.2](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.1...v0.11.2) - 2026-09-09

### ✨ Features

* **scripts:** 重构文档链接检查工具并接入动态自愈引擎 ([c9488d4](https://github.com/lidaixingchen/brutxui-vue3/commit/c9488d47c767a8e76f802a3e5817137c7fc301f6))
* **scripts:** 聚合契约与文档门禁并接入Result Envelope ([14f967f](https://github.com/lidaixingchen/brutxui-vue3/commit/14f967ff5c24a624aed0eb553ecb23fbc0c68d1b))
* **ui:** 升级 API 文档生成引擎并加固产物隔离门禁 ([240245c](https://github.com/lidaixingchen/brutxui-vue3/commit/240245ca15478ebad75bfeb44ce5e2ce82909ae7))
* **shared:** 统一 AST 语法解析引擎与模块依赖分析 ([2d39b09](https://github.com/lidaixingchen/brutxui-vue3/commit/2d39b092490b158e6b802e03aab6cdcd828f08ad))
* **cli:** 浅包装模块物理清理与公共 API 终态收尾 (#109) ([7ee2dd4](https://github.com/lidaixingchen/brutxui-vue3/commit/7ee2dd480e00b4805d72f05d3d65d242eca52e90))
* **cli:** ProjectContext 惰性单例集成与命令层迁移 (#108) ([1f96072](https://github.com/lidaixingchen/brutxui-vue3/commit/1f96072f813bb91e8ccd66151e671154979ed83c))
* **cli:** 实现依赖图拓扑解析与通用组件列表枚举 (#107) ([4f5f552](https://github.com/lidaixingchen/brutxui-vue3/commit/4f5f552a80704f7db0bb59e99f464a0d3f67f834))
* **cli:** 实现 RegistryClient 基础拉取管道与可注入 Ports 适配器 (#106) ([ea4a751](https://github.com/lidaixingchen/brutxui-vue3/commit/ea4a7513b9cf760d2cd649c5a3215c114d8c7d31))
* **cli:** 配置管理领域独立与参数契约解耦 (#105) ([54b4b2b](https://github.com/lidaixingchen/brutxui-vue3/commit/54b4b2b6f7a547e31f2e8c1226dbd8b650aa00eb))
* **cli:** 升级 tailwind.tokens 为图感知规则 (#103) ([65fd394](https://github.com/lidaixingchen/brutxui-vue3/commit/65fd39400f0907b9dd034473f98324d7ef21ae30))
* **cli:** 支持 tokensFile 与 init 样式解耦 (#102) ([efd13bc](https://github.com/lidaixingchen/brutxui-vue3/commit/efd13bc59e15372399239cb79ab4177b76c0dcff))
* **cli:** 实现 CSS 依赖有向无环图扫描引擎与相对路径注入器 (#101) ([0dad7d6](https://github.com/lidaixingchen/brutxui-vue3/commit/0dad7d6bdcef7e87ea9ee7a5c9c7427ecdb1f95c))
* **cli:** 支持 doctor CI智能嗅探与细粒度退出码 (close #99) ([356741a](https://github.com/lidaixingchen/brutxui-vue3/commit/356741af55e9bf27ee36622146ecb5be0f7f99ac))
* **cli:** 支持 OASIS SARIF 2.1.0 报告器 (close #98) ([73fd107](https://github.com/lidaixingchen/brutxui-vue3/commit/73fd107a569442c17f20f91829941aeabe254310))
* **cli:** 支持多态 Reporter 矩阵与 GitHub CI (close #97) ([15e7275](https://github.com/lidaixingchen/brutxui-vue3/commit/15e72755c22df6e3dc1737fe9d7026889ae47443))
* **cli:** 支持自定义规则插件加载与沙箱隔离 (close #96) ([8f8d3af](https://github.com/lidaixingchen/brutxui-vue3/commit/8f8d3afc096f3ef8b3bf299ef87726bdfa3eb5dd))
* **cli:** 支持 components.json 规则严重级别覆盖 (close #95) ([330f310](https://github.com/lidaixingchen/brutxui-vue3/commit/330f310da33f4c9ba843ff641aa607c3062790df))
* **cli:** bundle CLI standalone and add monorepo E2E ([50e1a93](https://github.com/lidaixingchen/brutxui-vue3/commit/50e1a9354c34d807e85adbf39abd8e4239764621))
* **cli:** implement two-phase execution and router ([738744c](https://github.com/lidaixingchen/brutxui-vue3/commit/738744c8de616fda6985d0b969ccd936cc303c21))
* **registry:** migrate AST pipeline to SfcAstEngine ([8c5abe1](https://github.com/lidaixingchen/brutxui-vue3/commit/8c5abe15556948fbee12e15b2f7286629efeef50))
* **cli:** implement WorkspaceTopologyEngine and resolver ([ad756d6](https://github.com/lidaixingchen/brutxui-vue3/commit/ad756d64e96aa370d133f94404f2b2b1411569ea))
* **shared:** implement SfcAstEngine pipeline ([f30b4df](https://github.com/lidaixingchen/brutxui-vue3/commit/f30b4dfa7df658992ed49d62338a4755597b3f51))
* **cli:** 补充多源竞速调试追踪与健康探针测试 (#87) ([fdae20f](https://github.com/lidaixingchen/brutxui-vue3/commit/fdae20ff1c48ad09d47c1d868421b1e571a85f19))
* **cli:** 业务层接入阶梯竞速与弹性门面，清除旧版硬超时重试 (#86) ([a59de42](https://github.com/lidaixingchen/brutxui-vue3/commit/a59de42cdf6c9b9ebb9d2a397e4bc3c0db2290aa))
* **cli:** 实现链式自适应阶梯竞速调度引擎与弹性网络门面 (#85) ([47f8a3a](https://github.com/lidaixingchen/brutxui-vue3/commit/47f8a3a553f38b5417e17293885130c8bd920f14))
* **cli:** 实现网络退避抖动算法与会话级源健康状态机 (#84) ([16c9b77](https://github.com/lidaixingchen/brutxui-vue3/commit/16c9b7708615e116e9cd8a53d7b8dd4651d085a1))
* **cli:** CLI update / add 命令流水线与三合一原子事务提交 (#81) ([a31cf65](https://github.com/lidaixingchen/brutxui-vue3/commit/a31cf65f3f189f9376bd931ccaa889811b5c29dd))
* **cli:** DirectoryMergePlanner 组件多文件目录级拓扑感知调度 (#80) ([a2b54b5](https://github.com/lidaixingchen/brutxui-vue3/commit/a2b54b59032c1ec4b275da9b2ad160b48546af4d))
* **cli:** BaselineProvider 清单元数据按需 Base 动态重构器 (#79) ([8aa3daf](https://github.com/lidaixingchen/brutxui-vue3/commit/8aa3daf38e3192a18c83f6795af160eeb09f2fe7))
* **cli:** 纯数据 3-Way Merge 核心算法与换行缩进容差引擎 (#78) ([4eeddc6](https://github.com/lidaixingchen/brutxui-vue3/commit/4eeddc66827690b08a5921970a92097759603782))

### ♻️ Code Refactoring

* **scripts:** 重构巡检与契约守卫脚本 ([18457ba](https://github.com/lidaixingchen/brutxui-vue3/commit/18457ba188e9560606a89ed286b6b717cfc96ea5))
* 清理工作流脚本及全包代码历史方案注释 ([a0173f9](https://github.com/lidaixingchen/brutxui-vue3/commit/a0173f917e056bfe58f5e4516a174b0bbc26b4e7))
* **registry,cli:** 消费端适配统一 AST 引擎与路径重写 ([989c7c2](https://github.com/lidaixingchen/brutxui-vue3/commit/989c7c23f240d2f981c335a309af219cfc2393ed))
* **shared:** 清单扫描器接入统一 AST 引擎并清理重复实现 ([95a22a1](https://github.com/lidaixingchen/brutxui-vue3/commit/95a22a18b2d50e3f36fe5bd74573c249d3c0299c))
* **ui:** 优化 NumberInput 步进按钮悬浮与按压交互 ([0b7b1fe](https://github.com/lidaixingchen/brutxui-vue3/commit/0b7b1fe116465ee1adf1d2e2d44af02c5608b754))
* **cli:** 完善 init 服务别名解析与自引用防御 ([82eb339](https://github.com/lidaixingchen/brutxui-vue3/commit/82eb33912eb8bd608374bbfe7f5884ee261d20c5))
* **cli:** 优化 CSS 依赖图引擎并发安全与路径防御 ([879d0c6](https://github.com/lidaixingchen/brutxui-vue3/commit/879d0c686a7f7178e4cbe696f86bce05a540c06d))
* **cli:** 优化诊断引擎配置透传与 Reporter 异常防御 ([77c88b9](https://github.com/lidaixingchen/brutxui-vue3/commit/77c88b91cd666d216165c1ce63083d79ae7ca914))
* **cli:** 优化 3-Way Merge 引擎代码审查发现项与边界异常防护 ([cb9a8db](https://github.com/lidaixingchen/brutxui-vue3/commit/cb9a8dbe81f4d65cfa740014b030dda1088ccdd2))

### 🐛 Bug Fixes

* **deps:** 修复安全中心依赖漏洞并升级相关补丁版本 ([28c4d64](https://github.com/lidaixingchen/brutxui-vue3/commit/28c4d6447b07108ce3bd214fb6378b5ba17c98b0))
* **scripts:** 修复文档链接引擎边界缺陷并对齐诊断信封协议 ([b02917c](https://github.com/lidaixingchen/brutxui-vue3/commit/b02917cbb4e8f22dce6557a9d91cb6746f578e2a))
* **cli:** 完善注册表客户端错误守卫与动态缓存隔离 ([fcd2ecc](https://github.com/lidaixingchen/brutxui-vue3/commit/fcd2ecc461792e62d57626ebed060625d762fbeb))
* **cli:** 修复 lint 告警并替换 reporters 为原生 fs ([c25ea76](https://github.com/lidaixingchen/brutxui-vue3/commit/c25ea7668d150a293f2e94ee65811869a3748a36))
* **cli:** refine SFC edge cases and workspace resolver ([c4e7e32](https://github.com/lidaixingchen/brutxui-vue3/commit/c4e7e320c596210897c22668c1f58f1bd9793fe5))
* **cli:** 修正 resilient-fetch 中 abortableSleep 的 const 声明 ([09abab0](https://github.com/lidaixingchen/brutxui-vue3/commit/09abab00aee4a5462401a4036b742166091c234e))
* **cli:** 强化退避中断即时响应与重试耗尽判定 ([3d32f38](https://github.com/lidaixingchen/brutxui-vue3/commit/3d32f3825a5a4c39e30314f4c2adcf06394b1ec3))
* **cli:** Doctor 冲突巡检细化文件读取异常诊断避免假阴性 ([205ebcd](https://github.com/lidaixingchen/brutxui-vue3/commit/205ebcd0a5ae83d7eb1ee0c956e2b345421a8d9b))
* **ui:** 显式声明 playwright 开发依赖以保障浏览器测试稳定性 ([3958c1f](https://github.com/lidaixingchen/brutxui-vue3/commit/3958c1f2fc7142697d64cc8c9a5ab34b2d183af1))

### 📝 Documentation

* **core:** 补充工程门禁与巡检脚本工具链重构方案 ([b0b3ebe](https://github.com/lidaixingchen/brutxui-vue3/commit/b0b3ebe3a9c991eb2aaedf5d6f80d1e96c407a69))
* **core:** 新增文档链接检查与自愈引擎改进方案 ([adc78b5](https://github.com/lidaixingchen/brutxui-vue3/commit/adc78b5d2c357491c2fbe081e092825c54a4b266))
* 汇总存量方案至系统演进方案并归档原文档 ([1669a4c](https://github.com/lidaixingchen/brutxui-vue3/commit/1669a4c0a776e496cb0fbadb930edac3cfcf403b))
* **guides:** 新增COMMANDS手册并精简AGENTS自检表 ([3557289](https://github.com/lidaixingchen/brutxui-vue3/commit/3557289c47479305e1b15f75121af25cd6762e71))
* 落实文档生命周期分流与领域镜像分仓 ([40b456c](https://github.com/lidaixingchen/brutxui-vue3/commit/40b456c3a2e5a311b197c378489872eec244fbe8))
* **plans:** 完成 AST 解析统一与源码工具链治理方案 ([dd48066](https://github.com/lidaixingchen/brutxui-vue3/commit/dd480666c2191a137639469b5b207db508c50dd5))
* **plans:** 完成 CLI 注册表深模块客户端重构方案 ([b69b067](https://github.com/lidaixingchen/brutxui-vue3/commit/b69b067f8815b3ae4881444457cc003130a398a5))
* **number-input:** add visual optimization design spec ([90f4817](https://github.com/lidaixingchen/brutxui-vue3/commit/90f481784621c67867a801f7792a1307695bc365))
* **plans:** mark CLI AST and workspace plan as done ([c4245e9](https://github.com/lidaixingchen/brutxui-vue3/commit/c4245e9a37f172eed0157ef9bded03744821f438))
* **plans:** add CLI AST and workspace plan ([932b042](https://github.com/lidaixingchen/brutxui-vue3/commit/932b04273d9def0263065109b2fd6109b010a576))
* **plans:** 归档 CLI 网络韧性与多源竞速自适应退避方案为完成态 ([e42f794](https://github.com/lidaixingchen/brutxui-vue3/commit/e42f7944ad17c2466f0fda624550a8481f926458))

### ✅ Tests

* **shared:** 修复 Linux CI 下绝对路径 URL 断言的跨平台兼容性 ([3d176e0](https://github.com/lidaixingchen/brutxui-vue3/commit/3d176e086613e0763c80ff46dbe528d83c85ebbc))
* **shared:** 增加文档链接检查与自愈引擎单元测试 ([c8dc614](https://github.com/lidaixingchen/brutxui-vue3/commit/c8dc6145b8d61d1d30dddccb0c955e7d4839785a))
* **cli:** Doctor 冲突巡检规则与全生命周期零 I/O 内存集成验证 (#82) ([ca27fbf](https://github.com/lidaixingchen/brutxui-vue3/commit/ca27fbf12163234446406d38ca67554292602a17))

### 📦 Build

* **deps:** override sourcemap-codec to 1.5.0 ([4a43a31](https://github.com/lidaixingchen/brutxui-vue3/commit/4a43a312384a137916843cf59294a23b3ce23196))

### 🔧 CI

* **deps:** bump actions/deploy-pages in the actions-official group (#110) ([446a123](https://github.com/lidaixingchen/brutxui-vue3/commit/446a1235f886ff322fda0cca7cb16e081013eb0a))


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

* **[0.11.1](apps/docs/changelog/v0.11.1.md)** - 2026-08-24
* **[0.11.0](apps/docs/changelog/v0.11.0.md)** - 2026-08-19
* **[0.10.2](apps/docs/changelog/v0.10.2.md)** - 2026-08-13
* **[0.10.1](apps/docs/changelog/v0.10.1.md)** - 2026-08-11
* **[0.10.0](apps/docs/changelog/v0.10.0.md)** - 2026-08-11
* **[0.9.12](apps/docs/changelog/v0.9.12.md)** - 2026-08-09
* **[0.9.11](apps/docs/changelog/v0.9.11.md)** - 2026-08-08
* **[0.9.10](apps/docs/changelog/v0.9.10.md)** - 2026-08-07
* **[0.9.9](apps/docs/changelog/v0.9.9.md)** - 2026-08-05
* **[0.9.8](apps/docs/changelog/v0.9.8.md)** - 2026-08-05
* **[0.9.7](apps/docs/changelog/v0.9.7.md)** - 2026-08-04
* **[0.9.6](apps/docs/changelog/v0.9.6.md)** - 2026-07-27
* **[0.9.5](apps/docs/changelog/v0.9.5.md)** - 2026-07-18
* **[0.9.4](apps/docs/changelog/v0.9.4.md)** - 2026-07-12
* **[0.9.3](apps/docs/changelog/v0.9.3.md)** - 2026-07-09
* **[0.9.2](apps/docs/changelog/v0.9.2.md)** - 2026-07-08
* **[0.9.1](apps/docs/changelog/v0.9.1.md)** - 2026-07-06
* **[0.9.0](apps/docs/changelog/v0.9.0.md)** - 2026-07-03
* **[0.8.2](apps/docs/changelog/v0.8.2.md)** - 2026-06-30
* **[0.8.1](apps/docs/changelog/v0.8.1.md)** - 2026-06-30
* **[0.8.0](apps/docs/changelog/v0.8.0.md)** - 2026-06-29
* **[0.7.8](apps/docs/changelog/v0.7.8.md)** - 2026-06-28
* **[0.7.7](apps/docs/changelog/v0.7.7.md)** - 2026-06-28
* **[0.7.6](apps/docs/changelog/v0.7.6.md)** - 2026-06-28
* **[0.7.5](apps/docs/changelog/v0.7.5.md)** - 2026-06-27
* **[0.7.4](apps/docs/changelog/v0.7.4.md)** - 2026-06-27
* **[0.7.3](apps/docs/changelog/v0.7.3.md)** - 2026-06-27
* **[0.7.2](apps/docs/changelog/v0.7.2.md)** - 2026-06-26
* **[0.7.1](apps/docs/changelog/v0.7.1.md)** - 2026-06-26
* **[0.7.0](apps/docs/changelog/v0.7.0.md)** - 2026-06-26
* **[0.6.8](apps/docs/changelog/v0.6.8.md)** - 2026-06-25
* **[0.6.7](apps/docs/changelog/v0.6.7.md)** - 2026-06-10
* **[0.6.6](apps/docs/changelog/v0.6.6.md)** - 2026-06-09
* **[0.6.5](apps/docs/changelog/v0.6.5.md)** - 2026-06-08
* **[0.6.4](apps/docs/changelog/v0.6.4.md)** - 2026-06-07
* **[0.6.3](apps/docs/changelog/v0.6.3.md)** - 2026-06-06
* **[0.6.2](apps/docs/changelog/v0.6.2.md)** - 2026-06-05
* **[0.6.1](apps/docs/changelog/v0.6.1.md)** - 2026-06-05
* **[0.6.0](apps/docs/changelog/v0.6.0.md)** - 2026-06-04
* **[0.5.7](apps/docs/changelog/v0.5.7.md)** - 2026-06-03
* **[0.5.6](apps/docs/changelog/v0.5.6.md)** - 2026-06-03
* **[0.5.5](apps/docs/changelog/v0.5.5.md)** - 2026-06-02
* **[0.5.4](apps/docs/changelog/v0.5.4.md)** - 2026-06-02
* **[0.5.3](apps/docs/changelog/v0.5.3.md)** - 2026-06-01
* **[0.5.2](apps/docs/changelog/v0.5.2.md)** - 2026-06-01
* **[0.5.1](apps/docs/changelog/v0.5.1.md)** - 2026-05-31
* **[0.5.0](apps/docs/changelog/v0.5.0.md)** - 2026-05-31
* **[0.4.1](apps/docs/changelog/v0.4.1.md)** - 2026-05-30
* **[0.4.0](apps/docs/changelog/v0.4.0.md)** - 2026-05-30
* **[0.3.1](apps/docs/changelog/v0.3.1.md)** - 2026-05-29
* **[0.3.0](apps/docs/changelog/v0.3.0.md)** - 2026-05-29
* **[0.2.2](apps/docs/changelog/v0.2.2.md)** - 2026-05-28
* **[0.2.1](apps/docs/changelog/v0.2.1.md)** - 2026-05-28
* **[0.2.0](apps/docs/changelog/v0.2.0.md)** - 2026-05-28
* **[0.1.1](apps/docs/changelog/v0.1.1.md)** - 2026-05-27
* **[0.1.0](apps/docs/changelog/v0.1.0.md)** - 2026-05-26

