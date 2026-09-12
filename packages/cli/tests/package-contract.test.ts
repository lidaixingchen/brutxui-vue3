import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
    FileEntry as SharedFileEntry,
    FileStat as SharedFileStat,
    FsRemoveOptions as SharedFsRemoveOptions,
    FileSystemAdapter as SharedFileSystemAdapter,
} from 'brutx-shared-vue/fs'
import type {
    FileEntry as CliFileEntry,
    FileStat as CliFileStat,
    FsRemoveOptions as CliFsRemoveOptions,
    FileSystemAdapter as CliFileSystemAdapter,
} from '../src/lib/fs/file-system-adapter'
import type {
    RegistryItem as SharedRegistryItem,
    RegistryFile as SharedRegistryFile,
} from 'brutx-shared-vue'
import type {
    RegistryItem as CliRegistryItem,
    RegistryFile as CliRegistryFile,
} from '../src/lib/types'

type AssertEqual<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false
type _TypeParityGuard = [
    AssertEqual<CliFileEntry, SharedFileEntry>,
    AssertEqual<CliFileStat, SharedFileStat>,
    AssertEqual<CliFsRemoveOptions, SharedFsRemoveOptions>,
    AssertEqual<CliFileSystemAdapter, SharedFileSystemAdapter>,
    AssertEqual<CliRegistryItem, SharedRegistryItem>,
    AssertEqual<CliRegistryFile, SharedRegistryFile>,
][number] extends true ? true : never

describe('CLI Package Delivery Contract', () => {
    const cliRoot = resolve(__dirname, '..')
    const packageJsonPath = resolve(cliRoot, 'package.json')
    const apiDtsPath = resolve(cliRoot, 'dist/api.d.ts')
    const apiJsPath = resolve(cliRoot, 'dist/api.js')
    const indexJsPath = resolve(cliRoot, 'dist/index.js')

    const privatePackageName = 'brutx-shared-vue'
    const privateImportRegex = new RegExp(`['"]${privatePackageName}(?:/[^'"]*)?['"]`)

    it('package.json dependencies must not declare private shared package', () => {
        const pkgContent = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
            dependencies?: Record<string, string>
            peerDependencies?: Record<string, string>
            optionalDependencies?: Record<string, string>
        }

        const productionDeps = {
            ...pkgContent.dependencies,
            ...pkgContent.peerDependencies,
            ...pkgContent.optionalDependencies,
        }

        expect(productionDeps).not.toHaveProperty(privatePackageName)
    })

    it('dist JS bundles must inline private shared package code', () => {
        expect(existsSync(apiJsPath)).toBe(true)
        expect(existsSync(indexJsPath)).toBe(true)

        const apiJs = readFileSync(apiJsPath, 'utf-8')
        const indexJs = readFileSync(indexJsPath, 'utf-8')

        expect(privateImportRegex.test(apiJs)).toBe(false)
        expect(privateImportRegex.test(indexJs)).toBe(false)
    })

    it('dist api.d.ts declaration must inline private shared types without external imports', () => {
        expect(existsSync(apiDtsPath)).toBe(true)

        const apiDts = readFileSync(apiDtsPath, 'utf-8')
        expect(privateImportRegex.test(apiDts)).toBe(false)
    })
})
