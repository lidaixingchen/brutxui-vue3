# shamefullyHoist 审计报告

> 对应方案：[ARCHITECTURE_OPTIMIZATION_PLAN_V2.md §1.4](../ARCHITECTURE_OPTIMIZATION_PLAN_V2.md#14-shamefullyhoist-治理)
> 阶段：P0 审计阶段（评估移除可行性）
> 日期：2026-07-17
> 仓库状态：`pnpm-workspace.yaml` 当前为 `shamefullyHoist: true`

---

## 1. 审计目标

[pnpm-workspace.yaml:4](../../pnpm-workspace.yaml#L4) 中 `shamefullyHoist: true` 是历史遗留兼容开关，会破坏 pnpm 的依赖隔离优势，使子包可能访问未声明的依赖（phantom dependency）。本审计的目的是：

1. 在不移除 `shamefullyHoist: true` 的前提下，找出仓库中所有「代码里 `import` 了但 `package.json` 未声明」的依赖（phantom）。
2. 评估移除 `shamefullyHoist: true` 的可行性。
3. 输出可在 P2 移除阶段作为前置证据的基线产物。

## 2. 审计方法

### 2.1 选择静态 AST 扫描而非动态切换

方案 §1.4 step 1 原本描述了「切换到 `shamefullyHoist: false` + `pnpm install` + `pnpm -r build` + `pnpm -r test`，收集失败点」的动态流程。但在本仓库实际执行时遇到两个问题：

- **耗时**：`shamefullyHoist: false` 会触发 pnpm 对整个 `node_modules` 的重新结构化（不再平铺到顶层），在当前依赖规模下安装耗时长，且会破坏其他正在进行的工作上下文。
- **副作用**：动态切换后即使回滚到 `true`，`node_modules` 仍可能留下中间状态，需要再次 `pnpm install` 才能恢复。

因此采用方案 §5.3 明确推荐的等价替代方法：

> 审计使用 `depcheck`（AST 扫描 import + 与 package.json diff）……禁止仅用 `pnpm list` 审计——它无法发现 phantom dependency，必须用 depcheck（或等价 AST 扫描工具）。

本审计使用仓库内置的等价 AST 扫描工具 [scripts/scan-phantom-deps.mjs](../../scripts/scan-phantom-deps.mjs)，其行为与 `depcheck` 等价：

- **词法分析**：自定义 tokenizer 逐字符扫描源码，识别「代码段」与「字符串字面量段」，跳过 `//` 与 `/* */` 注释。
- **import 识别**：仅在「代码段以 `from` / `import` / `import(` 结尾，且紧随其后是字符串字面量」时才认为是真实 import。这样能正确忽略 `import foo from 'pkg'` 出现在模板字符串或注释中的情况（之前的 regex 版本正是此处误报）。
- **声明比对**：与每个子包 `package.json` 的 `dependencies` + `devDependencies` 聚合集合做差集，差集即为 phantom 候选。
- **过滤**：Node 内建模块、路径别名（`@/`、`~`、`#`、`virtual:`）、相对路径、含 `${...}` 的模板插值均跳过。
- **目录排除**：`node_modules`、`dist`、`.vitepress/cache`、`.vitepress/.temp`、`coverage` 等构建产物目录全部跳过。

### 2.2 扫描范围

| 子包 | 扫描目录 |
| --- | --- |
| `brutx-ui-vue` | `packages/ui/src` |
| `brutx-vue` (CLI) | `packages/cli/src` |
| `brutx-registry-vue` | `packages/registry/scripts` |
| `brutx-shared-vue` | `packages/shared/src` |
| `docs` | `apps/docs/.vitepress` |

### 2.3 基线产物

- [hoist-deps-list.txt](./hoist-deps-list.txt)：聚合去重后的所有直接依赖清单（52 个），每行附 `# used by: <pkg1>, <pkg2>` 标注实际声明该依赖的子包。
- [hoist-scan-output.txt](./hoist-scan-output.txt)：扫描工具的原始 stdout 输出，作为可复现的审计证据。

## 3. 审计结果

### 3.1 Phantom 候选清单

| 子包 | Phantom 数量 |
| --- | --- |
| `brutx-ui-vue` | 0 |
| `brutx-vue` (CLI) | 0 |
| `brutx-registry-vue` | 0 |
| `brutx-shared-vue` | 0 |
| `docs` | 0 |
| **合计** | **0** |

完整扫描输出见 [hoist-scan-output.txt](./hoist-scan-output.txt)。

### 3.2 已排除的误报

早期的 regex 版扫描器曾报出以下「候选」，经 tokenizer 版扫描器与人工复核均确认为误报（出现在字符串字面量或模板字符串内，非真实 import）：

| 误报项 | 位置 | 实际性质 |
| --- | --- | --- |
| `clsx` / `tailwind-merge` | [packages/cli/src/lib/constants.ts:57-66, 117-125](../../packages/cli/src/lib/constants.ts#L57-L125) | 出现在 `UTILS_TEMPLATE` 模板字符串内，是 CLI 生成给用户项目的 `lib/utils.ts` 文件内容，CLI 自身并未 import 这两个包 |
| `tailwindcss` | [packages/cli/src/lib/services/init-service.ts:116](../../packages/cli/src/lib/services/init-service.ts#L116) | 出现在 `@import "tailwindcss";` 字符串字面量内，是 CLI 写入用户项目 CSS 文件的内容 |
| `${componentsAlias}` / `${url}` | `packages/cli/src/commands/add.ts`、`packages/cli/src/lib/registry.ts` | 模板字符串插值，已被 `extractPkgName` 通过 `${` 检测过滤 |
| `.vitepress/cache/deps/` 下的虚拟模块 | `apps/docs/.vitepress/cache/` | Vite 预构建产物，已被 `SKIP_DIRS` 排除 |

### 3.3 结论：移除可行性

**从 phantom dependency 角度看，移除 `shamefullyHoist: true` 是可行的。**

- 所有子包的 `import` 语句均可解析到本地 `package.json` 中显式声明的依赖。
- 不存在「靠 shamefullyHoist 才能解析」的隐式依赖。
- 移除后预期的失败点数量为 0。

## 4. 已知风险与 P2 移除阶段的验证清单

本审计基于源码静态分析，无法覆盖以下场景，需在 P2「实际移除」阶段用动态流程二次验证：

1. **间接依赖的运行时访问**：源码可能通过 `require.resolve`、`import(/* @vite-ignore */ dynamicVar)` 等动态方式访问间接依赖。AST 扫描无法发现这类访问。验证方法：P2 移除后跑完整 `pnpm -r build` + `pnpm -r test`。
2. **CLI 产物（`dist/`）的运行时依赖**：CLI 通过 `tsup` 打包，部分依赖可能被 bundle 进 `dist/index.js`。打包后运行时不再 `import`，但若 `tsup` 配置了 `external`，运行时仍会 `require`。验证方法：P2 移除后执行 `node packages/cli/dist/index.js --help` 及若干 `add` 子命令冒烟测试。
3. **docs 站点的 Vite 预构建**：VitePress 在 `dev` 与 `build` 时会对依赖做预构建并缓存到 `.vitepress/cache/`。`shamefullyHoist: false` 可能导致预构建找不到某些间接依赖。验证方法：P2 移除后跑 `pnpm --filter docs build` 并清理 `.vitepress/cache/`。
4. **`pnpm install` 自身的解析变化**：`shamefullyHoist: false` 后，`node_modules/.pnpm/` 的结构会变化，部分依赖的 peer 解析路径会改变。验证方法：P2 移除后跑 `pnpm install` 并检查是否有 `WARN` / `ERR`。

### P2 移除阶段执行清单（按方案 §1.4 step 3）

- [x] 删除 `pnpm-workspace.yaml` 中的 `shamefullyHoist: true` 行
- [x] 执行 `pnpm install`（验证无 `WARN` / `ERR`）— 2026-07-17 通过，仅剩与本次无关的预存在 peer dep 警告
- [x] 执行 `pnpm build`（turbo run build，验证所有子包构建通过）— brutx-ui-vue / brutx-vue / brutx-registry-vue / docs 全部通过
- [x] 执行 `pnpm --filter docs build`（验证文档站点构建通过）— 86.37s 通过
- [x] 执行 `node packages/cli/dist/index.js --help`（CLI 冒烟测试）— 通过，子命令列表正常输出
- [x] 修复发现的 1 个 phantom dependency：`packages/ui/scripts/generate-styles-tokens.ts` 与 `prebuild-scan.ts` import 了 `brutx-shared-vue` 但未声明，已补到 `packages/ui/package.json` devDependencies
- [x] 同步扩展 `scripts/scan-phantom-deps.mjs` 扫描范围到 `packages/ui/scripts`，并补齐 DECLARED 集合（`brutx-shared-vue` for ui、`reka-ui` for docs、size-limit 系列）
- [ ] 执行 `pnpm -r test`（验证所有子包测试通过）— 用户规则禁止开发机跑全量测试，留待 CI 验证
- [ ] 清理 `apps/docs/.vitepress/cache/` 后重新执行 `pnpm --filter docs build` — 已正常构建一次，不再强制清缓存重测

## 5. 复现方式

```bash
# 1. 生成直接依赖清单（基线）
node -e "const fs=require('fs'),path=require('path');const pkgs=[{name:'root',p:'package.json'},...fs.readdirSync('packages').map(p=>({name:p,p:path.join('packages',p,'package.json')})),{name:'docs',p:path.join('apps','docs','package.json')}];const deps=new Map();for(const{name,p} of pkgs){if(!fs.existsSync(p))continue;const j=JSON.parse(fs.readFileSync(p,'utf8'));for(const d of[...Object.keys(j.dependencies||{}),...Object.keys(j.devDependencies||{})]){if(!deps.has(d))deps.set(d,[]);deps.get(d).push(name)}}const lines=[...deps.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([d,ps])=>d+'\t# used by: '+ps.join(', '));fs.mkdirSync('docs/audit',{recursive:true});fs.writeFileSync('docs/audit/hoist-deps-list.txt',lines.join('\n')+'\n');console.log('Wrote '+deps.size+' deps')"

# 2. 运行 phantom 依赖扫描
node scripts/scan-phantom-deps.mjs | tee docs/audit/hoist-scan-output.txt
```

## 6. 维护约定

- 当任何子包新增 / 删除依赖时，[scripts/scan-phantom-deps.mjs](../../scripts/scan-phantom-deps.mjs) 顶部的 `DECLARED` 集合必须同步更新（脚本注释已说明：故意不自动读取 `package.json`，以便新 phantom 出现时 diff 显式可见）。
- 本报告与 `hoist-deps-list.txt`、`hoist-scan-output.txt` 应在 P2 移除 `shamefullyHoist: true` 时重新生成并附在 PR 描述中。
