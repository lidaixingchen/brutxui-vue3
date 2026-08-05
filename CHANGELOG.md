# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.8...HEAD)

## [0.9.8](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.7...v0.9.8) - 2026-08-05

### 🔧 CI

* 禁用 registry 包 turbo 缓存，修复生成文件漂移 ([4603a63](https://github.com/lidaixingchen/brutxui-vue3/commit/4603a63b3fe1345a6d3cad7fce5d4b43dfef850a))

### 🐛 Bug Fixes

* **cli:** 保留 snippets 解析失败异常的 cause 链 ([d9c249b](https://github.com/lidaixingchen/brutxui-vue3/commit/d9c249b476f3f2119473223a64b7b7f9e40617a6))
* **ui:** 覆盖层全透明时不建立刮除基准，回退按当前 alpha 阈值统计 ([f1a8fe3](https://github.com/lidaixingchen/brutxui-vue3/commit/f1a8fe3ca6ea36c3a200d61e4ed4ddfa60d76f39))
* **cli:** 修复全局与子命令同名 --dry-run option 导致命令级 dry-run 失效 ([9e657bb](https://github.com/lidaixingchen/brutxui-vue3/commit/9e657bbaca20102a310b15d2a4fce9b7c112efbb))
* **docs:** 转义 changelog 中 Promise<boolean> 尖括号，修复 vitepress 构建 ([3d414db](https://github.com/lidaixingchen/brutxui-vue3/commit/3d414dbaac04ce63caeff753f6b9a14b6fd68772))
* **ui:** 修复代码审查回归与边界问题 ([2c25830](https://github.com/lidaixingchen/brutxui-vue3/commit/2c258307c3ddf41c30d6ca9b129ab60cee9c8288))
* **ui:** canvas 刮除进度缩略采样与相对基准、分页非有限值校验 ([102b14d](https://github.com/lidaixingchen/brutxui-vue3/commit/102b14d05ed178e4ba95307c289144e1f5ba7f17))
* **ui:** 统一 Prism 实例、无限滚动 missing-target 重试、renderSlot 归一化、slider 填充定位、upload 取消态、tree-view 深拷贝 ([0548ee6](https://github.com/lidaixingchen/brutxui-vue3/commit/0548ee6deac3c59f42b5c789f07dc490c637cbc0))
* **ui:** stepper 垂直连接线 calc 语法与按圆点尺寸对齐 ([8ebc2b4](https://github.com/lidaixingchen/brutxui-vue3/commit/8ebc2b49f131374aac0ef5e51f1216427d87237b))
* **ui:** 修复 8 个组件变体样式问题 ([e302d11](https://github.com/lidaixingchen/brutxui-vue3/commit/e302d11aff929a01dde4d66cc80630a068757e5a))
* **shared:** 补齐 6 个组件缺失的依赖元数据 ([18359d5](https://github.com/lidaixingchen/brutxui-vue3/commit/18359d5fe6bea889bdd21278186f36691f20637d))
* 补齐单边配色类、导出名转换、扫描器校验与 accordion 双浮起 ([8c58adf](https://github.com/lidaixingchen/brutxui-vue3/commit/8c58adf9bcb1b91b4814daf4f7e66251ee90f9ed))
* **cli:** add 回滚能力、根键深度检测、orphaned 路径安全与 snippets 结构校验 ([62909cb](https://github.com/lidaixingchen/brutxui-vue3/commit/62909cb4c34404158c74dd45f0021cc07bb6fcae))
* **cli:** 版本相对实际命中源解析并统一验签严格模式 ([3256776](https://github.com/lidaixingchen/brutxui-vue3/commit/3256776c2f1eaa291d7d5dc6f9ea2e1d750473d6))
* **cli:** 修正 dry-run 子命令定位、依赖失败回滚语义与 doctor 修复区分 ([183975f](https://github.com/lidaixingchen/brutxui-vue3/commit/183975f09d96f07bd22f4a19fe2825854455a638))
* **ui:** accordion interactive 变体消除 trigger 双重浮起 ([10d10df](https://github.com/lidaixingchen/brutxui-vue3/commit/10d10dff4a39bba60c57758f27abfd95acf9dd4a))
* **shared:** 补全组件依赖元数据并修复扫描器与导出名转换 ([056db16](https://github.com/lidaixingchen/brutxui-vue3/commit/056db16556a30ef035108a1cfc919e0feb9c5cb8))
* **cli:** 拆分单方向边框颜色类并补齐 border-b/l-brutal ([0df4a88](https://github.com/lidaixingchen/brutxui-vue3/commit/0df4a8814dda323e20919b0b7dd1bb8fc0c39c5c))
* **cli:** 修复 add-service 状态矛盾、根键检测误判与 orphaned 路径穿越 ([f4c11de](https://github.com/lidaixingchen/brutxui-vue3/commit/f4c11de0ad089705e7c6a4cd84d12a3b0fce2296))
* **cli:** 修复依赖提取、包名校验、snippets 备份与验签严格模式 ([7a115af](https://github.com/lidaixingchen/brutxui-vue3/commit/7a115af1f586b8b1c57323e745794cc60da8b0a8))
* **cli:** 修复命令层 SIGINT 挂起、依赖半安装态、完整性漂移确认与全局 dry-run 判定 ([7c39cd0](https://github.com/lidaixingchen/brutxui-vue3/commit/7c39cd0b2009a4c1cf102fbc74589a149df3158f))
* **changelog:** 修复归档正则无法匹配 0.x.y 版本号并归档 v0.9.4 ([9dab9fb](https://github.com/lidaixingchen/brutxui-vue3/commit/9dab9fb0fb4dd9833510f090348fdbb394096da7))

### ✅ Tests

* **registry:** 更新构建快照（data-table 依赖补 reka-ui、组件文件哈希变更） ([5a75e93](https://github.com/lidaixingchen/brutxui-vue3/commit/5a75e93b770ce654d3188040228a115486b5cef7))
* **ui:** 补充 slider 填充定位、upload 取消态、tree-view 嵌套拖拽用例 ([edf6407](https://github.com/lidaixingchen/brutxui-vue3/commit/edf640753bbda9bcb94492639d7f38ef48d964d7))
* **cli:** 补充 rollback、根键检测与验签严格模式用例 ([f65afb0](https://github.com/lidaixingchen/brutxui-vue3/commit/f65afb0c8e236493ff9c6f0860f18da8c98aec49))

### ♻️ Code Refactoring

* **cli:** 抽取共享 runProcess 处理子进程 SIGINT 并校验包名 ([704fdc0](https://github.com/lidaixingchen/brutxui-vue3/commit/704fdc0a86561920316f05d0dcb3946ccef7c091))

### 📝 Documentation

* **agents:** 修正AGENTS.md ([dfa18a0](https://github.com/lidaixingchen/brutxui-vue3/commit/dfa18a0f7f0f9ba28f51c37703fbe2d45ee3bead))
* **changelog:** 生成 v0.9.7 根 CHANGELOG 段 ([09141dd](https://github.com/lidaixingchen/brutxui-vue3/commit/09141ddabd5d6a244a0180670fc169576795664a))

## [0.9.7](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.6...v0.9.7) - 2026-08-04

### 🧹 Chores

* 合并远程 main（sign-manifest job 签名提交 1729e7a6） ([adc900f](https://github.com/lidaixingchen/brutxui-vue3/commit/adc900f54eaac1e14c1f9e9ec57289747a13a928))

### 📝 Documentation

* **agents:** 重构 AGENTS.md 为表格化结构 ([e8e52b6](https://github.com/lidaixingchen/brutxui-vue3/commit/e8e52b68f22c6436369bcd1c6f5f0204200bc6a3))
* README 补供应链安全与离线要点，RELEASE 补签名产物发布流程 ([69ceb5f](https://github.com/lidaixingchen/brutxui-vue3/commit/69ceb5fcbbc1ff02459bf1619629eca0a18c92d7))
* **schema:** registry-manifest 补 signature/keyId/integrity，新增 components.json schema ([35282e6](https://github.com/lidaixingchen/brutxui-vue3/commit/35282e6a04948eb15df696fe585168013c4441f8))
* **cli:** 更新 CLI 文档 — registry 子命令、多源/离线、签名信任链 ([dad69af](https://github.com/lidaixingchen/brutxui-vue3/commit/dad69af92536565cc78081f54824df8c1e0505ae))
* 基础设施闭环验收契约与依赖说明 ([7e5efd6](https://github.com/lidaixingchen/brutxui-vue3/commit/7e5efd63b6826ae1036da6c973720f51d9ed9ec9))
* **copilot-instructions:** 更新 GitHub Copilot 使用说明补充规范 ([3760477](https://github.com/lidaixingchen/brutxui-vue3/commit/37604776f6a5b885be79461d26cc6763cba0c06c))
* **changelog:** 整理 v0.9.6 CHANGELOG 格式并归档 v0.9.3，修复生成脚本 ([aee9820](https://github.com/lidaixingchen/brutxui-vue3/commit/aee98208019212c7c0120a2ec668e0fec2b663ac))

### 🔧 CI

* main 签名 job 与发布注入官方私钥 ([819eaa7](https://github.com/lidaixingchen/brutxui-vue3/commit/819eaa7cb577a0c312dc60323e930f6349dc0c5f))
* **deps:** bump actions/checkout in the actions-official group (#3) ([b5c9a2d](https://github.com/lidaixingchen/brutxui-vue3/commit/b5c9a2d51c7ddeb78abc3133fb336f38adba960c))

### ✨ Features

* **registry:** 构建侧 CI 自动签发 registry-manifest ([446fb7e](https://github.com/lidaixingchen/brutxui-vue3/commit/446fb7e755ca986c401cc0386b7a69239b259b11))
* **cli:** registry 源管理子命令并接入多源至 add/info/list/diff/doctor ([d80ee68](https://github.com/lidaixingchen/brutxui-vue3/commit/d80ee68cf5a3c1f157c562acebbb741afb92403f))
* **cli:** 多源 fallback 与离线韧性 — 错误透出、逐源缓存与可观测性 ([85ed364](https://github.com/lidaixingchen/brutxui-vue3/commit/85ed364eeacb50a428171d58bcdf6e9299bdfff9))
* **cli:** 签名信任链闭环 — manifest 完整性复算校验与严格模式 ([235f34f](https://github.com/lidaixingchen/brutxui-vue3/commit/235f34ff7856f28afdd7fb6556888a5a32368d13))

### 🐛 Bug Fixes

* **ci:** 排除 drift gate 中非确定性生成文件 ([036e791](https://github.com/lidaixingchen/brutxui-vue3/commit/036e791d932b695d9b02ad907e2bfccfeebe2781))

## [0.9.6](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.5...v0.9.6) - 2026-07-27

### 🐛 Bug Fixes

* **docs:** 移除失效的 @ts-expect-error 指令修复 CI typecheck ([76f6909](https://github.com/lidaixingchen/brutxui-vue3/commit/76f690933b71a68444c9cf39f4c16dec2b3af527))
* **changelog:** 修复脏提交引发的 TypeError 崩溃与切片倒序引发的爆栈风险 ([432ffa2](https://github.com/lidaixingchen/brutxui-vue3/commit/432ffa2075c9cc364b489b1b826232531a449a32))
* **changelog:** 修复 Windows CRLF 换行替换失效并添加 index.md 缺失兜底机制 ([2573ca3](https://github.com/lidaixingchen/brutxui-vue3/commit/2573ca3cce65f2421be2b969646b12c5485d4520))
* **changelog:** 修复 fs 引用 ReferenceError 致命 bug 并优化正则与链接兼容性 ([5d437a9](https://github.com/lidaixingchen/brutxui-vue3/commit/5d437a96d058239b1517e8262f9d08c1a96e44a1))

### 📝 Documentation

* 更新文档规范、示例与配置，移除废弃的useLocale内容 ([d176bcc](https://github.com/lidaixingchen/brutxui-vue3/commit/d176bcc2b95a066f0bbaca3eed54e07de2372721))
* 更新组件开发文档与项目维护指南 ([9430fc6](https://github.com/lidaixingchen/brutxui-vue3/commit/9430fc637a4025449da6aeeae23cc85252a7a663))
* 批量更新文档与新增组件词典、组合式函数词典 ([4197de6](https://github.com/lidaixingchen/brutxui-vue3/commit/4197de69fd551000b2c41727423e24c2cd85e1bf))
* **ui:** 新增 AI 技能高阶优化指南与复合区块协同示例 ([9542faa](https://github.com/lidaixingchen/brutxui-vue3/commit/9542faa593683a3decd6f9ce64eb70341fbf2357))
* **ui:** 优化 AI 技能文档与参考指南 ([3ce994a](https://github.com/lidaixingchen/brutxui-vue3/commit/3ce994ae7d75bdaef8b3df9eb462be645bb394e4))
* **skills:** 更新 brutxui 技能文档与 AGENTS.md 维护约定 ([8945992](https://github.com/lidaixingchen/brutxui-vue3/commit/89459924c396d3789ecf57f2054b194b2b00d1d4))
* **changelog:** 精简主 CHANGELOG.md 头部描述并同步更新发版初始化头 ([b2f054a](https://github.com/lidaixingchen/brutxui-vue3/commit/b2f054a48dd10025c278b4f7d16bd8c23da9f09d))
* **changelog:** 补齐遗漏的历史归档版本 v0.2.2 与 v0.1.1 ([f873419](https://github.com/lidaixingchen/brutxui-vue3/commit/f873419a5e4b3c2a9d2ed07b2caa2d2fce67e518))
* **changelog:** 全面重构、精炼并规范化 v0.8.0 至 v0.1.0 之间的所有历史归档日志 ([2b773ee](https://github.com/lidaixingchen/brutxui-vue3/commit/2b773eedc6f646a83ffdabefc9f0ff34f27e2995))
* **changelog:** 补全并精炼 v0.6.8 至 v0.1.0 历史归档更新日志 ([dac2c6f](https://github.com/lidaixingchen/brutxui-vue3/commit/dac2c6fc876594ee05a671f9810e2fbb99e3667e))
* **changelog:** 统一中英文主导航链接路径结构 ([6e533ff](https://github.com/lidaixingchen/brutxui-vue3/commit/6e533ffcaa8fa0d29cf5190935f94f21370064ab))
* **changelog:** 在主导航栏添加更新日志入口 ([cdd1a21](https://github.com/lidaixingchen/brutxui-vue3/commit/cdd1a21bdba1029b8e5008086b54f83275a90be1))
* **changelog:** 引入归档机制与根 CHANGELOG 生成脚本 ([f0eff9e](https://github.com/lidaixingchen/brutxui-vue3/commit/f0eff9e85b63c9dcec85e504edd938ee731c15f9))

### ✨ Features

* **changelog:** 实现全自动滑动窗口归档与裁剪逻辑，并同步更新发版规范文档 ([482f8ce](https://github.com/lidaixingchen/brutxui-vue3/commit/482f8ce1c15510f28588f005113eb0c1b4a32673))


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

