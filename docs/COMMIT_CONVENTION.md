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
- 描述：中文，简洁明了，不超过 50 字符
- 格式：`type(scope): 描述` 或 `type: 描述`

### 正文（可选但推荐）

- 简单提交（如 typo 修复）可省略正文
- 复杂修改必须写明：**问题原因** + **修复方案**
- 使用中文撰写

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
