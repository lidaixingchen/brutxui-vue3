# 更新日志

本项目所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.5...HEAD)

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

## [0.9.4](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.3...v0.9.4) - 2026-07-12

### ⚠️ Breaking Changes

* **ui/popup:** 解决 Toast 定时器冲突、Dialog 内存泄漏并废止回调式 beforeClose 接口。beforeClose 接口不再接收 done 回调参数，需改写为返回 boolean 或 Promise<boolean> ([81d4358](https://github.com/lidaixingchen/brutxui-vue3/commit/81d43589bd1e86ffe7ac3232230a4471627d91b4))

### 📦 Build

* **registry:** 重新生成组件注册表及清单产物 ([294bac0](https://github.com/lidaixingchen/brutxui-vue3/commit/294bac0cb9da2a3c640d7e8189e13384ccf3f88b))

### 🐛 Bug Fixes

* **registry:** 修复构建脚本正则重写过度、Locale依赖及哈希计算不一致问题 ([cc142c3](https://github.com/lidaixingchen/brutxui-vue3/commit/cc142c3fdfe14d890c1d7511563731a9b0edb88d))
* **ui:** 提取 DataTable 的魔法数字为默认常量 ([0640071](https://github.com/lidaixingchen/brutxui-vue3/commit/0640071ecc5acde132722a98b84d6d09587881ad))
* **cli:** 修复安全漏洞、事务回滚失效、多选项目录匹配及路径匹配假阳性问题 ([3aa8348](https://github.com/lidaixingchen/brutxui-vue3/commit/3aa834808eab2d0898a20cf2982fdd56c3196bf0))
* **shared:** 修复组件文件遗漏、分类数据混淆及侧边栏分组问题 ([5167691](https://github.com/lidaixingchen/brutxui-vue3/commit/5167691bb77b73cf83c526887beab7dc6b15f40f))
* **ui/interaction:** 修复 Counter 缩放、Tour 全局按键拦截及其他交互组件的 boundary 问题 ([10e7572](https://github.com/lidaixingchen/brutxui-vue3/commit/10e757277eca4b6afd4892a4653a34f140a3366c))
* **ui/upload:** 解决 Upload 组件重试上传竞态与进度更新时的频繁重渲染性能问题 ([e8da15d](https://github.com/lidaixingchen/brutxui-vue3/commit/e8da15dea68b45cd689eedaa160cdb00d17c2b2a))
* **ui/form:** 修复 FormControl 属性丢失、FormWizard 步骤失效及输入类组件的 A11y/IME 问题 ([8f055a9](https://github.com/lidaixingchen/brutxui-vue3/commit/8f055a926dfedcd5cfb5cd24a110841d5480b68a))
* **ui/data-table:** 修复 DataTable 单元格合并失效及系列交互、性能问题 ([7de59fd](https://github.com/lidaixingchen/brutxui-vue3/commit/7de59fd3cfd418d37e647dcdd1b8d0049527d594))

### 📝 Documentation

* **review:** 新增 UI 与辅助包 Bug 扫描报告 ([cc1bf10](https://github.com/lidaixingchen/brutxui-vue3/commit/cc1bf10d16c36a9b09e182b8b0ccc3ec40f3bf1e))

### ✅ Tests

* **cli:** 修复 remove 命令测试中 mockedGetItem 调用的断言参数不一致问题 ([ba645ac](https://github.com/lidaixingchen/brutxui-vue3/commit/ba645ac8))

## [0.9.3](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.2...v0.9.3) - 2026-07-09

### ♻️ Code Refactoring

* **ui,docs:** 整理多处组件与工具代码，修复 useClipboard、textarea、backtop、select、typewriterText、rate 等组件细节问题并进行细节清理 ([e21dac6](https://github.com/lidaixingchen/brutxui-vue3/commit/e21dac6b01e6f23e287d77f2631a9419176f548a))
* **ui:** 重构 TreeView 数据流，引入 localNodes 代理状态与 update:nodes 机制，遵循单向数据流原则并优化测试用例 ([9ade098](https://github.com/lidaixingchen/brutxui-vue3/commit/9ade0986193b0168aa292f939ee6e99521e1ab21))
* **shared,docs,cli,registry:** 提取公共侧边栏生成逻辑至 shared 包，重构文档侧边栏实现并优化 registry 缓存校验 ([c0117e9](https://github.com/lidaixingchen/brutxui-vue3/commit/c0117e9f1bfa13c31e9244024e3b88cff452ba0b))

### ⚡ Performance

* **ui:** 移除 props.nodes 的 deep watch 监听，由 localNodes 本地状态直接托管内部树属性变化，斩断 watch 死循环并极大降低响应式性能开销 ([c27e5f6](https://github.com/lidaixingchen/brutxui-vue3/commit/c27e5f6baca5f81344a5b799e29c13521a2e8df6))

### 🐛 Bug Fixes

* **ui:** 修复 ToastContainer 堆叠未响应 maxVisible 限制的问题，并在单元测试中进行沙箱化隔离 ([15b580f](https://github.com/lidaixingchen/brutxui-vue3/commit/15b580fa36d308d576bc284ea8dbd762ecac2f0e))
* **cli,docs:** 修复 CLI 的 add 服务流程中特定逻辑边界并同步更新相关组件说明文档 ([25401f8](https://github.com/lidaixingchen/brutxui-vue3/commit/25401f8af3f0a4c74034e117ef09fee2f18ad79f))
* **ui:** 修复 directives/loading、Watermark、theme-variables、useClipboard、useDebounce、useColorPicker、TypewriterText、SketchyChart、Backtop、Menu、SubMenu、Pagination、Tour 等组件与指令的内存泄漏及边缘逻辑缺陷 ([93c93b8](https://github.com/lidaixingchen/brutxui-vue3/commit/93c93b8b61a42f60145de3e427aece8b2436fb0b))
* **ui:** 优化 Upload 并发模型与取消机制（引入 AbortController 支持取消），修复文件大小格式化输出边界缺陷 ([71ae6c5](https://github.com/lidaixingchen/brutxui-vue3/commit/71ae6c59315254ef15df8680589cec64bb4937d4))
* **ui:** 修复 useDialog、DialogEnhanced 和 useToast 函数式调用的 Promise 悬挂及 DOM 泄漏，保证 Escape 键与点击遮罩正常触发 beforeClose 钩子 ([48126c3](https://github.com/lidaixingchen/brutxui-vue3/commit/48126c3d5d1ca0bb0ea1c4157964c48782f3fecd))
* **ui:** 修复 FormWizard、Input/Textarea（拼音 IME 输入法缓冲）、Cascader、ColorPicker、Slider、Rate、Stepper 等表单与输入组件交互、清除按钮事件冒泡及无障碍键盘导航问题 ([14fd4ac](https://github.com/lidaixingchen/brutxui-vue3/commit/14fd4ac6a94a612f98483fd2d6ff70f0c45df4bd))
* **ui:** 修复 DataTable 展开行 colspan 表格错位、KanbanBoard 拖动 rAF 竞态泄漏、TreeViewUtils 迭代算法避免深层树栈溢出等逻辑缺陷 ([fe04f57](https://github.com/lidaixingchen/brutxui-vue3/commit/fe04f57c912913654b2dafd5d208ed36cd564b97))
* **ui:** 修复 lib/date DST 期间解析失效，以及 Calendar、TimePicker、DatePickerRangePanel、YearPicker 跨时区匹配和边界数值处理，统一周起始日为周一 ([e6a0c69](https://github.com/lidaixingchen/brutxui-vue3/commit/e6a0c69e38831406eca589fe1f6aacfae7b686ee))
* **docs:** 修复文档站 CopyButton、TranslationBanner 等组件的内存泄漏与响应性更新缺陷，补充全面的 Bug 扫描报告 ([1d92bd8](https://github.com/lidaixingchen/brutxui-vue3/commit/1d92bd8a348ef783b508d72f6621201989d952d6))
* **shared:** 补齐桶导出类型，重新分类 feedback-form 等 block 组件，并移除 page 相关的无用死代码 ([f93e158](https://github.com/lidaixingchen/brutxui-vue3/commit/f93e158696837c19101d7ce2449d3c9637d67347))
* **cli:** 修复 doctor --fix 状态不更新、diff 误报 not-installed、remove 依赖警告失效等命令逻辑错误，优化 rollback 回滚事务机制，升级 Node 版本要求至 22.5.0 ([64551a0](https://github.com/lidaixingchen/brutxui-vue3/commit/64551a0957826a5a3948549d1cfcc1868b0a3031))
* **registry:** 优化 computeSourceHash 依赖哈希提取逻辑，解决 composables 依赖变更未触发构建的缓存问题，当构建失败时正确设置非零退出码 ([e5a3533](https://github.com/lidaixingchen/brutxui-vue3/commit/e5a35337182716b994b44ced499ddb46a842e581))

### ✅ Tests

* **ui:** 使用 try-finally 确保 Tour 测试中假计时器在断言失败时也能被清理以防用例间环境污染 ([114e32e](https://github.com/lidaixingchen/brutxui-vue3/commit/114e32e80c0b1480f9b3cda85214fe7efc838a5e))
* **ui:** 更新 useColorPicker、year-picker 和 tour 的单元测试以适配最新的交互与性能优化变更 ([14c2282](https://github.com/lidaixingchen/brutxui-vue3/commit/14c228225656b84fd6c6ec2cf2c40b4fd5369010))

## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

