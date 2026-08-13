# 提交信息规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，提交时仅提交自身负责的或受自身影响的。

## Shell 提交注意事项

书写多行 commit message 时需注意不同 Shell 的语法差异：

- **Bash 工具**（Claude Code 默认）：使用 Git Bash（POSIX sh），`@'...'@` 不是 here-string 语法，会被当作普通字符串。多行 commit message 应直接用普通引号包裹。
- **PowerShell**：`@'...'@` 单引号 here-string 语法要求结束标记 `'@` 必须位于行首（列 0），前面不能有空格。

## 格式模板

```
<type>(<scope>): <简短描述>

<详细描述（可选）>
```

## 格式规则

### 标题行（必填）

- `type`：英文，必填，标识提交类型
- `scope`：英文，可选，标注影响范围
- 描述：中文，简洁明了，不超过 50 字符（由 commitlint 钩子强制，见「兜底验证」）
- 格式：`type(scope): 描述` 或 `type: 描述`

### 正文（可选但推荐）

- 简单提交（如 typo 修复）可省略正文
- 复杂修改必须写明：**问题原因** + **修复方案**
- 使用中文撰写
- **Breaking Change 标注**：若属破坏性变更，正文首行写 `BREAKING CHANGE: <影响与迁移说明>`（见「Breaking Change 标注」章节）

## Type 类型

| type | 用途 | 示例场景 |
|------|------|----------|
| `feat` | 新功能 | 新增组件、新增 props |
| `fix` | 修复 bug | 修复测试失败、修复样式问题 |
| `refactor` | 重构（不改变功能） | 代码结构调整、重命名 |
| `docs` | 文档变更 | 更新 README、组件文档 |
| `style` | 格式调整（不影响逻辑） | 代码格式化、空格调整 |
| `test` | 测试相关 | 新增测试、修复测试 |
| `chore` | 构建/工具/依赖 | 升级依赖、配置变更 |
| `perf` | 性能优化 | 减少渲染开销、优化计算 |
| `ci` | CI/CD 配置 | GitHub Actions 变更 |
| `build` | 构建系统变更 | Vite 配置、打包优化 |
| `revert` | 回滚提交 | 回滚某个功能 |

## Scope 范围（可选）

| scope | 含义 |
|-------|------|
| `ui` | 核心 UI 组件库 |
| `cli` | CLI 工具 |
| `docs` | 文档网站 |
| `registry` | 注册表构建 |
| `shared` | 共享类型 |
| `deps` | 依赖变更 |
| `theme` | 主题及令牌变更 |

> **说明**：推荐在必要时使用具体的子 Scope 来精确标识受影响的组件或模块，例如 `ui/toast`、`cli/add`。

## Breaking Change 标注

破坏性变更（移除/改名 prop、更改默认行为、组件合并或删除、token 重命名）必须显式标注，二选一：

1. **标题行 `!`**（推荐）：`feat(ui)!: 移除 xxx prop`
2. **正文首行**：`BREAKING CHANGE: <影响与迁移说明>`

`generate-changelog.mjs` 识别 `!` 与 `/BREAKING[ -]CHANGE:/`，归入根 CHANGELOG 的 `⚠️ Breaking Changes` 段置顶；两种标注等价。

## 兜底验证

提交信息由 `commitlint` 钩子（`.husky/commit-msg`）强制，规则与本节一致：`type-enum`（feat/fix/refactor/docs/style/test/chore/perf/ci/build/revert）、`type-case`、`type-empty`、`scope-case`、`subject-empty`、`header-max-length` 100、`description-max-length` ≤ 50（按 code point 计数，中文=1）。

自检命令：

```bash
pnpm exec commitlint --edit "$1"
echo "feat(ui): 修复按钮焦点环" | pnpm exec commitlint   # 通过
echo "feat(ui): 这是一条超过五十个字符的超长提交描述信息违反了描述长度限制" | pnpm exec commitlint   # exit 1
```

历史提交不追溯；仅强制新提交。
