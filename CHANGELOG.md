# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.11.2...HEAD)

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


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

