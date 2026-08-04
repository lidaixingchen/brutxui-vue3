# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.7...HEAD)

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

## [0.9.5](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.4...v0.9.5) - 2026-07-18

### ⚠️ Breaking Changes

* **ui/exports:** `brutx-ui-vue/calendar` 不再导出 `DatePicker`/`useDatePicker`，`brutx-ui-vue/carousel` 不再导出 `useCarousel`，改用独立子路径 ([d3a35ac](https://github.com/lidaixingchen/brutxui-vue3/commit/d3a35acdc756bb12caad3f133ad1bdbba809a7fd))
* **ui/re-export:** 移除主入口 `index.ts` 中全部 reka-ui 值 re-export，`import { Dialog, Popover, Tooltip, ... } from 'brutx-ui-vue'` 需改为直接从 `reka-ui` 导入 ([4c0d7e0](https://github.com/lidaixingchen/brutxui-vue3/commit/4c0d7e0404cbbdce881fedc2378c568ac0fece81))

### ✨ Features

* **cli/manifest:** Ed25519 签名校验基础设施 + 公钥轮换 + REGISTRY_SIGNATURE_INVALID ([4ce99d7](https://github.com/lidaixingchen/brutxui-vue3/commit/4ce99d701b42f9ba2aaf892dfeeda9b624083faa))
* **cli/registry:** 多 registry 源与离线韧性（离线模式 + auth + reachability） ([b084a17](https://github.com/lidaixingchen/brutxui-vue3/commit/b084a173f4790bd8c832250d66fd33565b94ab99))
* **cli/cache:** 缓存层升级（条件请求 + 并发去重 + LRU 上限 + registry 版本绑定） ([30b7e1c](https://github.com/lidaixingchen/brutxui-vue3/commit/30b7e1c734895f2a2e18fe5f38c2a14d99142b5f))
* **cli/doctor:** 消费 manifest 实现 integrity 漂移与孤儿检测，新增 `--sbom` 与签名默认 warn 严格模式 ([0adf138](https://github.com/lidaixingchen/brutxui-vue3/commit/0adf13819cc228a8a749e6be99c2c1a872e7fd6c), [2c1adf6](https://github.com/lidaixingchen/brutxui-vue3/commit/2c1adf6c5dee40e95e3b79f91f06be9544ff1447))
* **cli/update:** 版本约束体系（version-pinned 默认锁定 + `--across-versions` 解锁） ([b92d426](https://github.com/lidaixingchen/brutxui-vue3/commit/b92d4263d71631ec9d32c871ed10d4371a03aa81))
* **cli/deps:** 组件版本治理体系化（resolveDeps 去重 + 去硬编码 URL + manifest 版本契约） ([9ff275d](https://github.com/lidaixingchen/brutxui-vue3/commit/9ff275d1c4e4412bb9f297b636a3df1a273bd32a))
* **cli/audit:** CLI 操作审计日志与全局 dry-run（`BRUTX_DRY_RUN=1` 或 `--dry-run`） ([d9bc8fc](https://github.com/lidaixingchen/brutxui-vue3/commit/d9bc8fcc360ce78d8ac6a9cc2c07ffdf2301103a))
* **registry:** CycloneDX 1.5 SBOM 生成 + 依赖分析深化与依赖图导出 + build watch 模式 + 构建增量透明化（verify/bench） ([400928e](https://github.com/lidaixingchen/brutxui-vue3/commit/400928eed5bb2298cd870944a12dbaab6a5db56c), [1d39b6a](https://github.com/lidaixingchen/brutxui-vue3/commit/1d39b6ae7f54b981dae149b3ccc64b4f70b1c7d9), [1c8ea7d](https://github.com/lidaixingchen/brutxui-vue3/commit/1c8ea7d3193c7af81f0b9adcfa4278b29b749258), [eb38422](https://github.com/lidaixingchen/brutxui-vue3/commit/eb384228cdff7358263757b43bd27e990f6f85f4))
* **docs:** 新增 i18n 镜像校验脚本 ([6d4a9cf](https://github.com/lidaixingchen/brutxui-vue3/commit/6d4a9cf54f73732b9fabb0bd18ab80579cf0a3a6))

### ♻️ Code Refactoring

* **ui:** SSR 兼容性治理（env.ts 工具层 + lint 拦截 + smoke 测试） ([f13c3f0](https://github.com/lidaixingchen/brutxui-vue3/commit/f13c3f0321f0184f56dce1139a447b107398d77a))
* **ui:** exports 子路径自动化与多入口 ESM 构建 ([d3a35ac](https://github.com/lidaixingchen/brutxui-vue3/commit/d3a35acdc756bb12caad3f133ad1bdbba809a7fd))
* **registry:** 重构注册表系统，改用 AST 自动扫描组件清单 ([edb335b](https://github.com/lidaixingchen/brutxui-vue3/commit/edb335b6fb313b64660b8de102bab2918ac79ebc))
* **shared:** 重构组件索引生成与设计令牌系统，简化 Tailwind 版本检测 ([e986f3c](https://github.com/lidaixingchen/brutxui-vue3/commit/e986f3cd0128c6ff990c710dbf39e8bb50602ea0), [6d187af](https://github.com/lidaixingchen/brutxui-vue3/commit/6d187affdcd0ca5dc8730345af954211d37db2e8), [7fadf0e](https://github.com/lidaixingchen/brutxui-vue3/commit/7fadf0e4be181286a35f287015a5d930eb9e69a0))

### 🐛 Bug Fixes

* **ui/toast:** 修复 useToast 与 Toast.vue 双定时器冲突 ([24a7c38](https://github.com/lidaixingchen/brutxui-vue3/commit/24a7c38ccfb76fb069508ddb6e816807bcf177e3))
* **ui:** 修复 FormWizard/Dialog/TreeView 三处状态与 i18n 问题 ([8e72cb2](https://github.com/lidaixingchen/brutxui-vue3/commit/8e72cb2587d6966c4114af493e7c0f403e4bc789))
* **ui/dialog:** handleClose 并发守卫与 initSize rAF 取消 ([9fec2ff](https://github.com/lidaixingchen/brutxui-vue3/commit/9fec2ff2b3490a03915b6d6243df2baa28df288d))
* **ui/cascader:** 预选值未找到时不再错误高亮首页 ([ec0bcdd](https://github.com/lidaixingchen/brutxui-vue3/commit/ec0bcdd3d39bf2375f5086ec04792aaaad97927c))
* **ui/data-table:** 重置 warnedColumns 并提取魔法数字为默认常量 ([eaa6239](https://github.com/lidaixingchen/brutxui-vue3/commit/eaa623952ce298e360c0d30fed903eea9a10d316))
* **ui/lib:** date.ts 安全 WW token 解析与 render-imperative timer 跟踪 ([072682f](https://github.com/lidaixingchen/brutxui-vue3/commit/072682fb4c1b09afb7ae9485ea489f4661f2013f))
* **ui/theme:** useTheme fallback 引用计数清理 ([5cf76a2](https://github.com/lidaixingchen/brutxui-vue3/commit/5cf76a2fe70c9989f7a08c2f52f1467a3dc62c04))
* **ui:** 修复 reka-ui 下拉菜单组件命名错误与 Upload 类型 import 路径 ([5343591](https://github.com/lidaixingchen/brutxui-vue3/commit/5343591685ae680bb836a4d789d188a333c5cc23), [600ef27](https://github.com/lidaixingchen/brutxui-vue3/commit/600ef2709254d278792aeb4904cadf07929dcdb3))
* **dialog:** 修复无文档或无 body 时的弹窗创建异常 ([e01aeb9](https://github.com/lidaixingchen/brutxui-vue3/commit/e01aeb9f47f8635135e53385c67321c29dc6e2a9))
* **cli:** 修复打包后 doctor 命令找不到 package.json 与 fetchWithSources 离线全失败时丢失 cause 的问题 ([5df18fa](https://github.com/lidaixingchen/brutxui-vue3/commit/5df18faa915fc642674b9b5ca57c2a89945a3df3), [a7e36ef](https://github.com/lidaixingchen/brutxui-vue3/commit/a7e36ef5a62f906a3cc8f702dbbce62e678676f5))
* **cli:** 修复辅助包 bug 扫描发现的 5 项问题（project/doctor/package-manager/validate-utils） ([6e40d92](https://github.com/lidaixingchen/brutxui-vue3/commit/6e40d92a13c0aa12a799e3a51df5d05834e0a22e))
* **registry:** validate 排除 registry-sbom.json + verify-build 在 npm_execpath 缺失时回退 PATH 中的 pnpm ([f1b6392](https://github.com/lidaixingchen/brutxui-vue3/commit/f1b6392ece95964708d8e9536af75d3a5a2c70df), [fa876ea](https://github.com/lidaixingchen/brutxui-vue3/commit/fa876ea5424cb5a492206fe42b8c65a7853102f))
* **shared:** 拆分 scan 入口隔离 typescript 依赖，修复 CLI 打包 ESM 崩溃 ([1277013](https://github.com/lidaixingchen/brutxui-vue3/commit/12770131fd2c214892ae58d1949542c884947c34))
* **ui:** 修复浏览器测试 CI 失败（playwright provider + Node-only 依赖隔离） ([efc64fc](https://github.com/lidaixingchen/brutxui-vue3/commit/efc64fc952544ce8f93b7e997ebd46723d59fb70), [69a9fc4](https://github.com/lidaixingchen/brutxui-vue3/commit/69a9fc42e743a2f4287e7aab342aac5acc5458be))
* **visual-test:** 修复跨系统字体差异导致的视觉快照失败 ([b704ff2](https://github.com/lidaixingchen/brutxui-vue3/commit/b704ff256d9af02db83fd9ad340ff999ec5395db))
* **docs:** 修复组件总览卡片链接 404、Demo 组件内存泄漏与英文首页 SEO 路径 ([a8e641b](https://github.com/lidaixingchen/brutxui-vue3/commit/a8e641b542a6ceddd4541a40ab6e238e92a765fc), [27f4af9](https://github.com/lidaixingchen/brutxui-vue3/commit/27f4af93d26708ab825b551aebcf60b95f48fc9d), [f230406](https://github.com/lidaixingchen/brutxui-vue3/commit/f230406d036ad313d7a95a4fc5c9b30443e4dd44))
* **vercel:** 修复 Vercel 部署 base 路径、outputDirectory 与 buildCommand 多项问题 ([e21fae2](https://github.com/lidaixingchen/brutxui-vue3/commit/e21fae29479a73dac6a04cd0406f1fa908ba6f47), [b56550c](https://github.com/lidaixingchen/brutxui-vue3/commit/b56550c4ba4f54d63575bbcb22cb1a86131cc39e), [fc1c554](https://github.com/lidaixingchen/brutxui-vue3/commit/fc1c554c2445c04a5b25cb0c8ba137749db5e5d3), [009d23f](https://github.com/lidaixingchen/brutxui-vue3/commit/009d23f942d3791975a3b44762bcec7e412d8ad5))
* 修复根仓库扫描报告 5 项发现 + 补齐方案 V2 验收遗漏项 ([35a201c](https://github.com/lidaixingchen/brutxui-vue3/commit/35a201c5759bb8d8f9f352171b0389b5a995f6cc), [8680c28](https://github.com/lidaixingchen/brutxui-vue3/commit/8680c28a25de83e68a53a075d9d62e2cca7def8e))

### ⚡ Performance

* **ui:** 运行时性能体系（bench 基准 + 组件审计 + 最佳实践文档） ([6da8a43](https://github.com/lidaixingchen/brutxui-vue3/commit/6da8a43c3693df52f90dfbe79ca6debb52d35b9b))

### 📝 Documentation

* 新增供应链安全、仓库基础设施与架构优化方案 V2/V3 文档 ([9e07480](https://github.com/lidaixingchen/brutxui-vue3/commit/9e07480ced479e0e74b67cbd0822e47812c60c6d), [5ec0ec3](https://github.com/lidaixingchen/brutxui-vue3/commit/5ec0ec3c023d61a11b4832f4f9c12091983cd4b3), [dc38499](https://github.com/lidaixingchen/brutxui-vue3/commit/dc38499ed0e5261ba767cb28ab39401296bdc717))
* **cli:** 补全版本锁定、供应链安全、breaking change 迁移规范与 monorepo 提示文档 ([7db7b53](https://github.com/lidaixingchen/brutxui-vue3/commit/7db7b53e1977130d711ec83d11c0f573c522908d), [9995151](https://github.com/lidaixingchen/brutxui-vue3/commit/9995151b90a30be3e83dc4a2783843666dea0584))
* **docs:** 抽离贡献指南、精简首页、重构卡片样式与本地搜索弹窗 ([9dfdaf2](https://github.com/lidaixingchen/brutxui-vue3/commit/9dfdaf26789b9d1406c4038f4219274771191093), [b427ec2](https://github.com/lidaixingchen/brutxui-vue3/commit/b427ec288127ada156e6b95235fadbbb4968ec46), [f575ab6](https://github.com/lidaixingchen/brutxui-vue3/commit/f575ab6b2284a1fdd2a227336011ae4608c6d8f7), [03a2a00](https://github.com/lidaixingchen/brutxui-vue3/commit/03a2a00fc6bd96b102b3e9540469795e2f54050f))
* 清理冗余过时设计文档，显式注明开发仅允许使用 pnpm 约定 ([517593f](https://github.com/lidaixingchen/brutxui-vue3/commit/517593fab5b9f2b79acbbd7b408327478e17a82a), [3839f51](https://github.com/lidaixingchen/brutxui-vue3/commit/3839f510c1c6828fe9269c168ff6985150b5b52b))

### 🔧 CI

* **deps:** bump github-actions group with 11 updates (#2) ([fea0fae](https://github.com/lidaixingchen/brutxui-vue3/commit/fea0faec6ccc416874a4b14f78447a9a5016db56))
* **dependabot:** 优化依赖分组策略，拆分 minor/patch 与 major 升级 PR ([ed730ac](https://github.com/lidaixingchen/brutxui-vue3/commit/ed730ac6a8cef6e1c10531629622711ad411fa44))
* 优化三套工作流并行化与缓存策略，新增浏览器测试 job，工作流安全与并发加固 ([351a20d](https://github.com/lidaixingchen/brutxui-vue3/commit/351a20d51eb257f25504165abcffb08de926bb95), [e43a416](https://github.com/lidaixingchen/brutxui-vue3/commit/e43a4166452e7dc5a66439ee0be2322b43f62ff4), [6b39333](https://github.com/lidaixingchen/brutxui-vue3/commit/6b39333e4597799b071cd503788c2751cf48fac6), [641fc62](https://github.com/lidaixingchen/brutxui-vue3/commit/641fc62ec33d79d34b657086760ed3fb91119766), [c3294cf](https://github.com/lidaixingchen/brutxui-vue3/commit/c3294cffbd92263cd91c9cec6c4b3f4589f4fb4b))

### 📦 Build

* 引入 turbo 构建增量编排 + changeset 版本管理，移除 shamefullyHoist 显式化包间依赖 ([86ba7bf](https://github.com/lidaixingchen/brutxui-vue3/commit/86ba7bf9922bf1536718c2667e66674742d07260), [5e28af6](https://github.com/lidaixingchen/brutxui-vue3/commit/5e28af6ef4ea2b50d9b0cce02464d8cfac2ea022), [0409f43](https://github.com/lidaixingchen/brutxui-vue3/commit/0409f431f159390ca6f65dfdbd6877f579757e63))
* **ci:** 修复 turbo.json 缓存输出，解决测试与文档部署资源缺失问题 ([b724597](https://github.com/lidaixingchen/brutxui-vue3/commit/b7245972fbe1a6cd36b282201a7fc10c07830efd))
* **ui:** 添加 @vitest/browser-playwright 依赖并更新配置 ([6cd490d](https://github.com/lidaixingchen/brutxui-vue3/commit/6cd490d887dc749aaed335a41e5fa0c45470caa5))

### ✅ Tests

* **cli:** 更新集成测试用例以匹配新的目录结构 ([1ad3df5](https://github.com/lidaixingchen/brutxui-vue3/commit/1ad3df57c599bc216490ae225883bc52a60c13d7))

## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

