# 反馈与浮层组件

## Dialog

```vue
<Dialog>
  <DialogTrigger as-child><Button>打开</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    内容
    <DialogFooter>
      <Button variant="outline">取消</Button>
      <Button variant="primary">确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

子组件：Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription

## AlertDialog

确认弹窗。

```vue
<AlertDialog>
  <AlertDialogTrigger as-child><Button variant="danger">删除</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>此操作不可撤销。</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction>确认删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

子组件：AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel

## Alert

```vue
<Alert>
  <AlertTitle>提示</AlertTitle>
  <AlertDescription>提示信息。</AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>错误</AlertTitle>
  <AlertDescription>操作失败。</AlertDescription>
</Alert>
```

- `variant`: `'default' | 'destructive'`

## Toast

```vue
<script setup lang="ts">
import { useToast } from 'brutx-ui-vue'
const { toast } = useToast()

toast({ title: '成功', description: '已保存。', variant: 'success' })
</script>
```

- `title`: `string`
- `description`: `string`
- `variant`: `'default' | 'success' | 'destructive' | 'info'`

## Popover

```vue
<Popover>
  <PopoverTrigger as-child><Button>打开</Button></PopoverTrigger>
  <PopoverContent align="center" :side-offset="8">弹出内容</PopoverContent>
</Popover>
```

- `PopoverContent.align`: `'center' | 'start' | 'end'` — 默认 `'center'`
- `PopoverContent.sideOffset`: `number` — 默认 `8`

## Tooltip

```vue
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as-child><Button>悬停我</Button></TooltipTrigger>
    <TooltipContent :side-offset="6">提示内容</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

- `TooltipContent.sideOffset`: `number` — 默认 `6`

## DropdownMenu

```vue
<DropdownMenu>
  <DropdownMenuTrigger as-child><Button>菜单</Button></DropdownMenuTrigger>
  <DropdownMenuContent :side-offset="6">
    <DropdownMenuItem>编辑</DropdownMenuItem>
    <DropdownMenuItem>复制</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>删除</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

- `DropdownMenuContent.sideOffset`: `number` — 默认 `6`

子组件：DropdownMenu, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuRadioGroup, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSubTrigger, DropdownMenuSubContent

## Command

命令面板。

```vue
<Command>
  <CommandInput placeholder="搜索..." />
  <CommandList>
    <CommandEmpty>没有结果</CommandEmpty>
    <CommandGroup heading="操作">
      <CommandItem>新建文件</CommandItem>
      <CommandItem>打开设置</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="最近">
      <CommandItem>项目 A</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

子组件：Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut
