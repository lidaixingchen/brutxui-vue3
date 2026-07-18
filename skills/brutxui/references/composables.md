# BrutxUI 组合式函数词典 (Composables Dictionary)

本文件收录了 BrutxUI 导出的所有自定义 Vue 组合式函数（Composables）及其核心功能说明。可用于逻辑复用及自定义开发。

---

## 核心 Composable 列表

| 组合式函数 | 说明 | 导入路径 |
| --- | --- | --- |
| `useCarousel` | 轮播逻辑（embla 初始化、autoplay、状态管理），自动尊重 prefers-reduced-motion | `brutx-ui-vue/carousel` |
| `useDatePicker` | 日期选择逻辑（面板开关、显示值、选择确认） | `brutx-ui-vue/date-picker` |
| `useColorPicker` | 颜色选择逻辑 | `brutx-ui-vue/color-picker` |
| `useColorHistory` | 颜色历史记录管理（localStorage 持久化、去重、最大数量限制） | 默认导出 |
| `useAnimation` | 统一动画降级策略，自动尊重 prefers-reduced-motion | 默认导出 |
| `useReducedMotion` | 检测用户 prefers-reduced-motion 系统设置 | 默认导出 |
| `useFormFieldValidation` | 通用表单验证（rules、validateOn、validationState） | 默认导出 |
| `useTheme` | 主题切换与运行时定制（支持 `setCustomVariable` / `removeCustomVariable` 动态修改单个变量） | 默认导出 |
| `useToast` | Toast 通知生命周期与队列管理 | 默认导出 |
| `useClipboard` | 剪贴板复制功能（含 `isSupported` 及 `copied` 临时状态） | 默认导出 |
| `useAudioEngine` | Web Audio API 音效引擎，提供 8-bit 复古点击、成功、失败音效 | 默认导出 |
| `useCanvasInteraction` | Canvas 交互涂抹逻辑（涂抹进度计算、阈值触发自动揭示） | 默认导出 |
| `useKanban` | 看板拖拽核心逻辑（鼠标拖拽、键盘无障碍 Space/方向键移动） | 默认导出 |
| `useStepper` | 步骤条导航与控制逻辑（包含步骤验证与键盘辅助） | 默认导出 |
| `useClearable` | 统一输入框清除按钮逻辑（显示状态、清除触发、悬停状态） | 默认导出 |
| `useInfiniteScroll` | 基于 IntersectionObserver 的无限滚动监听（防抖、加载判定） | 默认导出 |
| `useDataTableSort` | DataTable 排序状态与多字段逻辑管理 | 默认导出 |
| `useDataTableFilter` | DataTable 条件过滤与搜索缓存管理 | 默认导出 |
| `useDataTableSelection` | DataTable 单选/多选及跨页选择状态管理 | 默认导出 |
| `useDataTablePagination` | DataTable 逻辑分页及页码变动管理 | 默认导出 |
| `useUpload` | 文件上传核心逻辑，支持 AbortController 强行取消上传，所有参数响应式更新 | 默认导出 |
| `useMessage` | 函数式消息提示调用（info/success/warning/error），支持垂直堆叠与单例销毁 | 默认导出 |
| `useDialog` | 函数式对话框管理器，优化 DOM 生命周期防御泄露，返回 `{ close, promise }` | 默认导出 |
| `useMessageBox` | 函数式确认框管理器，支持输入校验和 Promise 异步拦截 | 默认导出 |

---

## 核心 Composable 使用示例

### 1. 主题切换与局部变量自定义 (`useTheme`)
```typescript
import { useTheme } from 'brutx-ui-vue'

const { theme, setTheme, setCustomVariable, removeCustomVariable } = useTheme()

// 切换至内置 Pastel 粉彩主题
setTheme('pastel')

// 在运行时，针对当前用户选择动态覆盖特定 CSS 变量
setCustomVariable('--brutal-primary', '#8B5CF6')

// 恢复默认
removeCustomVariable('--brutal-primary')
```
