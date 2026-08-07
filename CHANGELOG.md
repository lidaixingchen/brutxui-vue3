# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.10...HEAD)

## [0.9.10](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.9...v0.9.10) - 2026-08-07

### ✅ Tests

* **update:** 测试 cwd 改用 os.tmpdir 并 mock audit 适配 Windows 开发环境 ([0c94134](https://github.com/lidaixingchen/brutxui-vue3/commit/0c941349be96bfba3a6de029304ee0a81d0216fc))
* **transfer:** 补充选中项变 disabled 后选中态残留的回归测试 ([748c1e7](https://github.com/lidaixingchen/brutxui-vue3/commit/748c1e7e52d068cceaf8f572a7aa16d07d28b300))
* **form:** 补充 clearValidate 不清表单值回归用例 ([a5c834e](https://github.com/lidaixingchen/brutxui-vue3/commit/a5c834ecf43758e83003eb0f87453c87af34b65a))
* **scratch-card:** 补充画布移除定时器用例 ([6b9f205](https://github.com/lidaixingchen/brutxui-vue3/commit/6b9f20542f349438fc655d5cf5cec3c8edca0e96))
* **kanban:** 补充向右拖拽排序回归用例 ([8c54657](https://github.com/lidaixingchen/brutxui-vue3/commit/8c546577239012600c6420d92f938423e4c2f66e))

### 🔧 CI

* **deploy-docs:** 并发组启用 cancel-in-progress 防止卡死 run 阻塞部署队列 ([3b1df19](https://github.com/lidaixingchen/brutxui-vue3/commit/3b1df19c818d66c6bf2c19acfbdc6a2c70963efd))

### 🐛 Bug Fixes

* **tags-input:** 删除按钮默认文案接入 i18n ([e95fc1d](https://github.com/lidaixingchen/brutxui-vue3/commit/e95fc1deec377deb80e8598088f9632e1ed54518))
* **watermark:** 防篡改重建前归位被移出的节点并显式判空 ([7dd77b8](https://github.com/lidaixingchen/brutxui-vue3/commit/7dd77b8888a7d599a0e271dfa63c171b57c9564b))
* **upload:** 拖拽中止时复位高亮态并补 UploadTrigger 测试 ([597cfcc](https://github.com/lidaixingchen/brutxui-vue3/commit/597cfcc44359e627df7f3e6a459d4de48b85f149))
* **tour:** steps 缩短时钳制 currentStep 避免卡死 ([c2f3c83](https://github.com/lidaixingchen/brutxui-vue3/commit/c2f3c8388341365a080374956aa2a83612b96fa8))
* **tree:** 树组件审查修复及回归测试 ([136db61](https://github.com/lidaixingchen/brutxui-vue3/commit/136db61ffd63bfb416d47b1bab9a3b14ff298fa2))
* **components:** 修复 tour/transfer/virtual-scroll/watermark 缺陷 ([d9a83fc](https://github.com/lidaixingchen/brutxui-vue3/commit/d9a83fcd6a1f9aaa8f5516f05bba2bebf1d1e9c1))
* **tags-input:** 删除按钮提供默认 aria-label 并允许覆盖 ([d8bfb45](https://github.com/lidaixingchen/brutxui-vue3/commit/d8bfb455dd2eb560d60749ce0303a32e6b726359))
* **tree:** 修复树组件的键盘导航、搜索展开与节点回写 ([e5e885b](https://github.com/lidaixingchen/brutxui-vue3/commit/e5e885ba2749a7a7cc76c6f7e45c3aabc79b7022))
* **upload:** 卸载时中止上传并修正 trigger 的 FileList 与 drag 开关 ([07f39e3](https://github.com/lidaixingchen/brutxui-vue3/commit/07f39e3d397723bb6e424b30c66c8ee4e0aec126))
* **hardcore-input:** 恢复组合结束兜底 emit 并通过标记去重 ([0914c28](https://github.com/lidaixingchen/brutxui-vue3/commit/0914c28b575287947ec61952d4f1ca90deda8ed3))
* **input:** 恢复组合结束兜底 emit 并通过标记去重 ([aa5c4a5](https://github.com/lidaixingchen/brutxui-vue3/commit/aa5c4a58842f34c123def90ee49ff7e3b4cd86b4))
* **slider:** 暴露的 currentValue 对齐归一化值 ([71d3eb5](https://github.com/lidaixingchen/brutxui-vue3/commit/71d3eb581f86357066a16e79f65ded9fd6adbd86))
* **select:** 组件级归一化 options 供分组与非分组共用 ([89c4bd7](https://github.com/lidaixingchen/brutxui-vue3/commit/89c4bd7f1c432e1ca5c1323064469a870f5e0a22))
* **menu:** 选中子菜单项自动收起并支持 Escape 关闭 ([028e95f](https://github.com/lidaixingchen/brutxui-vue3/commit/028e95fb3d91096b0805a22cc4834471a47c387e))
* **infinite-scroll:** 重新观察哨兵触发复查并文档化加载契约 ([c57b4dd](https://github.com/lidaixingchen/brutxui-vue3/commit/c57b4ddf062bf05fda37745134a850d90a9a6cab))
* **textarea:** 组合结束恢复兜底 emit 并通过标记去重 ([0a07681](https://github.com/lidaixingchen/brutxui-vue3/commit/0a0768176fd24240d0736db791686d6a97dcc9e7))
* **tabs:** 选中项被移除时同步内部激活值 ([136e086](https://github.com/lidaixingchen/brutxui-vue3/commit/136e0861d219bb49b9b52fd6f213b37298fe3e18))
* **form-wizard:** steps 动态变化时重新钳制当前步骤 ([484d0be](https://github.com/lidaixingchen/brutxui-vue3/commit/484d0becc0f509b35206e834501ae3e2e7d44f60))
* **stepper:** 空步骤时拦截越界导航 ([866fd97](https://github.com/lidaixingchen/brutxui-vue3/commit/866fd97767a0d69b6cdb906b2d626ff330461552))
* **textarea:** 完善 IME 组合事件处理避免重复发射与卡死 ([b2146a9](https://github.com/lidaixingchen/brutxui-vue3/commit/b2146a9a2b6452c08a8572eede789581efed880e))
* **tabs:** 非受控模式校验选中项仍存在 ([6f1d03f](https://github.com/lidaixingchen/brutxui-vue3/commit/6f1d03faf0ef8098f8a4a9caa0251878013d56e6))
* **table:** 表格样式选择器限定为直接子元素 ([28004c8](https://github.com/lidaixingchen/brutxui-vue3/commit/28004c8a048158d41eaf76341efb23a247a566fb))
* **stepper:** 越界钳制激活步骤索引 ([0ec2502](https://github.com/lidaixingchen/brutxui-vue3/commit/0ec25022de3842e712de38d41e88b203df66b5ae))
* **slider:** 归一化 modelValue 保证 thumb 数量一致 ([8af1f59](https://github.com/lidaixingchen/brutxui-vue3/commit/8af1f59c6d53893784383e54bb907e11770090b5))
* **skeleton:** SkeletonAvatar 显式透传圆形形状 ([b090f8b](https://github.com/lidaixingchen/brutxui-vue3/commit/b090f8b5f1dc1ddf433c3b7780705cdab18c4ea5))
* **select:** 防御 options 为 null 时分组渲染崩溃 ([0b50d67](https://github.com/lidaixingchen/brutxui-vue3/commit/0b50d6724c2e5a9d89d506e1ca59d45665429087))
* **scratch-card:** 用定时器替代 transitionend 移除画布 ([eacd775](https://github.com/lidaixingchen/brutxui-vue3/commit/eacd7758631950720e9387ddbe385600a2cef7e2))
* **noise-background:** 先停止旧动画循环避免 NaN 写入 DOM ([ee59421](https://github.com/lidaixingchen/brutxui-vue3/commit/ee59421baa09e3afb5fc66405965e8f3fbba1fbd))
* **menu:** 点击固定打开的子菜单不随鼠标移出关闭 ([204e87f](https://github.com/lidaixingchen/brutxui-vue3/commit/204e87ffa74a42b0685c8436a47349edd7ed7a48))
* **kanban:** 统一列拖拽移动语义使事件下标可精确重放 ([b626167](https://github.com/lidaixingchen/brutxui-vue3/commit/b6261676251af5ddb1b7175a378dbd6486b250ca))
* **infinite-scroll:** 修复重置后哨兵停滞与禁用态恢复加载失败 ([8b78c8e](https://github.com/lidaixingchen/brutxui-vue3/commit/8b78c8e4292dd75a57db72a19821deb73eb11057))
* **form:** 修复 clearValidate 误重置表单值与向导步骤越界 ([37f5abf](https://github.com/lidaixingchen/brutxui-vue3/commit/37f5abfbefe3f7172326a9bf5105ded6e426f788))

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


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

