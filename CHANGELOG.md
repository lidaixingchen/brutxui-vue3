# 更新日志

本项目所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.4...HEAD)

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

## [0.9.2](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.1...v0.9.2) - 2026-07-08

### ⚠️ Breaking Changes

* **shared,docs:** 移除 `media` 组件分类并将原组件重新归类，修正 7 个误分类组件，重构中英文文档 sidebar 为元数据驱动自动生成。消费 registry JSON 中 `category === 'media'` 的外部代码需要迁移 ([fca8ab9](https://github.com/lidaixingchen/brutxui-vue3/commit/fca8ab939b8cc48d75de5fd530d4dee56f3b5299))

### ✨ Features

* **cli:** 扩展 CLI 组件 management，diff/update/remove 全面沿用安装清单来源，并支持在 `list` 中展示组件安装来源与检查更新、更新可用性提示等 ([6e1f2bc](https://github.com/lidaixingchen/brutxui-vue3/commit/6e1f2bc5c74f179820fe9cb3eb9db7e02119ae11), [fa93917](https://github.com/lidaixingchen/brutxui-vue3/commit/fa93917af16c0f8de6ea56bae70551e8723c3e56), [fd251be](https://github.com/lidaixingchen/brutxui-vue3/commit/fd251be9501982547f5fde96e81d5c3c067fa7b5), [3c03207](https://github.com/lidaixingchen/brutxui-vue3/commit/3c03207a3c8cf05ce42d63d6a793677fdf3886c0), [516a2a3](https://github.com/lidaixingchen/brutxui-vue3/commit/516a2a336cb4a9f502c9171568b5e8b43ad74c13), [8bca38c](https://github.com/lidaixingchen/brutxui-vue3/commit/8bca38c17aa073bbc9b094bc7c97e1dd99034135), [b4d9160](https://github.com/lidaixingchen/brutxui-vue3/commit/b4d9160a5f228337025cb2869e36f9e11c6c73c4))
* **cli:** 在本地安装清单中记录组件详细元数据，并添加 CLI 运行时错误恢复建议引导 ([2e3a57e](https://github.com/lidaixingchen/brutxui-vue3/commit/2e3a57e4dde47335056bec3987c87e1cf62759f1), [46f7286](https://github.com/lidaixingchen/brutxui-vue3/commit/46f7286fa0f4b5740e29d37a19033c797467d3a8), [6debec9](https://github.com/lidaixingchen/brutxui-vue3/commit/6debec9d629c6428a864a2dc922bea6d5bffae4d))
* **registry:** 实现编译期依赖去重与循环依赖校验，并支持构建期输出依赖图与组件分类元数据 ([678e705](https://github.com/lidaixingchen/brutxui-vue3/commit/678e7058843430d1ea16de7e78ba9e185be3570b), [0226663](https://github.com/lidaixingchen/brutxui-vue3/commit/022666369c156af3e60bfe91abd69b012acc2110), [dedba66](https://github.com/lidaixingchen/brutxui-vue3/commit/dedba66e70410e64fa2ec239f725f91af0feac8d), [4dbddac](https://github.com/lidaixingchen/brutxui-vue3/commit/4dbddaccb3177977deb7b7ba87d629ba983e888b))
* **registry:** 增加组件生命周期状态管理与自动校验，防止打包时引用未知组件或跨组件非法导入 ([cd7d390](https://github.com/lidaixingchen/brutxui-vue3/commit/cd7d39002eeebf7dd9157fe5f5ea9c9eafbf53dc), [6be7eff](https://github.com/lidaixingchen/brutxui-vue3/commit/6be7effbfe9edafe9a69534aac522bc4c9cf4248), [4152e46](https://github.com/lidaixingchen/brutxui-vue3/commit/4152e46524c3aa2b181155815f19ae59b1e8dc59))
* **registry:** 引入注册表构建清单生成与校验机制，同时支持输出发布版本和 SHA-256 完整性哈希元数据 ([c8b4eed](https://github.com/lidaixingchen/brutxui-vue3/commit/c8b4eed7fb076ac99d4a3ce66cce12f3d6eb9016), [a4035d2](https://github.com/lidaixingchen/brutxui-vue3/commit/a4035d23e55b4314fcb82fca5fc0ddbeec825ec3), [c7c2520](https://github.com/lidaixingchen/brutxui-vue3/commit/c7c2520199c339421f68d0d04dd03f6cdcce644a), [adf0c20](https://github.com/lidaixingchen/brutxui-vue3/commit/adf0c209e9b620fa4e939fd7809eb8cdd938e04e))
* **shared:** 新增 `sidebarGroup`/`kind`/`docsHidden`/`docsSlug` 元数据字段，支持 docs sidebar 自动生成、组件/区块路由前缀区分与别名 ([fca8ab9](https://github.com/lidaixingchen/brutxui-vue3/commit/fca8ab939b8cc48d75de5fd530d4dee56f3b5299), [10a3d3c](https://github.com/lidaixingchen/brutxui-vue3/commit/10a3d3c57e921e216dd90030dd606862cc5481aa))
* **docs:** 支持根据 `COMPONENT_REGISTRY` 动态生成文档侧边栏，并增加 validateSidebarCoverage 校验，确保文档与注册表强一致 ([fca8ab9](https://github.com/lidaixingchen/brutxui-vue3/commit/fca8ab939b8cc48d75de5fd530d4dee56f3b5299))

### ♻️ Code Refactoring

* **cli:** 重构 CLI 构建架构为双入口（CLI 命令行 & 公共 API 服务），新增 `src/api.ts` 暴露全部服务模块，并解耦并抽离出初始化、安装、写入、差异比对、卸载等独立服务 ([c2aa807](https://github.com/lidaixingchen/brutxui-vue3/commit/c2aa807a5f2670932d8ad8a4cdf0fada436a31eb), [50d89a9](https://github.com/lidaixingchen/brutxui-vue3/commit/50d89a939f0a3a7aa5e5657e4eb05113588d7432), [8e833ae](https://github.com/lidaixingchen/brutxui-vue3/commit/8e833ae9ac9496fe647054c0402c50f00a31d879), [ab1ed17](https://github.com/lidaixingchen/brutxui-vue3/commit/ab1ed174827f478450676e8ab855f750330f545d), [d6129c9](https://github.com/lidaixingchen/brutxui-vue3/commit/d6129c9c5681d9f370410bacea42c86b56aaa531), [05509b7](https://github.com/lidaixingchen/brutxui-vue3/commit/05509b798156b7825419e2d6fb11c6a217dabb25), [409ddf4](https://github.com/lidaixingchen/brutxui-vue3/commit/409ddf43dd5b6f465065fa432df93d20aab0f9cf))
* **ui:** 清理老旧与废弃组件代码，移除 legacy 公开分发入口；将 EmptyState 替换为 Result 空状态实现，UploadCard 重构为复用 Upload，GlitchButton 转发至 Button，CarouselEnhanced 转发至 Carousel 核心组件 ([4a7c246](https://github.com/lidaixingchen/brutxui-vue3/commit/4a7c246eeb896f5d0c97ba9f43317d7c812d5f79), [d0517fe](https://github.com/lidaixingchen/brutxui-vue3/commit/d0517fe23bbbb8d3013e352892f140ae7c59814d), [a2cf070](https://github.com/lidaixingchen/brutxui-vue3/commit/a2cf070732775f88bad629ec917499d53a9ed28b), [251b942](https://github.com/lidaixingchen/brutxui-vue3/commit/251b942003ca7b68e1fe8dc16a97997d3587faf7), [3db365e](https://github.com/lidaixingchen/brutxui-vue3/commit/3db365e1f3ed3fb75a6151f0a8a01c93b24d4180), [615a768](https://github.com/lidaixingchen/brutxui-vue3/commit/615a768a94247675b75cf2ff7f7e4aa3eaa4c6b2))
* **ui:** 统一及归拢多选与交互逻辑，重构 Cascader / TreeSelect / DatePicker 系列组件的清除与确认面板操作；收束 SearchWidget / Transfer 组件状态与浮层样式令牌 ([32cef0f](https://github.com/lidaixingchen/brutxui-vue3/commit/32cef0f2f833d6d0ca897c69d33b94a3f09a433c), [9698608](https://github.com/lidaixingchen/brutxui-vue3/commit/969860883c16bfe7fa4bc6405ce4fbe6a1c9cb59), [b6465e4](https://github.com/lidaixingchen/brutxui-vue3/commit/b6465e4517bf4e162cff424f9e1b388cc4e65e67), [1dab740](https://github.com/lidaixingchen/brutxui-vue3/commit/1dab740cc7bb6776c5b54f3a394a3a218cbef2b9), [7638eb6](https://github.com/lidaixingchen/brutxui-vue3/commit/7638eb668098ecee62d0c81bfbc0612d4ec81f84), [46e93c4](https://github.com/lidaixingchen/brutxui-vue3/commit/46e93c4651b347c5c23b85059bb70416168d8ec9), [23de46c](https://github.com/lidaixingchen/brutxui-vue3/commit/23de46c7eaf2216beaa23e97cb1cf3e9f01e645a), [c1aae32](https://github.com/lidaixingchen/brutxui-vue3/commit/c1aae3245b7b14ee397a07474109cc81caf0497a))
* **registry:** 重构并优化组件依赖与文件映射逻辑，引入 TypeScript AST 分析导入依赖；将组件文件映射移动至共享包，消除硬编码映射 ([c072fc9](https://github.com/lidaixingchen/brutxui-vue3/commit/c072fc98a6f050ee2172c5c83bc19fc6337ac07d), [eb46d48](https://github.com/lidaixingchen/brutxui-vue3/commit/eb46d488c3c1d9d91b13dfcd481b1de116cc03d7), [3304703](https://github.com/lidaixingchen/brutxui-vue3/commit/33047039e6293dd9702264c65384a5c2163dcf28), [e5a53ba](https://github.com/lidaixingchen/brutxui-vue3/commit/e5a53ba41794b0755befc2d7f22308192377717e), [6503fcd](https://github.com/lidaixingchen/brutxui-vue3/commit/6503fcd5cca748fde057424f15f4184eef4db519))

### 🐛 Bug Fixes

* **ui:** 修复 P0 级浏览器兼容性降级问题（如 Image、InfiniteScroll、Audio 及函数式弹窗的 body guard 访问限制）；补充组件主入口导出（Calendar、Carousel、CodeBlock 等） ([93b4d67](https://github.com/lidaixingchen/brutxui-vue3/commit/93b4d67801dc35742c902035fbaded044e73f065), [faef356](https://github.com/lidaixingchen/brutxui-vue3/commit/faef35616cbf6d72992da142001222ce1a939d26), [a2129d1](https://github.com/lidaixingchen/brutxui-vue3/commit/a2129d1f5c622c052c621859e498a6e97c668815), [8337712](https://github.com/lidaixingchen/brutxui-vue3/commit/8337712c9d718d73b4f831074610303478b7fb78))
* **cli:** 修复 Tailwind 配置中对已废弃的 brutalism 插件导入提醒；修复辅助包安装、Vite CSS 路径识别与事务回滚失败等问题 ([3d373db](https://github.com/lidaixingchen/brutxui-vue3/commit/3d373db3120421647438881197b787e3d8f8ff2c), [fed8143](https://github.com/lidaixingchen/brutxui-vue3/commit/fed8143b6426718ffd76af91147a38ecd9ebd996))
* **registry:** 修正 DataTable 筛选条件合并兼容缺陷，同步收口 legacy 组件合并状态，补齐清除组合式函数（useClearable）与 Button 的元数据映射 ([9e012d1](https://github.com/lidaixingchen/brutxui-vue3/commit/9e012d17952e22cf194cddd96f59e3377a0d6140), [475790e](https://github.com/lidaixingchen/brutxui-vue3/commit/475790e4615dd9c0cd6369721662dfa3f9172cbd), [1640634](https://github.com/lidaixingchen/brutxui-vue3/commit/164063414bb0ae06d27fc470faa27ade089ec55c))

### 📝 Documentation

* **docs:** 补充完整组件的中文描述文本以替换原有占位信息，移除区块文档中的冗余列表项 ([2ac4292](https://github.com/lidaixingchen/brutxui-vue3/commit/2ac42923f6187fd3945e0414566b9bb09271c34d), [54bd2e7](https://github.com/lidaixingchen/brutxui-vue3/commit/54bd2e756c76d290711a2da052fd741efaea9174))
* **docs:** 区分本地 CLI 开发运行环境与仓库工作流，明确 DatePicker API 语义，更新组件合并治理与技术债收敛报告 ([495b6cc](https://github.com/lidaixingchen/brutxui-vue3/commit/495b6cc16b6768388549f8b1eee5acfbd74649de), [e4c6c9a](https://github.com/lidaixingchen/brutxui-vue3/commit/e4c6c9a91717e184f19cccf8b4c04fb661ba805d), [c9578ac](https://github.com/lidaixingchen/brutxui-vue3/commit/c9578ac2f95fa8c2d5db9e3e0d5d613273d2c497), [a556170](https://github.com/lidaixingchen/brutxui-vue3/commit/a556170223163a6dadd59760033561ea7ca971e2))
* **ui:** 明确日期解析 API 规范、子路径白名单和主题 fallback 处理细节 ([706a205](https://github.com/lidaixingchen/brutxui-vue3/commit/706a205709ce7194f10b9f8bcd78fb8d30bfb30a), [f810fd9](https://github.com/lidaixingchen/brutxui-vue3/commit/f810fd9d8b373256a7218d0e391c618dcc5920e0), [6f55b15](https://github.com/lidaixingchen/brutxui-vue3/commit/6f55b153a820b89f745436d4fedd6959ce17e883))

### ✅ Tests

* **ui:** 锁定纯日期本地时区解析单测，扩展表单校验多分支覆盖，固化产物路径重写并引入主入口导出同步校验 ([578afee](https://github.com/lidaixingchen/brutxui-vue3/commit/578afee37eaaa656b3a89549f25158a1716a3d07), [675b173](https://github.com/lidaixingchen/brutxui-vue3/commit/675b1733c08d03eb882597b19377e98ad52dcb5c), [03b520a](https://github.com/lidaixingchen/brutxui-vue3/commit/03b520aa2f41c05991ea0818eb5052bf58ddab5c), [4a969d2](https://github.com/lidaixingchen/brutxui-vue3/commit/4a969d2a4bae22e8cdf92626c62a1f9443cbcc47))
* **cli:** 建立并定义了 CLI 多版本环境下的完整集成测试矩阵，并接入发布门禁，支持测试现场保留、命令参数筛选以及事务回滚机制覆盖 ([3bdea45](https://github.com/lidaixingchen/brutxui-vue3/commit/3bdea45fd6d3121d29afc9fcb6db41c21c5a8fa2), [49c73ee](https://github.com/lidaixingchen/brutxui-vue3/commit/49c73eeacee497ce6d07e25e053727e85512410c), [f4f52da](https://github.com/lidaixingchen/brutxui-vue3/commit/f4f52da303ebaa55c3e53df1d32296f3e3969221), [8ed0fee](https://github.com/lidaixingchen/brutxui-vue3/commit/8ed0fee23ea867c5c474377fd2f2eb93d5001fb4), [9590ffd](https://github.com/lidaixingchen/brutxui-vue3/commit/9590ffde7ed8d3e856040e670b39f3f3f53834ae))
* **registry:** 强化组件文档覆盖及 manifest 强类型契约校验，覆盖依赖解析的边界测试类型 ([c160abf](https://github.com/lidaixingchen/brutxui-vue3/commit/c160abfe0035399600f3c0889871bdc04b3a4630), [2bc598c](https://github.com/lidaixingchen/brutxui-vue3/commit/2bc598c9a42ae0e1eea8bb36eabd914a75f9a15a), [33a9671](https://github.com/lidaixingchen/brutxui-vue3/commit/33a9671d6d471d137c5509d80beef5328d4c30ce))

## [0.9.1](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.0...v0.9.1) - 2026-07-06

### ✨ Features

* **ui:** 新增 Image/Tour/Message 组件及函数式 API ([f428f7e](https://github.com/lidaixingchen/brutxui-vue3/commit/f428f7e6ec2e8cc72471dad442224a76114f3ff6))
  Image：懒加载、FocusScope 预览、缩放/旋转/翻转/拖拽；Tour：Canvas 挖空 + DPR 高清渲染、ResizeObserver 防漂移、四方向 Popover；Message：单例挂载 + TransitionGroup + grace period GC；新增 useDialog/useMessageBox/useMessage 函数式 API
* **ui:** 新增 Loading、Statistic、Result、Watermark、Backtop 五个组件 ([cdc2b58](https://github.com/lidaixingchen/brutxui-vue3/commit/cdc2b5831820ad2e8fc8e819d74f36f538ff499b), [d2e8071](https://github.com/lidaixingchen/brutxui-vue3/commit/d2e80718b49eb18263e3ac1a4ada597c4e9ad363))
  v-loading 指令支持 SSR 隔离和 position 定位还原；Watermark Canvas 降级 SVG fallback 与 VDOM 防篡改重绘；Backtop JSDOM 沙箱兼容
* **ui:** TreeView 增强（拖拽/懒加载/过滤/reloadNode）、Calendar 增强（事件标记/mode/eventRenderer） ([f428f7e](https://github.com/lidaixingchen/brutxui-vue3/commit/f428f7e6ec2e8cc72471dad442224a76114f3ff6))
* **ui:** Input 新增密码显示隐藏国际化、Cascader 支持手动传入选中状态、Badge 图标间距适配 ([9329f39](https://github.com/lidaixingchen/brutxui-vue3/commit/9329f390bf4a33665fdea5e93377e74ca0499be3))

### ♻️ Code Refactoring

* **ui:** 组件库统一抽离 — 提取 chip-variants、defaults.ts 全局默认配置，统一 composables 销毁方法导出，修复内存泄漏和警告重复 ([d87c3b3](https://github.com/lidaixingchen/brutxui-vue3/commit/d87c3b3a2f4ce6c667c33c0de00f75ebf52cc148))
* **ui:** 重构样式系统 — 提取 preflight.css、恢复 Tailwind CSS v4 完整导入修复 Cascade Layer 结构丢失、解耦可选依赖 ([627445f](https://github.com/lidaixingchen/brutxui-vue3/commit/627445f66b52b1c0badd76907318dcec164c7e6f), [a2c33c2](https://github.com/lidaixingchen/brutxui-vue3/commit/a2c33c2f22bf9af936d5f388f9d60d387fcf63d8), [1a4ae55](https://github.com/lidaixingchen/brutxui-vue3/commit/1a4ae5515a6e8e7bee10d01d0b5b51533405b07b))
* **ui:** 重构 Input 统一容器架构 — 抽离 inputContainerVariants CVA，SelectTrigger 补充 rounded-brutal 主题圆角适配 ([8ff2652](https://github.com/lidaixingchen/brutxui-vue3/commit/8ff26529c224c109696227a405d810c62ca63127))
* **ui:** 重构 DataTable 筛选器并支持国际化 ([e685c1f](https://github.com/lidaixingchen/brutxui-vue3/commit/e685c1ffce5a8e7e308773a45c063a52934780a4))
* **virtual-scroll:** 添加泛型支持，提取 VirtualizerInstance/VirtualizerVirtualItem 类型到共享 types ([abfb198](https://github.com/lidaixingchen/brutxui-vue3/commit/abfb1980f2e10277a290c230c3545f4c29948ec0))
* **cli:** 为 remove 命令添加 directives 目录的孤儿文件检测逻辑 ([abfb198](https://github.com/lidaixingchen/brutxui-vue3/commit/abfb1980f2e10277a290c230c3545f4c29948ec0))

### 🐛 Bug Fixes

* **ui:** 修复 Card 交互与事件（activate 传递原生 Event、统一 interactive 变体）、SketchyChart 无数据空白渲染、filterState.columns 未定义解构 ([baa5d55](https://github.com/lidaixingchen/brutxui-vue3/commit/baa5d554789476155c010960e2c3bca8f808af81), [9b162a8](https://github.com/lidaixingchen/brutxui-vue3/commit/9b162a8e5ff1d73ee22c450cc12911b8f937649c), [b197db8](https://github.com/lidaixingchen/brutxui-vue3/commit/b197db8ef0c3de18297f889a1f245ef89461933a))
* **ui:** 修复多选组件 indeterminate 状态选中逻辑（DataTableColumnFilter/Cascader/Transfer） ([b4788d0](https://github.com/lidaixingchen/brutxui-vue3/commit/b4788d0cf52abee70ca85522b6353e6500b542b4))
* **ui,docs:** 修复 Demo 渲染问题与 DescriptionsItem span 公式（bordered horizontal 下 span*2-1） ([eb22491](https://github.com/lidaixingchen/brutxui-vue3/commit/eb22491ffb8fdb4df82296c1906abb1daf5cf682))
* **shared:** 移除 components.ts 重复的 image 键、补充 image 和 message 到 COMPONENTS 注册表 ([6be34ed](https://github.com/lidaixingchen/brutxui-vue3/commit/6be34ed640322f7b0b9bf6795e2a3e28f43f78f4), [9acd6de](https://github.com/lidaixingchen/brutxui-vue3/commit/9acd6de9b5df584557aaac30e3d21ddf0034cc37))
* **test:** 用 Vue provide 替代 vi.mock 修复 useLocale 在 isolate:false + pool:threads 下的跨文件竞态泄漏 ([8498036](https://github.com/lidaixingchen/brutxui-vue3/commit/84980368fc3631945e69389dbdc11e6a4e698f67))
* **visual:** 移除 visual.css 冗余 preflight 导入修复视觉回归测试（组件透明和高度坍塌） ([0f47353](https://github.com/lidaixingchen/brutxui-vue3/commit/0f47353038e646ab879ac5639b8c3174014962c2))
* **test:** 修复 VirtualScroll 可访问性测试在 CI 中因 mock 不稳定而失败 ([b9a2a29](https://github.com/lidaixingchen/brutxui-vue3/commit/b9a2a297347c763e3f8694da0d9649df9c157aff))

### 📝 Documentation

* 新增组件开发同步清单文档，规范组件发布流程 ([7ead57e](https://github.com/lidaixingchen/brutxui-vue3/commit/7ead57e6957f41769fbe2decfefc25107c5635c7))
* 补充 Image/Tour/Message/Statistic/Result/Watermark/Backtop/Loading 组件文档与 Demo 注册 ([473bbc9](https://github.com/lidaixingchen/brutxui-vue3/commit/473bbc9be5596d42d382ad8b9e16074a5cb41ef1), [b845e53](https://github.com/lidaixingchen/brutxui-vue3/commit/b845e53ee511d5d2fa18e7f8b3ece68cdb7e2023))
* 规范化 Menu、Cascader、Transfer、Rate 组件文档并注册 Demo ([1e86453](https://github.com/lidaixingchen/brutxui-vue3/commit/1e864535d39b11cfd337f8eba262c914317adeb1))
* 同步更新 brutxui 技能参考文档，登记第一二阶段新组件 ([5c715f8](https://github.com/lidaixingchen/brutxui-vue3/commit/5c715f8e9a42a2585b068b50bf33635a2935ce09))
* 修正 Input 组件文档移除未支持的插槽说明 ([9e6434a](https://github.com/lidaixingchen/brutxui-vue3/commit/9e6434a3578bb0b6323ed6cff4ceed0f7abea804))

### 💄 Styles

* **ui:** 统一组件样式规范 — 批量更新 rounded-brutal 圆角、border-3 边框，替换原生元素为封装组件，修复 Rate 颜色变量适配 ([0f7ea3e](https://github.com/lidaixingchen/brutxui-vue3/commit/0f7ea3e1f8226d4386b94aa545f96499c168bed2))

### 📦 Build

* **registry:** 生成 message.json 注册表文件，修复 CLI dry-run 报 Component not found ([80ff78f](https://github.com/lidaixingchen/brutxui-vue3/commit/80ff78f05f019a3efbcc9dc96f72d0a7fcb30929))

### ✅ Tests

* **ui:** 修复 VirtualScroll 测试的 TypeScript 类型错误 ([dd279a5](https://github.com/lidaixingchen/brutxui-vue3/commit/dd279a546e865e06a0557eb8ee701f8fd298ec12))

## [0.9.0](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.8.2...v0.9.0) - 2026-07-03

### ✨ Features

* **registry:** 实施共享注册表 16 项改进并修复审计发现的 4 个 bug ([7999995](https://github.com/lidaixingchen/brutxui-vue3/commit/799999501c529b8619e3b8f9e10fdabf28975295))
  补齐 COMPONENTS 缺失元数据并实现双向交叉验证；抽离 locale-zh-cn 为独立 registry item；ComponentMeta 重命名为 RegistryComponentMeta 消除命名冲突；实现 SHA-256 增量构建缓存；validate-registry 补充 type 白名单、依赖去重、交叉引用验证等校验。
* **cli:** 执行 CLI 改进方案全部 22 项 ([7e71edb](https://github.com/lidaixingchen/brutxui-vue3/commit/7e71edb60800e3f24f721253115e7e6592408ad6))
  新增 update/list/info/remove/create/cache clean 六个命令；installPackages 改异步 spawn、registry fetch 添加指数退避重试和 TTL 缓存、add 命令写入前快照+失败回滚、导入重写改用 es-module-lexer AST 解析；多组件安装进度显示、doctor --fix 逐项确认、Nuxt 自动注入、VS Code snippets 生成、Monorepo 检测。
* **ui:** 实施组件深化拓展方案全部 16 批 ([f2d98f7](https://github.com/lidaixingchen/brutxui-vue3/commit/f2d98f7eb8fd0f35d82e77fc14575f5c1512c41e), [9922319](https://github.com/lidaixingchen/brutxui-vue3/commit/9922319205240b9568c7c0a7c1fac9353f56bfcc), [4515469](https://github.com/lidaixingchen/brutxui-vue3/commit/451546920a330de376c6d8940fc3f1babeda2fe4), [229429e](https://github.com/lidaixingchen/brutxui-vue3/commit/229429e767679e50c121fa741c0eab5ca6330b8c), [f4bcc10](https://github.com/lidaixingchen/brutxui-vue3/commit/f4bcc1002396600fa50eed8340b9019ce82e3f7f))
  - **基础修复与性能**：修复 102 个 TS 错误和 61 个测试失败；测试 2350→3314（覆盖率 72%→83%）；包体积 429KB→33KB（-92%），启用 tree-shaking 和 preserveModules；新增 useDebounce/useThrottle/useEventListener
  - **表单与数据**：Input 新增 clearable/showPassword/前后缀插槽；Upload 支持拖拽/进度/错误处理；DataTable 新增展开行/固定列/合并单元格；Form 新增 inline/scrollToError 并暴露验证方法；Pagination/DialogEnhanced 多项增强
  - **新组件**：Popconfirm、Descriptions、InfiniteScroll、Popover
  - **无障碍**：axe-core 集成；61 个键盘导航测试；Card/Timeline/KanbanBoard ARIA 语义补全；高对比度模式支持
  - **表单状态**：Input/Textarea/NumberInput/SelectTrigger 新增 errorMessage 和 error 变体
  - **程序化控制**：10+ 组件通过 defineExpose 暴露 focus/blur/setValue 等方法
  - **主题**：ThemeVariables 接口 + 4 套预设主题 + 主题编辑器
  - **Composable**：新增 useKanban/useStepper，hooks 导出同步至 18 个，useLocale fallback 可配置

### ♻️ Code Refactoring

* **ui,docs,registry:** 组件合并与共享变体抽取 ([f44bf35](https://github.com/lidaixingchen/brutxui-vue3/commit/f44bf35c42fcbcd304ef3c523f7dfd744f790404), [8fa95b6](https://github.com/lidaixingchen/brutxui-vue3/commit/8fa95b6e223415d9bfd060d3db2b9758d6ab04d8), [93975de](https://github.com/lidaixingchen/brutxui-vue3/commit/93975de4ada56d1678d95819a92ee4945107e8a4), [f3a314c](https://github.com/lidaixingchen/brutxui-vue3/commit/f3a314c3242740917b73ab8ee5c5074dd946be6e))
  合并 SubmitButton→Button、SaaSPricing→PricingSection、TabsNav→Tabs、ComboboxMulti→Combobox；抽取 brutal-interaction-variants、floating-animation-classes、form-toggle-base 等共享模块；brutal-danger→brutal-destructive 全局 token 统一。
* **ui,cli:** 技术债务清理与质量提升 ([b169d33](https://github.com/lidaixingchen/brutxui-vue3/commit/b169d33f87944416c81032aa45e9bf65bddcfd32), [b003999](https://github.com/lidaixingchen/brutxui-vue3/commit/b003999d26b6d2aad1ec9ccef52b77f8e09e41d6), [2082706](https://github.com/lidaixingchen/brutxui-vue3/commit/2082706ca54556235a27c4535bd8680c6a39d957), [8e26a0c](https://github.com/lidaixingchen/brutxui-vue3/commit/8e26a0c6370705f8e0b8e6bb0798a62cbd668630), [88ca3af](https://github.com/lidaixingchen/brutxui-vue3/commit/88ca3af1f446872bd36abb8052111db30c0e4216), [b347ccd](https://github.com/lidaixingchen/brutxui-vue3/commit/b347ccd96bae138ac0aa32464920467ece748c00))
  UI：修复 33 项技术债（无障碍/类型守卫/生命周期统一/死代码删除），消除 TS2352/ESLint any 报错，提取魔法数字到 defaults.ts，移除孤儿 type-only 导出。CLI：Logger 输出改 stderr、安全错误统一 CliError、引入 diff 库替代逐行比较、路径匹配精度修复。
* **ui:** DialogEnhanced 提取至 useDialogEnhanced composable 并修复 data-attribute 旧模式 ([70e4521](https://github.com/lidaixingchen/brutxui-vue3/commit/70e45214822f0abadc341be3885c4c2205cfc443))
* **ui:** Descriptions 改用 InjectionKey<Ref<T>> 类型安全模式，移除 jsdom 零使用依赖 ([55c7d2a](https://github.com/lidaixingchen/brutxui-vue3/commit/55c7d2a3b530738849d099b498951b440526cb0c))
* **upload:** 修复单选模式下无效文件清空已有文件的 bug，补齐 useUpload/Button/UploadCard 测试 ([d35ef57](https://github.com/lidaixingchen/brutxui-vue3/commit/d35ef5720542070e102e4aac7102de86c577a9f7))
* **ui:** 删除 component-preview 死代码（541 行）并清理 typedoc 排除项 ([89d8376](https://github.com/lidaixingchen/brutxui-vue3/commit/89d8376fe96d378dbf0fc14c695ec3c461612b6e))
* 清理过期技术文档与组件样式微调 ([57afdfc](https://github.com/lidaixingchen/brutxui-vue3/commit/57afdfcfd815442f30382301d79452982989cdb1))

### 🐛 Bug Fixes

* **cli:** 修复 Windows 集成测试因 pnpm 短/长路径别名导致的失败 ([16892ce](https://github.com/lidaixingchen/brutxui-vue3/commit/16892ceace1e50a9f9a7c84a0744d21724d7d65e))
* **cli:** 修复 10 个 bug 并补齐 update/list/info/remove 测试共 76 个 ([74a2ee1](https://github.com/lidaixingchen/brutxui-vue3/commit/74a2ee17bdaced90b1842e2287d338c73547b686))
  readConfig 补 $version 修复 checkConfigVersion 死循环；resolveComponentFilePath 前缀匹配精度修复；新增 migrateConfig 链式版本迁移和 verifyWrittenPath TOCTOU 防御。
* **ui:** 修复 12 个逻辑缺陷 ([94c40fe](https://github.com/lidaixingchen/brutxui-vue3/commit/94c40fed9ce5c2608abdfabce46eaa15b2b5b7a7))
  CarouselEnhanced emblaRef 解构恢复；DialogEnhanced destroyOnClose 条件修复；Form provide 改响应式 ComputedRef；DatePicker/ColorPicker 嵌套 button 改 span[role=button]。
* **ui:** 修复 VirtualScroll 虚拟列表不渲染，改用底层 Virtualizer 类 + shallowRef 管理响应式 ([4d1ed4e](https://github.com/lidaixingchen/brutxui-vue3/commit/4d1ed4e8865f5a5389010620a5fba9a83061cb08))
* **ui,docs:** 修复日历和日期选择器硬阴影丢失与裁剪问题 ([12c7799](https://github.com/lidaixingchen/brutxui-vue3/commit/12c7799fcf9820ff2e287b15ba0b7449bd11ec84))
* **ui:** 修复 DialogEnhanced 编译与测试类型错误 ([c57c9e6](https://github.com/lidaixingchen/brutxui-vue3/commit/c57c9e660b2b54e8de2cc2aabd07868b583fb859))
* **ui:** 修复类型检查错误和未使用的引用 ([9f17572](https://github.com/lidaixingchen/brutxui-vue3/commit/9f1757253673079c1e2f4300ef29421d9b4e6386))
* **ui:** a11y 测试工具强制使用真实定时器，防止 FakeTimers 污染 ([e7b8c9b](https://github.com/lidaixingchen/brutxui-vue3/commit/e7b8c9b07a65e902c29760dc1cf788aa225f8729))
* **ui:** 优化测试配置并修复 VirtualScroll 斑马线、输入框变体样式等问题 ([559fde5](https://github.com/lidaixingchen/brutxui-vue3/commit/559fde505e7e83319d2893353a722455aee525a1))
* 修复 pnpm-lock.yaml 与根 package.json 不一致导致 CI frozen-lockfile 报错 ([706e5b9](https://github.com/lidaixingchen/brutxui-vue3/commit/706e5b99f9d82d60997ac9fdea5b025f93a32fa5))
* **docs:** 修正主页浏览组件按钮链接至组件总览页 ([35433f1](https://github.com/lidaixingchen/brutxui-vue3/commit/35433f16ed583f85b061aa5eb4bcaab72bbfb927))
* **skills:** 更新组件参考文件表格格式 ([c69c462](https://github.com/lidaixingchen/brutxui-vue3/commit/c69c4620a619798af90b2f293bad85384cc8168a))

### 📝 Documentation

* **cli:** 更新文档网站和 README 以反映全部 9 个 CLI 命令 ([9cda214](https://github.com/lidaixingchen/brutxui-vue3/commit/9cda2149e3695237424342f6665f7e04e56cf1e9))
  新增 update/list/info/remove/create 命令文档，补充 --vscode/--workspace-root/--no-cache/--fix-only 选项，新增 components.json 配置参考和版本锁定语法。
* **ui:** 添加最佳实践指南和项目模板 ([85c4f60](https://github.com/lidaixingchen/brutxui-vue3/commit/85c4f6005a518b85659ee6257b89c74ea5456923))
  新增 component-usage/performance/accessibility/styling 四份最佳实践指南，创建 Vue 项目模板和组件模板脚手架。
* 同步更新 11 个组件文档（defineExpose/errorMessage/variant 等 API 变更） ([7ee9b98](https://github.com/lidaixingchen/brutxui-vue3/commit/7ee9b9865e566cd42b3c2ff9e1c204e097aa59bb))
* **skills:** 全面更新 skills 参考文件（5 个组件 + 6 个区块参考） ([5808de1](https://github.com/lidaixingchen/brutxui-vue3/commit/5808de149cff70be7fe0ff80cddd6f27b946f775))
* 修复 CLI 文档错误并新增兼容性扫描报告 ([53cdf17](https://github.com/lidaixingchen/brutxui-vue3/commit/53cdf1731e9b2886021265c5673b31ef035d5509))
* **docs:** 重构最佳实践概览页为子指南索引 ([33ea3b6](https://github.com/lidaixingchen/brutxui-vue3/commit/33ea3b67a8ad5e12994654bec88bbb34d8c13d74))
* **docs:** 翻译同步英文版最佳实践指南及 Blocks 遗漏页面 ([3b9b93f](https://github.com/lidaixingchen/brutxui-vue3/commit/3b9b93fcb28f018e6bb52148d82c02045447a72c))
* **blocks:** 补充 footer/header/not-found 块的可访问性章节 ([988d615](https://github.com/lidaixingchen/brutxui-vue3/commit/988d615ebb3442b71216fc2dff179bf51367189b))
* 更新 TAILWIND_CLASS_UNIFICATION_PLAN、AGENTS.md、提交规范等项目文档 ([144d8d6](https://github.com/lidaixingchen/brutxui-vue3/commit/144d8d60944b618bfe89328ec6eefb3b258622a5), [a574c83](https://github.com/lidaixingchen/brutxui-vue3/commit/a574c83928a9ad58bd904a61f9e14906e630af71), [38f9f64](https://github.com/lidaixingchen/brutxui-vue3/commit/38f9f64266e34342c835501ff25c5d5a2be2d8a3), [3f3780a](https://github.com/lidaixingchen/brutxui-vue3/commit/3f3780aeeaedc5616a2d399333beefe74a5b9707), [33bc7ef](https://github.com/lidaixingchen/brutxui-vue3/commit/33bc7ef076c105335c8fdfb16d9c435b422343d1))

### 🔧 CI

* 优化 CI/CD 缓存、部署并发和视觉基线工作流 ([3d1b319](https://github.com/lidaixingchen/brutxui-vue3/commit/3d1b31938d916d1b57ccb33c4c1f9b76c7346e02))
  添加 Playwright 浏览器缓存；部署并发取消设为 true；Node 22/24 版本矩阵。

### 📦 Build

* **ui:** 更新 Vite 配置以支持 ES/CJS 多种输出格式 ([3528bfb](https://github.com/lidaixingchen/brutxui-vue3/commit/3528bfb628880cee477500c31992452314430594))
* **ui,docs:** 修复文档构建相对路径解析失败及依赖打包问题 ([145e138](https://github.com/lidaixingchen/brutxui-vue3/commit/145e13800d1458154965116f95ee703560161a2f))

### ✅ Tests

* **ui:** 优化 axe 可访问性测试性能，统一 wrapper.unmount() 清理防止 DOM 累积超时 ([e9ca296](https://github.com/lidaixingchen/brutxui-vue3/commit/e9ca29609c0f8896e9c067cd3b1fc36bcff70377))

## [0.8.2](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.8.1...v0.8.2) - 2026-06-30

### ✨ Features

* **i18n:** 实施多语言支持 - 英文 locale 配置与主题组件国际化 ([0639f0e](https://github.com/lidaixingchen/brutxui-vue3/commit/0639f0ee4d4d7e77be19b73050e3d6efa7b655a0), [d6fd00a](https://github.com/lidaixingchen/brutxui-vue3/commit/d6fd00a850333e03b99c32f62bbc78e2d836255a))
  创建 useI18n composable（22 个翻译键），国际化主题组件，完成 113 个英文文档翻译，添加 VitePress 英文 locale。

### ♻️ Code Refactoring

* **ui:** 清理技术债 - 类型安全与依赖管理 ([bc490e6](https://github.com/lidaixingchen/brutxui-vue3/commit/bc490e6efb5a1f1ded27a51acf5eb38877109804), [d1fbb4b](https://github.com/lidaixingchen/brutxui-vue3/commit/d1fbb4b5e1c7d87401a4dc51423a53db1c29ed7c))
  统一 SSR 守卫为 env.ts 工具函数；移除过时常量/依赖（postcss/tailwindcss-animate/rimraf/jsdom）；embla-carousel-vue 移至 peerDependencies；添加 .browserslistrc。
* **cli:** 清理兼容性债务，优化项目配置 ([ffe49eb](https://github.com/lidaixingchen/brutxui-vue3/commit/ffe49ebe30bfd4d7a6ca54d3999ae1694825bb85))
  定义 CliError 类统一错误处理，移除所有 process.exit()；替换 JSONC 解析器为 jsonc-parser；重构 Logger 支持依赖注入。

### 🐛 Bug Fixes

* **ui:** 修复代码审查发现的 8 个 bug ([9fc3a0a](https://github.com/lidaixingchen/brutxui-vue3/commit/9fc3a0ab9ecb6a9c1e8c3c7d99ea58abea1dfef3))
  parseFormattedDate 无分隔符格式修复；useToast fallback 作用域修复；GlitchText 定时器泄漏修复；DataTable deep watch 移除。
* **ui:** 修复类型安全与兼容性问题 ([2ed7cfe](https://github.com/lidaixingchen/brutxui-vue3/commit/2ed7cfe98dd68d5688f59615375a2fda31481787), [fa496bd](https://github.com/lidaixingchen/brutxui-vue3/commit/fa496bd5b39504edb6569f1224fcd5e89cb7e09b), [2d340e3](https://github.com/lidaixingchen/brutxui-vue3/commit/2d340e3457c381eb7506a282f4da92ef73b40c5e))
  ESLint no-explicit-any 提升为 error；VirtualScroll 参数非响应式修复；多组件添加 SSR 安全守卫；DatePicker 系列添加 v-model:open 受控模式。
* **ci:** 修复 vue-tsc 类型检查失败及 VitePress 死链 ([cb52c57](https://github.com/lidaixingchen/brutxui-vue3/commit/cb52c5777e342f4824390e3a32748937188bc328))
* **cli:** 兼容源码与构建产物的 styles 路径解析 ([1fdb15b](https://github.com/lidaixingchen/brutxui-vue3/commit/1fdb15b364b9a6c212b5ab29f223b3ba763c7d44))
* **docs:** 修复文档格式与国际化问题（blocks 安装方式、Props 表格列名、locales 配置位置） ([479fb71](https://github.com/lidaixingchen/brutxui-vue3/commit/479fb71a2514f4589ff447a2c3dc50a66dec5eeb), [4d9c233](https://github.com/lidaixingchen/brutxui-vue3/commit/4d9c233f7afed417639b1086c0879c2cafca9748), [b45beb6](https://github.com/lidaixingchen/brutxui-vue3/commit/b45beb67c2c762b8c8a90170933a940d5b1022b2))

### 📝 Documentation

* **docs:** 全面翻新组件与区块文档（101 个） ([397f288](https://github.com/lidaixingchen/brutxui-vue3/commit/397f2888612dca71dc30ec2316090d53198cb465), [524bd88](https://github.com/lidaixingchen/brutxui-vue3/commit/524bd88491bb25cf66d72181754208521b4d84f5), [3a189bf](https://github.com/lidaixingchen/brutxui-vue3/commit/3a189bf01a5cf814d044f67c49fdbfecca785bf4))
  统一章节顺序、名称中文化、表格格式标准化；对照源码更新 64 个组件 API 描述。
* **docs:** 文档网站中文化改造及 VitePress 升级至 1.6.4 ([14ddf22](https://github.com/lidaixingchen/brutxui-vue3/commit/14ddf225c863ca9887012ecebcbd3dffca84e8ca), [469f18b](https://github.com/lidaixingchen/brutxui-vue3/commit/469f18b93f38e979f687af1eafe002cdc3080625))
  消除英文残留；404 使用自定义组件；新增 FAQ/CHANGELOG/贡献指南页面。
* **docs:** 为 12 个复杂组件添加常见问题章节 ([90fc5af](https://github.com/lidaixingchen/brutxui-vue3/commit/90fc5af1db5d52baf5fd8aed2d89ab75c05ff4f3))
* **docs:** 删除无用文档章节（10 个组件样式定制、kbd 常见问题等冗余内容） ([c689651](https://github.com/lidaixingchen/brutxui-vue3/commit/c689651533a974156840fde958f2b475ea875cd4))

### 📦 Build

* **registry:** 重建全部组件注册表索引，同步源码变更
* **ui,docs:** 技术栈优化与子路径导出扩展 ([4fab9bf](https://github.com/lidaixingchen/brutxui-vue3/commit/4fab9bf9e1bf5c68f1d489c3049d842cde3d832a))
  brutalism-plugin 转 ESM；5 个重组件改 defineAsyncComponent；@tailwindcss/vite 替代 postcss；新增 10 个高频子路径导出。

## [0.8.1](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.8.0...v0.8.1) - 2026-06-30

### ♻️ Code Refactoring

* **ui:** 全组件兼容性审查与清理（12 类约 96 处 + 补充 5 类 30 处） ([087164a](https://github.com/lidaixingchen/brutxui-vue3/commit/087164a3a8205c37db4c9a7c72bd5cad03f791fb), [af394d9](https://github.com/lidaixingchen/brutxui-vue3/commit/af394d921a68a6a1f0703d6ad77334577ac2f8b9))
  移除 defaultValue 双模式兼容写法；统一 emit 为 kebab-case；清除 CVA 空变体值；冗余类型断言改 instanceof 守卫；硬编码魔法值提取为命名常量；新建 modal-variants/validation 等共享模块。
* **ui:** 执行组件深化拓展方案 8 批全量改动 ([1a0cd7d](https://github.com/lidaixingchen/brutxui-vue3/commit/1a0cd7d8ac9cfba89eade1f643cef451e9175d45))
  无障碍：Switch/Checkbox/Toggle 等新增 ariaLabel；Badge/Alert/Dialog/Tabs 功能增强；defineExpose 暴露方法；新增 useCarousel/useDatePicker/useColorPicker/useAnimation/useFormFieldValidation。
* **date-picker:** 调整年月选择器网格布局为 4 列，新增 TooltipProvider 组件 ([05d7575](https://github.com/lidaixingchen/brutxui-vue3/commit/05d75756443187006cf5d118285634400a5ee9b0))

### 🐛 Bug Fixes

* **ui:** 修复 5 个组件 CI 测试失败（ChatBubble/Marquee/Stepper/VirtualScroll/KanbanBoard） ([93e0c6b](https://github.com/lidaixingchen/brutxui-vue3/commit/93e0c6bfa50d8f76c916412718febfcd497b2f55))
* **ui,docs:** 修复 Tabs 垂直溢出、Pagination/KanbanBoard demo 溢出、BeforeAfter 容器比例 ([6f49c2b](https://github.com/lidaixingchen/brutxui-vue3/commit/6f49c2b122023838e6e5fd4d6990ee657144978c))
* **ui:** 修复 Slider/KanbanBoard/ChatBubble/BeforeAfter/Card3D/Separator/TreeView 等 14 个组件问题 ([7b75730](https://github.com/lidaixingchen/brutxui-vue3/commit/7b75730e3181ad30f503da24dfe8d2bde7dd083b))

### 📝 Documentation

* 更新全组件文档，补充 SearchWidget/FeedbackForm/Brutal/Layout/Form 等组件 API ([165e85e](https://github.com/lidaixingchen/brutxui-vue3/commit/165e85eee2ce3ca6d9f3339450fc0aae1e0b1164))

## [0.8.0](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.8...v0.8.0) - 2026-06-29

### ✨ Features

* 多组件属性增强：新增 iconSize CVA 系统（DataTable/Card/Form 等）；Stepper 新增 size/variant/clickable + 键盘导航；BeforeAfter 新增 orientation；Card3D 新增 clickable；CodeBlock 新增 maxLines；ChatBubble 新增 color/size 变体
* TreeView 新增 checkbox 多选模式（级联选择/半选/Space 键）；KanbanBoard 新增列拖拽排序；Combobox 新增 loading + creative 创建模式
* 新增 4 个 CVA 变体文件：alert-dialog-variants/scroll-area-variants/combobox-variants/form-wizard-variants

### 🐛 Bug Fixes

* **cli:** 强化 5 处安全防护：isSafePath 添加符号链接解析和磁盘根目录检查；resolveAliasPath/readConfig/resolveComponentFilePath 内置路径遍历防护
* **registry:** 补充 6 个文件声明和 16 个组件的 useLocale composable 声明；重建全部 98 个组件 JSON；修复 build-registry.ts 变量名遮蔽
* **可访问性**：UploadCard/TreeSelectNode/DataTable/Stepper 添加键盘导航；TypewriterText 移除 aria-live="polite"；ToastContainer 改 aria-live="off"
* **TypeScript**：消除 mergeLocale 双重断言；DataTableFilterState 收窄类型；registryIndex 使用 RegistryIndex 接口；catch 块 any→unknown
* **Vue 组件**：DataTable filter/export 事件修复；Form validationSchema 改 computed；Counter 竞态修复；Calendar 缓存键碰撞修复

### ✅ Tests

* 补充 14 个组件功能测试（tabs/dialog/form/accordion 等），新增 color-mode-switcher 测试，重写 tooltip 测试，总计 2058 个测试通过

## [0.7.8](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.7...v0.7.8) - 2026-06-28

### ✨ Features

* **DataTable:** 新增 useDataTableSort/useDataTableFilter/useDataTableSelection/useDataTablePagination 四个组合式函数
* **GlitchButton/GlitchText:** 新增 direction 属性，支持横向/纵向/双向撕裂效果

### ♻️ Code Refactoring

* 统一使用内置 Button/Badge 组件替换原生元素（颜色模式切换器、博客卡片、认证卡片、Toast、日期选择器等）

## [0.7.7](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.6...v0.7.7) - 2026-06-28

### ✨ Features

* 新增打字机效果、噪点背景、树形选择器组件文档与示例

### ♻️ Code Refactoring

* 重构颜色模式切换器（emoji→lucide 图标）；优化 DataTable/ColorPicker/Select 组件实现

### 🐛 Bug Fixes

* 修复 Checkbox、Spinner、DatePicker 等组件样式与逻辑问题

## [0.7.6](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.5...v0.7.6) - 2026-06-28

### ✨ Features

* Form 新增 setError 方法；AuthCard 添加密码可见性切换和表单校验；DialogEnhanced 添加宽高限制；TreeSelectNode 添加完整键盘交互；FormWizard 添加导航拦截事件；UploadCard 添加文件大小过滤；ScratchCard 新增重置逻辑

### ♻️ Code Refactoring

* 重构 ColorPicker 清空逻辑、SettingsPage 插槽结构、DataTable 单元格渲染；优化 CommandInput 无障碍属性、NoiseBackground ID 生成

### 🐛 Bug Fixes

* 修复 Toast 重复触发动画、ColorPicker 清空逻辑、日期选择器变更事件、Slider 空值判断、GallerySection/ActivityLogPage 空状态

## [0.7.5](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.4...v0.7.5) - 2026-06-27

### ✨ Features

* **GlitchButton:** 故障效果按钮，支持 hover/click/autoplay/none 触发模式和 slow/medium/fast 动画速度
* **VirtualScroll:** 虚拟滚动组件，封装 @tanstack/vue-virtual，支持多种尺寸和列表项样式变体
* Input/Textarea 添加 ARIA 无障碍属性（ariaLabel/ariaLabelledby/ariaDescribedby/ariaInvalid/ariaRequired）

## [0.7.4](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.3...v0.7.4) - 2026-06-27

### ✨ Features

* **TreeSelect:** 树形下拉选择器，支持单选/多选/搜索过滤/任意深度树结构
* **TypewriterText:** 打字机效果文本，支持循环播放/光标闪烁/尺寸变体，兼容 prefers-reduced-motion
* **NoiseBackground:** 噪点纹理背景，基于 SVG feTurbulence 滤镜，支持动画和 SSR

## [0.7.3](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.2...v0.7.3) - 2026-06-27

### ♻️ Code Refactoring

* **registry:** 重构注册表实现，新增 component-files.ts 集中映射、validate-registry.ts 校验脚本，简化 build-registry.ts 构建逻辑

## [0.7.2](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.1...v0.7.2) - 2026-06-26

### ✨ Features

* **ColorPicker:** 支持 HEX/RGB/HSL 色彩空间转换、预设色板与历史记录
* **DatePicker:** 支持日期/日期范围/日期时间/周/月/年多种选择模式

### ♻️ Code Refactoring

* Calendar 样式隔离改用 brutx-calendar 类 + :global() 解决 scoped CSS 失效；优化注册表校验脚本

### 🐛 Bug Fixes

* 修复 DatePicker 系列日期居中样式、DialogEnhanced 事件监听器泄漏、DataTable 过滤后 currentPage 未重置、KanbanBoard 同列拖拽排序、ScratchCard 画布初始化判断

## [0.7.1](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.7.0...v0.7.1) - 2026-06-26

### 🐛 Bug Fixes

* **registry:** 添加 color-mode-switcher 和 data-table 组件到注册表

## [0.7.0](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.6.3...v0.7.0) - 2026-06-26

### ✨ Features

* **DataTable:** 功能丰富的数据表格，支持排序、筛选、分页
* **ColorModeSwitcher:** 支持亮色/暗色/系统模式切换
* **暖色主题系统：** 新增 Warm 主题配色方案；CSS 动画预设（淡入、滑入、缩放等）
* **主题实验室：** 交互式主题预览和调试工具
* **CLI:** 新增 doctor 命令（检查项目配置）和 diff 命令（对比组件版本差异）

### ♻️ Code Refactoring

* 引入语义化前景色变量，优化 Mono/暗色模式可读性；合并定价组件实现；全面优化 ESLint 配置消除警告

### 🐛 Bug Fixes

* 修复 40+ 组件控制/非受控模式冲突；Input CJK 输入法组合事件处理；CodeBlock 快速切换语言异步竞态；ScratchCard 揭示后画布交互阻塞；CLI Windows shell 兼容性

### ✅ Tests

* 添加视觉回归测试覆盖和 CLI 注册表安装回归测试；修复优化多个组件单元测试

## [0.6.3](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.5.7...v0.6.3) - 2026-06-06

### 🐛 Bug Fixes

* 修复 40+ 个组件综合问题：Checkbox/Switch/Toggle 受控/非受控模式冲突；Input IME 组合事件处理；CodeBlock 异步竞态；ScratchCard Canvas 交互阻塞；KanbanBoard 拖拽闪烁；AuthCard 事件绑定缺失。无障碍改进：Combobox/Slider aria-label、Skeleton aria-busy、TreeView 键盘导航。暴露缺失属性：SelectTrigger disabled、RadioGroup name/disabled/orientation。其他：CookieConsent v-model 控制、Calendar scoped 样式、Pagination 边界验证、ChatBubble 首字母计算、Form 响应性修复。

## [0.5.7] - 2026-06-03

### 早期版本

详见 git 历史记录。