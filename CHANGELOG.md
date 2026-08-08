# 更新日志

根 `CHANGELOG.md` 仅保留**最近 3 个版本**的完整变更记录，历史版本详见[归档版本](#归档版本)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.11...HEAD)

## [0.9.11](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.9.10...v0.9.11) - 2026-08-08

### 🐛 Bug Fixes

* **ui:** 修复 CI 失败的 lint 违规 ([735bdc5](https://github.com/lidaixingchen/brutxui-vue3/commit/735bdc5fdccc3184b07d051c4e9fd4ef866eae6d))
* **shared/ui:** 主题信息色前景对比度数据源对齐 ([ce58ab4](https://github.com/lidaixingchen/brutxui-vue3/commit/ce58ab4746f3245ad639ddc1234a65547d37ea42))
* **ui:** DeepPartial 基本类型守卫与深合并原型链防护 ([993a7d5](https://github.com/lidaixingchen/brutxui-vue3/commit/993a7d55e875addcdf6702d146ce156ee49355bb))
* **ui:** 主题对比度达标与 createCustomTheme 运行时校验 ([a588a18](https://github.com/lidaixingchen/brutxui-vue3/commit/a588a187d4c041cde1f2fe774e54ccac9080c480))
* **ui:** 工具类型支持函数式组件与内置类型守卫 ([e913f38](https://github.com/lidaixingchen/brutxui-vue3/commit/e913f38db38fc07867a9cef16bbbca027f258e53))
* **ui:** plugin 生命周期释放与私有字段能力探测 ([d053377](https://github.com/lidaixingchen/brutxui-vue3/commit/d053377ceb72391edb74a18daee872d24ada56d1))
* **ui:** 测试基础设施定时器/类型/mock 健壮性 ([84ecdf0](https://github.com/lidaixingchen/brutxui-vue3/commit/84ecdf00657852b6f343adb08b15635e699d0b56))
* **ui:** 语言包非文案默认值移出并动态化版权年份 ([b3d7520](https://github.com/lidaixingchen/brutxui-vue3/commit/b3d75208075d4563f5bdacd7bdcd9e812d69b5e5))
* **ui:** mergeLocale 的 isPlainObject 补充原型链校验 ([396813f](https://github.com/lidaixingchen/brutxui-vue3/commit/396813f61e978bdfc3270063b43624d5fc07a5f9))
* **ui:** destroyBrutxUI 作为真实实现避免 deprecated 沿别名传播 ([f759a8f](https://github.com/lidaixingchen/brutxui-vue3/commit/f759a8f3a6a2c94b8e1158ab6a83c19adb2798a4))
* **ui:** 统一 dialog 确认文案并修正定价终身文案格式 ([cd87ce3](https://github.com/lidaixingchen/brutxui-vue3/commit/cd87ce39c9e87a342ed7bf69284d192bc4b337e0))
* **ui:** 语言包类型收窄并重写 mergeLocale 合并语义 ([213b0a2](https://github.com/lidaixingchen/brutxui-vue3/commit/213b0a2e57da7956f4e8fbd4194f13740e98c7dd))
* **ui:** v-loading 定位还原去除死代码并补 Spinner 兜底 ([d153d64](https://github.com/lidaixingchen/brutxui-vue3/commit/d153d64886acfff56221f071fc1a6d440ca71d4e))
* **ui:** 修正 CSS 与全局类型声明，改用官方 embla 类型 ([a311dd1](https://github.com/lidaixingchen/brutxui-vue3/commit/a311dd13637ce8d2ce2085cd0d45db2dd2184046))
* **cli:** 本地 registry 组件列表过滤全部元数据文件 ([d2cf02a](https://github.com/lidaixingchen/brutxui-vue3/commit/d2cf02a591ce77295c303cd6c7f5d5aaa54768fb))
* **cli:** 支持 --all 搭配本地 registry 枚举组件列表 ([2803ff0](https://github.com/lidaixingchen/brutxui-vue3/commit/2803ff01a7aedcbb4a1b50cfa031936fa73c5b33))
* **cli:** CliError 错误码单一数据源与缓存临时文件唯一化 ([ef14b29](https://github.com/lidaixingchen/brutxui-vue3/commit/ef14b296f849ad2b44becc1df3fef491593fd98d))
* **cli:** cn 模板复用单一数据源并修复重复 import 绑定风险 ([7629126](https://github.com/lidaixingchen/brutxui-vue3/commit/7629126b8437831bb18fc4d47036d557d6aa77c8))
* **cli:** 审计计数过滤脏数据并消除命令白名单漂移 ([96c9f40](https://github.com/lidaixingchen/brutxui-vue3/commit/96c9f405a022a7dfd5d4ea80d360352442c62279))
* **cli:** argv 全局选项扫描跳过 -- 分隔符并严格校验 --max-age ([55c42bb](https://github.com/lidaixingchen/brutxui-vue3/commit/55c42bb265ec50df5955e98e3af0e824f2222337))
* **cli:** update 检查失败计入 registry 不可达并修正部分失败文案 ([63b5cdb](https://github.com/lidaixingchen/brutxui-vue3/commit/63b5cdb27ec3b2248e394c65710bac549bc03401))
* **cli:** 缓存原子写入、损坏条目防御与清理失败日志 ([8fd4ad5](https://github.com/lidaixingchen/brutxui-vue3/commit/8fd4ad5d259d593f935c417dae52e8c77a9e992e))
* **cli:** 修复 argv 预处理 -- 分隔符与 --max-age 严格整数解析 ([9a8767c](https://github.com/lidaixingchen/brutxui-vue3/commit/9a8767c113278fa7e6b5859b15ceec844daa7791))
* **cli:** CliError 兼容旧 Node cause 并运行时校验 code/exitCode ([959de07](https://github.com/lidaixingchen/brutxui-vue3/commit/959de073478eee79db74c81af6714304450ecbda))
* **cli:** 加固 styles 目录解析、统一 libUtils 前缀并自包含 cn 模板 ([5107c9e](https://github.com/lidaixingchen/brutxui-vue3/commit/5107c9eb0e49cd46f06cb93f55bfb7a5e4d8e211))
* **cli:** 修正离线预缓存建议文案为 list --check-updates ([0f7c9ef](https://github.com/lidaixingchen/brutxui-vue3/commit/0f7c9ef2fd65576251a3d8d00a1fbcc650a04243))
* **cli:** update 命令隔离组件与分组的更新错误并汇总失败 ([166dcaa](https://github.com/lidaixingchen/brutxui-vue3/commit/166dcaab397d013a35ad6d68ffc0bca266f3e875))
* **cli:** 审计模块加固（全局 dry-run 跳过写入、流式读取、错误脱敏） ([963b7be](https://github.com/lidaixingchen/brutxui-vue3/commit/963b7be0e3286f9063e6843b4959c72299f445cf))
* **cli:** list 透出 updateCheckError 状态并防御缺失依赖字段 ([0581b18](https://github.com/lidaixingchen/brutxui-vue3/commit/0581b181b28e39809030efbbed24e28cae3275c6))
* **cli:** 复用 findTailwindConfig 消除重复实现并完善 create/diff 提示注释 ([6566ae3](https://github.com/lidaixingchen/brutxui-vue3/commit/6566ae30f2e1fe05bf76ef171d47fbb688eae16a))
* **cli:** 404 透出 COMPONENT_NOT_FOUND 错误码并修复 info 组件名校验 ([546e284](https://github.com/lidaixingchen/brutxui-vue3/commit/546e284c0b3cc4630410adfe054977a761111a3b))
* **cli:** 修复 add 写盘后回滚边界与 remove dry-run 计数中断 ([d50f154](https://github.com/lidaixingchen/brutxui-vue3/commit/d50f15416137d5994377203cd54127dcb0615340))
* **cli:** 修复 diff/remove/list 的清单错误处理、回滚提示与表格对齐 ([2bb0890](https://github.com/lidaixingchen/brutxui-vue3/commit/2bb0890e908851863a4f8330f084423eacc9466c))
* **cli:** init 命令按安装目标检测项目类型与包管理器并修复 snippets 失败处理 ([5db3f40](https://github.com/lidaixingchen/brutxui-vue3/commit/5db3f40f94fb55206923d1d586c8ace3c070ea3b))
* **cli:** add 命令禁止 --all 配自定义 registry 并回滚写盘后失败 ([0d46fe2](https://github.com/lidaixingchen/brutxui-vue3/commit/0d46fe2a90754e6739007cefe02fd73e56a3a968))
* **cli:** info 命令增加组件名路径安全校验并正确判定 not-found 状态 ([296fe6e](https://github.com/lidaixingchen/brutxui-vue3/commit/296fe6e4d111b9548bae048e899ffb4a0f83657b))
* **cli:** 收紧 create 项目名校验并在失败时清理残留目录 ([9455cad](https://github.com/lidaixingchen/brutxui-vue3/commit/9455cad29d421d07275aa9dc81291ae6131124ea))

### 📝 Documentation

* 更新 AI 协作约定，代码注释仅描绘当下 ([cefca6e](https://github.com/lidaixingchen/brutxui-vue3/commit/cefca6ecc0ee4af0bb276cfce7be31984edeb72d))
* **agents:** 优化 AGENTS.md 结构与规范 ([a1b8807](https://github.com/lidaixingchen/brutxui-vue3/commit/a1b880724ff498b33fc8af3b25cb086acc11745a))

### ♻️ Code Refactoring

* **ui:** 收敛清理 API 命名并抽取 Transfer/Tour 公共类型 ([2e9031b](https://github.com/lidaixingchen/brutxui-vue3/commit/2e9031b14b0c10c994f9b4b3585ed714614fe6e6))
* **cli:** 显式界定公共 API 面并补充 MANIFEST_READ_FAILED 错误码 ([643a0b7](https://github.com/lidaixingchen/brutxui-vue3/commit/643a0b7f7ad58db80c78ec05dc2d9402f4a7ce6b))

### ✅ Tests

* **cli:** 更新 libUtils 前缀路径测试为真实 registry 路径 ([c62fa3e](https://github.com/lidaixingchen/brutxui-vue3/commit/c62fa3eeb01c9c69ebe5dfe379c7a6664ce58876))
* **cli:** 更新 404 错误码与组件名校验相关测试 ([393cc74](https://github.com/lidaixingchen/brutxui-vue3/commit/393cc74a6c2f8316bef749719fd2111c8dc3eb85))
* **cli:** 补充 create 名称校验与 info 状态判定的测试 ([d5fea34](https://github.com/lidaixingchen/brutxui-vue3/commit/d5fea3433e45e1cc0f5cddac9f90414acc36d891))
* **ui:** 统一测试文件命名为 kebab-case ([223192e](https://github.com/lidaixingchen/brutxui-vue3/commit/223192ed8d43bae4f76efd5abc11d45eeefac4f3))

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


## 归档版本

> 以下版本已归档至 [apps/docs/changelog/](apps/docs/changelog/)，点击版本号查看完整变更记录：

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

