# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.10.1...HEAD)

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

## [0.9.12](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.11...v0.9.12) - 2026-08-09

### ⚠️ Breaking Changes

* **ui:** 精简 lib 聚合导出，移除内部调优参数 ([55ad9ee](https://github.com/lidaixingchen/brutxui-vue3/commit/55ad9ee2dabd84dfa8e038849e028e44c695dcbe))
* **ui:** 统一两套主题系统命名为 classic ([b14da42](https://github.com/lidaixingchen/brutxui-vue3/commit/b14da42d5395ce67dd5281d8a161857515ed2734))

### ♻️ Code Refactoring

* **ui:** VALID_THEMES 下沉 lib 层并整理聚合导出 ([dfdb1ab](https://github.com/lidaixingchen/brutxui-vue3/commit/dfdb1ab9ffec8fb83d187d6766c8f7a031032a1b))
* **ui:** 抽取浮动表面与关闭按钮公共样式常量 ([ecc8c3c](https://github.com/lidaixingchen/brutxui-vue3/commit/ecc8c3cd1845fad3ddd1e8bd1e4974d32f3dd312))
* **ui:** iconSize 尺寸档位 default 改名 md 并全量迁移 ([9a8d882](https://github.com/lidaixingchen/brutxui-vue3/commit/9a8d882a3cc44937910c3ef2243ed8fd1118d6eb))
* **ui:** 收敛交互变体与动画常量，修复禁用态样式冲突 ([a7fad43](https://github.com/lidaixingchen/brutxui-vue3/commit/a7fad4355f919001ff6a502f91b1e54b51eff80f))
* **cli:** 移除 lib/index.ts 中重复的 RegistrySourceStatus 重导出 ([ed5880b](https://github.com/lidaixingchen/brutxui-vue3/commit/ed5880b0ee9d21d455ab38f35c3ac20bdcd18b95))

### 🐛 Bug Fixes

* **ci:** 修复 registry 快照过期与 SBOM 随机 UUID 导致的 CI 失败 ([1316ab3](https://github.com/lidaixingchen/brutxui-vue3/commit/1316ab3720f15572a044f3cc35f0b78c0db2ad56))
* **ui:** 暗色共享 store 引入引用计数，修复 destroy 切断同 key 实例状态 ([d1f85bc](https://github.com/lidaixingchen/brutxui-vue3/commit/d1f85bc37656498c688e5e1659846e343a0b6d92))
* **ui:** tree 节点选中边框改由变体显式控制，消除级联顺序依赖 ([bcbb826](https://github.com/lidaixingchen/brutxui-vue3/commit/bcbb826238dabb76a62498691b5fd334651f6e60))
* **ui:** 统一暗色模式状态管理，修复双工厂状态不同步 ([385c8d7](https://github.com/lidaixingchen/brutxui-vue3/commit/385c8d7e18143c2e0da8f16f256d446fc992705c))
* **ui:** 焦点环令牌化并补充透明 outline 降级 ([041f036](https://github.com/lidaixingchen/brutxui-vue3/commit/041f036914d8de45b1c9a6df3c4623d755b36a0a))
* **ui:** 邮箱正则本地部分按标签边界收紧 ([102e9d0](https://github.com/lidaixingchen/brutxui-vue3/commit/102e9d0e8bd3243d7710bb543f69220d164e530a))
* **ui:** theme-editor 预览键清理与构造/CSS 转义防护 ([34ace22](https://github.com/lidaixingchen/brutxui-vue3/commit/34ace228c6ff5d83f4b10622779ea3ee6cc79efb))
* **ui:** 命令式渲染回退即时卸载，消除重复渲染 ([62b5783](https://github.com/lidaixingchen/brutxui-vue3/commit/62b57839f60f24a11639e5958954250cd8c55350))
* **ui:** registerTheme 入参防护与主题合并基线补全 ([02dcfa0](https://github.com/lidaixingchen/brutxui-vue3/commit/02dcfa0d150ecadbd40208a758d850e53dafd727))
* **ui:** theme-fallbacks 回退为自包含，修复 registry 分发 ([6a9b567](https://github.com/lidaixingchen/brutxui-vue3/commit/6a9b567d758582d6a37fac9a0cfcd573c3dd594f))
* **ui:** 主题变量注册深拷贝合并并清理旧变量 ([f6c60cd](https://github.com/lidaixingchen/brutxui-vue3/commit/f6c60cd8b5eaaf717b70846c49a4d19223db0345))
* **ui:** 收紧邮箱正则并补充策略注释 ([50255d2](https://github.com/lidaixingchen/brutxui-vue3/commit/50255d231187aa1d3e4ed01574de85c7911b6ec5))
* **ui:** 主题编辑器校验补强与预览/导出变量集统一 ([8791a0f](https://github.com/lidaixingchen/brutxui-vue3/commit/8791a0f3b14abf99107afb92cd6fba7359b54e52))
* **ui:** 命令式渲染先入 DOM 再挂载并保证销毁幂等 ([bf17c28](https://github.com/lidaixingchen/brutxui-vue3/commit/bf17c289339da7715a380380f1a792064d2d8b74))
* **ui:** 日期解析补时分秒范围校验 ([daeb481](https://github.com/lidaixingchen/brutxui-vue3/commit/daeb4816db491126693916fa02380a3d372c95a7))
* **ui:** 主题回退色改为默认主题派生并注明 light-only ([c0d2148](https://github.com/lidaixingchen/brutxui-vue3/commit/c0d21489b39af293a3e7c50a7689e80e789306f0))
* **ui:** 修复 OCR 审查反馈的 11 条问题 ([f6136f6](https://github.com/lidaixingchen/brutxui-vue3/commit/f6136f6bf79d5528302d0fbf2797f757cdac0c4a))
* **ui:** devtools 异常路径测量与循环引用检测，版本号取自 package.json ([47e9f61](https://github.com/lidaixingchen/brutxui-vue3/commit/47e9f613416135c5beb834e1c4f43250e0ba8c3c))
* **ui:** 加固工具层空值与环境守卫，统一默认值口径 ([5ccd71a](https://github.com/lidaixingchen/brutxui-vue3/commit/5ccd71a94767dd0af4379c8aaecc2413f9059ccc))
* **cli:** 修复 OCR 审查反馈的 9 条问题 ([95b9bd4](https://github.com/lidaixingchen/brutxui-vue3/commit/95b9bd43a164bedcb105a288adebdbafd9d9ab08))
* **cli:** nuxt 根块扫描状态机与写入失败原因透传 ([95d2085](https://github.com/lidaixingchen/brutxui-vue3/commit/95d208507a08822fdf3e502ae3f48bae7830add4))
* **cli:** add 服务写入前路径复检与 dry-run 结构一致 ([902d8e1](https://github.com/lidaixingchen/brutxui-vue3/commit/902d8e18b731ad6e4f5bda616ab44d843f97db61))
* **cli:** diff 服务路径匹配与组件目录穿越防护 ([b3d5a58](https://github.com/lidaixingchen/brutxui-vue3/commit/b3d5a5827c398c70039c46960468a778b7a10a92))
* **cli:** 多 registry 离线作用域引用计数与配置校验 ([a4c22d3](https://github.com/lidaixingchen/brutxui-vue3/commit/a4c22d3e8f01c6f4c10a2a848e7dc75de7839db5))
* **cli:** 子进程结算去重与按行缓冲输出 ([8b18fcd](https://github.com/lidaixingchen/brutxui-vue3/commit/8b18fcd8bf78326d58b8fac2f0953fba96b1bebc))
* **cli:** manifest 绝对路径校验与损坏清单错误包装 ([50f368f](https://github.com/lidaixingchen/brutxui-vue3/commit/50f368fc1f933fc45133d8e5ddd3a5362e714568))
* **cli:** 文件事务部分回滚状态机与孤儿临时目录治理 ([edf79db](https://github.com/lidaixingchen/brutxui-vue3/commit/edf79dbfa20c7cb7fc8bf95d4c1cbf9431365e21))
* **cli:** 组件依赖提取改用 es-module-lexer 解析并加受限并发 ([12c9bbd](https://github.com/lidaixingchen/brutxui-vue3/commit/12c9bbdd6458ff676f5c7a12b01340f371f741ff))
* **cli:** 缓存淘汰删除失败补偿，保持尽力满足限额 ([2d19cfe](https://github.com/lidaixingchen/brutxui-vue3/commit/2d19cfe6585b1a0c2d5fe3cbc6ad3ee80df297ab))
* **cli:** verbose 拦截 NaN 等级并修正空 DEBUG 真值解析 ([85bca81](https://github.com/lidaixingchen/brutxui-vue3/commit/85bca813dc7c37ff0dbcbf6bb7a5431df414a0d7))
* **cli:** 完整性校验并行读取并补充错误上下文 ([dd50bd8](https://github.com/lidaixingchen/brutxui-vue3/commit/dd50bd89ab3af117f7e368552057ccdb626c8f1a))
* **cli:** 文件事务回滚去重、状态机与目录快照治理 ([598fcd6](https://github.com/lidaixingchen/brutxui-vue3/commit/598fcd613a7b7d3071f404531082bac5b0e08e18))
* **cli:** logger 等级校验、DEBUG 真值与错误输出健壮化 ([688cef9](https://github.com/lidaixingchen/brutxui-vue3/commit/688cef999e004bd62b7d5ae31a6945327b5067bb))
* **cli:** 组件扫描跳过无关目录、并行化并单组件容错 ([5b86191](https://github.com/lidaixingchen/brutxui-vue3/commit/5b861911f60195cb519bbbc1f8ba49999cacc9e3))
* **cli:** dry-run 打印改为静态导入同步输出 ([d42cdc5](https://github.com/lidaixingchen/brutxui-vue3/commit/d42cdc5fff8e14940bb1cf5d715cd14909f22379))
* **cli:** doctor 非交互修复需显式 --yes，SBOM hash 转 hex ([7e09349](https://github.com/lidaixingchen/brutxui-vue3/commit/7e0934949e5fa148fac9ea2bbf05b5bfbf854303))
* **changelog:** 转义归档 changelog 中的裸尖括号，修复 vitepress 构建 ([2809b0a](https://github.com/lidaixingchen/brutxui-vue3/commit/2809b0a3da042407aaf511aee4ad789dd5177a2d))

### 📝 Documentation

* **registry:** Registry 产物发布时构建计划定稿（方案 B：GitHub Release 资产） ([4e5c83d](https://github.com/lidaixingchen/brutxui-vue3/commit/4e5c83dfeb7e245615979aec76f97eee0d1546cd))
* **cli:** signature 模式并发与真值语义说明 ([4693644](https://github.com/lidaixingchen/brutxui-vue3/commit/4693644c57a06425845cc74e10314ef32263620c))
* 更新根 CHANGELOG 至 0.9.11 并归档 0.9.8 ([3a5bf30](https://github.com/lidaixingchen/brutxui-vue3/commit/3a5bf30709532db953e68d660c91253d463cc983))

### ⚡ Performance

* **cli:** 并行化缓存清理的 stat 与删除 ([e9a36d7](https://github.com/lidaixingchen/brutxui-vue3/commit/e9a36d7d259a99a0d02a0c4ee3b3d6aa0b5856f7))

### 🔧 CI

* **registry:** main push 后自动签名 registry manifest 并回填 ([084000a](https://github.com/lidaixingchen/brutxui-vue3/commit/084000a32c725f152235fcd41f2d245d7983c673))


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

