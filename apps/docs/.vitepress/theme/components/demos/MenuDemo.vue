<script setup lang="ts">
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu, Button } from 'brutx-ui-vue'
import { Home, Settings, Users, Shield, Compass } from '@lucide/vue'

const active = ref('home')
const mode = ref<'vertical' | 'horizontal'>('vertical')

function toggleMode() {
    mode.value = mode.value === 'vertical' ? 'horizontal' : 'vertical'
}

function handleSelect(index: string) {
    active.value = index
}
</script>

<template>
    <div class="flex flex-col gap-4 w-full max-w-xl mx-auto p-4 bg-brutal-bg border-3 border-brutal rounded-brutal shadow-brutal">
        <div class="flex justify-between items-center pb-2 border-b-3 border-brutal">
            <span class="font-black text-sm uppercase tracking-wider flex items-center gap-1.5 text-brutal-fg">
                <Compass class="w-4 h-4 stroke-3" />
                Menu 导航菜单
            </span>
            <Button size="sm" variant="outline" @click="toggleMode" class="text-xs py-1">
                切换为 {{ mode === 'vertical' ? '水平模式' : '垂直模式' }}
            </Button>
        </div>
        
        <div class="flex justify-center items-center py-6 min-h-[220px]">
            <Menu :mode="mode" :default-active="active" @select="handleSelect" class="transition-all duration-300">
                <MenuItem index="home">
                    <Home class="w-4 h-4 stroke-3" />
                    <span>首页</span>
                </MenuItem>
                
                <SubMenu index="admin">
                    <template #title>
                        <Shield class="w-4 h-4 stroke-3" />
                        <span>管理面板</span>
                    </template>
                    <MenuItem index="admin-users">
                        <Users class="w-4 h-4 stroke-3" />
                        <span>用户管理</span>
                    </MenuItem>
                    <MenuItem index="admin-settings">
                        <Settings class="w-4 h-4 stroke-3" />
                        <span>系统设置</span>
                    </MenuItem>
                </SubMenu>
                
                <MenuItem index="about" inset>
                    <span>关于我们</span>
                </MenuItem>
                
                <MenuItem index="disabled-item" inset disabled>
                    <span>禁用项目</span>
                </MenuItem>
            </Menu>
        </div>
    </div>
</template>
