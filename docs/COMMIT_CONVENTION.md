# 提交信息规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

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

## Shell 注意事项

书写多行 commit message 时需注意不同 Shell 的语法差异：

- **Bash 工具**（Claude Code 默认）：使用 Git Bash（POSIX sh），`@'...'@` 不是 here-string 语法，会被当作普通字符串。多行 commit message 应直接用普通引号包裹。
- **PowerShell**：`@'...'@` 单引号 here-string 语法要求结束标记 `'@` 必须位于行首（列 0），前面不能有空格。

## 示例

### 简单提交（无正文）

```
fix(ui): 修复 Button 组件 hover 状态样式
docs: 更新 README 安装说明
chore(deps): 升级 Vue 到 3.5.13
```

### 复杂提交（带正文）

```
fix(ui): 修复 5 个组件的 CI 测试失败问题

修复 ChatBubble、Marquee、Stepper、VirtualScroll、KanbanBoard 共 8 个测试用例失败。

## ChatBubble - system 消息 text-xs 被 size 覆盖

**问题**: cn() 内部的 tailwind-merge 会将 text-xs 与 text-base 合并。
**修复**: 为 system 消息在 cn() 末尾追加 text-xs 以提高优先级。

## Stepper - 默认 variant 不符合测试预期

**问题**: 默认 variant 为 "default"，但 active 步骤应显示 primary 配色。
**修复**: 将默认 variant 从 "default" 改为 "primary"。
```

### 多个 scope 的提交

```
fix(ui,cli): 修复组件注册路径解析问题
```

### 带 Issue 引用的提交

```
fix(ui): 修复 KanbanBoard 拖拽排序问题

Closes #168
```
