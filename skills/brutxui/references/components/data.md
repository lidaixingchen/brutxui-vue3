# 数据展示组件

## Table

```vue
<Table>
  <TableHeader>
    <TableRow><TableHead>列 1</TableHead><TableHead>列 2</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>数据 1</TableCell><TableCell>数据 2</TableCell></TableRow>
  </TableBody>
</Table>
```

子组件：Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption

## Badge

```vue
<Badge variant="success">已完成</Badge>
<Badge variant="primary" size="sm">Small</Badge>
<Badge variant="primary" size="lg">Large</Badge>
```

- `variant`: `'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline'`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`

## Avatar

```vue
<Avatar size="lg" shape="circle">
  <AvatarImage src="https://..." />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

- `size`: `'sm' | 'default' | 'lg' | 'xl'`
- `shape`: `'square' | 'circle'`

子组件：Avatar, AvatarImage, AvatarFallback

## Progress

```vue
<Progress :model-value="60" :max="100" />
```

- `modelValue`: `number` — 默认 `0`
- `max`: `number` — 默认 `100`

## Pagination

```vue
<Pagination
  :current-page="1" :total-pages="10"
  :sibling-count="1" show-first-last
  @update:current-page="handlePageChange"
/>
```

- `currentPage`: `number` — 必填
- `totalPages`: `number` — 必填
- `siblingCount`: `number` — 默认 `1`
- `showFirstLast`: `boolean` — 默认 `true`
- `showPageNumbers`: `boolean` — 默认 `true`
- `variant`: `'default' | 'outline'`
- `size`: `'default' | 'sm' | 'lg'`

## Counter

数字动画，从一个值过渡到另一个。

```vue
<Counter :to="1000" :duration="2000" prefix="$" suffix="+" separator="," />
```

- `to`: `number` — 必填
- `from`: `number` — 默认 `0`
- `duration`: `number` — 默认 `2000`
- `decimals`: `number` — 默认 `0`
- `prefix`: `string`
- `suffix`: `string`
- `separator`: `string` — 默认 `','`
- `easing`: `'linear' | 'ease-out' | 'ease-in-out'` — 默认 `'ease-out'`
- `autoStart`: `boolean` — 默认 `true`
- `size`: `'sm' | 'md' | 'lg'`

## Kbd

键盘按键展示。

```vue
<Kbd size="md">Ctrl</Kbd> + <Kbd size="md">C</Kbd>
```

- `size`: `'sm' | 'md' | 'lg'` — 默认 `'md'`

## CodeBlock

```vue
<CodeBlock code="const x = 1" language="typescript" filename="example.ts" :show-line-numbers="true" />
```

- `code`: `string` — 必填
- `language`: `string` — 默认 `'plaintext'`
- `filename`: `string`
- `showLineNumbers`: `boolean` — 默认 `false`

## Marquee

```vue
<Marquee direction="left" :speed="20" :pause-on-hover="true" :fade="true">
  <span>滚动内容...</span>
</Marquee>
```

- `direction`: `'left' | 'right'` — 默认 `'left'`
- `speed`: `number` — 默认 `20`
- `pauseOnHover`: `boolean` — 默认 `false`
- `fade`: `boolean` — 默认 `false`

## BeforeAfter

前后对比图。

```vue
<BeforeAfter before="/before.jpg" after="/after.jpg" before-alt="修改前" after-alt="修改后" />
```

- `before`: `string` — 必填
- `after`: `string` — 必填
- `beforeAlt`: `string`
- `afterAlt`: `string`
- `defaultValue`: `number` — 默认 `50`
- `disabled`: `boolean`

## ChatBubble

```vue
<ChatBubble :message="{ id: '1', content: '你好！', variant: 'sent', name: '我', timestamp: '10:30' }" />
```

- `message`: `ChatMessage` — `{ id: string; content: string; variant?: 'sent'|'received'|'system'; avatar?: string; name?: string; timestamp?: string }`
- `showAvatar`: `boolean` — 默认 `true`

## Skeleton

```vue
<Skeleton class="h-4 w-[250px]" />
<SkeletonText :lines="3" />
<SkeletonCard />
<SkeletonAvatar />
<SkeletonTable :rows="5" :cols="4" />
```

子组件：Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable

## Spinner

```vue
<Spinner />
<Spinner size="sm" />
<BlockSpinner />
<DotsSpinner />
<BarsSpinner />
```

- `size`: `'sm' | 'default' | 'lg'`

子组件：Spinner, BlockSpinner, DotsSpinner, BarsSpinner
