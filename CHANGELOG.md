# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.0...HEAD)

## [0.11.0](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.10.2...v0.11.0) - 2026-08-19

### ⚠️ Breaking Changes

* **ui:** 焦点体系回退为 ring ([41e13b3](https://github.com/lidaixingchen/brutxui-vue3/commit/41e13b34ff4d1107dd50b3abe39dc2d759a969ef))
* **ui:** 按压反馈改盖影语义并移除 pressed 令牌 ([a46a850](https://github.com/lidaixingchen/brutxui-vue3/commit/a46a850cb2f941a2ef3ee3eff0dda46b93fee2c2))

### ✨ Features

* **scripts:** 引入 ScaffoldEngine 原子事务与 AST 精准切片导出注入 (#35) ([f5c00b0](https://github.com/lidaixingchen/brutxui-vue3/commit/f5c00b00be4c7a7a512e086d7f31ad43e813da54))
* **cli:** 封装 AuditLogStorage 深模块并聚合至 ProjectContext (#33) ([ba868c1](https://github.com/lidaixingchen/brutxui-vue3/commit/ba868c17c7e38d36e765b9ec0e7c2b08527b1a8e))
* **cli:** 封装 CacheStorage 持久化深模块与零 IO 缓存淘汰 (#32) ([48e89bd](https://github.com/lidaixingchen/brutxui-vue3/commit/48e89bd00ee385e03ba41f51fe266b6f2bf8785c))
* **shared:** 下沉通用 VFS 基础设施与测试沙箱 (#31) ([9248fc5](https://github.com/lidaixingchen/brutxui-vue3/commit/9248fc509031aaaa6a29e4e875fd662979f3bed8))
* **cli:** refactor doctor command and export apis ([37c1326](https://github.com/lidaixingchen/brutxui-vue3/commit/37c1326cf4eac9e7ed259ee55b88fd649bedde47))
* **cli:** add project sbom service ([d863725](https://github.com/lidaixingchen/brutxui-vue3/commit/d863725e3998752cb369040a5a8f80991dce71db))
* **cli:** add integrity rules and offline support ([1483595](https://github.com/lidaixingchen/brutxui-vue3/commit/1483595f10896d27258c509cf2013d62a35ff007))
* **cli:** add tailwind and structure rules ([22777f7](https://github.com/lidaixingchen/brutxui-vue3/commit/22777f73e172910a920409a2fcc64ce03c1c076f))
* **cli:** add config rules and transactional repair ([0979459](https://github.com/lidaixingchen/brutxui-vue3/commit/0979459054c23820608e32bf5e602a4dac025d5d))
* **cli:** add DiagnosticEngine core and env rules ([0719a71](https://github.com/lidaixingchen/brutxui-vue3/commit/0719a710e3e841ac9c2129300ac40467bc489276))
* **registry:** 实现 SBOM/签名发射器与落盘 (#21) ([535d1fc](https://github.com/lidaixingchen/brutxui-vue3/commit/535d1fc7f3c84a1ab6ddb670229622b0f92158d5))
* **registry:** 组装纯内存 RegistryCompiler 管道并打通全链路零 IO 测试 (#20) ([b84f28c](https://github.com/lidaixingchen/brutxui-vue3/commit/b84f28c2279e67ca72197b67720c408785d97743))
* **registry:** 实现传递依赖闭包解析与增量哈希缓存管理器 (#19) ([2e1b8ba](https://github.com/lidaixingchen/brutxui-vue3/commit/2e1b8ba82b918879b4e06aeb57d7505cc6e1eb5d))
* **registry:** 实现基于 AST 精确定位的代码切片重写与依赖提取器 (#18) ([7fd7e23](https://github.com/lidaixingchen/brutxui-vue3/commit/7fd7e23ca4e6dfd8b8e8309bc3cee8cbd0019913))
* **registry:** 建立 FileSystemAdapter 双适配器与跨平台 VFS Seam (#17) ([06a078e](https://github.com/lidaixingchen/brutxui-vue3/commit/06a078e082819d2e61ac0a84ddcbc61484ec7622))
* **registry:** 增强 validate-registry 门禁以强制校验文档 Demo 组件覆盖率 ([c0b00b9](https://github.com/lidaixingchen/brutxui-vue3/commit/c0b00b93cb7e502522f3367507cf0c9849713817))
* **cli:** 实现 ProjectContext 聚合根与统一路径解析引擎 (#13) ([88c5c09](https://github.com/lidaixingchen/brutxui-vue3/commit/88c5c09364e9807c9e28c1b988300d7f99f3a0e9))
* **cli:** 实现虚拟文件系统抽象契约与双适配器 (#11) ([e06b8ff](https://github.com/lidaixingchen/brutxui-vue3/commit/e06b8ffd317092dcc694c3622bf69c8bed640291))
* **ui:** Composables 现代化与全量门禁对齐 (#9) ([1a0f92d](https://github.com/lidaixingchen/brutxui-vue3/commit/1a0f92d87125eae3994e04ffdf529a3a27feff39))
* **ui:** 独立 MessageBox 领域组件与 Functional / i18n 体系 (#7) ([7cafb49](https://github.com/lidaixingchen/brutxui-vue3/commit/7cafb49951ad5c39a4d1215dc0c969c99d6e280f))
* **ui:** 实现命令式宿主深模块与活动栈调度器 (#6) ([f2948a0](https://github.com/lidaixingchen/brutxui-vue3/commit/f2948a0ebc82ad62912878e9dc04958aa1d0a9cc))
* **tokens:** 下沉设计令牌单一信源并接入多端样式生成管道 ([879776e](https://github.com/lidaixingchen/brutxui-vue3/commit/879776ef987eaf2c99b6f3e42d27da219234689c))
* **menu:** implement roving focus and keyboard nav ([ad1f30f](https://github.com/lidaixingchen/brutxui-vue3/commit/ad1f30fe2291e440fa0e25046d89c5dc84ee112d))
* **theme:** 统一主题预设至 design-tokens 并自动生成 CSS 变量 ([97571fa](https://github.com/lidaixingchen/brutxui-vue3/commit/97571faf401831f4b1ee82ae0e51b69adb258ab5))
* **ui:** 收敛 Tabs 尺寸并扩展 Alert/Badge/Card 的 Subtle 变体 ([3b43ba0](https://github.com/lidaixingchen/brutxui-vue3/commit/3b43ba048efcfc25c420aeed7df96f365ee3842e))
* **theme:** 支持 Subtle 浅色衍生令牌与机械弹性动效 ([3a97dcf](https://github.com/lidaixingchen/brutxui-vue3/commit/3a97dcf10332eada57c1c4dc0b7cd9611e7b02fe))

### ♻️ Code Refactoring

* **cli:** 全面消除双轨适配器与直接磁盘 I/O 穿透 (#36) ([4fe46b4](https://github.com/lidaixingchen/brutxui-vue3/commit/4fe46b4e77cef57d3152f16b7c678f59c3600ecb))
* **ui:** 解耦 TokenStyleCompiler 纯计算编译器与薄 IO 发射器 (#34) ([5f7a47e](https://github.com/lidaixingchen/brutxui-vue3/commit/5f7a47e9ab3108e06218cfb42608776f3d35fab2))
* **registry:** 优化 SBOM 排序函数可读性 ([6475a11](https://github.com/lidaixingchen/brutxui-vue3/commit/6475a11bd60c3f852dd1f2bde7281d3a9d3e1c31))
* **registry:** 重构运行时调度与薄入口兼容层 (#22) ([04655d5](https://github.com/lidaixingchen/brutxui-vue3/commit/04655d59406f5bf01c6c51df2de7faa7d7d9bc8a))
* **ui:** 提取额度报错复用并支持省略整数位字号小数 ([c017f83](https://github.com/lidaixingchen/brutxui-vue3/commit/c017f833215973adfeccfe12024110d307c84d3f))
* **cli:** 破坏式统一 Services 签名至 Context (#15) ([fb81e30](https://github.com/lidaixingchen/brutxui-vue3/commit/fb81e30679a404f8eef2e93d8c8b01e5268fb109))
* **cli:** 重构核心 Services 接入 ProjectContext (#14) ([5ede1e8](https://github.com/lidaixingchen/brutxui-vue3/commit/5ede1e87971d855ae53056f769073c95849c70ec))
* **cli:** 改造 FileTransaction 内建安全防御并将底层辅助模块接入 VFS (#12) ([13089a4](https://github.com/lidaixingchen/brutxui-vue3/commit/13089a481ff42580c5543ff3610dee901c54d696))
* **ui:** Dialog 纯粹化与去耦合重构 (#8) ([b92739d](https://github.com/lidaixingchen/brutxui-vue3/commit/b92739db51d1da2478b19d42b03c8bd0a247b3c2))
* **scroll-area:** unify thickness and add viewportClass ([3b184c1](https://github.com/lidaixingchen/brutxui-vue3/commit/3b184c11759060cd0aeac0d9fdf4ca14053a6895))
* **docs:** 使用 import.meta.glob 批量自动注册 demo 组件 ([5211fba](https://github.com/lidaixingchen/brutxui-vue3/commit/5211fba3bbc6ca97b4b576517c93452e6b9ead76))
* **shared:** 归一化组件元数据为单一信源 ([0eb29ae](https://github.com/lidaixingchen/brutxui-vue3/commit/0eb29aedb7f6fc332370546ef02eb3b15c4ccc68))
* **build:** 收敛构建与扫描脚本至单一事实来源并增强门禁修复 ([118b1c7](https://github.com/lidaixingchen/brutxui-vue3/commit/118b1c76d6dcdf30673a6da72f628004ddd7bb09))
* **ui:** 收敛浮动表面类串并规范组件默认常量 ([34aec2c](https://github.com/lidaixingchen/brutxui-vue3/commit/34aec2cfad6d6d546b83c51694fbe9fcd77fd860))
* **ui:** unify component selected state styles ([e91f946](https://github.com/lidaixingchen/brutxui-vue3/commit/e91f94602a03293d2d4eeadb78a4b43416b826cb))
* **ui:** 废除 useAnimation 组合式并清理公共工具函数死导出 ([f4d299f](https://github.com/lidaixingchen/brutxui-vue3/commit/f4d299f4b53e5aa10c9a4eb49e094329d3ed884f))
* **theme:** 优化预设接口派生与描述注释并规范化小写 hex ([5d410b7](https://github.com/lidaixingchen/brutxui-vue3/commit/5d410b741f076ef9a2ac9b9b9b7cc5c818df477d))
* **theme:** 移除废弃 JS 主题系统并增加 WCAG AA 对比度单测门禁 ([0afa652](https://github.com/lidaixingchen/brutxui-vue3/commit/0afa6520b5d09fa4a8502d3db04e637bff91bf14))
* **scripts:** 贯彻寂静哲学与高信噪比原则重构构建与检查脚本 ([01b4b29](https://github.com/lidaixingchen/brutxui-vue3/commit/01b4b29bdbf253df17e3fafaa411a3e4d8436e6e))
* **ui:** 抽离 DashboardShell 独立 CVA 变体 ([17352fd](https://github.com/lidaixingchen/brutxui-vue3/commit/17352fd5b3706d1d078727542690952c1d3c6034))
* **ui:** 增加性能日志配置项并消除默认控制台输出 ([009fa4b](https://github.com/lidaixingchen/brutxui-vue3/commit/009fa4ba65f0d21fabe2c81bd6f18a0a1ac0accf))
* **ui:** 解耦共享交互变体机制注释与文档镜像 ([7f3b900](https://github.com/lidaixingchen/brutxui-vue3/commit/7f3b900d35caec7341ea541fca1f3904045adc23))
* **theme:** 阴影工具类组装化重构 ([47ae9b6](https://github.com/lidaixingchen/brutxui-vue3/commit/47ae9b6d7edabd98e05accf529257b8dc7ceea7f))

### 🐛 Bug Fixes

* **shared:** 完善 MemoryFileSystemAdapter rename 目标目录非空与类型冲突校验 ([0a61698](https://github.com/lidaixingchen/brutxui-vue3/commit/0a61698afe67945d5557dcc1665dda1d17b17f9d))
* **shared:** 修正 MemoryFileSystemAdapter remove 符号链接仅删除链接节点的语义 ([7951a9b](https://github.com/lidaixingchen/brutxui-vue3/commit/7951a9b8be9ede2ed37ac3b441cc67c85121056b))
* **arch:** 修复 open-code-review 审查意见并强化 VFS 原子性与异常契约 ([4a410ad](https://github.com/lidaixingchen/brutxui-vue3/commit/4a410ad9b30b66a0ac429f5219ab68effd0f0377))
* **cli:** address open-code-review findings ([45a0837](https://github.com/lidaixingchen/brutxui-vue3/commit/45a08373856f9c5f2091dcf8506fc9569573b3ea))
* **registry:** 增强 SBOM 确定性排序与构建健壮性 ([bd444a7](https://github.com/lidaixingchen/brutxui-vue3/commit/bd444a7c40e118d42b3b88a3453b70ff87fcdd60))
* **registry:** 修复 OCR 审查问题与性能优化 ([ebff36e](https://github.com/lidaixingchen/brutxui-vue3/commit/ebff36e00df457cf874b2299e0078320c0cf8ec1))
* **scroll-area:** use static class literals ([8788863](https://github.com/lidaixingchen/brutxui-vue3/commit/87888634b054e45e87cec5652e1baa8c3a584115))
* **registry:** 移除已失效的 message-box 临时文档别名映射 ([a11cc38](https://github.com/lidaixingchen/brutxui-vue3/commit/a11cc38f3623df2b028d7f67d3c6bff9fca3dcce))
* **registry:** 补充 message-box 文档别名映射 ([47a1c3f](https://github.com/lidaixingchen/brutxui-vue3/commit/47a1c3fe8f6fa6b48f924c9043f27e3f0e08ee4d))
* 修复 CI 跨平台路径解析、子路径上下文与 UI 校验 ([cfe4571](https://github.com/lidaixingchen/brutxui-vue3/commit/cfe45717e111d24cdb4fdfb917dc11495cc84daa))
* **cli:** 修复正则回溯漏洞并覆盖安全依赖版本 ([d17cf1a](https://github.com/lidaixingchen/brutxui-vue3/commit/d17cf1ac342a341cb113c7256aa389f076b9f5f7))
* **ui:** 修复加载插槽重复、字号动态换算与额度预检 ([abb799c](https://github.com/lidaixingchen/brutxui-vue3/commit/abb799ca142a686723590dcb15936b9278b46827))
* **ui:** 采纳 OCR 审查建议修复状态保留、滚动监听与字号换算 ([b27b1be](https://github.com/lidaixingchen/brutxui-vue3/commit/b27b1be8206894bce1e2db90cb422e9357039488))
* **ui:** clean up variant exports and toast state refs ([f3c2997](https://github.com/lidaixingchen/brutxui-vue3/commit/f3c299722802e46943ba7e7f970fb0c3d5f60363))
* **ui:** polish interaction variants & tour canvas ([6a552b1](https://github.com/lidaixingchen/brutxui-vue3/commit/6a552b16ccb9de37ec3119715154eda88c619e7d))
* **ui:** resolve OCR findings across T components ([12a3087](https://github.com/lidaixingchen/brutxui-vue3/commit/12a30872d0b5e6b24a6c0c4c48a6db0e0ce59ed9))
* **ui:** refine slot-utils & skeleton a11y ([406d931](https://github.com/lidaixingchen/brutxui-vue3/commit/406d931c05088b46021904643560cce9c715bcfb))
* **ui:** resolve OCR findings across S components ([3185374](https://github.com/lidaixingchen/brutxui-vue3/commit/3185374cc57bc1111e6f6234fe549848e2079173))
* **ui:** 完善 MessageBox 选项合并对称性与正则克隆安全 ([ed4c26c](https://github.com/lidaixingchen/brutxui-vue3/commit/ed4c26c385ebe23789663d74d1ce57fbbf60045f))
* **ui,cli:** 采纳 OCR 审查建议修复令牌类名与 ESC 兑现时序 ([2b8d821](https://github.com/lidaixingchen/brutxui-vue3/commit/2b8d82125303507414f322ed48082520e8bf541f))
* **cli:** 修复 OCR 审查发现的降级配置与分桶缓存 (#15) ([a7777c8](https://github.com/lidaixingchen/brutxui-vue3/commit/a7777c80bb6850724e1b1a28385628d3da234e7d))
* **cli:** 采纳 OCR 审查优化参数守卫与损坏配置容错 (#15) ([fb7dd68](https://github.com/lidaixingchen/brutxui-vue3/commit/fb7dd68eca76518448b1f6431bea48d30461f567))
* **ui:** 修复 watermark SVG属性转义、画布异常降级与字号解析 ([c6b8557](https://github.com/lidaixingchen/brutxui-vue3/commit/c6b8557d8c512e1239e64716f38c3bd892540f6e))
* **ui:** 修复 virtual-scroll 类型收窄、动态测量与粗野主义边框 ([e29fa61](https://github.com/lidaixingchen/brutxui-vue3/commit/e29fa619537e010ee8aa12c8d80668b7f27346e5))
* **ui:** 修复 upload 组件边界与可访问性缺陷 ([0ad1305](https://github.com/lidaixingchen/brutxui-vue3/commit/0ad13051a199bced87b1aaf74299fe7cec38db62))
* **ui:** resolve typewriter-text issues ([8230fde](https://github.com/lidaixingchen/brutxui-vue3/commit/8230fde8fa34925a3b076109e0be26f34ebc3edf))
* **ui:** resolve tree-view component issues ([355f74c](https://github.com/lidaixingchen/brutxui-vue3/commit/355f74c4b3c416cfbe4583ed5c9ebcc9a8b98340))
* **ui:** resolve tree-select component issues ([9519838](https://github.com/lidaixingchen/brutxui-vue3/commit/9519838c6cdae058c97ffb284e4019cc72d25799))
* **ui:** resolve transfer component issues ([0a2d643](https://github.com/lidaixingchen/brutxui-vue3/commit/0a2d643685f8648ff09671849270e34681e50079))
* **ui:** resolve tour component issues ([dc3caa9](https://github.com/lidaixingchen/brutxui-vue3/commit/dc3caa94511d819cce7bf40dee671c01e4d01936))
* **ui:** resolve tooltip component issues ([bea0796](https://github.com/lidaixingchen/brutxui-vue3/commit/bea0796af0f408b5662a6d6a5dd0daa12058a9d3))
* **ui:** resolve toggle component issues ([7958692](https://github.com/lidaixingchen/brutxui-vue3/commit/7958692ef3e1e6f3227b7771094d6dd8e5ec91ed))
* **ui:** resolve toggle-group issues ([0238053](https://github.com/lidaixingchen/brutxui-vue3/commit/0238053f23d1b0bbee18fc3ec67e36ae54d43a84))
* **ui:** resolve toast component issues ([f87455c](https://github.com/lidaixingchen/brutxui-vue3/commit/f87455ceb066a04333a948adde37554c368afea8))
* **ui:** resolve timeline component issues ([0a1a011](https://github.com/lidaixingchen/brutxui-vue3/commit/0a1a011cbdc8578eabcbb3cfc3051df64e5f136e))
* **ui:** resolve textarea component issues ([75d5299](https://github.com/lidaixingchen/brutxui-vue3/commit/75d52996c3f3dfa3516ae20fe4a6f7df710e5880))
* **ui:** resolve tags-input component issues ([3f3d8b3](https://github.com/lidaixingchen/brutxui-vue3/commit/3f3d8b3cba5a3e61b99dc9b0beb675be89413270))
* **ui:** resolve tabs component issues ([d3a56d9](https://github.com/lidaixingchen/brutxui-vue3/commit/d3a56d904d25a0277fe7fa92fcab9c03b45f1a79))
* **ui:** resolve table component issues ([4a4a150](https://github.com/lidaixingchen/brutxui-vue3/commit/4a4a150691a6f0f20683606758d13229058ae60b))
* **switch:** support defaultChecked & fallback a11y ([3f98131](https://github.com/lidaixingchen/brutxui-vue3/commit/3f9813134362f829ba57f3e5bee46affb8dac0be))
* **stepper:** add button disabled & reuse types ([7d5538d](https://github.com/lidaixingchen/brutxui-vue3/commit/7d5538d69c5540040ea378cfb5e27b3c50ef6435))
* **spinner:** sanitize color classes & fallback label ([0380a30](https://github.com/lidaixingchen/brutxui-vue3/commit/0380a307e0ccd62dd2f9a3a9af059d822027f105))
* **slider:** fix disabled styling, clamp marks & a11y ([3880fdf](https://github.com/lidaixingchen/brutxui-vue3/commit/3880fdfbde73bd5b02048a232eaf47f7bd9b21b5))
* **sketchy-chart:** fix yTicks keys and pie tolerance ([a22da55](https://github.com/lidaixingchen/brutxui-vue3/commit/a22da553660f366d4b45df77468c677ffce0a883))
* **skeleton:** normalize width and sanitize bounds ([a0bf4f6](https://github.com/lidaixingchen/brutxui-vue3/commit/a0bf4f6954846e5c774905cb7838760abc03420d))
* **sheet:** forward attrs and handle empty title/desc ([c0cc8ac](https://github.com/lidaixingchen/brutxui-vue3/commit/c0cc8ac8096ed3e19287a176caf2c64f46422e7c))
* **separator:** fix slot content check and ARIA attrs ([c305150](https://github.com/lidaixingchen/brutxui-vue3/commit/c3051504fb7d6711c01ac0c1b3651db8241ca38f))
* **select:** improve a11y, disabled styles and token ([d076528](https://github.com/lidaixingchen/brutxui-vue3/commit/d076528d84a4c03cc8b50c8e7b1d7a284c7879c7))
* **scratch-card:** fix canvas transform and stripe bounds on reset ([3f11184](https://github.com/lidaixingchen/brutxui-vue3/commit/3f11184f673fbfdabdfe7de8cf00fe39c14330cd))
* **ui:** 完善焦点迁移缓存、数值钳制与价格标签优先级 ([959259e](https://github.com/lidaixingchen/brutxui-vue3/commit/959259e230cfd88dbc4f6c0fe3436393c91acd96))
* **ui:** 修复 OCR 审查指出的动画类、计算高度与状态迁移 ([ff28c9f](https://github.com/lidaixingchen/brutxui-vue3/commit/ff28c9f14a9a99238093a8f25641c627b7e8d42c))
* **ui:** 修复 Result 装饰图标无障碍与标题渲染边界 ([0c18d8f](https://github.com/lidaixingchen/brutxui-vue3/commit/0c18d8f3d38a32abc0fcf16d2ab98eecf4ad47cb))
* **ui:** 修复 Rate 键盘导航默认行为与动态无障碍属性 ([fa543ca](https://github.com/lidaixingchen/brutxui-vue3/commit/fa543ca77d6f1eb0bd4e27bc870a832dc074f7c7))
* **ui:** 修复 RadioGroup 指示器居中与尺寸联动 ([e82775c](https://github.com/lidaixingchen/brutxui-vue3/commit/e82775c687e3ee9784af311eea4b92c106a9bc0a))
* **ui:** 修复 Progress 数值安全收敛与无障碍文本 ([f32d98c](https://github.com/lidaixingchen/brutxui-vue3/commit/f32d98cbc910a4bced471be9ffb0fb146815c088))
* **ui:** 修复 PricingSection 价格标签回退与模板作用域遮蔽 ([e71c035](https://github.com/lidaixingchen/brutxui-vue3/commit/e71c03519f77acc3341c5244030250bcbff83968))
* **ui:** 修复 Popconfirm 支持 v-model:open 受控与补齐单测 ([9ce63d2](https://github.com/lidaixingchen/brutxui-vue3/commit/9ce63d25b864bb089520543bb66c45da4a989955))
* **ui:** 修复 Pagination 禁用位移抑制与边界总页数计算 ([6604b0f](https://github.com/lidaixingchen/brutxui-vue3/commit/6604b0fafe2a60072f135491282c4b496f5373fd))
* **ui:** 修复 NumberInput 堆叠边框与属性过滤 ([8c6a4b3](https://github.com/lidaixingchen/brutxui-vue3/commit/8c6a4b32716f1e9d7366611a6193c9d3815b6f84))
* **ui:** 修复 NoiseBackground 圆角变体与动画复位 ([f1bb980](https://github.com/lidaixingchen/brutxui-vue3/commit/f1bb9801d05c8fb3812a97633fdbbed06006d407))
* **ui:** 修复 Message 类型兜底、动态 ARIA 与视口防溢出 ([4a45678](https://github.com/lidaixingchen/brutxui-vue3/commit/4a45678ff51465b2922385fbea03d2eb32672b32))
* **ui:** 修复 Menu 动态索引注册与路由异常捕获 ([c3ed4ce](https://github.com/lidaixingchen/brutxui-vue3/commit/c3ed4ce07729de8ae6f4df3095dfdb03ffa23000))
* **ui:** 修复 Marquee 悬停双轨道暂停同步与速度边界 ([fc78a90](https://github.com/lidaixingchen/brutxui-vue3/commit/fc78a902cf1cb77c34469819dcf2748a3347f685))
* **ui:** 修复焦点类型收窄、插槽兜底与滚动复位逻辑 ([de99a93](https://github.com/lidaixingchen/brutxui-vue3/commit/de99a93d64975ad7818de75a12e38aa94b5a674a))
* **ui:** 修复三轮审查的焦点闭环与插槽提取兜底问题 ([f5ff007](https://github.com/lidaixingchen/brutxui-vue3/commit/f5ff007c01114c98977eebc460f89acfcf5c4278))
* **ui:** 修复二轮审查的无障碍与状态清理问题 ([a34fcdb](https://github.com/lidaixingchen/brutxui-vue3/commit/a34fcdbe2747050e7d1531cd65ae9b4402230229))
* **form:** 修复二轮审查的 RadioNodeList 断言与跳转逻辑重复问题 ([d32360b](https://github.com/lidaixingchen/brutxui-vue3/commit/d32360b00986de12a4b6f2acc74c099caef029fd))
* **kanban:** 恢复被误覆盖的 kanban-board 测试并补键盘 card-move 用例 ([fbd465b](https://github.com/lidaixingchen/brutxui-vue3/commit/fbd465b8ac4d83243152038a0ecc1b7b6b76835b))
* **ui:** 修复 OCR 审查发现的定时器、无障碍与状态残留问题 ([5ba9073](https://github.com/lidaixingchen/brutxui-vue3/commit/5ba90734d0c2734027efb2d4db3d539812c061fa))
* **form:** 修复 OCR 审查发现的选择器回归与错误文案边界问题 ([2992d48](https://github.com/lidaixingchen/brutxui-vue3/commit/2992d481a2423f5e942853a191e6c685504ace2b))
* **loading:** 页面模式受 loading 控制、fullscreen 真正铺满视口 ([726aaed](https://github.com/lidaixingchen/brutxui-vue3/commit/726aaed512875c42b556f0e5ea5edb351a005b19))
* **label:** 移除 label 上不合规范的 aria-required ([1bcce87](https://github.com/lidaixingchen/brutxui-vue3/commit/1bcce87551bd6e31ad93d683e1342045ede10060))
* **kbd:** default 变体复用共享调色板并补充类合并边界测试 ([8c49af9](https://github.com/lidaixingchen/brutxui-vue3/commit/8c49af9ed7fb9e5c6965e358a24154a9d357c644))
* **kanban:** 键盘移动补发 card-move 并消除拖拽插入位置偏差 ([0568fe3](https://github.com/lidaixingchen/brutxui-vue3/commit/0568fe38b3c17267c6f09113c607022797779a5a))
* **infinite-scroll:** 修复禁用态定时器残留与 onLoad 异常导致加载卡死 ([e47f480](https://github.com/lidaixingchen/brutxui-vue3/commit/e47f480494aba5528b7b04d3ae076b5adbcdc455))
* **image:** 修复 fallback 变更复位、拖拽监听残留与 preview 强制关闭 ([92e7999](https://github.com/lidaixingchen/brutxui-vue3/commit/92e7999c84d813b851dad79a4ec03b9a10659916))
* **header-section:** 移动端菜单改用 DialogTrigger 并修复抽屉关闭顺序 ([283f66d](https://github.com/lidaixingchen/brutxui-vue3/commit/283f66d7558c77f25f12624f23de9f4ccdfa207a))
* **hardcore-input:** 修复事件重复发射、编程校验值不同步与抖动复位竞态 ([ef17cb9](https://github.com/lidaixingchen/brutxui-vue3/commit/ef17cb9162b7b7ae7b265f8deb063b6bef692261))
* **glitch-text:** 复用 useGlitchEffect 修复自动播放调度问题并补全无障碍 ([b2736f5](https://github.com/lidaixingchen/brutxui-vue3/commit/b2736f50899c63e47d3fce7e7789fe768d7c3d52))
* **form:** 修复校验边界、提交前全量校验、字段名选择器注入等问题 ([1316759](https://github.com/lidaixingchen/brutxui-vue3/commit/131675963bcf3ad962cb8a842b1eb8c83ca65453))
* **footer-section:** 链接事件携带原始 MouseEvent 并加固类型契约 ([f3cf10d](https://github.com/lidaixingchen/brutxui-vue3/commit/f3cf10daa1d8f22df19fc505588405d43c852a89))
* **feedback-form:** 修复提交数据与校验不一致及多实例 id 冲突等问题 ([8725b49](https://github.com/lidaixingchen/brutxui-vue3/commit/8725b49167139c5896f61725a08b697daf22fba0))
* **ui:** 保留已提交快捷项缓存并补齐 YearPicker 表单与闰日测试 ([f477d62](https://github.com/lidaixingchen/brutxui-vue3/commit/f477d6251a832654f9b85185bc59d88b014ca389))
* **ui:** 修复复审发现的 Escape 范围与闰日收敛一致性问题 ([2c9e0d3](https://github.com/lidaixingchen/brutxui-vue3/commit/2c9e0d3eed3c9215bcfa760f64b9a22da6dc08c0))
* **ui:** 修复审查发现的组件交互与类型边界问题 ([e6e168b](https://github.com/lidaixingchen/brutxui-vue3/commit/e6e168b513d276329cc3bdd7fc85dded584eb758))
* **ui:** 修复 DashboardShell SSR 一致性与焦点管理问题 ([03030f3](https://github.com/lidaixingchen/brutxui-vue3/commit/03030f3f073a8dbf0673dee7d0d5a8bbaa2d5c17))
* **ui:** 修复 DatePicker 系列时区残留与表单序列化问题 ([9456d05](https://github.com/lidaixingchen/brutxui-vue3/commit/9456d05bb24d8a843dc21d464767096396e1beb8))
* **ui:** 修复 Dialog 遮罩指针拦截与 showMessageBox 文档契约 ([63bee76](https://github.com/lidaixingchen/brutxui-vue3/commit/63bee76f3f8e8fdb311ad0ca2e5496bbfaa3cc4c))
* **ui:** 落实 DatePicker 审查决策项与主题色 twMerge 注册 ([617a973](https://github.com/lidaixingchen/brutxui-vue3/commit/617a9737450bd939b62d1f6a1f91231ec8f167fb))
* **ui:** 统一 Dialog 动画与 showMessageBox 语义并解耦销毁时机 ([a86a9f3](https://github.com/lidaixingchen/brutxui-vue3/commit/a86a9f3c72241cddd967e51236e49e68d4b8f8a7))
* **ui:** 修复 DropdownMenu 系列 attrs 透传与状态样式问题 ([feafae3](https://github.com/lidaixingchen/brutxui-vue3/commit/feafae3d2bb7a53c2579be5d951c3cb540ca5a03))
* **ui:** 修复 Dialog 系列销毁清理与 forceMount 透传问题 ([3771c03](https://github.com/lidaixingchen/brutxui-vue3/commit/3771c0339489d05038997a345eba194a46a639f8))
* **ui:** 修复 Descriptions 列数与跨列边界校验 ([83f31c2](https://github.com/lidaixingchen/brutxui-vue3/commit/83f31c2fe46410317ca1a9bec6e67e0dc6c8ae22))
* **ui:** 修复 DatePicker 系列面板边界与无障碍问题 ([2381230](https://github.com/lidaixingchen/brutxui-vue3/commit/238123013d544a9255508285dcca28a0b1238a54))
* **ui:** 修复 DataTable 过滤类型保真与虚拟滚动交互问题 ([80505db](https://github.com/lidaixingchen/brutxui-vue3/commit/80505dbab48460b3a2f7be6d3bf6c025602840ff))
* **ui:** 修复 DashboardShell 无障碍与移动端交互问题 ([9c1e0e1](https://github.com/lidaixingchen/brutxui-vue3/commit/9c1e0e1b4b9d5f610f2d4c265514a732198f8655))
* 移除 window.setTimeout 直接访问以符合 SSR 安全 lint 约定 ([85a2f47](https://github.com/lidaixingchen/brutxui-vue3/commit/85a2f477b4c4d99b2aacb4db3159e22e51499976))
* 根据 OpenCodeReview 建议完善防御性校验与代码健壮性 ([cca506b](https://github.com/lidaixingchen/brutxui-vue3/commit/cca506bbc4a94503d9490119c548e8e56b641caa))
* **review:** address open-code-review findings ([8c893ed](https://github.com/lidaixingchen/brutxui-vue3/commit/8c893ed2007e43df3545a250eb926fcdc0312f00))
* **canvas:** support late mounting auto-recovery ([914e2a9](https://github.com/lidaixingchen/brutxui-vue3/commit/914e2a994e89642c9329f2cf22fabf8d5e24a99e))
* **transfer:** align brutal borders and remove cn ([d872d15](https://github.com/lidaixingchen/brutxui-vue3/commit/d872d1566055dd32ee11395957deca0832238342))
* **theme:** 补齐预设暗色尺寸令牌并提升 pastel 暗色边框对比度 ([6ed7eba](https://github.com/lidaixingchen/brutxui-vue3/commit/6ed7eba040f606e87e0c57161a7c35eead5ad7c3))
* **cli:** 同步 brutalist.css subtle 衍生色与动效令牌 ([8d94c63](https://github.com/lidaixingchen/brutxui-vue3/commit/8d94c632e448ce880fca1031799b650b4e47b568))
* **ci:** 在 fallback 审计白名单登记 styles.css 暗色 subtle 衍生色偏离 ([9f094e1](https://github.com/lidaixingchen/brutxui-vue3/commit/9f094e10bf162907a5d4717cf06d95fe8d2fad97))
* **review:** 响应代码审查修复动画缓动属性、Subtle底色融合、侧栏变体与构建检查边界 ([01ac2b3](https://github.com/lidaixingchen/brutxui-vue3/commit/01ac2b30bb84c337f955727a24db41b142c205b6))
* **ui:** 补齐 tags-input 选中态 outline-hidden 与门禁正则加固 ([c75d02a](https://github.com/lidaixingchen/brutxui-vue3/commit/c75d02a2dfdab3f3f9095d450b5054a96a98edf7))
* **cli:** 令牌门禁注释剥离与 fail-closed 加固 ([1c03f03](https://github.com/lidaixingchen/brutxui-vue3/commit/1c03f03c8d6ad64efebcbc21b45fa1a3bfd53544))
* **ui:** 主入口核对收紧与目录缺失保护 ([1f41e96](https://github.com/lidaixingchen/brutxui-vue3/commit/1f41e9602449002d24be9ede101fb20575f7290c))
* **ci:** 生成物漂移门禁补 preflight.css 与 turbo 缓存 inputs 补齐 ([3f9bd99](https://github.com/lidaixingchen/brutxui-vue3/commit/3f9bd997c5bbd3b7e1e3567d178705d204b0336b))
* **ui:** exports 一致性双向核对与主入口覆盖门禁 ([334fcfd](https://github.com/lidaixingchen/brutxui-vue3/commit/334fcfd6603315fd69f9e8eff821b076ba2ec1d8))
* **cli:** brutalist.css 令牌覆盖补齐与 @theme 门禁比对 ([f86d2ec](https://github.com/lidaixingchen/brutxui-vue3/commit/f86d2ec4b6b09e1b28290fdb970d37572b2fea2a))
* **ui:** TreeViewNode 拖拽叠色令牌化，撤销 R6 豁免 ([24acbfe](https://github.com/lidaixingchen/brutxui-vue3/commit/24acbfe81fc7489137cf81f72d4185b582815009))
* **release:** prepare 自动提交纳入 guide 版本历史页并补充防坑说明 ([c742be9](https://github.com/lidaixingchen/brutxui-vue3/commit/c742be9d161e2e1a29c7ac7a16e3a0214f58f762))

### 📝 Documentation

* 更新全工程 VFS Seam、持久化深模块与共享包架构文档 ([db87f47](https://github.com/lidaixingchen/brutxui-vue3/commit/db87f47d641b1acc70da83b5a8a6aac010a9ce0c))
* 更新全工程虚拟文件系统统一与持久化深模块重构方案状态为 done ([8916763](https://github.com/lidaixingchen/brutxui-vue3/commit/89167633bf42008fe67639533437e27286898702))
* update diagnostic engine plan and cli docs ([bd7bb16](https://github.com/lidaixingchen/brutxui-vue3/commit/bd7bb1644c42bd41cd3ab5640592530ccb12e71d))
* **cli:** add diagnostic engine plan ([08ddc28](https://github.com/lidaixingchen/brutxui-vue3/commit/08ddc28e1489a1cf03516878c5e113f14f8259fb))
* **registry:** 补充包内架构分层与使用说明 ([3301b0c](https://github.com/lidaixingchen/brutxui-vue3/commit/3301b0cc86dabc6045b2f9675ff71fd010baa7d4))
* 更新注册表编译方案状态为 done ([7d686df](https://github.com/lidaixingchen/brutxui-vue3/commit/7d686df5d976b161cc46c78f781b0fad72080ac0))
* **message-box:** 补充中英文文档可访问性必须章节 ([894312e](https://github.com/lidaixingchen/brutxui-vue3/commit/894312ee8bc1b527882c48f3f58f7def73391624))
* 新增 MessageBox 交互预览 Demo 并纯粹化 MessageDemo ([4ecf6cb](https://github.com/lidaixingchen/brutxui-vue3/commit/4ecf6cb060ad58142b4976724ee4ac1e6db75151))
* 新增 MessageBox 独立文档并纯粹化 Dialog 与 Message 说明 ([e543556](https://github.com/lidaixingchen/brutxui-vue3/commit/e543556e3fd48866778cf28269534e3878c9bf8d))
* **plans:** 更新 CLI 项目上下文与路径解析引擎封装方案状态为 done ([2e7a247](https://github.com/lidaixingchen/brutxui-vue3/commit/2e7a24757d28e9e877964f10212afc63c76f7433))
* 更新 upload、virtual-scroll、watermark 组件文档与类型定义 ([0242712](https://github.com/lidaixingchen/brutxui-vue3/commit/024271223e11b7a73f03e34f59cefabff09a4f95))
* update T components props documentation ([b7205bc](https://github.com/lidaixingchen/brutxui-vue3/commit/b7205bc0758d8aad711967729b71a8c1b30976c6))
* **components:** sync props & API for S series ([671d182](https://github.com/lidaixingchen/brutxui-vue3/commit/671d182552003d0bf4d996296d634f983932ff7b))
* 新增组件视觉深化方案、命令式弹层宿主方案及领域词汇表 ([fbdab75](https://github.com/lidaixingchen/brutxui-vue3/commit/fbdab75722201cef384bd6becb3da0497386ff93))
* 补充主题对比度与周起始日限制说明 ([c1aaa46](https://github.com/lidaixingchen/brutxui-vue3/commit/c1aaa460d4c783970069675b332ff97ca63bb7c7))
* 同步全库单一信源与自动化生成相关规范 ([c45a7e3](https://github.com/lidaixingchen/brutxui-vue3/commit/c45a7e3870c0d499a492f5235a27e42576c1d4b5))
* 建立全库单一信源治理与样式元数据自动生成方案 ([66fe9ec](https://github.com/lidaixingchen/brutxui-vue3/commit/66fe9ec87bc5e4a96fbe02dc74392f8debccbd25))
* **theme:** 纠偏中英文设计令牌表格数据 ([5dc3015](https://github.com/lidaixingchen/brutxui-vue3/commit/5dc301581e273848701cdfedfa7b2f338a40def3))
* **plans:** 沉淀共享常量收割与构建校验防漂移方案 ([e04f5ba](https://github.com/lidaixingchen/brutxui-vue3/commit/e04f5ba291f804ae968acc8b021da70ab87149f3))
* add plan for selected states and a11y ([e0c3db0](https://github.com/lidaixingchen/brutxui-vue3/commit/e0c3db01b483b3e98bbc1ada32bd1d34a964fbf6))
* **plans:** 新增死代码与动效预设清理方案并标记落地完成 ([1fe2652](https://github.com/lidaixingchen/brutxui-vue3/commit/1fe26528b2139c72ec5b73bf6fd09fb8ed7e7f1b))
* 移除动效预设与 useAnimation 文档章节并同步技能词典 ([efe7454](https://github.com/lidaixingchen/brutxui-vue3/commit/efe7454a95ed5aa4833b3aadda028e5a34bbbe19))
* **theme:** 添加主题三套合一方案与文档示例对齐 ([1f90474](https://github.com/lidaixingchen/brutxui-vue3/commit/1f90474ecea6ee43bd029ea126241b0c2d7808c2))
* 增补 R8 排版体系规范与视觉效果优化方案 ([93f39dd](https://github.com/lidaixingchen/brutxui-vue3/commit/93f39dde824c8d9300a252aa30836598ae7e69a4))
* **plans:** 记录代码质量与性能改进方案 ([3363784](https://github.com/lidaixingchen/brutxui-vue3/commit/33637843f21c3d759a9bf0b22dd0b51dab931814))
* **guides:** 规范提交规范、发布与组件模板的排版与提示 ([0647a95](https://github.com/lidaixingchen/brutxui-vue3/commit/0647a9547d8e174e2cf2762fa448e86a20db427c))
* **guides:** 重构视觉系统与组件开发指南的内容结构 ([3383bcf](https://github.com/lidaixingchen/brutxui-vue3/commit/3383bcfcf37b3221165cd12ef81cfd5c58714ad6))
* 同步视觉系统、组件指南与方案归档 ([81f5279](https://github.com/lidaixingchen/brutxui-vue3/commit/81f5279264fe391c0b9f239c130dbbc6e8ec97ce))
* 按压盖影语义文档同步与方案落档 ([8bcb1a3](https://github.com/lidaixingchen/brutxui-vue3/commit/8bcb1a3e9378929aaf9e7e2dd0271f43c546ef1f))
* 精简 Breaking Change 标注章节指引 ([fc7b02e](https://github.com/lidaixingchen/brutxui-vue3/commit/fc7b02e968e0f573bf13c6745559661ddb31c170))
* 审查报告补 status-error 对比度缺口记录 ([634d0ee](https://github.com/lidaixingchen/brutxui-vue3/commit/634d0eea5af63f4d1a30c156c9692cca3f4f7794))
* 审查报告补复核结论与校验链缺口修复记录 ([3ff92ca](https://github.com/lidaixingchen/brutxui-vue3/commit/3ff92ca40ab9fa16008e9f89bcccabfc9b5b8d49))
* 审查报告补 check-brutalist-tokens @theme 门禁盲区 ([1897003](https://github.com/lidaixingchen/brutxui-vue3/commit/1897003889c105a476d71cfb50ad5c8fd4734743))
* 审查报告补主题统一评审决策与手写副本全景 ([3680ae3](https://github.com/lidaixingchen/brutxui-vue3/commit/3680ae393d68bcf6786d8bae5c35f8030f94bcc2))

### ✅ Tests

* **cli:** 迁移 CLI 测试套件并完成类型门禁校验 (#15) ([d72dd1d](https://github.com/lidaixingchen/brutxui-vue3/commit/d72dd1ddf4ee5645b60602851b1a87ebee8bf99f))
* **form:** 补充三轮审查指出的焦点与插槽提取用例 ([cf024e0](https://github.com/lidaixingchen/brutxui-vue3/commit/cf024e00af166871bd078f6f6ff1eddba3ca0b72))
* **form:** 补充二轮审查指出的边界用例 ([e871afc](https://github.com/lidaixingchen/brutxui-vue3/commit/e871afcd20b707c2d58a2474aa9b4e30ed69b257))
* **form:** 补充 OCR 审查指出的行为边界测试 ([8b78d1e](https://github.com/lidaixingchen/brutxui-vue3/commit/8b78d1ef9ceec3e7201edaf7d846138d9501949f))
* **cli:** 补充 registry 命令异常路径单测覆盖 ([211607d](https://github.com/lidaixingchen/brutxui-vue3/commit/211607de934c33111ae3897d66f87c5456172321))

### ⚡ Performance

* **cli:** 并行化 doctor 孤立文件遍历消除 IO 阻塞 ([d663780](https://github.com/lidaixingchen/brutxui-vue3/commit/d66378098a9910d5753b286d2feefaacf83e4d07))

### 🔧 CI

* **deps:** bump pnpm/action-setup (#4) ([196f853](https://github.com/lidaixingchen/brutxui-vue3/commit/196f853888f2858e1dbade298a3f77a1b62e796f))

### 🎨 Styles

* 清理 registry 测试中未使用变量与导入 ([38e1084](https://github.com/lidaixingchen/brutxui-vue3/commit/38e10843ea6a74cb1b616372db7897f6b7a5a290))
* 修复组件 lint 警告（默认值、属性顺序、void 元素自闭合） ([aa74ba7](https://github.com/lidaixingchen/brutxui-vue3/commit/aa74ba76cc778b4dabc30d66e0b351306d833708))

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


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

