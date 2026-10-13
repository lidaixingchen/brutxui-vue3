export interface DocsSitePaths {
    base: string
    favicon: string
    manifest: string
}

export function createDocsSitePaths(isVercel: boolean): DocsSitePaths {
    const base = isVercel ? '/' : '/brutxui-vue3/'
    const resolveAsset = (asset: string) => `${base}${asset}`

    return {
        base,
        favicon: resolveAsset('favicon.svg'),
        manifest: resolveAsset('manifest.json'),
    }
}
