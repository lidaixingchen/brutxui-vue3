import fs from 'node:fs'
import path from 'node:path'
import { ProjectContext } from '../../src/lib/project-context.js'
import type { RegistryItem } from 'brutx-shared-vue'

const [consumerDirectory, registryDirectory, componentNamesJson, outputPath] = process.argv.slice(2)
const componentNames = JSON.parse(componentNamesJson) as string[]
const context = await ProjectContext.load(consumerDirectory)
const components = await Promise.all(componentNames.map(async (name) => {
    const item: RegistryItem = JSON.parse(fs.readFileSync(path.join(registryDirectory, `${name}.json`), 'utf8'))
    const files = await Promise.all(item.files.map(async file => ({
        path: file.path,
        targetPath: await context.resolveTargetPath(file.path),
        content: context.resolveImportAlias(file.content, file.path),
    })))
    return { name, files }
}))

fs.writeFileSync(outputPath, JSON.stringify(components))
