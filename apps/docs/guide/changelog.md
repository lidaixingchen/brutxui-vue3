---
title: 版本历史
description: BrutxUI 版本更新记录入口。
---

# 版本历史

本项目所有重要变更均记录于 [CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md)。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

> 根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录；更早版本已归档至 [归档版本索引](../changelog/)，按版本号独立成文。

## 最新版本

## [0.10.2](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.10.1...v0.10.2) - 2026-08-13

### ✨ Features

* **changelog:** 版本历史页内联最新版本并发布脚本自动同步 ([afe0e08](https://github.com/lidaixingchen/brutxui-vue3/commit/afe0e088ef0be42996c4e593c73cec798572dac4))
* **theme:** 状态令牌与危险态阴影令牌补全 ([b3996d1](https://github.com/lidaixingchen/brutxui-vue3/commit/b3996d151b1d850e38769d60d2144ac66e739542))

### ♻️ Code Refactoring

* **ui:** 焦点与选中指示统一到 outline，根除 ring 与 brutal 阴影争用 ([19c725b](https://github.com/lidaixingchen/brutxui-vue3/commit/19c725bdd3a17b9872477827d9a58b3b47aba833))

### 🐛 Bug Fixes

* **release:** OCR 审查修复——guide 同步转义、dry-run 守卫与门禁排除收窄 ([1ab3549](https://github.com/lidaixingchen/brutxui-vue3/commit/1ab35490aa17fd1ea03d40ac7dd1306950e2df0c))
* **ui:** 清理 docs 侧 ring 残留并扩展 check:deprecated 门禁覆盖 ([4d0354f](https://github.com/lidaixingchen/brutxui-vue3/commit/4d0354f1a235d872e4d47d8c9d495baad5889c37))
* **ui:** 低等级审查发现修复 ([2e941aa](https://github.com/lidaixingchen/brutxui-vue3/commit/2e941aa2da5af429e1f86b81e3107ffcc6565bb6))
* **ci:** open-code-review 审查发现的令牌门禁与安全加固 ([7c75501](https://github.com/lidaixingchen/brutxui-vue3/commit/7c755017942849d6ae0a6ad982ece73deadfac82))
* **ci:** 跨包令牌契约与构建链路加固 ([0aaad80](https://github.com/lidaixingchen/brutxui-vue3/commit/0aaad808cf28ac975dad6aa5312ce85c842468bd))
* **ui:** 主题子系统去重与原型链防护 ([20a3177](https://github.com/lidaixingchen/brutxui-vue3/commit/20a3177e1b980173d44bde54d61340a2d4127d9f))
* **ui:** composables 生命周期与健壮性修复 ([634896c](https://github.com/lidaixingchen/brutxui-vue3/commit/634896c2a7a8b0ba6f99d8690a69b78780b79ba0))
* **ui:** 共享交互变体清理与按压反馈共享化 ([f814b73](https://github.com/lidaixingchen/brutxui-vue3/commit/f814b7304c1e3e9255406b53a6ba49925b3f20a2))
* **ui:** 高亮按压反馈复合变体抽取共享常量 ([0fa9b9f](https://github.com/lidaixingchen/brutxui-vue3/commit/0fa9b9fc4b1df536251c07bd25ca44b6fc0143d1))
* **ui:** 已废弃工具类门禁与样式注释修复 ([0e8d81a](https://github.com/lidaixingchen/brutxui-vue3/commit/0e8d81adeee4abb30c8bbf11e063a98299cbc94b))
* **ci:** 约定门禁脚本审查问题修复 ([858cd4b](https://github.com/lidaixingchen/brutxui-vue3/commit/858cd4b64b190db90e2d7b43d6332e049dfc9ec6))
* **ci:** 约定门禁 CI 接线与 commitlint PR 校验修复 ([bee24c9](https://github.com/lidaixingchen/brutxui-vue3/commit/bee24c974cd5cf59fc109f00195b74b4b2209df1))
* **ui:** 日格子过渡显式声明与复制按钮反馈修复 ([479f7a3](https://github.com/lidaixingchen/brutxui-vue3/commit/479f7a3de40194f9e4d36f3d07a3603ba31adf54))
* **ui:** 硬编码 shadow 与颜色回归令牌化 ([b3ba04b](https://github.com/lidaixingchen/brutxui-vue3/commit/b3ba04b480e2c6ea713a75fb0afbe8eb96c7bbd4))
* **ui:** command 焦点指示与高亮按压反馈复合变体 ([fdeaf17](https://github.com/lidaixingchen/brutxui-vue3/commit/fdeaf170a299a16097696c10702d3bd69c092d6e))
* **ui:** 焦点体系 a11y 修复与惰性 outline-none 清理 ([39ca3cc](https://github.com/lidaixingchen/brutxui-vue3/commit/39ca3cc5c2e297a03a19b8700bbd10a21cf71af4))
* **ui:** 共享交互变体契约与 toggle/separator 修复 ([0c4abfc](https://github.com/lidaixingchen/brutxui-vue3/commit/0c4abfc8ccdbd062e3812b3fa38139fb937ecbc3))
* **ui:** 组件视觉令牌化迁移样板 ([9699162](https://github.com/lidaixingchen/brutxui-vue3/commit/9699162cbc69047266ab77372615ce56c8c1ffc1))
* **ui:** pagination 省略号焦点类改引用统一常量 ([5cabed2](https://github.com/lidaixingchen/brutxui-vue3/commit/5cabed265606fed0ab9eee953f91bfe0936cf86d))
* **ui:** cascader 叶子路径缓存下沉消除首渲染重复递归 ([04bfe78](https://github.com/lidaixingchen/brutxui-vue3/commit/04bfe782fdcc8b7002f985286922c71cf64d938d))
* **ui:** counter 千分位分隔符改函数形式防特殊模式转义 ([bca6095](https://github.com/lidaixingchen/brutxui-vue3/commit/bca6095d22359b4fb99177cd5eaf768455c61b15))
* **ui:** command 隐藏子元素文本不入搜索索引 + 测试 ([05df874](https://github.com/lidaixingchen/brutxui-vue3/commit/05df874ec6076e05e9a4466ad160fbb044d97d2b))
* **ui:** code-block prism-languages 依赖校验降级与失败计数清零 + 测试 ([504e7d7](https://github.com/lidaixingchen/brutxui-vue3/commit/504e7d7733280cd349de0c69fed3588d995bea1b))
* **ui:** chat-bubble 无时间戳消息不触发日期边界 + 公共变体契约注释 ([2fe3a7e](https://github.com/lidaixingchen/brutxui-vue3/commit/2fe3a7e413125513e7965152118cb0f84136cda1))
* **ui:** color-picker 多指拖拽仅末会话结束确认 + 非法色块透明度清理 ([103ee3c](https://github.com/lidaixingchen/brutxui-vue3/commit/103ee3caffad98ee9961ab5ede9ad1f00f4776e0))
* **ui:** card-3d 修复程序化/辅助技术 click 被误吞的回归 + 测试 ([e34de3d](https://github.com/lidaixingchen/brutxui-vue3/commit/e34de3d0949f7586a40e60c320e91c7b7f5bb6ae))
* **ui:** color-mode-switcher OCR 修复——1 条 ([0664858](https://github.com/lidaixingchen/brutxui-vue3/commit/06648582a71e4c7b99c0e3e42d7dada186b4b32c))
* **ui:** brutal-interaction-variants OCR 修复——1 条 ([73359ae](https://github.com/lidaixingchen/brutxui-vue3/commit/73359ae30e1069ee1844ae81de19d31604e34276))
* **ui:** counter OCR 修复——1 条 + 约束注释 ([d02981b](https://github.com/lidaixingchen/brutxui-vue3/commit/d02981b6d4d5129776ad64cc30f7a41994c79ac4))
* **ui:** color-picker OCR 修复——6 条全处理 ([3cebd47](https://github.com/lidaixingchen/brutxui-vue3/commit/3cebd47767ae1d25e364cbc6d0a72fc5d9a146f1))
* **ui:** code-block OCR 修复——5 条全处理 ([3fce770](https://github.com/lidaixingchen/brutxui-vue3/commit/3fce7709895a4acdcb6e3649f1727180c1955501))
* **ui:** checkbox OCR 修复——1 条 ([b3313f2](https://github.com/lidaixingchen/brutxui-vue3/commit/b3313f2fa3003cbb9918b238c183e9d2ece67e27))
* **ui:** chat-bubble OCR 修复——4 修 1 跳 ([96b058b](https://github.com/lidaixingchen/brutxui-vue3/commit/96b058b704065ebf1168667f0269fe4cfecda2fa))
* **ui:** calendar OCR 修复——1 条 ([663bfad](https://github.com/lidaixingchen/brutxui-vue3/commit/663bfade499c6a869e067b48aca873b75b91ddf5))
* **ui:** copy-to-clipboard OCR 修复——2 条全处理 ([53342dc](https://github.com/lidaixingchen/brutxui-vue3/commit/53342dce055cb5ad87c5b87c7c6277cb03f85b94))
* **ui:** command OCR 修复——3 条全处理 ([e20fd1c](https://github.com/lidaixingchen/brutxui-vue3/commit/e20fd1cc0c333954f8571d938607bc50eae9c8ac))
* **ui:** card-3d OCR 修复——4 条全处理 ([b997029](https://github.com/lidaixingchen/brutxui-vue3/commit/b997029f57f6e5166ffc94b71ea5edc1c5077b5a))
* **ui:** card OCR 修复——3 条全处理 ([308e272](https://github.com/lidaixingchen/brutxui-vue3/commit/308e272ab9d30f98ee158fee636be31cdd5cb29a))
* **ui:** shadow 令牌移出 @theme 单层化，消除悬停/按压双影鬼影 ([904774b](https://github.com/lidaixingchen/brutxui-vue3/commit/904774b531e68ec224a30234f14127914f176d5e))
* **ui:** command 语义化与契约修复 ([adb46fc](https://github.com/lidaixingchen/brutxui-vue3/commit/adb46fcbad31409939b93390806c3f36e4517769))
* **ui:** command-input 双向同步，v-model 仅回显用户输入 ([614d2bc](https://github.com/lidaixingchen/brutxui-vue3/commit/614d2bc283a775c5a0f41bc458bfb228c3d392ce))
* **ui:** command 过滤注册同步化，消除首渲闪烁与隐藏项键盘导航 ([77633f4](https://github.com/lidaixingchen/brutxui-vue3/commit/77633f4bd33a433287e5a13e630ed2d5d0c48422))
* **ui:** counter OCR 修复——5 条全处理 ([aad5aeb](https://github.com/lidaixingchen/brutxui-vue3/commit/aad5aeb508d5db0bd804c958311e6c0ab4cc63b9))
* **ui:** color-picker OCR 修复——21 条全处理（aria-controls 接线、swatch 语义、拖拽会话、lastEmitted、Enter 防重） ([126b562](https://github.com/lidaixingchen/brutxui-vue3/commit/126b562276ca749d46a83997896b10937024ba95))
* **ui:** color-mode-switcher OCR 修复——3 条全处理（indexOf -1 保持现状、select 值归一化、拒绝隐藏的 system） ([37e1f24](https://github.com/lidaixingchen/brutxui-vue3/commit/37e1f244793d37f35783cd52d68cfee49379df19))
* **ui:** copy-to-clipboard OCR 修复——失败反馈、aria 播报、共享按下态 ([2da7bd4](https://github.com/lidaixingchen/brutxui-vue3/commit/2da7bd4b2fd1c805314ee24bd020ca0ba963b072))
* **ui:** cookie-consent OCR 修复——emit 顺序、空串回退、region 语义 ([46d948c](https://github.com/lidaixingchen/brutxui-vue3/commit/46d948c19f4107c9f779e4b9dd02c392ee2ba3b4))
* **ui:** combobox OCR 修复——create 值 trim、label 运行时兜底、受控 open 契约 ([b28d876](https://github.com/lidaixingchen/brutxui-vue3/commit/b28d8765a5cc88986d5570158d69126680c91f3c))
* **ui:** code-block OCR 修复——13 条全处理 ([734b404](https://github.com/lidaixingchen/brutxui-vue3/commit/734b404dcdde905aff8a975649cb1d57034620f8))
* **ui:** chat-bubble OCR 修复——12 条全处理（阴影重构、乱序稳定排序、码点 initials、STATUS_META 穷尽表） ([a711a71](https://github.com/lidaixingchen/brutxui-vue3/commit/a711a71033cdeb0978f9bffe716debc9a8ed4d30))
* **ui:** checkbox OCR 修复——5 条全处理（选中态前景色、defaultValue 透传、size 兜底、name/value/required 表单属性） ([f41bd7f](https://github.com/lidaixingchen/brutxui-vue3/commit/f41bd7f221c1bbdae9fdf3da8c437b7e9828c97a))
* **ui:** cascader OCR 修复——偏移/类冲突、disabled 过滤、缓存与键盘可访问性 ([e0e4221](https://github.com/lidaixingchen/brutxui-vue3/commit/e0e4221f4c0573325f62b8c47dbb123e44638915))
* **ui:** carousel OCR 修复——11 条全处理（未消费配置四项实现、ARIA 语义、dots 二选一、enabled 变体） ([cb4b13d](https://github.com/lidaixingchen/brutxui-vue3/commit/cb4b13dc29983f7fc14f86075235fe57902d00cc))
* **ui:** card OCR 修复——嵌套交互/主键过滤、键盘 keyup 语义、disabled 支持、CardTitle as 白名单 ([80277a2](https://github.com/lidaixingchen/brutxui-vue3/commit/80277a23c1bdc23313f0d270c4755ee33dc216e4))
* **ui:** card-3d OCR 修复——偏移配置表字面量类名、悬停状态重置、clickable 键盘可访问性 ([71843d7](https://github.com/lidaixingchen/brutxui-vue3/commit/71843d764da5e8fe83a0add047b7a76382419d43))
* **ui:** calendar OCR 修复——5 修 1 跳过（缓存键 JSON 序列化、drag isRange 防护、事件 key 去重、单元素归一化、事件预分组） ([8e8fc07](https://github.com/lidaixingchen/brutxui-vue3/commit/8e8fc07af51faa87bc5b1d359d4c82cf905f4528))

### 📝 Documentation

* 同步 ring 门禁覆盖范围并补充英文 changelog 中文界面提示 ([e24d848](https://github.com/lidaixingchen/brutxui-vue3/commit/e24d848b0dd7d7d64e0f314244a72b482bada738))
* 审查报告补主题前景对比度发现 ([d6fc289](https://github.com/lidaixingchen/brutxui-vue3/commit/d6fc289e9613a86ce2817bd4d010b1466f3cc5d2))
* 压缩审查报告修复记录为状态总览 ([bd4c74d](https://github.com/lidaixingchen/brutxui-vue3/commit/bd4c74da6af42a1e14b7283ffac6784894123b46))
* 审查报告机械可修项修复进展 ([3fcd280](https://github.com/lidaixingchen/brutxui-vue3/commit/3fcd280cfff221faa3a05178cae0e8e066713510))
* 约定体系既有债修复进展 ([de94362](https://github.com/lidaixingchen/brutxui-vue3/commit/de94362f8076459f11b3ca4dc587e3f1b8bc62d1))
* **guides:** 视觉规则边框配对说明 ([aa29302](https://github.com/lidaixingchen/brutxui-vue3/commit/aa29302b592bbc531182ad5ae91b7d046840e209))
* **ui:** 组件文档补全必须章节 ([07a2dc1](https://github.com/lidaixingchen/brutxui-vue3/commit/07a2dc12819940970bd42fad868db2cc6dd0d7a5))
* 约定体系未纳入债清单与方案引用 ([aeac000](https://github.com/lidaixingchen/brutxui-vue3/commit/aeac000a7a33f65915f4524d53a0fce2757779cc))
* **guides:** 约定体系修复——机制文档与措辞定稿 ([f10169f](https://github.com/lidaixingchen/brutxui-vue3/commit/f10169fd2da2fb89e9774fcf9db15b1b0b349694))
* 约定体系修复方案——7 条系统性弱点修复与 6 阶段执行 ([d34a73a](https://github.com/lidaixingchen/brutxui-vue3/commit/d34a73aa0de11081097f26018314f863394d1487))
* 约定体系审查——8 条违反指控裁决与约定质量审计 ([204c1d0](https://github.com/lidaixingchen/brutxui-vue3/commit/204c1d063ad70124ec72684a2e8d61cb98845bc4))
* 基座并行审查补强——跨包令牌契约/构建链路/composables/lib 共享层 30 项发现 ([11fc81e](https://github.com/lidaixingchen/brutxui-vue3/commit/11fc81e391a082d2fba7cb6df41b99c1a7042552))
* **ui:** color-mode-switcher 同步边界态展示值回退说明 ([fb17634](https://github.com/lidaixingchen/brutxui-vue3/commit/fb17634aa390dd9eb61c97650b0c3cdd549e01bb))
* **ui:** chat-bubble/checkbox/color-picker 同步分组排序、indeterminate 与表单语义 ([442f268](https://github.com/lidaixingchen/brutxui-vue3/commit/442f268c3bac4484e8d0db25e63adc795276fc24))
* **ui:** command/copy-to-clipboard 同步双向绑定契约与反馈时长说明 ([40d270a](https://github.com/lidaixingchen/brutxui-vue3/commit/40d270a0b870e9e7f84309f6465e9646423f3674))
* **ui:** card/card-3d 同步禁用视觉、键盘守卫与 ariaLabel 说明 ([bcbab37](https://github.com/lidaixingchen/brutxui-vue3/commit/bcbab37bf591c0ebcc2176dd7e63ba6926a2d215))
* 阴影过渡与焦点体系统一方案实施文档与焦点态约定 ([0d7b237](https://github.com/lidaixingchen/brutxui-vue3/commit/0d7b237f99d17f460da10286c959b0f928b90aa9))
* 补充组件/发布/视觉规范并修正焦点与过渡表述 ([093519f](https://github.com/lidaixingchen/brutxui-vue3/commit/093519f85d8a314702223520db602c40f2632a89))
* **ui:** command 同步受控、回写与 class 类型说明 ([c084458](https://github.com/lidaixingchen/brutxui-vue3/commit/c084458b161508077a4a1366bcf4bb40527c6df3))
* **ui:** counter 同步 separator 空串语义与 accent 使用提示 ([64b44c6](https://github.com/lidaixingchen/brutxui-vue3/commit/64b44c698a24e2c93c108caaa3583a15e04d5aef))
* **ui:** color-mode-switcher/color-picker 同步边界行为、表单提交与色块语义说明 ([8205f85](https://github.com/lidaixingchen/brutxui-vue3/commit/8205f851274311e2e2325328f74f4f2e66fef67e))
* **ui:** locale 指南修正 CodeBlock 键——补 expand/collapse、删幻影键 ([0bd3666](https://github.com/lidaixingchen/brutxui-vue3/commit/0bd3666cae922554c698c2aacef2d31cb791d952))
* **ui:** code-block 同步 --brutal-code-foreground 变量与对比度校准说明 ([a4f9142](https://github.com/lidaixingchen/brutxui-vue3/commit/a4f91423d170f4666e9994b7998daab845107805))
* **ui:** combobox/cookie-consent/copy-to-clipboard 同步契约与行为说明 ([67ac478](https://github.com/lidaixingchen/brutxui-vue3/commit/67ac4788be2a18561d0b0428975189e40105781e))
* **ui:** code-block 同步插槽与 code prop 契约说明 ([39c1f21](https://github.com/lidaixingchen/brutxui-vue3/commit/39c1f21808ba2f565fe5c507447f0f4511ea84d9))
* **ui:** chat-bubble/checkbox 同步分组排序与间隔时间标签、受控/非受控与表单属性说明 ([98975ac](https://github.com/lidaixingchen/brutxui-vue3/commit/98975acf91b380f9226c3b353c98ca71ebe988ea))
* **ui:** cascader 同步 CascaderOption 泛型与键盘可访问性说明 ([1ef7ae8](https://github.com/lidaixingchen/brutxui-vue3/commit/1ef7ae8902ac4c5d7968b743b9e45f26950bdd4f))
* **ui:** card/card-3d 同步 disabled prop、CardTitle as 类型收窄与键盘可访问性说明 ([4af7336](https://github.com/lidaixingchen/brutxui-vue3/commit/4af7336027d15e9a603baa4ab133615b7e750a2f))
* 更新根 CHANGELOG 至 0.10.1 并归档 0.9.11 ([f83006f](https://github.com/lidaixingchen/brutxui-vue3/commit/f83006f6de13abf0f7978b45ea065faa7c6c0853))

### ✅ Tests

* **ui:** toggle 补保持按下态类断言 ([8e1b3c9](https://github.com/lidaixingchen/brutxui-vue3/commit/8e1b3c9c6fffeebed3cfb447c211b6e3622dff90))
* **ui:** cascader 补充 OCR 修复回归测试 ([e65ae28](https://github.com/lidaixingchen/brutxui-vue3/commit/e65ae288785a21d48af21d59519dbab67b319758))
* **ui:** command 契约更新并补充同步回归用例 ([d836383](https://github.com/lidaixingchen/brutxui-vue3/commit/d836383551f16a421d2ee89431342fbe62e9d3f2))

### 🔧 CI

* 约定体系自动化门禁与提交门禁 ([a4c939e](https://github.com/lidaixingchen/brutxui-vue3/commit/a4c939e2dbc8f5c6159d1bc08e573d4339d2d312))

## [0.10.1](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.10.0...v0.10.1) - 2026-08-11

### ✨ Features

* **input:** 新增 autocomplete prop 支持密码管理器识别 ([1ee7a5b](https://github.com/lidaixingchen/brutxui-vue3/commit/1ee7a5b03dca6d0665255b150f82d7163dd624ed))
* **docs:** 重构 docs/ 目录——三类分层 + frontmatter 状态机 + 脚本化链接修复 ([4940f39](https://github.com/lidaixingchen/brutxui-vue3/commit/4940f39044a60401a4d8afcd535bdf11a14c68ac))
* **release:** 新增 release:prepare/release:tag 一体化发布脚本 ([d1a15b6](https://github.com/lidaixingchen/brutxui-vue3/commit/d1a15b6ec433318ea2461b33cfd5848850b038c2))

### ♻️ Code Refactoring

* **changelog:** CHANGELOG 段落固定顺序——破坏性/新功能/重构/修复/文档/测试 ([183141e](https://github.com/lidaixingchen/brutxui-vue3/commit/183141e00c97d77878e11dedee3b5d3cee4cf414))

### 🐛 Bug Fixes

* **ui:** backtop OCR 复审——观察器常驻支持目标重建重新绑定 ([87465f8](https://github.com/lidaixingchen/brutxui-vue3/commit/87465f83f13a623b316afa73d8a3a3b4d75206d7))
* **ui:** before-after OCR 复审——焦点态 ring 改 outline 保留偏移投影 ([20c063c](https://github.com/lidaixingchen/brutxui-vue3/commit/20c063c90d52c77348bdc2ce0a93f1e6dcabcc79))
* **ui:** breadcrumb OCR 复审——BreadcrumbEllipsis sr-only 仅无 default slot 时渲染 ([823d0d0](https://github.com/lidaixingchen/brutxui-vue3/commit/823d0d064267246e9538a4997324fab16019ec08))
* **ui:** button OCR 审查修复——仅 glitch 按钮输出 glitch 类、danger/ghost 变体意图注释 ([b180b32](https://github.com/lidaixingchen/brutxui-vue3/commit/b180b32c2acb566faa0130d920fef2f909123f4d))
* **ui:** brutalist-hero OCR 审查修复——空字符串回退默认文案、terminal 插槽化 CLI 演示 ([f0e9649](https://github.com/lidaixingchen/brutxui-vue3/commit/f0e9649b8379fe5e20296faf9b8807582d8fc292))
* **breadcrumb:** 链接过渡属性补全、省略号改纯展示、当前页去 link 语义、分隔符去冗余 role、aria-label 空值回退 ([fd30548](https://github.com/lidaixingchen/brutxui-vue3/commit/fd3054849cc71bcf2893dec8df9c231bf3a87d0d))
* **ui:** badge OCR 审查修复——图标尺寸映射表、transition-opacity、关闭图标 aria-hidden ([e77ea96](https://github.com/lidaixingchen/brutxui-vue3/commit/e77ea96bdfcd009b91651193c5ff10214ba72548))
* **before-after:** 值越界 clamp 归一、defaultValue 仅作初始值、补充定位/层级契约与垂直方向风险注释、root 加焦点环 ([7715e31](https://github.com/lidaixingchen/brutxui-vue3/commit/7715e314f6073b83089193e20728df4d3fb067b5))
* **backtop:** 非法选择器容错、统一 scrollTo、MutationObserver 监听动态 target 并重置显隐 ([a35664b](https://github.com/lidaixingchen/brutxui-vue3/commit/a35664b0859ff49febd50b1f0b7c43315d1771e6))
* **avatar:** 统一 default 底色为半透明，alt 默认装饰性语义，透传 delayMs/asChild，状态圆点改 sr-only 播报 ([6d6ff43](https://github.com/lidaixingchen/brutxui-vue3/commit/6d6ff4386bd0ab865d04887d74795a39f3f660d3))
* **ui:** OCR 二次审查修复——码点计数、错误关联、清除按钮焦点保持 ([3a97d10](https://github.com/lidaixingchen/brutxui-vue3/commit/3a97d1018db78a8d04f85c2fe5a4102ce484ef42))
* **ui:** OCR 审查修复——AccordionTrigger 空 icon 槽、AccordionItem 恢复解构 ([947a066](https://github.com/lidaixingchen/brutxui-vue3/commit/947a066d821d1ea8174d460cb79669c3ece942df))
* **ui:** OCR 审查修复——AlertDescription useId 提升、AlertDialogTitle 占位说明 ([606c424](https://github.com/lidaixingchen/brutxui-vue3/commit/606c424681a03a5eb84230f19ac78b3cd7d5631e))
* **input:** 聚焦反馈改用 focus-within、只读禁用后缀交互、可访问性补全 ([5c98712](https://github.com/lidaixingchen/brutxui-vue3/commit/5c9871277f4d6cc7e47a47dcd011b3197b7b21fd))
* **auth-card:** 防重复提交、错误即时清除、密码最小长度校验与可访问性增强 ([3699944](https://github.com/lidaixingchen/brutxui-vue3/commit/36999449310271ec613c54558b42087d61460d4f))
* **ui:** alert 变体 warning 复用 accent 令牌、AlertTitle 层级约定注释 ([a26f202](https://github.com/lidaixingchen/brutxui-vue3/commit/a26f20287058d72502381c57f45abec481479d77))
* **ui:** Alert 关闭按钮阻止冒泡，移除冗余 aria-live，自动关联描述 aria-describedby ([c7db460](https://github.com/lidaixingchen/brutxui-vue3/commit/c7db460b7934b5c8fbeac0aaf4bba1996b5b747a))
* **accordion:** 修复 OCR 报告问题——变体差异化、border-color 下沉、图标容器方案 ([c1853ee](https://github.com/lidaixingchen/brutxui-vue3/commit/c1853ee786a1828de85e577d17dc845319a0f743))
* **ui:** time-picker 触发器补 inline-flex 使 gap/justify 自包含 ([fccb892](https://github.com/lidaixingchen/brutxui-vue3/commit/fccb892dea40010674df80b118259a5c4ea9d8b3))
* **ui:** dialog 镜像同步 Header 语义标签与 Footer 空插槽守卫 ([a4b405c](https://github.com/lidaixingchen/brutxui-vue3/commit/a4b405c97b8eaac8bc7c27ec006c638ad5e49380))
* **ui:** alert-dialog 子组件语义与类型面完善 ([642fb0a](https://github.com/lidaixingchen/brutxui-vue3/commit/642fb0aeb1fb8d03f2de0a3a918c36196b890457))
* **ui:** AlertDialogContent 显式透传 attrs，新增 overlayClass 定制遮罩 ([822d8d5](https://github.com/lidaixingchen/brutxui-vue3/commit/822d8d520c46e33af821cd1bcf76c724548b3a0c))
* **ui:** alert-dialog 内容容器补 grid 使 gap-4 生效，注明静态 cva 全库惯例 ([f4b271a](https://github.com/lidaixingchen/brutxui-vue3/commit/f4b271abb17c23cc4a159634d19b1ccf632f859e))
* **ci:** Create GitHub Release 前清理同名 Draft——修复 tag 重打导致的双 release ([6eed9cf](https://github.com/lidaixingchen/brutxui-vue3/commit/6eed9cf5302432ca45f6bab6a9ebc386acedf012))
* **scripts:** 修复 changelog 重排脚本审查问题——空行归一化、块识别收窄、按块统计、ENOENT 保护 ([c2bbac1](https://github.com/lidaixingchen/brutxui-vue3/commit/c2bbac140720c222a277812729bc09b79149d40f))
* **release:** 修复发布脚本审查发现的三处问题 ([bca8380](https://github.com/lidaixingchen/brutxui-vue3/commit/bca8380f31c9c7f103424a453300ef78145d1b14))

### 📝 Documentation

* **ui:** button 补直接 buttonVariants 用 glitch 需显式传 speed/direction 说明 ([5e4741a](https://github.com/lidaixingchen/brutxui-vue3/commit/5e4741a954df59845d45b8055893cd3d45382a8b))
* **input:** ariaInvalid 未显式传入时按 variant 推导的说明补充 ([ac160ec](https://github.com/lidaixingchen/brutxui-vue3/commit/ac160ec5a457cbff334818e4744efa2d3c4cb3a7))
* **auth-card:** 补充 submitting/passwordMinLength props 与安全约束说明 ([c29ad98](https://github.com/lidaixingchen/brutxui-vue3/commit/c29ad98ae1c7d1190b15615b370e55e19a087a01))
* **accordion:** 同步内容区样式表与 icon 插槽说明 ([3e71914](https://github.com/lidaixingchen/brutxui-vue3/commit/3e7191430340a33656f4f3a141d0b5db8c83dbb4))
* **alert-dialog:** 补充 overlayClass prop 说明 ([c206684](https://github.com/lidaixingchen/brutxui-vue3/commit/c206684b558652462ba6c268a09196a969fde8b8))
* **index:** 移除对归档改造方案的引用，规则以 index.md 为准 ([200f0a2](https://github.com/lidaixingchen/brutxui-vue3/commit/200f0a222e7724473c33f1632c865e7fd5d7c400))
* **index:** 固化文档治理规则，索引自包含 ([8e8531d](https://github.com/lidaixingchen/brutxui-vue3/commit/8e8531dea72d317a5fc5019ab117f6eae860bd38))
* **docs:** index.md 新增「链接校验工具」小节，check-doc-links.mjs 描述通用化 ([f7a7fbb](https://github.com/lidaixingchen/brutxui-vue3/commit/f7a7fbbb3a34ace18396198318523552d033ae3d))
* **plans:** 归档 composables/changelog/文档目录改造 三个 done 方案 ([8e11b6d](https://github.com/lidaixingchen/brutxui-vue3/commit/8e11b6dfc9467b8b317a8d9081780d876ebb36c9))
* **plans:** 归档 CLI 闭环与 registry 方案至 archive/2026/ ([d6899c8](https://github.com/lidaixingchen/brutxui-vue3/commit/d6899c88ce0187d1e7ef75ccd83c0577b7e4990a))
* **plans:** 落地核查修正方案状态——辅助包v2/CLI闭环/registry 转 done ([f10ca77](https://github.com/lidaixingchen/brutxui-vue3/commit/f10ca774f50c994987f1ff32f1aa02cc5bac2709))
* **release:** 发布流程文档瘦身——TL;DR 置顶并下沉原理至 RELEASE_ARCHITECTURE ([ef01bee](https://github.com/lidaixingchen/brutxui-vue3/commit/ef01bee1240c8a0a7ac04b0f0183135598f5f4ef))

### ✅ Tests

* **ui:** button 补 glitch 类污染与显式覆盖用例 ([95ca723](https://github.com/lidaixingchen/brutxui-vue3/commit/95ca7239cbad0157bc73e8c28cc5012590c8a5c8))
* **ui:** brutalist-hero 补空字符串回退与 terminal 插槽用例 ([a90ae6a](https://github.com/lidaixingchen/brutxui-vue3/commit/a90ae6abef7b28b3e148a42941414a88fb3fbcd9))
* **breadcrumb:** 补 breadcrumb-list 钩子/twMerge 冲突/空插槽/asChild class 合并用例并同步文档 ([98b0310](https://github.com/lidaixingchen/brutxui-vue3/commit/98b031039d88372c49392aedabc5ab32e87bdd50))
* **ui:** badge 补测试——pulse 隐含 dot、dot 尺寸映射、关闭图标 aria-hidden ([eb3b4e9](https://github.com/lidaixingchen/brutxui-vue3/commit/eb3b4e9164b2be8175fd636f706feabf43a431e0))
* **before-after:** 补越界 clamp/非受控拖动保持/焦点环用例并同步中英文文档 ([7fd9aae](https://github.com/lidaixingchen/brutxui-vue3/commit/7fd9aae6a570dec635aadedb001ddc7fa2577499))
* **backtop:** 补 target 元素/选择器/切换/卸载/动态目标用例并同步中英文文档 ([72b133c](https://github.com/lidaixingchen/brutxui-vue3/commit/72b133ca8395565e36be3b1fa01927c17895b425))
* **avatar:** 补兜底分支/class 覆盖/状态与语言切换用例并同步中英文文档 ([aa243f1](https://github.com/lidaixingchen/brutxui-vue3/commit/aa243f1bd2ef72eab652c0313a04ec89cf9babba))
* **ui:** 补 accordion 边界用例与 keyboard 断言修正 ([4b944bb](https://github.com/lidaixingchen/brutxui-vue3/commit/4b944bbc49d348497e75047ee05fd5d8024cdd74))
* **ui:** 补充 alert 边界用例 ([0dfcf75](https://github.com/lidaixingchen/brutxui-vue3/commit/0dfcf751bba716f7247f153c3da9b3a21629fcdc))

## [0.10.0](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.12...v0.10.0) - 2026-08-11

### ⚠️ Breaking Changes

* **shared,cli:** registry 完整性哈希覆盖 path/type/content 并自校验 ([7f247f7](https://github.com/lidaixingchen/brutxui-vue3/commit/7f247f7dc1e7ae2d4fa3a3afd7eb4716a17212ee))

### ✨ Features

* **composables:** 补齐 index.ts 聚合入口的类型导出 ([1da7de1](https://github.com/lidaixingchen/brutxui-vue3/commit/1da7de146f5105d13788954800d5d89e79ad39d9))
* **registry:** 产物发布时构建——发布通道上线与入库机制拆除 ([39630e1](https://github.com/lidaixingchen/brutxui-vue3/commit/39630e1f5eca732e6e015a4e30d38662247405a9))

### ♻️ Code Refactoring

* **composables:** B 类标量内部状态只读化收尾 ([ce0221f](https://github.com/lidaixingchen/brutxui-vue3/commit/ce0221fcf675877a015cd2751ada3a331e1bcfcc))
* **composables:** useReducedMotion 返回只读化（根依赖） ([e7f9412](https://github.com/lidaixingchen/brutxui-vue3/commit/e7f941296befefa19182737c6914a149c128633d))
* **composables:** useMessage.messageStore 只读化 ([84e7b5d](https://github.com/lidaixingchen/brutxui-vue3/commit/84e7b5d40a37f72d792fddf00d0ffd084be7a5b1))
* **composables:** B 类内部标量状态只读化 ([d96d4d1](https://github.com/lidaixingchen/brutxui-vue3/commit/d96d4d13b8b98d69401c7b35bff04bd6f3c3b79f))
* **composables:** useDataTableFilter 补 setter 并只读化，DataTable 改 setter 回调 ([66514cd](https://github.com/lidaixingchen/brutxui-vue3/commit/66514cd00003b74d0af68c9e5b3eed48548c1857))
* **composables:** useDialogEnhanced position/size 只读化并补 setter ([edeb706](https://github.com/lidaixingchen/brutxui-vue3/commit/edeb706c65acc046853efde11488679cc2215e4e))
* **composables:** useToast.toasts 只读化 ([02e4709](https://github.com/lidaixingchen/brutxui-vue3/commit/02e4709a8fd47d85e157759c148235a1bd3cc3cf))
* **composables:** selectedRows/sortState/checked 只读化，仅经方法修改 ([5695853](https://github.com/lidaixingchen/brutxui-vue3/commit/5695853fd7e73b0a236669b76a5eeb2abbf7636c))
* **registry:** 适配元数据只读数组类型 ([40babfc](https://github.com/lidaixingchen/brutxui-vue3/commit/40babfc3c9d4f84d3bcd4fc97bec7c7592ce160c))
* **cli:** 消除冗余完整性校验并修复漂移检测哈希边界 ([afe346d](https://github.com/lidaixingchen/brutxui-vue3/commit/afe346db9aa7b9baf9864f2ed15d298456671b36))
* **ui,docs:** 移除 danger/warning 别名统一到语义色 ([1f24730](https://github.com/lidaixingchen/brutxui-vue3/commit/1f2473027a3e413b0b73e55d0e2b31a4aab3a2c2))
* **cli:** 注入样式统一引用 @theme 令牌 ([188ca11](https://github.com/lidaixingchen/brutxui-vue3/commit/188ca1101dcc1f41606593d7c4db79bb4177b5f8))
* **cli:** 类型契约与 tsconfig 解析健壮性 ([37a1cff](https://github.com/lidaixingchen/brutxui-vue3/commit/37a1cffd49924820d87d43940d8e593eec416cea))
* **cli:** 样式注入判据统一为 markers 有序匹配 ([13c1265](https://github.com/lidaixingchen/brutxui-vue3/commit/13c1265051700d72568586ed1a5213e3b7df23f4))
* **cli:** 移除手写 diff 类型 shim 改用官方类型 ([b0aa2f9](https://github.com/lidaixingchen/brutxui-vue3/commit/b0aa2f9c15b2a6773251a83b5c07b0db8b77a20d))
* **cli:** CSS 注入改 markers 唯一判据并清理片段生成 ([9e9ecbb](https://github.com/lidaixingchen/brutxui-vue3/commit/9e9ecbba5da974e7a031d287071bddbbdf69e82b))
* **cli:** 统一组件清单类型结构与命令选项基类 ([1ea7b25](https://github.com/lidaixingchen/brutxui-vue3/commit/1ea7b254d5e3c54f9eb6bfd84f55897f0d68c2a3))

### 🐛 Bug Fixes

* **composables:** 选择/显示/上传审查修复——空标签过滤、resolveBaseClass、同批去重 (#1-#4/#7) ([74e236e](https://github.com/lidaixingchen/brutxui-vue3/commit/74e236eef12c4293aab8274003e80c4a9a1823e5))
* **composables:** useTheme 审查修复——无保存值统一 system 语义 (#6) ([81307fa](https://github.com/lidaixingchen/brutxui-vue3/commit/81307fadff28d1e1e612f35cae5cb7d685f62270))
* **composables:** useThrottle 审查修复——时钟回拨兜底与返回类型收窄 (#12/#13) ([f05a71a](https://github.com/lidaixingchen/brutxui-vue3/commit/f05a71aaaf0ae26d7c467aa3e496dc9e66bf1720))
* **composables:** useDialogEnhanced 审查修复——RO 用 borderBoxSize 防收缩循环、pointercancel 清理、touch-action、observer 重绑 (#8/#9/#10/#5) ([6937ba1](https://github.com/lidaixingchen/brutxui-vue3/commit/6937ba1721dda6ecd63951b8084087cbcb05fb0e))
* **composables:** useUpload 校验与去重修复——initialFiles 经 isFileValid 过滤、多选按标识去重、accept */* 特判 (#103-#105) ([ffa5efa](https://github.com/lidaixingchen/brutxui-vue3/commit/ffa5efa2c08621c9c680fe1f9b463b8ee5d365f2))
* **composables:** useThrottle 节流语义与类型修复——leading:false 只尾部执行、flush 不执行丢弃调用、throttled 返回类型收窄 (#99-#102) ([8efec41](https://github.com/lidaixingchen/brutxui-vue3/commit/8efec41ead5ef85c2dbd25fd553c8b2102881740))
* **composables:** useToast 分组合并与 promise 反馈修复——匹配键收紧、仅覆盖显式字段、同步异常进 catch (#95-#98) ([be20e86](https://github.com/lidaixingchen/brutxui-vue3/commit/be20e862bd29e81de72faad3adde94464dd0f87e))
* **composables:** useTheme 持久化与单例生命周期修复——initTheme 不写默认值、fallback 卸载身份校验、destroy 重置 initialized (#92-#94) ([38a048d](https://github.com/lidaixingchen/brutxui-vue3/commit/38a048d3aab73c8eea58e8b95344dfd568d48a92))
* **composables:** 选择类 composable 修复——baseClass arity 分派、空态样式常量、面板选择语义注释固化 (#87-#91) ([c3a6e95](https://github.com/lidaixingchen/brutxui-vue3/commit/c3a6e95c71dfd7f466c9db029b41a76a4e5fba3b))
* **composables:** useDialogEnhanced 六项交互修复——aspectRatio 联动、dragHandle 空守卫、RO 补测、pointer 事件、拖拽尺寸缓存 (#81-#86) ([ca1dd79](https://github.com/lidaixingchen/brutxui-vue3/commit/ca1dd7975864d2f3b5bdaf64afd66d0466da1d30))
* **composables:** 键盘与显示文本修复——handleKeydown 忽略修饰键、getLabel 空标签回退、ListFormat 缓存 (#76-#80) ([f72e26e](https://github.com/lidaixingchen/brutxui-vue3/commit/f72e26ee1456a1e285982b5f778462c23c0d3b8b))
* **composables:** OCR 审查修复——suppress 标志中和与防抖异常状态 (#71 补正) ([85a0996](https://github.com/lidaixingchen/brutxui-vue3/commit/85a099609626a9a5a9be0c0b4e7a26043b3ce817))
* **composables:** useLocale/useDatePicker/useStepper 交互状态修复 (#68-#72/#75) ([116aea3](https://github.com/lidaixingchen/brutxui-vue3/commit/116aea377f144248290d3c56ee53cd0c1193ba17))
* **composables:** useKanban 拖拽状态与回调一致性修复 (#59-#63) ([3b1de8b](https://github.com/lidaixingchen/brutxui-vue3/commit/3b1de8b0e6e291991230faf8af476ad243d4a95e))
* **composables:** 定时器与动画生命周期修复 (#53/#54/#55/#56/#65) ([21999aa](https://github.com/lidaixingchen/brutxui-vue3/commit/21999aa6f9bc2c079685224cac3fc71dff6c36d7))
* **composables:** 弹窗与消息系统异常状态修复 (#51/#52/#58/#73) ([a96c198](https://github.com/lidaixingchen/brutxui-vue3/commit/a96c198c7de6129219eba610890d6e413075528a))
* **data-table:** 虚拟滚动分支适配增量过滤协议 + 多选 pending 缓冲 ([45a5cf7](https://github.com/lidaixingchen/brutxui-vue3/commit/45a5cf760b32b7bc9b325796d2cda33295eaef7c))
* **composables:** useAnimation.test 适配只读化后的类型与 lint ([482acac](https://github.com/lidaixingchen/brutxui-vue3/commit/482acacb102e10d84ab3231ceab7b2df4163e046))
* **data-table:** 列过滤增量 patch 合并，避免并发更新互相覆盖 ([55fab27](https://github.com/lidaixingchen/brutxui-vue3/commit/55fab27d9dc9b4578eb3a862c25666c127474a76))
* **composables:** 修复 OCR 审查发现的只读化遗留问题 ([5ca87c7](https://github.com/lidaixingchen/brutxui-vue3/commit/5ca87c7126bce925b2a3a16b63496427bbb60021))
* **composables:** useFormFieldValidation 错误文案变化通知与异步规则检测 ([397312c](https://github.com/lidaixingchen/brutxui-vue3/commit/397312c7fadeaf7562d42cc8ded0c0ae33c94ac1))
* **composables:** useClearableSelection 回调异常隔离与清除契约文档 ([2deb73f](https://github.com/lidaixingchen/brutxui-vue3/commit/2deb73f7a51c3bdd388ec09650309ca49c697d0d))
* **composables:** useDataTableSelection 非标量 rowKey 缓存与单次告警 ([13db28a](https://github.com/lidaixingchen/brutxui-vue3/commit/13db28a4ac598404ec204c97d494d4489948fb6c))
* **composables:** useClearable 空串判空、preventDefault 与焦点态显示清除 ([14c289c](https://github.com/lidaixingchen/brutxui-vue3/commit/14c289c1d2327b28371866d3863d3d4d6d80b22c))
* **composables:** useDataTableFilter 日期本地日归一化与空过滤放行 ([7924ac3](https://github.com/lidaixingchen/brutxui-vue3/commit/7924ac3e0f1a037c9ea9a78ea177cad6640d0b7a))
* **composables:** useColorPicker 显示统一基于 displayValue 并归一空串 ([ea998b7](https://github.com/lidaixingchen/brutxui-vue3/commit/ea998b77881b60c2a0e14601b05b50d4491a522d))
* **composables:** useDataTableSort 空值与 NaN 归一化、混合类型确定顺序 ([b4c771a](https://github.com/lidaixingchen/brutxui-vue3/commit/b4c771a78dfb70be7d7904644556b04611191ba9))
* **composables:** useClipboard 能力检测双向同步 ([4bf1bc0](https://github.com/lidaixingchen/brutxui-vue3/commit/4bf1bc0dceb621ad8c3de4a997d5b1271a711fae))
* **composables:** useDataTablePagination 只读源回写兜底 ([0320de6](https://github.com/lidaixingchen/brutxui-vue3/commit/0320de6dd3fafab6595ec2e16c2d20e3c8759d51))
* **composables:** useColorHistory 合并路径与加载校验保持一致 ([b38ddff](https://github.com/lidaixingchen/brutxui-vue3/commit/b38ddff3fe80dc43e7777ea676a71c278253af68))
* **composables:** useReducedMotion 客户端 setup 同步查询偏好 ([b571dd6](https://github.com/lidaixingchen/brutxui-vue3/commit/b571dd641d247687c98e591ac6f60409851e010a))
* **composables:** useCanvasInteraction 未按下移动兜底结束刮擦 ([05ed06b](https://github.com/lidaixingchen/brutxui-vue3/commit/05ed06b5221987e9a8baefa9f0d144c27506e710))
* **composables:** useAudioEngine resume 回调校验上下文状态 ([282d827](https://github.com/lidaixingchen/brutxui-vue3/commit/282d827ca4feaae7c0e27d1784ee39e87f3dd987))
* **composables:** 自动播放运行态通知与进度退化修复 ([e5c73d6](https://github.com/lidaixingchen/brutxui-vue3/commit/e5c73d68d333a63c118061200ae956ca8a5eb9d4))
* **composables:** useCanvasInteraction 指针捕获失败降级继续 ([779fdd5](https://github.com/lidaixingchen/brutxui-vue3/commit/779fdd5684e0f4bf9c84ee6b8487a8ed4471dd62))
* **composables:** useAnimation SSR 阶段保守返回空类名 ([ac414ec](https://github.com/lidaixingchen/brutxui-vue3/commit/ac414ec66930c45bb2186c6fdd5f93297d282ca7))
* **composables:** destroyFallbacks 异常隔离与刮擦完成阈值 ([caa725d](https://github.com/lidaixingchen/brutxui-vue3/commit/caa725d83076e96dbe19b4750f6fd9b89c24e402))
* **composables:** useDataTable 分页回写与取消全选对称 ([a48177a](https://github.com/lidaixingchen/brutxui-vue3/commit/a48177a86c6b861eeb201e367a7c277c57914616))
* **composables:** useClipboard 时长下限与能力动态刷新 ([f3eb0b7](https://github.com/lidaixingchen/brutxui-vue3/commit/f3eb0b795dbfa8cf310e7d6e51c6d0a8ed31f860))
* **composables:** useColorHistory 数据校验与跨标签页合并 ([ebea133](https://github.com/lidaixingchen/brutxui-vue3/commit/ebea1339fcaf74ff4cd46630ce45bcfaa2058bbd))
* **composables:** useAudioEngine 异常隔离与上下文泄漏 ([f2b68eb](https://github.com/lidaixingchen/brutxui-vue3/commit/f2b68ebb6505e3414e1ea89e3cfc66c8d3703d03))
* **composables:** useCarouselEnhanced 进度追踪修复与 TDZ 消除 ([06e255a](https://github.com/lidaixingchen/brutxui-vue3/commit/06e255ae3757d95d37a1fa1c644039251863c9fc))
* **composables:** useCarousel 自动播放竞态与监听器泄漏 ([52d269f](https://github.com/lidaixingchen/brutxui-vue3/commit/52d269fbb953fa53b8eeafe025e0896a4e6b5acb))
* **registry:** 落实 OCR 审查 5 项修复 ([2fa7e13](https://github.com/lidaixingchen/brutxui-vue3/commit/2fa7e13c82907499e9455f4a5119ba814c72993f))
* **registry:** loadMergedRegistry 错误包装附加 cause 链 ([07a2d40](https://github.com/lidaixingchen/brutxui-vue3/commit/07a2d40902328d57dae263bba61e7ed58f9651cb))
* **registry:** 本地工具链提示优化与开发文档同步 ([44d2185](https://github.com/lidaixingchen/brutxui-vue3/commit/44d218522184230dfbe548f15576753e589e6894))
* **shared:** 修复 OCR 审查发现的路径规范化与标签边界问题 ([8ca7625](https://github.com/lidaixingchen/brutxui-vue3/commit/8ca7625902f96470dc317f4a13271ebf88437408))
* **shared:** 统一组件元数据 kind 约定并清理 registry 校验 ([dc56644](https://github.com/lidaixingchen/brutxui-vue3/commit/dc56644adbde799fdd2e8ab1a0292b738126d78b))
* **shared:** 加固 sidebar-generator 的分组解析与排序 ([b517268](https://github.com/lidaixingchen/brutxui-vue3/commit/b517268d9ea7ee5af606b600286103b4c376c172))
* **shared:** 修复组件扫描的相对导入分类与目录扫描 ([3ca7db0](https://github.com/lidaixingchen/brutxui-vue3/commit/3ca7db081d7464291c3bcf98284784150ec30da7))
* **shared:** 修复模块依赖提取的类型导入/动态导入与 script 块解析 ([b1fc5dc](https://github.com/lidaixingchen/brutxui-vue3/commit/b1fc5dc8cba6036e57022174735e1fb35bb82355))
* **shared:** 修复 OCR 复审反馈的 9 条问题 ([8ce0934](https://github.com/lidaixingchen/brutxui-vue3/commit/8ce09340859c37e0eb655f84856f1d96a57b5e1f))
* **shared:** 修复 OCR 审查发现的前 20 条问题（索引/元数据/令牌/类型） ([bbd048f](https://github.com/lidaixingchen/brutxui-vue3/commit/bbd048f50a0bcd5923205444a7c49668980dbd39))
* **ui,cli:** 修复 OCR 审查发现的样式回归 ([41df4d3](https://github.com/lidaixingchen/brutxui-vue3/commit/41df4d36dd81c95173e963ac431a0e0e19ff9407))
* **docs:** 收窄日历弹层阴影 hack 作用域 ([22a3df7](https://github.com/lidaixingchen/brutxui-vue3/commit/22a3df70e9e471352b81038623dba53f41d3a6f3))
* **ui:** 修复预检样式与核心样式问题 ([6c25f6f](https://github.com/lidaixingchen/brutxui-vue3/commit/6c25f6f18edb43ca6eda51a355a6b4cec83ea996))
* **cli:** 签名错误透传与片段生成错误处理 ([5ca5237](https://github.com/lidaixingchen/brutxui-vue3/commit/5ca523754a30410e05e5c81f3a7839bbefbc5f08))
* **cli:** 孤立文件引用判定精度与并发修复 ([ef9616a](https://github.com/lidaixingchen/brutxui-vue3/commit/ef9616a21084c5d2e4fbb3ab3ea0c13ab27ab65a))
* **cli:** registry 缓存路径交叉校验与越界判定修复 ([158ad1f](https://github.com/lidaixingchen/brutxui-vue3/commit/158ad1f53f3bf1410a72297f0e518aec120302ca))
* **cli:** 组件移除依赖图校验与项目探测修复 ([418319c](https://github.com/lidaixingchen/brutxui-vue3/commit/418319c996737e884d5fef584ae3e6e969482250))
* **cli:** registry 签名验证与缓存安全加固 ([a9acca1](https://github.com/lidaixingchen/brutxui-vue3/commit/a9acca1763809e6fa3a99cbcf1918812f2b517b6))

### 📝 Documentation

* **composables:** 研讨结论落地——onChange 导航意图语义与 provideLocale 形态约定 (#67/#74) ([ecd4a4e](https://github.com/lidaixingchen/brutxui-vue3/commit/ecd4a4e2d9d1f86e3f05cd7777b6521a5df5dfee))
* 补只读化重构 M7 收尾执行记录 ([d4677f3](https://github.com/lidaixingchen/brutxui-vue3/commit/d4677f3c8d2141a7d696ea895d60043e887e15e6))
* 内部状态只读化全库重构方案与执行记录 ([7f15769](https://github.com/lidaixingchen/brutxui-vue3/commit/7f157690b4754ba0fdfdb4d34c450bf6b0120708))
* **registry:** 全面审查修正发布时构建计划 ([4130e6d](https://github.com/lidaixingchen/brutxui-vue3/commit/4130e6da3683ae2dd0b3b05f5ce079677db995c7))
* **agents:** 修正"进行进行"重复用词 ([3d8cea2](https://github.com/lidaixingchen/brutxui-vue3/commit/3d8cea225b99cc5d61ecab3f2ae9825ee4e28d94))
* **agents:** 补充开发早期破坏式变更原则 ([d94196c](https://github.com/lidaixingchen/brutxui-vue3/commit/d94196c84e7e7010a5a0ec2fb34229935163f741))
* 更新根 CHANGELOG 至 0.9.12 并归档 0.9.9 ([857ec72](https://github.com/lidaixingchen/brutxui-vue3/commit/857ec72977d8b1a44e85f3fc8a9eaac2b48db178))

### ✅ Tests

* **registry:** 移除构建快照断言，改为结构断言（产物不入库解耦） ([6ea6eff](https://github.com/lidaixingchen/brutxui-vue3/commit/6ea6eff849c8fd5169214e0012f22a032ee22268))
* **data-table:** 补列过滤与全局搜索的 UI 绑定链路测试 ([e9ba4fc](https://github.com/lidaixingchen/brutxui-vue3/commit/e9ba4fc9d8938a4b2fee831d9660031266d0927a))
* **shared:** 补充依赖提取器的 vitest 测试基础设施 ([89e7637](https://github.com/lidaixingchen/brutxui-vue3/commit/89e7637df9bfb975ef02854591f2019c28a96527))
* **registry:** 适配新完整性哈希算法更新测试与快照 ([c89c435](https://github.com/lidaixingchen/brutxui-vue3/commit/c89c43554b9c519aabb6d012e61393b7420118a4))
## 历史归档版本

更早版本已归档至 [归档版本索引](../changelog/)，按版本号独立成文，便于回溯。

- 文档站点入口：[归档版本索引](../changelog/)
- 归档文件目录：[`apps/docs/changelog/`](https://github.com/lidaixingchen/brutxui-vue3/tree/main/apps/docs/changelog)
