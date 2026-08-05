# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.9...HEAD)

## [0.9.9](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.8...v0.9.9) - 2026-08-05

### ✅ Tests

* **registry:** 更新 build-registry 快照（随组件修复变化） ([4865a9e](https://github.com/lidaixingchen/brutxui-vue3/commit/4865a9e785ee55fbdf12a133157c7f48c362ae0a))
* 补审查修复的回归测试 ([5268b75](https://github.com/lidaixingchen/brutxui-vue3/commit/5268b75ef5021d08c9b6d8290efea13b68be9738))
* **registry:** 更新 build-registry 快照（integrity 随组件修复更新） ([8c1f220](https://github.com/lidaixingchen/brutxui-vue3/commit/8c1f220996bdeb33c3b3bf4b6c8e775b2cc4cc3b))
* 补 AvatarImage 回归测试并改进 scrollIntoView spy 恢复 ([4167beb](https://github.com/lidaixingchen/brutxui-vue3/commit/4167bebdd60878a526e8a03c5f65b01a2d8032ff))

### 🐛 Bug Fixes

* **components:** Card3D 指针坐标系统一 ([44e876b](https://github.com/lidaixingchen/brutxui-vue3/commit/44e876b484c7dea20ea52bd3e4c01beb9e1891b3))
* **components:** NumberInput aria-invalid 依据 variant 判定 ([9b42458](https://github.com/lidaixingchen/brutxui-vue3/commit/9b42458d0a511b14728bdbc81e4eb7e1ddf0b103))
* **components:** CommandInput 过滤同步收敛为单一函数 ([aca9701](https://github.com/lidaixingchen/brutxui-vue3/commit/aca970103e7801273ecc14c8f0de11acaf013250))
* **components:** ColorPicker 受控 open 收拢进 composable ([421ce7f](https://github.com/lidaixingchen/brutxui-vue3/commit/421ce7fa823cd3044b49357234834d124051cd19))
* **components:** Menu 子菜单注册时序与反向索引 ([9646aa3](https://github.com/lidaixingchen/brutxui-vue3/commit/9646aa34886717b5eb2e6e418d913f3a7dc538c1))
* **components:** DescriptionsItem 合并容器 class 透传与对齐 ([2c4c4ad](https://github.com/lidaixingchen/brutxui-vue3/commit/2c4c4ad059cd34bbc6d17686547e53be2f0cb8c6))
* **security:** FooterSection 链接过滤改危险协议黑名单 ([9c22f8c](https://github.com/lidaixingchen/brutxui-vue3/commit/9c22f8ce955aa6c4ea84768e9fba74c33df0ddd9))
* **components:** DataTable 展开/选择列设为 sticky ([f3d2457](https://github.com/lidaixingchen/brutxui-vue3/commit/f3d2457cc2dfe6ce69e2da20a3f3c1e0638e87aa))
* **components:** Button data-text 随更新同步 ([db1dbf8](https://github.com/lidaixingchen/brutxui-vue3/commit/db1dbf800f54d32ef96827ec85d3fe72a29bff85))
* **components:** Counter 朗读状态改为响应式 isAnimating ([e45162b](https://github.com/lidaixingchen/brutxui-vue3/commit/e45162b59a52c1d71d9b733e999d3f440948a9bd))
* **components:** DatePicker readonly 拦截与快捷键边界按天比较 ([bb47ba5](https://github.com/lidaixingchen/brutxui-vue3/commit/bb47ba59dfed7ba759eb27b82c919687bf5ea138))
* **components:** 修复 NumberInput 错误消息无障碍关联 ([4ffd19b](https://github.com/lidaixingchen/brutxui-vue3/commit/4ffd19b14ba056d2d83184b797fb3c3439fb7ad2))
* **components:** 修复 Menu 激活项父级子菜单自动展开 ([c40bde3](https://github.com/lidaixingchen/brutxui-vue3/commit/c40bde3816583124cabde94679b917d431426c3e))
* **components:** 显式声明 HeaderSection 按钮类型 ([618c616](https://github.com/lidaixingchen/brutxui-vue3/commit/618c616282f354bb34ffa95cf329c6a777aba6ae))
* **components:** 修复 FormConditional 条件字段未卸载 ([a217bf6](https://github.com/lidaixingchen/brutxui-vue3/commit/a217bf61329e5cdbcc129708bd3f63a5fbf0faba))
* **security:** 过滤 FooterSection 链接危险协议 ([41d376c](https://github.com/lidaixingchen/brutxui-vue3/commit/41d376c7534f99aea0aca56bb897fcbbac0a45c8))
* **components:** 修复 DropdownMenuCheckboxItem 受控失效 ([792c2d4](https://github.com/lidaixingchen/brutxui-vue3/commit/792c2d4f2aac1fadd46d6f09a48f4ef61382943a))
* **components:** 修复 DescriptionsItem 跨列错位 ([5551ebb](https://github.com/lidaixingchen/brutxui-vue3/commit/5551ebb44b2459583dc36c7ff84696a9c8a9a128))
* **components:** 修复 DatePicker 系列 readonly/边界/重复事件/确认按钮 ([a7aac9d](https://github.com/lidaixingchen/brutxui-vue3/commit/a7aac9d538d622ef914aac202847e0b7934935f9))
* **components:** 修复 DataTable 过滤空值与固定列偏移 ([18f2b53](https://github.com/lidaixingchen/brutxui-vue3/commit/18f2b5334dcc3775b06ba5cda8b074b841a4a7ea))
* **components:** 修复 Counter 动画时长与朗读播报 ([11376e0](https://github.com/lidaixingchen/brutxui-vue3/commit/11376e0ade94ced05668ac460da154c666114c12))
* **components:** 修复 CommandInput 初始过滤未同步 ([d8506a5](https://github.com/lidaixingchen/brutxui-vue3/commit/d8506a522b4d61702a2afd8f653af99962a67c34))
* **components:** 修复 ColorPicker 输入清空/事件冒泡/受控键盘 ([550e79a](https://github.com/lidaixingchen/brutxui-vue3/commit/550e79ace31a44e6b6aefd3898db4cd84c7ca3d9))
* **components:** 修复 CodeBlock 高亮失败残留旧结果 ([2b3a77f](https://github.com/lidaixingchen/brutxui-vue3/commit/2b3a77f1514714f6fa898627b8126ef63b3a9eae))
* **components:** 修复 ChatContainer 非法时间戳渲染崩溃 ([6785d6d](https://github.com/lidaixingchen/brutxui-vue3/commit/6785d6d1f14cc67257cd452c91686d71b82241c5))
* **components:** 修复 Calendar 异步降级组件模板编译错误 ([c97e0c6](https://github.com/lidaixingchen/brutxui-vue3/commit/c97e0c6c508b857f47f6512e6ac1bd9280f12b39))
* **components:** 修复 Card3D 指针坐标变换反馈漂移 ([4f513c6](https://github.com/lidaixingchen/brutxui-vue3/commit/4f513c66f19835e63691a482ceef5ef875a3abdd))
* **components:** 修复 Button glitch 文本缺失与 asChild 禁用拦截 ([eb7b25b](https://github.com/lidaixingchen/brutxui-vue3/commit/eb7b25b8a437adc71b757d0500a6acc4bfa47333))
* **lib:** 修复 Devtools state 协议与日期组合格式（审查反馈） ([752a3a0](https://github.com/lidaixingchen/brutxui-vue3/commit/752a3a0d791bb64d2509cb4b989cb5ef0a5e59ce))
* **composables:** 修复对话框缩放补偿与消息/动效缺陷（审查反馈） ([b5ad2f9](https://github.com/lidaixingchen/brutxui-vue3/commit/b5ad2f942ec973f4dc5f47abd9690897f9d790cc))
* **components:** 修复组件缺陷与测试基础设施 ([e872ba0](https://github.com/lidaixingchen/brutxui-vue3/commit/e872ba0cecfccb3c0eb72e9b8e72f627e7766eec))
* **lib:** 修复环境检测与 Devtools 集成 ([237c753](https://github.com/lidaixingchen/brutxui-vue3/commit/237c753fa4517621f7ccae49b0b0e494e9d908b0))
* **lib:** 修复日期 ISO 周与主题变量映射 ([d5e7043](https://github.com/lidaixingchen/brutxui-vue3/commit/d5e7043b52ff4c4c051dc888bf3364baf3aa10cf))
* **composables:** 修复看板/步进器/对话框/主题缺陷 ([aa221e5](https://github.com/lidaixingchen/brutxui-vue3/commit/aa221e5e03d541e1650c929d64e18fca95342fdb))
* **composables:** 修复防抖与消息类组合式函数 ([a62df5b](https://github.com/lidaixingchen/brutxui-vue3/commit/a62df5bdb65bce3d4f6441c33b0ae8c734b89d0e))
* **composables:** 修复 DataTable 选择与过滤逻辑 ([0b996fa](https://github.com/lidaixingchen/brutxui-vue3/commit/0b996fa6f2b9b2379df34ada83d4fa4c4d439514))

### 📦 Build

* 引入 pre-commit 自动同步 registry 并修复 turbo 缓存语义 ([893582a](https://github.com/lidaixingchen/brutxui-vue3/commit/893582ad1985cfd5550ba680c8ecaa7929da2167))

### ✨ Features

* **lib:** devtools Inspector 组件树支持 filter 关键字搜索 ([22edae9](https://github.com/lidaixingchen/brutxui-vue3/commit/22edae9707d4d506aaf34bbe0001856c6997843e))

### 📝 Documentation

* **changelog:** 生成 v0.9.8 根 CHANGELOG 段并归档 v0.9.5 ([356803c](https://github.com/lidaixingchen/brutxui-vue3/commit/356803c71a44de2f266b2d59ccd7cbba3a466755))

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


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

