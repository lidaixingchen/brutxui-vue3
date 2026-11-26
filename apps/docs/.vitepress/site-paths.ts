export interface DocsSitePaths {
    base: string
    favicon: string
    manifest: string
}

export const DOCS_CANONICAL_ROOT = 'https://lidaixingchen.github.io/brutxui-vue3/'
export const CHANGELOG_GUIDE = '/guide/changelog'

export function createDocsSitePaths(isVercel: boolean): DocsSitePaths {
    const base = isVercel ? '/' : '/brutxui-vue3/'
    const resolveAsset = (asset: string) => `${base}${asset}`

    return {
        base,
        favicon: resolveAsset('favicon.svg'),
        manifest: resolveAsset('manifest.json'),
    }
}
