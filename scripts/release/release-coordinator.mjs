import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const isWin = process.platform === 'win32';

export const ReleaseStage = {
    PREPARED: 'PREPARED',
    DRAFT_ASSETS_READY: 'DRAFT_ASSETS_READY',
    RELEASE_PUBLISHED: 'RELEASE_PUBLISHED',
    NPM_PACKAGES_READY: 'NPM_PACKAGES_READY',
    CHANNELS_ADVANCED: 'CHANNELS_ADVANCED',
    COMPLETED: 'COMPLETED',
};

export function computeSha256(contentOrBuffer) {
    return crypto.createHash('sha256').update(contentOrBuffer).digest('hex');
}

export function computeFileSha256(filePath) {
    const buffer = readFileSync(filePath);
    return computeSha256(buffer);
}

export function computeSri(contentOrBuffer) {
    const base64 = crypto.createHash('sha512').update(contentOrBuffer).digest('base64');
    return `sha512-${base64}`;
}

export function computeSha1(contentOrBuffer) {
    return crypto.createHash('sha1').update(contentOrBuffer).digest('hex');
}

/**
 * 生产环境发布适配器
 */
export class DefaultReleaseAdapter {
    constructor(options = {}) {
        this.rootDir = options.rootDir ?? repoRoot;
    }

    getUiVersion() {
        const pkgPath = path.join(this.rootDir, 'packages', 'ui', 'package.json');
        return JSON.parse(readFileSync(pkgPath, 'utf-8')).version;
    }

    getCliVersion() {
        const pkgPath = path.join(this.rootDir, 'packages', 'cli', 'package.json');
        return JSON.parse(readFileSync(pkgPath, 'utf-8')).version;
    }

    getGitHeadCommit() {
        const res = spawnSync('git', ['rev-parse', 'HEAD'], {
            cwd: this.rootDir,
            encoding: 'utf-8',
        });
        if (res.status !== 0) {
            return 'unknown';
        }
        return res.stdout.trim();
    }

    async packArtifacts(stagingDir) {
        if (existsSync(stagingDir)) {
            rmSync(stagingDir, { recursive: true, force: true });
        }
        mkdirSync(stagingDir, { recursive: true });

        // 1. Pack UI
        const uiDir = path.join(this.rootDir, 'packages', 'ui');
        const uiPackRes = spawnSync('pnpm', ['pack', '--pack-destination', stagingDir], {
            cwd: uiDir,
            encoding: 'utf-8',
            shell: isWin,
        });
        if (uiPackRes.status !== 0) {
            throw new Error(`Failed to pack brutx-ui-vue: ${uiPackRes.stderr}`);
        }

        // 2. Pack CLI
        const cliDir = path.join(this.rootDir, 'packages', 'cli');
        const cliPackRes = spawnSync('pnpm', ['pack', '--pack-destination', stagingDir], {
            cwd: cliDir,
            encoding: 'utf-8',
            shell: isWin,
        });
        if (cliPackRes.status !== 0) {
            throw new Error(`Failed to pack brutx-vue: ${cliPackRes.stderr}`);
        }

        const uiVersion = this.getUiVersion();
        const cliVersion = this.getCliVersion();
        const uiTarball = `brutx-ui-vue-${uiVersion}.tgz`;
        const cliTarball = `brutx-vue-${cliVersion}.tgz`;
        const uiTarballPath = path.join(stagingDir, uiTarball);
        const cliTarballPath = path.join(stagingDir, cliTarball);

        if (!existsSync(uiTarballPath) || !existsSync(cliTarballPath)) {
            throw new Error('Could not find packaged candidate tarballs matching versions in staging directory');
        }

        // 3. 收集 Registry 资产
        const registryDir = path.join(this.rootDir, 'packages', 'registry', 'registry');
        const registryFiles = [];
        let registryManifestDigest = '';
        if (existsSync(registryDir)) {
            const rFiles = readdirSync(registryDir).filter(f => f.endsWith('.json') && !f.endsWith('deps.json'));
            for (const rf of rFiles) {
                const src = path.join(registryDir, rf);
                const dest = path.join(stagingDir, rf);
                const content = readFileSync(src);
                writeFileSync(dest, content);
                registryFiles.push(dest);
                if (rf === 'registry-manifest.json') {
                    try {
                        const parsed = JSON.parse(content.toString('utf-8'));
                        registryManifestDigest = parsed.digest || '';
                    } catch {
                        // ignore
                    }
                }
            }
        }

        // 4. 计算生成 SHA256SUMS
        const sumsLines = [
            `${computeFileSha256(uiTarballPath)}  ${path.basename(uiTarballPath)}`,
            `${computeFileSha256(cliTarballPath)}  ${path.basename(cliTarballPath)}`,
        ];
        for (const rf of registryFiles) {
            sumsLines.push(`${computeFileSha256(rf)}  ${path.basename(rf)}`);
        }
        sumsLines.sort();

        const sha256SumsPath = path.join(stagingDir, 'SHA256SUMS');
        writeFileSync(sha256SumsPath, sumsLines.join('\n') + '\n');

        // 5. 生成 release-manifest.json
        const gitCommit = this.getGitHeadCommit();

        const releaseManifest = {
            schema: 'https://brutx.dev/schemas/release-manifest.v1.json',
            tag: `v${uiVersion}`,
            gitCommit,
            registryVersion: uiVersion,
            registryManifestDigest,
            packages: {
                'brutx-ui-vue': {
                    version: uiVersion,
                    tarball: path.basename(uiTarballPath),
                    sha256: computeFileSha256(uiTarballPath),
                    sri: computeSri(readFileSync(uiTarballPath)),
                    channel: uiVersion.includes('-') ? 'next' : 'latest',
                },
                'brutx-vue': {
                    version: cliVersion,
                    tarball: path.basename(cliTarballPath),
                    sha256: computeFileSha256(cliTarballPath),
                    sri: computeSri(readFileSync(cliTarballPath)),
                    channel: cliVersion.includes('-') ? 'next' : 'latest',
                },
            },
            assets: [
                {
                    name: path.basename(uiTarballPath),
                    size: statSync(uiTarballPath).size,
                    sha256: computeFileSha256(uiTarballPath),
                },
                {
                    name: path.basename(cliTarballPath),
                    size: statSync(cliTarballPath).size,
                    sha256: computeFileSha256(cliTarballPath),
                },
                {
                    name: 'SHA256SUMS',
                    size: statSync(sha256SumsPath).size,
                    sha256: computeFileSha256(sha256SumsPath),
                },
                ...registryFiles.map(rf => ({
                    name: path.basename(rf),
                    size: statSync(rf).size,
                    sha256: computeFileSha256(rf),
                })),
            ],
            environment: {
                node: process.version,
                lockfileSha256: existsSync(path.join(this.rootDir, 'pnpm-lock.yaml'))
                    ? computeFileSha256(path.join(this.rootDir, 'pnpm-lock.yaml'))
                    : '',
            },
        };

        const releaseManifestPath = path.join(stagingDir, 'release-manifest.json');
        writeFileSync(releaseManifestPath, JSON.stringify(releaseManifest, null, 2) + '\n');

        return {
            uiTarball: uiTarballPath,
            cliTarball: cliTarballPath,
            sha256SumsPath,
            releaseManifestPath,
            registryFiles,
        };
    }

    async getGithubRelease(tag) {
        const res = spawnSync('gh', ['release', 'view', tag, '--json', 'id,name,tagName,isDraft,isPrerelease,assets'], {
            cwd: this.rootDir,
            encoding: 'utf-8',
        });

        if (res.status !== 0) {
            return { exists: false, isDraft: false, isPrerelease: false, assets: [] };
        }

        try {
            const data = JSON.parse(res.stdout);
            return {
                exists: true,
                id: data.id,
                isDraft: Boolean(data.isDraft),
                isPrerelease: Boolean(data.isPrerelease),
                assets: Array.isArray(data.assets) ? data.assets.map(a => ({ name: a.name, digest: a.digest, size: a.size })) : [],
            };
        } catch {
            return { exists: false, isDraft: false, isPrerelease: false, assets: [] };
        }
    }

    async createDraftRelease(tag, notes, options = {}) {
        const makeLatest = options.makeLatest === true || options.makeLatest === 'true' ? 'true' : 'false';
        const tmpNotesFile = path.join(this.rootDir, 'tmp', `release-notes-${tag.replace(/[^a-zA-Z0-9._-]/g, '_')}.md`);
        mkdirSync(path.dirname(tmpNotesFile), { recursive: true });
        writeFileSync(tmpNotesFile, notes || `Release ${tag}`, 'utf-8');

        const args = [
            'release', 'create', tag,
            '--draft',
            '--title', `Release ${tag}`,
            '--notes-file', tmpNotesFile,
            `--make-latest=${makeLatest}`,
        ];
        if (options.prerelease) {
            args.push('--prerelease');
        }

        const res = spawnSync('gh', args, {
            cwd: this.rootDir,
            encoding: 'utf-8',
        });

        try {
            rmSync(tmpNotesFile, { force: true });
        } catch {
            // ignore
        }

        if (res.status !== 0) {
            throw new Error(`Failed to create GitHub Draft Release for ${tag}: ${res.stderr}`);
        }
    }

    async uploadReleaseAssets(tag, filePaths) {
        if (filePaths.length === 0) return;
        const res = spawnSync('gh', ['release', 'upload', tag, ...filePaths, '--clobber'], {
            cwd: this.rootDir,
            encoding: 'utf-8',
        });
        if (res.status !== 0) {
            throw new Error(`Failed to upload assets to GitHub Release ${tag}: ${res.stderr}`);
        }
    }

    async publishGithubRelease(tag, options = {}) {
        const makeLatest = options.makeLatest === true || options.makeLatest === 'true' ? 'true' : 'false';
        const args = [
            'release', 'edit', tag,
            '--draft=false',
            `--make-latest=${makeLatest}`,
        ];
        if (options.prerelease) {
            args.push('--prerelease');
        }

        const res = spawnSync('gh', args, {
            cwd: this.rootDir,
            encoding: 'utf-8',
        });
        if (res.status !== 0) {
            throw new Error(`Failed to promote draft release ${tag} to published: ${res.stderr}`);
        }
    }

    async setReleaseLatest(tag, makeLatest = 'true') {
        const makeLatestStr = makeLatest === true || makeLatest === 'true' ? 'true' : 'false';
        const res = spawnSync('gh', ['release', 'edit', tag, `--make-latest=${makeLatestStr}`], {
            cwd: this.rootDir,
            encoding: 'utf-8',
        });
        if (res.status !== 0) {
            throw new Error(`Failed to set --make-latest=${makeLatestStr} for release ${tag}: ${res.stderr}`);
        }
    }

    async getNpmPackageInfo(pkgName, version) {
        const res = spawnSync('pnpm', ['view', `${pkgName}@${version}`, '--json'], {
            cwd: this.rootDir,
            encoding: 'utf-8',
            shell: isWin,
        });

        if (res.status !== 0) {
            return { published: false, distTags: {} };
        }

        try {
            const data = JSON.parse(res.stdout);
            const distTagsRes = spawnSync('pnpm', ['view', pkgName, 'dist-tags', '--json'], {
                cwd: this.rootDir,
                encoding: 'utf-8',
                shell: isWin,
            });
            let distTags = {};
            if (distTagsRes.status === 0) {
                try {
                    distTags = JSON.parse(distTagsRes.stdout);
                } catch {
                    // ignore
                }
            }

            return {
                published: true,
                distTags,
                integrity: data.dist?.integrity,
                shasum: data.dist?.shasum,
            };
        } catch {
            return { published: false, distTags: {} };
        }
    }

    async publishNpmPackage(tarballPath, options = {}) {
        const args = ['publish', tarballPath, '--access', 'public', '--no-git-checks'];
        if (options.tag) {
            args.push('--tag', options.tag);
        }
        if (options.provenance) {
            args.push('--provenance');
        }

        const res = spawnSync('pnpm', args, {
            cwd: this.rootDir,
            encoding: 'utf-8',
            shell: isWin,
        });

        if (res.status !== 0) {
            const out = `${res.stdout}\n${res.stderr}`;
            if (out.includes('EPUBLISHCONFLICT') || out.includes('already published')) {
                throw new Error(`EPUBLISHCONFLICT: ${out}`);
            }
            throw new Error(`pnpm publish failed for ${tarballPath}: ${out}`);
        }
    }

    async advanceNpmDistTag(pkgName, version, distTag) {
        const res = spawnSync('pnpm', ['dist-tag', 'add', `${pkgName}@${version}`, distTag], {
            cwd: this.rootDir,
            encoding: 'utf-8',
            shell: isWin,
        });
        if (res.status !== 0) {
            throw new Error(`Failed to advance dist-tag ${distTag} for ${pkgName}@${version}: ${res.stderr}`);
        }
    }
}

/**
 * 统一发布状态机协调器
 */
export class ReleaseCoordinator {
    constructor(adapter = new DefaultReleaseAdapter(), options = {}) {
        this.adapter = adapter;
        this.options = options;
    }

    isPrerelease(version) {
        return version.includes('-') || version.includes('alpha') || version.includes('beta') || version.includes('rc');
    }

    resolveChannel(version) {
        if (!this.isPrerelease(version)) return 'latest';
        const match = version.match(/-([a-zA-Z]+)/);
        return match ? match[1] : 'next';
    }

    async execute(options = {}) {
        const stagingDir = options.stagingDir ?? path.join(repoRoot, 'tmp', 'release-staging');
        const uiVersion = this.adapter.getUiVersion();
        const cliVersion = this.adapter.getCliVersion();
        const releaseTag = options.tag ?? `v${uiVersion}`;
        const isPrerelease = this.isPrerelease(uiVersion);
        const channel = this.resolveChannel(uiVersion);
        const isStable = !isPrerelease;

        const summary = {
            tag: releaseTag,
            uiVersion,
            cliVersion,
            channel,
            isStable,
            stagesCompleted: [],
            recovered: false,
            publishedPackages: [],
            verifiedPackages: [],
        };

        // 阶段 1：打包密封资产 (PREPARED)
        const artifacts = await this.adapter.packArtifacts(stagingDir);
        const uiTarballHash = computeFileSha256(artifacts.uiTarball);
        const cliTarballHash = computeFileSha256(artifacts.cliTarball);
        summary.stagesCompleted.push(ReleaseStage.PREPARED);

        // 阶段 2：草稿与资产完整性核验 (DRAFT_ASSETS_READY)
        const ghRelease = await this.adapter.getGithubRelease(releaseTag);
        let draftCreated = false;

        if (!ghRelease.exists) {
            await this.adapter.createDraftRelease(releaseTag, options.releaseNotes || `Release ${releaseTag}`, {
                makeLatest: 'false',
                prerelease: isPrerelease,
            });
            draftCreated = true;
        } else {
            summary.recovered = true;
        }

        const allAssetPaths = [
            artifacts.uiTarball,
            artifacts.cliTarball,
            artifacts.sha256SumsPath,
            artifacts.releaseManifestPath,
            ...artifacts.registryFiles,
        ];

        const existingAssetMap = new Map((ghRelease.assets || []).map(a => [a.name, a]));
        const missingAssets = [];

        for (const fp of allAssetPaths) {
            const name = path.basename(fp);
            const existing = existingAssetMap.get(name);
            if (!existing) {
                missingAssets.push(fp);
            } else {
                const localSize = statSync(fp).size;
                if (existing.size !== undefined && existing.size !== localSize) {
                    missingAssets.push(fp);
                }
            }
        }

        if (missingAssets.length > 0) {
            await this.adapter.uploadReleaseAssets(releaseTag, missingAssets);
        }
        summary.stagesCompleted.push(ReleaseStage.DRAFT_ASSETS_READY);

        // 阶段 3：Release 公开 (RELEASE_PUBLISHED)
        // 关键契约：必须显式发送 make_latest: "false"，先公开特定 tag 的资产下载能力，暂不推进 latest 指针
        const currentGh = await this.adapter.getGithubRelease(releaseTag);
        if (currentGh.isDraft) {
            await this.adapter.publishGithubRelease(releaseTag, {
                makeLatest: 'false',
                prerelease: isPrerelease,
            });
        }
        summary.stagesCompleted.push(ReleaseStage.RELEASE_PUBLISHED);

        // 阶段 4：NPM 版本发布与确定性校验 (NPM_PACKAGES_READY)
        const packagesToPublish = [
            { name: 'brutx-ui-vue', version: uiVersion, tarball: artifacts.uiTarball, hash: uiTarballHash },
            { name: 'brutx-vue', version: cliVersion, tarball: artifacts.cliTarball, hash: cliTarballHash },
        ];

        for (const pkg of packagesToPublish) {
            const info = await this.adapter.getNpmPackageInfo(pkg.name, pkg.version);
            if (info.published) {
                // 如果已在 npm 存在，核验远程 shasum 或 integrity 是否完全匹配
                const tarballSha1 = computeSha1(readFileSync(pkg.tarball));
                const tarballSri = computeSri(readFileSync(pkg.tarball));

                if (info.shasum && info.shasum !== tarballSha1) {
                    throw new Error(
                        `Release blocked: Package "${pkg.name}@${pkg.version}" already published on npm with different shasum! ` +
                        `Expected: ${tarballSha1}, remote: ${info.shasum}. Cannot overwrite immutable releases.`
                    );
                }
                if (info.integrity && info.integrity !== tarballSri) {
                    throw new Error(
                        `Release blocked: Package "${pkg.name}@${pkg.version}" already published on npm with different integrity! ` +
                        `Expected: ${tarballSri}, remote: ${info.integrity}. Cannot overwrite immutable releases.`
                    );
                }
                summary.verifiedPackages.push(pkg.name);
            } else {
                try {
                    await this.adapter.publishNpmPackage(pkg.tarball, {
                        tag: isStable ? 'latest' : channel,
                        provenance: options.provenance ?? false,
                    });
                    summary.publishedPackages.push(pkg.name);
                } catch (err) {
                    if (err.message && err.message.includes('EPUBLISHCONFLICT')) {
                        const postInfo = await this.adapter.getNpmPackageInfo(pkg.name, pkg.version);
                        if (postInfo.published) {
                            const tarballSha1 = computeSha1(readFileSync(pkg.tarball));
                            const tarballSri = computeSri(readFileSync(pkg.tarball));
                            if (postInfo.shasum && postInfo.shasum !== tarballSha1) {
                                throw new Error(
                                    `Release blocked on conflict: Package "${pkg.name}@${pkg.version}" already published on npm with different shasum! ` +
                                    `Expected: ${tarballSha1}, remote: ${postInfo.shasum}.`
                                );
                            }
                            if (postInfo.integrity && postInfo.integrity !== tarballSri) {
                                throw new Error(
                                    `Release blocked on conflict: Package "${pkg.name}@${pkg.version}" already published on npm with different integrity! ` +
                                    `Expected: ${tarballSri}, remote: ${postInfo.integrity}.`
                                );
                            }
                            summary.verifiedPackages.push(pkg.name);
                        } else {
                            throw err;
                        }
                    } else {
                        throw err;
                    }
                }
            }
        }
        summary.stagesCompleted.push(ReleaseStage.NPM_PACKAGES_READY);

        // 阶段 5：渠道与最新指针推进 (CHANNELS_ADVANCED)
        // 全部 npm 包就绪后，若为稳定版本推进 GitHub make_latest: "true"
        if (isStable) {
            await this.adapter.setReleaseLatest(releaseTag, 'true');
        }

        // 推进并核验 npm dist-tag
        for (const pkg of packagesToPublish) {
            const targetTag = isStable ? 'latest' : channel;
            const remoteInfo = await this.adapter.getNpmPackageInfo(pkg.name, pkg.version);
            const currentPointer = remoteInfo.distTags?.[targetTag];

            if (currentPointer !== pkg.version) {
                await this.adapter.advanceNpmDistTag(pkg.name, pkg.version, targetTag);
            }

            // 指针核验
            const verifiedInfo = await this.adapter.getNpmPackageInfo(pkg.name, pkg.version);
            if (verifiedInfo.distTags?.[targetTag] !== pkg.version) {
                throw new Error(
                    `Failed to verify npm dist-tag "${targetTag}" for "${pkg.name}". ` +
                    `Expected "${pkg.version}", but got "${verifiedInfo.distTags?.[targetTag]}".`
                );
            }
        }
        summary.stagesCompleted.push(ReleaseStage.CHANNELS_ADVANCED);

        summary.stagesCompleted.push(ReleaseStage.COMPLETED);
        return summary;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    let tag;
    let stagingDir;
    let provenance = false;
    let dryRun = false;
    let releaseNotes;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--tag' && args[i + 1]) {
            tag = args[++i];
        } else if (args[i] === '--staging-dir' && args[i + 1]) {
            stagingDir = args[++i];
        } else if (args[i] === '--release-notes-file' && args[i + 1]) {
            const rnf = args[++i];
            if (existsSync(rnf)) {
                releaseNotes = readFileSync(rnf, 'utf-8');
            }
        } else if (args[i] === '--provenance') {
            provenance = true;
        } else if (args[i] === '--dry-run') {
            dryRun = true;
        }
    }

    const coordinator = new ReleaseCoordinator();
    coordinator.execute({ tag, stagingDir, provenance, dryRun, releaseNotes })
        .then((summary) => {
            console.log('[release-coordinator] Release completed successfully:');
            console.log(JSON.stringify(summary, null, 2));
        })
        .catch((err) => {
            console.error('[release-coordinator] Release failed:', err);
            process.exit(1);
        });
}
