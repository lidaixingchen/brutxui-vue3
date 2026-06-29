# Demo组件中英文规则

## 保留英文的内容

|类别|示例|原因|
|---|---|---|
|组件名|`Button`、`Input`、`Card`|用户写代码时必须用英文，保留便于对照|
|属性名|`variant`、`size`、`disabled`|API的一部分，代码中使用英文|
|技术术语|`v-model`、`prefix`、`suffix`|Vue/前端通用术语，翻译反而奇怪|
|变量名/class名|`isLoading`、`space-y-4`|代码本身，不能翻译|
|属性值|`primary`、`outline`、`sm`|写代码时用的值|

## 翻译成中文的内容

|类别|示例|说明|
|---|---|---|
|UI显示文本|`Default` → `默认`、`Loading` → `加载中`|用户看到的文字|
|表格表头|`Props` → `属性`、`Type` → `类型`|文档说明|
|描述说明|`Card description...` → `卡片描述内容`|展示内容|

## 示例

```vue
<!-- 改前 -->
<Button variant="primary">Primary</Button>
<Button :loading="true">Loading</Button>

<!-- 改后 -->
<Button variant="primary">主要</Button>
<Button :loading="true">加载中</Button>
```

属性名 `variant="primary"` 保留英文，按钮显示文字翻译为中文。

## 待翻译文件

- 33个纯英文文件（需要完整翻译）
- 65个混合语言文件（需要统一）

详见 [demo-language-report.md](demo-language-report.md)
