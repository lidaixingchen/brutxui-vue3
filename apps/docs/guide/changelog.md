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

## [0.11.3](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.2...v0.11.3) - 2026-09-28

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

## [0.11.1](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.0...v0.11.1) - 2026-08-24

### ✨ Features

* **slider:** 调音台立体推子键帽与工控指示刻槽重塑 ([9f6d8c6](https://github.com/lidaixingchen/brutxui-vue3/commit/9f6d8c68a0d39f2883a0d41ecc70fd31f4121ec3))
* **scroll-area:** 重塑纯色实体滑块与工控金属导轨 ([585b073](https://github.com/lidaixingchen/brutxui-vue3/commit/585b0736394dc9f49035eb3158d6fe7af29dac8b))
* **ui:** remodel Switch keycap and IO label marks ([95e7e87](https://github.com/lidaixingchen/brutxui-vue3/commit/95e7e87c325c07235a9893c69f46f3f8ef7b33e2))
* **ui:** upgrade CardWindowHeader interactivity ([c32c631](https://github.com/lidaixingchen/brutxui-vue3/commit/c32c631730b0df2215e5c65d5f009f4d78526f25))
* **docs:** 粗野主义图表主题 JSON 生成器与设计范式页 ([3d6c733](https://github.com/lidaixingchen/brutxui-vue3/commit/3d6c7336eef7af926ad136798965459288e89b12))
* **nav:** 滚动条防滑纹理、打卡槽页码、档案插片面包屑与工牌吊孔 ([ede97b3](https://github.com/lidaixingchen/brutxui-vue3/commit/ede97b39be14b92955c01e1b119b1a6721c9283e))
* **timeline,calendar:** LED 脉冲节点、PCB 双总线与复古挂历头 ([4a416c9](https://github.com/lidaixingchen/brutxui-vue3/commit/4a416c928d7e4bf3cac98a40d9f9836c761f6e47))
* **dialog,tour:** 百叶窗入场、点阵遮罩与 HUD 取景步骤指示 ([d25088f](https://github.com/lidaixingchen/brutxui-vue3/commit/d25088fe513b2d9a0566cf4632136288089d1d75))
* **table,data-table:** 表头底纹、荧光框选与蓝图空状态 ([8b4d202](https://github.com/lidaixingchen/brutxui-vue3/commit/8b4d20223630137372117bb1075dd80ceeb798c1))
* **accordion,tabs:** 展开态分层换色与打卡机插片变体 ([b71a04b](https://github.com/lidaixingchen/brutxui-vue3/commit/b71a04bcdc09653c24b0d358d7bc02cb40859b57))
* **tags-input,upload:** 便签贴纸标签与软盘档案化上传 ([cd7a3c5](https://github.com/lidaixingchen/brutxui-vue3/commit/cd7a3c5d060334f2c1751a082c5091bb0e6a393f))
* **display:** 展示组件仪表化——凹槽底槽、分段斜纹、扫描线骨架与钢印水印 ([4e7e7a7](https://github.com/lidaixingchen/brutxui-vue3/commit/4e7e7a74224518170bccd43f3450e5bc3ac70e0d))
* **number-input:** 步进机械键帽、Drum Ticker 翻页动效与 click 音效 ([e704b7e](https://github.com/lidaixingchen/brutxui-vue3/commit/e704b7e237d82aa11d048356e7764248a0eb9a2a))
* **switch,slider:** 轨道凹槽化、翘板吸合动效、防滑纹理与 snap 音效 ([f32652b](https://github.com/lidaixingchen/brutxui-vue3/commit/f32652be47c10b1e013a7176b215bbe8829f4a3c))
* **input,kbd:** 新增 inset 冲压凹槽变体与 3D 机械键帽 ([ae7fb43](https://github.com/lidaixingchen/brutxui-vue3/commit/ae7fb4377c2d4cc0430fd775b069ba526ad73d92))
* **rate:** 接入 BrutalShape 图腾图标与 Stamp Impact 敲印动效 ([d02ba81](https://github.com/lidaixingchen/brutxui-vue3/commit/d02ba81a23888b13bc04c7f76f8a1f5a526ed140))
* **blocks:** BrutalistHero 与 PricingSection 融合工控场景版式 ([4b691fd](https://github.com/lidaixingchen/brutxui-vue3/commit/4b691fdbc130d2bf14b9507177ed85effcc4645c))
* **card:** 新增 CardWindowHeader 复合组件与 HUD 准星及纹理变体 ([5abe026](https://github.com/lidaixingchen/brutxui-vue3/commit/5abe026ac99575d7d31c90f3963c70f134b03251))
* **card:** 新增 CardWindowHeader 复合组件与 HUD 准星及纹理变体 ([a4a75c5](https://github.com/lidaixingchen/brutxui-vue3/commit/a4a75c5157eb7f756919de3e9c8fe2899a2b8126))
* **button:** 新增 stacked/hazard/ticket 装饰形态变体与同源盖影按压契约 ([daedf78](https://github.com/lidaixingchen/brutxui-vue3/commit/daedf78d1898a315bbd1c773d62e0784c71567e3))
* **ui:** 新增 BrutalShape 粗野图腾矢量组件库 ([812263e](https://github.com/lidaixingchen/brutxui-vue3/commit/812263effc2908543cc3ba82a7f23343725c7ea9))
* **ui:** 扩展音效引擎机械触觉配方并新增 useBrutalHaptics 门面 ([95c97e5](https://github.com/lidaixingchen/brutxui-vue3/commit/95c97e5ec26ef2d408eaf747a64119418fba18b4))
* **ui:** 新增 ImageCard 拍立得相框卡片组件 ([899ab7c](https://github.com/lidaixingchen/brutxui-vue3/commit/899ab7c9f589c98b771672dfb987c9bfa45ffff0))
* **tokens:** 新增 stacked/inset 阴影档位与纹理工具类 CLI 分发闭环 ([fd5c60c](https://github.com/lidaixingchen/brutxui-vue3/commit/fd5c60c59f3037846443fc903e336bbd636810a2))
* **ui:** 治理Tabs双轨受控与非受控对称性并支持defaultValue与异步数据流 (#48) ([33f0a38](https://github.com/lidaixingchen/brutxui-vue3/commit/33f0a387a76447fa3e85692c85c8e0f31c9f2131))
* **ui:** useMessage接入复合生命周期与活跃消息守卫 (#46) ([58e28e3](https://github.com/lidaixingchen/brutxui-vue3/commit/58e28e33a7d50b2abe2698bddf84e5ebc8668bb6))
* **shared:** 下沉色彩通道解析、Alpha混合与WCAG对比度算法至shared单一信源 (#45) ([e497f52](https://github.com/lidaixingchen/brutxui-vue3/commit/e497f52c6e48d039e4b8bb60a657d1eedf219d0f))
* **cli:** 升级 doctor 结构规则与 utils 诊断自愈 (#41) ([0ba3f8f](https://github.com/lidaixingchen/brutxui-vue3/commit/0ba3f8f9e8dca794277587118ab1c0351841ad50))
* **tokens:** TokenStyleCompiler 拓展与 UI/CLI 模板自动注入管线 (#40) ([6dc1209](https://github.com/lidaixingchen/brutxui-vue3/commit/6dc1209897fc0bfbbf54b004ee4fcd20e2b0f887))
* **shared:** 纯函数式派生并导出 BRUTAL_COLOR_NAMES (#39) ([5449944](https://github.com/lidaixingchen/brutxui-vue3/commit/54499449c952b26cc162fdfe3413687918e2a71a))

### ♻️ Code Refactoring

* **ui:** 重构useDialogGeometry空间几何控制器与beforeClose控制流解耦 (#47) ([519ad18](https://github.com/lidaixingchen/brutxui-vue3/commit/519ad18a43018e0741be7e5f60831129b08df8c0))
* **arch:** unify tree model and z-index scale (#43) ([dcc449d](https://github.com/lidaixingchen/brutxui-vue3/commit/dcc449d692f07e711350ace896bbbd567f9fde86))
* **ui:** 移除废弃的私有扫描清单脚本并精简预扫描 ([45e43e5](https://github.com/lidaixingchen/brutxui-vue3/commit/45e43e539536295eb22c74964e59300d2caef6c7))
* **registry:** 统一排除清单类型并消除跨包私有脚本引用 ([2ae6dfc](https://github.com/lidaixingchen/brutxui-vue3/commit/2ae6dfce66fbb1718fd37dc82a5383d604e91037))
* **shared:** 下沉扫描排除清单与覆盖规则为单一信源 ([622054b](https://github.com/lidaixingchen/brutxui-vue3/commit/622054bdf5c6f4184b15a952cc603465203f8171))
* **ui:** 增加 debug 开关并收敛 devtools 控制台日志 ([1a28720](https://github.com/lidaixingchen/brutxui-vue3/commit/1a2872042f988fcf875f140cf6b8a2d62d998e5f))
* **tokens:** 强化 check-twmerge-colors 针对 CLI 双模板的门禁校验 ([d79da1f](https://github.com/lidaixingchen/brutxui-vue3/commit/d79da1f0d9c30033e3e1a6e288a301c5bf9581ee))

### 🐛 Bug Fixes

* **slider:** 导出 SliderThumbNotchVariantProps 类型声明 ([776fb74](https://github.com/lidaixingchen/brutxui-vue3/commit/776fb742de90140b40bc3f9643c602eafba47fa8))
* **ui:** optimize CardWindowHeader click handlers ([94026a3](https://github.com/lidaixingchen/brutxui-vue3/commit/94026a35cfc5e6ab1517c8d800d5f0447adde2e1))
* **ui:** 门禁白名单放行 ring-inset 位置变体 ([fe0bfe4](https://github.com/lidaixingchen/brutxui-vue3/commit/fe0bfe46bb5f8a13a7a93ab381bed0e0d1bfdb65))
* **ui:** 图腾与评分令牌引用补齐主题 fallback ([75556c7](https://github.com/lidaixingchen/brutxui-vue3/commit/75556c7539cbb2d939381276c649d3e6e57e701c))
* **number-input:** Drum Ticker 兜底定时器生命周期与测试隔离补全 ([f3fa738](https://github.com/lidaixingchen/brutxui-vue3/commit/f3fa73821951e0651c043b2cbaa69cb48739d13d))
* **ui:** 终审修复——ECharts 键名、准星伪元素化与变体契约补全 ([ff86ff8](https://github.com/lidaixingchen/brutxui-vue3/commit/ff86ff8da085d4a542245ef58e4d32dffb9b9bfa))
* **cli:** 优化 remove-service 变量作用域 ([d01131a](https://github.com/lidaixingchen/brutxui-vue3/commit/d01131addea2c76d360beb5cc6d9dbc31c6e65c7))
* **shared:** 修复 ESLint 校验与类型声明 ([8168609](https://github.com/lidaixingchen/brutxui-vue3/commit/816860945d013b7204b264bd7f596533ccc8e02a))
* **ui:** 修复 useDialogGeometry 与 useMessage ([94bb5ad](https://github.com/lidaixingchen/brutxui-vue3/commit/94bb5ad4dd6aba8e8677198840a7ebaf1055b224))
* **shared:** 增强 parseColorChannels 对 NaN 与非法对象色彩的校验防御 ([a78b6c9](https://github.com/lidaixingchen/brutxui-vue3/commit/a78b6c95f1e5b3196a254e2e496eef7fcf239299))
* **scaffold:** fix tail insertion and escape strings ([089d33a](https://github.com/lidaixingchen/brutxui-vue3/commit/089d33a21817cef0a4f3eff3311bbf3dce76b288))
* **cli:** runProcess 异常提示补充命中元字符的参数详情 ([5a9758d](https://github.com/lidaixingchen/brutxui-vue3/commit/5a9758d7d87f629efb397b7439ccbec91f8d4438))
* **cli:** runProcess 增加 Shell 元字符拦截防护与安全单测 ([7317b10](https://github.com/lidaixingchen/brutxui-vue3/commit/7317b10ff568bc465781018264d36129f979b9e0))

### 📝 Documentation

* **plans:** 将滑块与滚动条重塑方案标记为 done ([f36b8e6](https://github.com/lidaixingchen/brutxui-vue3/commit/f36b8e61314b7c0ae52b02cd3a05d90f1ed81bdc))
* **demos:** enhance SwitchDemo with 3D mechanical features ([636c9a7](https://github.com/lidaixingchen/brutxui-vue3/commit/636c9a72fd5858ce55035f23abde5a0211868b42))
* update CardWindowHeader and Switch demos and docs ([12fe258](https://github.com/lidaixingchen/brutxui-vue3/commit/12fe258dd218273d065b966808e3f973ff4e0cb6))
* **demos:** 组件演示覆盖视觉深化批次新增变体 ([f949746](https://github.com/lidaixingchen/brutxui-vue3/commit/f9497462b281c8da03b51926eeec287423be13b4))
* **docs:** 同步视觉深化批次新增变体至组件文档 ([2e96899](https://github.com/lidaixingchen/brutxui-vue3/commit/2e96899537d0fe30543009fb698c207a0d4d7ac2))
* **docs:** 补充图表设计范式英文指南 ([9c2f834](https://github.com/lidaixingchen/brutxui-vue3/commit/9c2f834c14f128e77c58f82137d52b04368fb8ea))
* **docs:** 补齐三组件文档页与演示组件 ([67918d7](https://github.com/lidaixingchen/brutxui-vue3/commit/67918d7b0beeb8add55a9b1c2ffcf8b632538197))
* **plans:** 视觉深化方案实施完成归档（19/19 tickets 交付） ([1f0141b](https://github.com/lidaixingchen/brutxui-vue3/commit/1f0141bd6136da62891f36b6613674ea94237c74))
* **plans:** 组件视觉深化方案落地审查修订 ([b686ff4](https://github.com/lidaixingchen/brutxui-vue3/commit/b686ff42b37ecdffaf8437fa84748a226947b06a))
* 同步更新 Tabs、Message、DialogGeometry 与色彩系统文档 ([a8711f4](https://github.com/lidaixingchen/brutxui-vue3/commit/a8711f4d13332cbe1abaee15bf18e5a37b4713b4))
* **guides:** sync z-index, tree model & scaffold docs ([810c552](https://github.com/lidaixingchen/brutxui-vue3/commit/810c552ff25e991632614f1379f4b52663d701ed))
* 更新代码质量与性能改进方案及设计令牌层级说明 ([afca817](https://github.com/lidaixingchen/brutxui-vue3/commit/afca81786e3f385aeab1054e3a29ef5e82505389))
* 更新方案状态索引与视觉系统层级指南 ([b9d2d13](https://github.com/lidaixingchen/brutxui-vue3/commit/b9d2d13082366760377152cec46688a1e2bbc9bd))
* 状态生命周期色彩与组件双轨治理方案落地归档 ([bdf8a51](https://github.com/lidaixingchen/brutxui-vue3/commit/bdf8a519bfb509603053ea183f60ae0fd0c661cb))
* 更新编译扫描排除清单与覆盖规则下沉方案为完成态 ([5d05258](https://github.com/lidaixingchen/brutxui-vue3/commit/5d052587b11759a125cc4598e9c73df558652a29))
* 登记编译扫描排除清单与覆盖规则下沉方案 ([03a2256](https://github.com/lidaixingchen/brutxui-vue3/commit/03a22563d9a6e4abc660f16f2ede7b5b2dd85af5))
* 更新颜色双轨单一信源方案与机制指南 ([0439076](https://github.com/lidaixingchen/brutxui-vue3/commit/04390761afcaf569dc5cfcdfebc78ac6fee3a4e4))

### ✅ Tests

* **ui:** 编译器补丁测试覆盖 pattern-utilities 第四标记区间 ([cd57f64](https://github.com/lidaixingchen/brutxui-vue3/commit/cd57f64127f5b09e7e4a79c814d428a8b9d5e5b4))
* **shared:** 为 registry.ts 增加 schema 校验与完整性断言单测 ([184a928](https://github.com/lidaixingchen/brutxui-vue3/commit/184a92822548ca145d246053305f3dbc4d9b4b14))
* **tokens:** 重构 check-twmerge-colors 门禁与契约 (#42) ([6f19f11](https://github.com/lidaixingchen/brutxui-vue3/commit/6f19f110bc8c8d223a3efcad1f53f1ad1c78647e))

### ⚡ Performance

* **cli:** FileTransaction 支持并发快照并并行化孤立文件与组件移除 ([9688e8e](https://github.com/lidaixingchen/brutxui-vue3/commit/9688e8efe77f656c6b11141441984f952e88a834))

### 📦 Build

* **ui:** Button 体积门禁上调至 22KB ([578661e](https://github.com/lidaixingchen/brutxui-vue3/commit/578661e99fca373598a26b01a0bad7607e07f63e))
* **ui:** 将 prebuild:exports 纳入 typecheck 与 lint 前置调用链路 ([ac4ce00](https://github.com/lidaixingchen/brutxui-vue3/commit/ac4ce000da328203f4ded8cf98edc4d222b35dcf))
* **ui:** 同步 exports 映射（新增 useDialogGeometry） ([045b0cd](https://github.com/lidaixingchen/brutxui-vue3/commit/045b0cdb6a8f4608b0a88ce349c592d28addb812))
## 历史归档版本

更早版本已归档至 [归档版本索引](../changelog/)，按版本号独立成文，便于回溯。

- 文档站点入口：[归档版本索引](../changelog/)
- 归档文件目录：[`apps/docs/changelog/`](https://github.com/lidaixingchen/brutxui-vue3/tree/main/apps/docs/changelog)
