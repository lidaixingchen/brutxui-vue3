import fs from 'node:fs'
import path from 'node:path'
import { computeRegistryIntegrity, computeRegistryManifestIntegrity, type RegistryItem } from 'brutx-shared-vue'

const [source, destination, targetFilesJson] = process.argv.slice(2)
if (!source || !destination || !targetFilesJson) throw new Error('需要 Registry 源目录、快照目标目录和 C1 更新目标文件')
const targetFiles = JSON.parse(targetFilesJson) as Record<string, string>
fs.mkdirSync(destination, { recursive: true })
for (const file of fs.readdirSync(source)) {
    if (file.endsWith('.json')) fs.copyFileSync(path.join(source, file), path.join(destination, file))
}
const indexPath = path.join(destination, 'index.json')
const manifestPath = path.join(destination, 'registry-manifest.json')
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const additions: Record<string, string> = {
    button: 'export const consumerBaseline = true\n',
    'tree-select': "export { useSelectableTrigger } from '@/composables/useSelectableTrigger'\n",
}
const baselineMarker = '<!-- consumer-registry-baseline -->\n'
const baselinePrivateModulePath = 'lib/collection-item-variants.ts'
const baselinePrivateModuleMarker = '/* consumer-registry-baseline */\n'
const missingBaselineModuleOwner = 'transfer'
const missingBaselineModulePath = 'components/ui/transfer/transfer-variants.ts'
const baselinePrivateModules = new Map<string, string>()
const missingBaselineModuleCopies = new Set<string>()
for (const [name, targetPath] of Object.entries(targetFiles)) {
    const itemPath = path.join(destination, `${name}.json`)
    const item: RegistryItem = JSON.parse(fs.readFileSync(itemPath, 'utf8'))
    const targetFile = item.files.find(file => file.path === targetPath)
    if (!targetFile) throw new Error(`快照缺少 ${name} 更新目标 ${targetPath}`)
    targetFile.content = `${baselineMarker}${targetFile.content}`

    const privateModule = item.files.find(file => file.path === baselinePrivateModulePath)
    if (privateModule) {
        const baselineContent = `${baselinePrivateModuleMarker}${privateModule.content}`
        baselinePrivateModules.set(name, baselineContent)
        privateModule.content = baselineContent
    }

    const missingModuleIndex = item.files.findIndex(file => file.path === missingBaselineModulePath)
    if (missingModuleIndex >= 0) {
        item.files.splice(missingModuleIndex, 1)
        missingBaselineModuleCopies.add(name)
    }
    if (name === missingBaselineModuleOwner && !missingBaselineModuleCopies.has(name)) {
        throw new Error(`候选 Registry 缺少新增模块 ${missingBaselineModulePath}`)
    }

    const addition = additions[name]
    if (addition) {
        const entry = item.files.find(file => file.path === `components/ui/${name}/index.ts`)
        if (!entry) throw new Error(`快照缺少 ${name} 公共入口`)
        entry.content += addition
    }

    item.integrity = computeRegistryIntegrity(item.files)
    fs.writeFileSync(itemPath, `${JSON.stringify(item, null, 2)}\n`)
    const indexEntry = index.items.find((entry: { name: string }) => entry.name === name)
    if (!indexEntry) throw new Error(`快照索引缺少 ${name}`)
    indexEntry.integrity = item.integrity
    manifest.items[name].integrity = item.integrity
}
if (baselinePrivateModules.size <= 1) {
    throw new Error(`共享私有模块 ${baselinePrivateModulePath} 不足两个 C1 基线组件`)
}
const baselinePrivateModuleContents = new Set(baselinePrivateModules.values())
if (baselinePrivateModuleContents.size !== 1) {
    throw new Error(`C1 基线组件中的共享私有模块 ${baselinePrivateModulePath} 内容不一致`)
}
if (!missingBaselineModuleCopies.has(missingBaselineModuleOwner)) {
    throw new Error(`C1 基线缺少预期的新模块 ${missingBaselineModulePath}`)
}
manifest.integrity = computeRegistryManifestIntegrity(manifest)
manifest.digest = manifest.integrity
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
