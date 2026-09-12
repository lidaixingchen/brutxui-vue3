import fs from 'node:fs'
import path from 'node:path'
import { computeRegistryIntegrity, computeRegistryManifestIntegrity, type RegistryItem } from 'brutx-shared-vue'

const [source, destination] = process.argv.slice(2)
if (!source || !destination) throw new Error('需要 Registry 源目录和快照目标目录')
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
for (const [name, addition] of Object.entries(additions)) {
    const itemPath = path.join(destination, `${name}.json`)
    const item: RegistryItem = JSON.parse(fs.readFileSync(itemPath, 'utf8'))
    const entry = item.files.find(file => file.path === `components/ui/${name}/index.ts`)
    if (!entry) throw new Error(`快照缺少 ${name} 公共入口`)
    entry.content += addition
    item.integrity = computeRegistryIntegrity(item.files)
    fs.writeFileSync(itemPath, `${JSON.stringify(item, null, 2)}\n`)
    index.items.find((entry: { name: string }) => entry.name === name).integrity = item.integrity
    manifest.items[name].integrity = item.integrity
}
manifest.integrity = computeRegistryManifestIntegrity(manifest)
manifest.digest = manifest.integrity
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
