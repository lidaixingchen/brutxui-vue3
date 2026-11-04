# CI 耗时分析与优化策略

调研日期：2026-11-03。统计来自 GitHub Actions 的真实作业、步骤时间戳与日志；优化收益为待验证的推算。

## 一、结论与优先级

**缩短 CI Gate 等待时间，优先拆解 Quality 的串行检查，再优化真实消费者测试；降低累计作业时长，优先复用文档构建产物。** CodeQL 也是耗时大户，但当前仓库规则集要求的状态检查为 `CI Gate (all checks passed)`，CodeQL 独立运行，优化它主要改善安全扫描反馈。

抽取最近 18 次 CI 的作业数据，其中 8 次成功、10 次失败；成功样本覆盖 2026-10-26 至 2026-11-02。成功运行从创建到 Gate 作业完成的中位耗时为 **182 秒（3 分 02 秒）**，范围为 158～186 秒；各作业运行时长之和的中位数为 **1,114 秒（18 分 34 秒）**。后者用于衡量计算消耗，不等同于 GitHub 账单分钟数。失败运行可能提前终止检查，故不混入成功基线。

8 次成功运行中，Quality 最后结束 4 次，消费者测试 3 次，覆盖率汇总链路 1 次。这说明仅优化 UI 分片或浏览器任务，通常不会直接缩短 Gate 等待。[样本 A](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427649)、[样本 B](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41219952593)、[样本 C](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41218984897)。

工作流配置对应本地基线提交 `e6cf1f5fbd8f5b56ca0bed8cee822360b0e5ad26`。最新成功 PR 样本是 Dependabot 更新 Actions 的运行，存在远程缓存权限差异。报告同时参考 [CI 工作流](../../../.github/workflows/ci.yml)、[部署工作流](../../../.github/workflows/deploy-docs.yml)、[Turbo 配置](../../../turbo.json)与[任务范围分类器](../../../scripts/ci/change-scope.mjs)，不把不同运行的缓存条件视为相同。

## 二、耗时大户

下表为作业自身运行时长，包含安装、缓存及收尾；并行作业的耗时不能直接相加为等待时间。CI 行使用上述 8 次成功样本，CodeQL 单独使用最近 3 次运行。

| 环节 | 中位耗时 | 范围 | 主要内部开销 |
| --- | ---: | ---: | --- |
| CodeQL JavaScript/TypeScript | 176 秒 | 168～188 秒 | 分析步骤 152～169 秒；独立于 CI Gate |
| Quality | 150.5 秒 | 110～166 秒 | 构建与类型/lint/validate 42.5 秒、tooling 29 秒、生成物校验 18 秒，串行累积 |
| 真实消费者 U1 / C1 / C3 | 143.5 秒 | 105～163 秒 | 消费者执行 73.5 秒、候选产物构建 29 秒 |
| Browser | 114 秒 | 88～156 秒 | Button 资源断言 34 秒、UI 构建 20.5 秒、浏览器测试 13.5 秒 |
| Documentation site | 114 秒 | 46～123 秒 | 构建与类型检查 86 秒 |
| Coverage 分片 1 / 2 | 95 / 90.5 秒 | 68～102 / 61～96 秒 | 测试与覆盖记录 71 / 65.5 秒 |
| Coverage 汇总 | 31.5 秒 | 29～35 秒 | 正式合并仅约 2～3 秒，其余主要为环境准备和产物处理 |

### 1. Quality：多项检查在同一个作业内串行

构建、生成物一致性、tooling、公开类型、包解析、文档规范、发布脚本测试和体积检查都堆叠在 Quality。部分命令内部已并发，但步骤之间仍然串行。

例如[最新成功运行的 Quality](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427649/job/125230801707)耗时 148 秒，其中构建检查 48 秒、tooling 24 秒、生成物检查 16 秒。将小检查逐个优化一两秒，收益低于缩短这条串行链。

建议把职责拆成两条独立检查链：

- 包产物链：构建、类型、lint、validate，随后执行依赖产物的公开类型、隔离、包解析与体积检查。
- 生成与工具链：生成物一致性、tooling、文档规范和发布脚本测试，按输入范围选择。

两条链在隔离作业中运行，避免生成器和读取生成物的检查共享写入目录；CI Gate 显式纳入被选中的新任务。依据现有步骤分布，单条 Quality 链有缩短数十秒的空间，但新增作业的环境准备和缓存成本必须计入。最终收益受消费者链路限制，不能直接从 182 秒减去 Quality 的全部节省。

### 2. 消费者测试：C1 是主因，U1 和 C3 增加串行等待

[消费者入口](../../../packages/cli/scripts/test-consumers.mjs)中的 `main()` 逐项 `await` 执行 U1、C1、C3；各流程使用隔离的消费者目录。日志分解为：

| 成功样本 | U1 | C1 | C3 | 整体命令耗时 |
| --- | ---: | ---: | ---: | ---: |
| [2026-11-02](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427649/job/125230802154) | 13.65 秒 | 37.51 秒 | 7.46 秒 | 59.28 秒 |
| [2026-10-31](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41219952593/job/124592297815) | 23.30 秒 | 62.11 秒 | 11.24 秒 | 97.70 秒 |

C1 包含多次 CLI `add`、更新验证、严格类型检查与生产构建，耗时占主导。优先试验同一个作业内用独立子进程，让 C1 与 U1/C3 支线重叠；现有入口已经支持 `--filter U1|C1|C3` 和 `--artifacts`，可以共用一次打包的输入。

上述两次运行中，U1+C3 合计约 21～35 秒，代表理想情况下可重叠的执行窗口，**不代表已经测得的节省**。并发后 CPU、pnpm store 和磁盘竞争可能拉长 C1，需要限制进程并发、隔离结果文件和证据目录，并汇总全部退出状态。入口内部使用同步子进程调用，仅在同一进程内改成 `Promise.all()` 无法实现这些同步阶段的有效并发。

独立矩阵作业是另一种可测实现：共享候选包上传一次，每个作业在自己的目录下载后运行过滤入口。[产物加载器](../../../scripts/testing/consumer-artifacts.mjs)支持基于 `tarballFile` 解析下载后的相对位置。它会增加调度、安装和传输成本，应与同作业子进程方案比较后选择。[GitHub 矩阵并行机制](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)。

### 3. 文档：同一提交重复构建

main push 同时触发 CI 的 `Documentation site` 与 `Deploy Docs`；两者都执行 `turbo run build:artifact typecheck:source --filter=docs`，Actions 本地缓存域分别为 `site` 与 `docs`。同时启动时，跨作业远程缓存也不能保证避免同一次未命中任务的重复计算。

同一提交 `708fb5d2b7` 的 [CI 文档构建步骤](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41218984897/job/124589432295)耗时 90 秒，[部署工作流](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41218984987)对应步骤耗时 93 秒。

建议由一个构建任务产出通过类型检查的文档站点，部署消费对应提交的产物。部署只读取成功任务产物，并按提交与运行关联选择；保留现有全历史检出以支持 VitePress `lastUpdated`。可通过可复用工作流统一构建与部署依赖。

这项优化主要节约重复构建和类型检查的计算量；跨工作流等待与下载也有成本，对 CI Gate 耗时的改善取决于资源竞争，不能按节省 90 秒等待时间计算。[GitHub 产物共享机制](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow)。

### 4. 缓存：恢复文件成功与任务命中是两层指标

最新 Dependabot PR 的 Quality 已恢复 `.turbo/cache`，但 Turbo 日志为 `Remote caching disabled`，14 个任务中 0 个命中，执行 48.265 秒。main 样本对应步骤为 `Remote caching enabled`，14 个任务中 11 个命中，执行 7.256 秒。两次运行的 Node 都是 `v22.23.4`，不能把差异归因于这两个样本的 Node 版本变化。

这是缓存条件差异的实例，不足以证明某个单一因素造成全部差异。Dependabot 只能访问其专用 secrets，与普通 Actions secrets 的可用性不同；恢复的旧缓存包含哪些任务也会影响命中。[PR 日志](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427649/job/125230801707)、[main 日志](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41219952593/job/124592297833)、[Dependabot 官方权限说明](https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions)。

建议分别记录普通 PR、Dependabot、main 的缓存命中率，优先改善 PR 对基线构建缓存的复用，并评估能否用一次构建的产物直接供应消费者及浏览器检查。缓存恢复/保存也需要计时，避免只追求缓存数量。

`generate` 的 `cache: false` 仅要求生成任务实时执行，不意味着下游构建和测试必然无法命中。调整缓存时，应让任务输入覆盖实际生成结果，保持 Node 运行时与任务参数隔离。[Turbo 官方配置说明](https://turborepo.dev/docs/reference/configuration)。

### 5. CodeQL：默认配置已包含增量基础数据库缓存

仓库的 CodeQL default setup 当前启用默认查询集、标准 runner、每周计划，扫描 Actions 与 JavaScript/TypeScript；它不是本地 `ci.yml` 中的任务。最近 3 次 JavaScript/TypeScript 作业分别耗时 188、176、168 秒。[运行一](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41219951743)、[运行二](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41218984853)、[运行三](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41216778644)。

188 秒样本的日志显示：源码提取约 34 秒、数据库 finalize 约 12 秒、查询阶段约 69 秒，之后还有上传、清理和数据库大小测量。该运行已启用 `overlay-base with caching`，查询使用 4 threads；无需把“开启增量缓存”作为新收益来源。

建议先保持现有扫描覆盖，采集 PR 与 main 的分阶段差异。若安全扫描本身成为交付时限目标，再用更高规格 runner 做对照，衡量查询、清理与总成本的变化；是否采用高级配置，应由实测瓶颈决定。目前已读取的仓库规则集只要求 CI Gate，因此此项优先级低于 Quality 和消费者链路。配置证据来自 `GET /repos/lidaixingchen/brutxui-vue3/code-scanning/default-setup`，门禁证据来自仓库 rulesets API。

## 三、后续优化对象

### UI 分片与覆盖率

当前已经使用两个 Node 24 UI 分片、两个 Node 22 coverage 分片和单独汇总任务；保留正式汇总阶段的全局阈值约束。[分片配置](../../../packages/ui/vitest.coverage-shard.config.ts)、[基础配置](../../../packages/ui/vitest.config.ts)。

在[最新覆盖率分片](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427649/job/125230801675)中，`date-time-picker.test.ts` 单文件约 8.52 秒，是适合专项剖析的对象。Vitest 的 setup、import、environment 指标同时较大，但这些是跨 worker 的汇总时间，不能直接相加视为墙钟时间。

当 Quality 和消费者链路缩短后，再比较分片数量和 worker 数。更多分片会增加独立环境准备及产物汇总成本；更多 worker 需要结合实际 runner CPU 和内存测量。Vitest 按文件分片，单个慢文件仍可能成为尾部瓶颈。[Vitest 分片指南](https://vitest.dev/guide/improving-performance#sharding)、[Blob 汇总机制](https://vitest.dev/guide/reporters#blob-reporter)。

### 安装、Playwright 与 Bench

8 次成功运行共 96 个依赖安装步骤，中位数只有 6 秒，合计 563 秒；属于累计成本，单个作业内收益空间有限。`setup-node` 缓存 pnpm store，不缓存 `node_modules`；按包过滤安装须覆盖全部跨包任务依赖。[setup-node 缓存说明](https://github.com/actions/setup-node#caching-global-packages-data)、[pnpm CI 指南](https://pnpm.io/continuous-integration)。

这些样本的 Playwright 浏览器缓存都命中，恢复耗时 4～8 秒，系统依赖安装仅 0～1 秒。当前 Browser 作业的主要开销是构建和资源断言。官方容器可作为冷缓存场景的对照，但本次没有冷缓存运行样本，也没有镜像拉取耗时证据。[Playwright CI 指南](https://playwright.dev/docs/ci)、[官方容器说明](https://playwright.dev/docs/docker)。

最近两次 Bench PR 作业耗时 92 秒和 51 秒，其中一次补建精确 base SHA 的基准花费 32 秒。现有 [Bench 工作流](../../../.github/workflows/bench.yml)已缓存精确基线并在缺失时重建；后续可统计基线缺失频率，判断是否需要改善基线产出覆盖。[补建样本](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427645)。

## 四、建议执行顺序与验收

| 顺序 | 优化项 | 主要收益 | 验收重点 |
| --- | --- | --- | --- |
| 1 | 拆分 Quality 检查链 | 缩短高频关键路径 | 新任务选取和 Gate 汇总完整，统计最长链耗时 |
| 2 | 消费者受控并发 | 重叠 U1/C3 与 C1 的等待 | 使用同一候选包，结果与证据隔离，检查覆盖完整 |
| 3 | 文档构建产物复用 | 降低同提交重复计算 | 部署读取对应提交的成功产物，保留 lastUpdated |
| 4 | 按运行身份优化缓存复用 | 稳定 PR 反馈与构建命中 | 分开记录文件缓存恢复和 Turbo 任务命中 |
| 5 | UI 慢文件、分片与 CodeQL 对照实验 | 改善下一阶段瓶颈 | 同时比较等待时间和累计作业时长 |

每项使用同一候选提交分别测量已有缓存和清空相关缓存后的场景，并覆盖普通 PR、Dependabot 与 main；取多次运行的中位数和范围。记录运行排队、任务开始与结束、关键步骤、任务缓存命中、累计作业时长，避免用不同任务范围之间的差异充当优化收益。

保留 main push 的完整验证约束：现有分类器对 main push 选取全量检查，用于覆盖并发取消后尚未验证的提交。优化以计算复用和检查链调度为主，确保 Node 22/24、SSR、覆盖率阈值、消费者和发布门禁的覆盖范围完整。

本次只做调研与文档落盘，未修改 CI 行为、触发新运行或执行优化实验。工作区原有 CI、发布脚本及文档改动保留。

## 五、成功样本与复核方式

| CI 运行 | 事件 | Gate 完成耗时 | 累计作业时长 | 最后结束的检查链 |
| --- | --- | ---: | ---: | --- |
| [41431427649](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41431427649) | PR | 184 秒 | 1,140 秒 | Quality |
| [41219952593](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41219952593) | push | 160 秒 | 780 秒 | 消费者 |
| [41218984897](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41218984897) | push | 186 秒 | 1,155 秒 | Quality |
| [41184005632](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41184005632) | push | 180 秒 | 1,104 秒 | 消费者 |
| [41168817408](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/41168817408) | push | 186 秒 | 1,144 秒 | Quality |
| [40908139406](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/40908139406) | push | 162 秒 | 1,099 秒 | 消费者 |
| [40633411699](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/40633411699) | push | 186 秒 | 1,124 秒 | Quality |
| [40309966395](https://github.com/lidaixingchen/brutxui-vue3/actions/runs/40309966395) | PR | 158 秒 | 1,001 秒 | Coverage 汇总链 |

复核命令：

```bash
gh run list --repo lidaixingchen/brutxui-vue3 --workflow ci.yml --limit 30 \
  --json databaseId,event,conclusion,createdAt,headSha,url
gh api 'repos/lidaixingchen/brutxui-vue3/actions/runs/41431427649/jobs?per_page=100'
gh run view 41431427649 --repo lidaixingchen/brutxui-vue3 \
  --job 125230801707 --log
gh api repos/lidaixingchen/brutxui-vue3/code-scanning/default-setup
gh api repos/lidaixingchen/brutxui-vue3/rulesets
```

作业耗时取 `completed_at - started_at`；Gate 完成耗时取 Gate 的 `completed_at - run.created_at`，包含排队与任务间调度；累计时长只累加实际执行的作业。步骤时间戳按秒统计，存在取整误差。此次样本量用于定位优化优先级，不用于推断稳定的高分位延迟。
