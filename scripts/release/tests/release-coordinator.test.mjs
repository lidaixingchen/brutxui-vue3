import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    ReleaseCoordinator,
    ReleaseStage,
    computeSha256,
    computeFileSha256,
    computeSha1,
    computeSri,
} from '../release-coordinator.mjs';

/**
 * 内存/临时目录测试适配器
 */
class MockReleaseAdapter {
    constructor(options = {}) {
        this.uiVersion = options.uiVersion ?? '0.2.0';
        this.cliVersion = options.cliVersion ?? '0.2.0';
        this.gitHeadCommit = options.gitHeadCommit ?? 'abc1234567890abcdef1234567890abcdef123456';
        this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-mock-'));

        // 模拟远程状态
        this.githubRelease = options.initialGithubRelease ?? {
            exists: false,
            isDraft: false,
            isPrerelease: false,
            assets: [],
        };
        this.npmPackages = options.initialNpmPackages ?? {
            'brutx-ui-vue': { published: false, distTags: {}, shasum: null, integrity: null },
            'brutx-vue': { published: false, distTags: {}, shasum: null, integrity: null },
        };

        // 记录调用历史
        this.calls = [];
        this.uploadedAssets = [];
        this.publishedNpmPackages = [];
        this.advancedDistTags = [];
        this.failAdvanceDistTag = options.failAdvanceDistTag ?? false;
    }

    cleanup() {
        fs.rmSync(this.tmpDir, { recursive: true, force: true });
    }

    getUiVersion() {
        return this.uiVersion;
    }

    getCliVersion() {
        return this.cliVersion;
    }

    getGitHeadCommit() {
        return this.gitHeadCommit;
    }

    async packArtifacts(stagingDir) {
        fs.mkdirSync(stagingDir, { recursive: true });

        const uiTarballPath = path.join(stagingDir, `brutx-ui-vue-${this.uiVersion}.tgz`);
        const cliTarballPath = path.join(stagingDir, `brutx-vue-${this.cliVersion}.tgz`);
        const regFile1 = path.join(stagingDir, 'button.json');
        const regFile2 = path.join(stagingDir, 'registry-manifest.json');

        fs.writeFileSync(uiTarballPath, 'mock-ui-tarball-content');
        fs.writeFileSync(cliTarballPath, 'mock-cli-tarball-content');
        fs.writeFileSync(regFile1, JSON.stringify({ name: 'button', type: 'component' }));
        fs.writeFileSync(regFile2, JSON.stringify({ name: 'manifest', digest: 'mock-digest-123' }));

        const registryFiles = [regFile1, regFile2];

        const sumsLines = [
            `${computeFileSha256(uiTarballPath)}  ${path.basename(uiTarballPath)}`,
            `${computeFileSha256(cliTarballPath)}  ${path.basename(cliTarballPath)}`,
            ...registryFiles.map(rf => `${computeFileSha256(rf)}  ${path.basename(rf)}`),
        ].sort();

        const sha256SumsPath = path.join(stagingDir, 'SHA256SUMS');
        fs.writeFileSync(sha256SumsPath, sumsLines.join('\n') + '\n');

        const releaseManifestPath = path.join(stagingDir, 'release-manifest.json');
        fs.writeFileSync(releaseManifestPath, JSON.stringify({
            schema: 'https://brutx.dev/schemas/release-manifest.v1.json',
            tag: `v${this.uiVersion}`,
            gitCommit: this.gitHeadCommit,
        }, null, 2));

        return {
            uiTarball: uiTarballPath,
            cliTarball: cliTarballPath,
            sha256SumsPath,
            releaseManifestPath,
            registryFiles,
        };
    }

    async getGithubRelease(tag) {
        this.calls.push({ method: 'getGithubRelease', tag });
        return { ...this.githubRelease };
    }

    async createDraftRelease(tag, notes, options = {}) {
        this.calls.push({ method: 'createDraftRelease', tag, notes, options });
        this.githubRelease = {
            exists: true,
            isDraft: true,
            isPrerelease: Boolean(options.prerelease),
            makeLatest: options.makeLatest,
            assets: [],
        };
    }

    async uploadReleaseAssets(tag, filePaths) {
        this.calls.push({ method: 'uploadReleaseAssets', tag, filePaths });
        for (const fp of filePaths) {
            const name = path.basename(fp);
            this.uploadedAssets.push(name);
            this.githubRelease.assets.push({
                name,
                size: fs.statSync(fp).size,
                digest: computeFileSha256(fp),
            });
        }
    }

    async publishGithubRelease(tag, options = {}) {
        this.calls.push({ method: 'publishGithubRelease', tag, options });
        this.githubRelease.isDraft = false;
        this.githubRelease.publishedMakeLatest = options.makeLatest;
    }

    async setReleaseLatest(tag, makeLatest = 'true') {
        this.calls.push({ method: 'setReleaseLatest', tag, makeLatest });
        this.githubRelease.latest = makeLatest === 'true';
    }

    async getNpmPackageInfo(pkgName, version) {
        this.calls.push({ method: 'getNpmPackageInfo', pkgName, version });
        return this.npmPackages[pkgName] ?? { published: false, distTags: {} };
    }

    async publishNpmPackage(tarballPath, options = {}) {
        this.calls.push({ method: 'publishNpmPackage', tarballPath, options });
        const name = path.basename(tarballPath).startsWith('brutx-ui-vue') ? 'brutx-ui-vue' : 'brutx-vue';
        const buffer = fs.readFileSync(tarballPath);
        const shasum = computeSha1(buffer);
        const integrity = computeSri(buffer);

        const targetVersion = path.basename(tarballPath).split('-').pop().replace('.tgz', '');
        const initialTagVersion = this.failAdvanceDistTag ? '0.0.0-outdated' : targetVersion;

        this.npmPackages[name] = {
            published: true,
            distTags: { [options.tag || 'latest']: initialTagVersion },
            shasum,
            integrity,
        };
        this.publishedNpmPackages.push({ name, tarballPath, options });
    }

    async advanceNpmDistTag(pkgName, version, distTag) {
        this.calls.push({ method: 'advanceNpmDistTag', pkgName, version, distTag });
        this.advancedDistTags.push({ pkgName, version, distTag });
        if (!this.failAdvanceDistTag) {
            if (!this.npmPackages[pkgName]) {
                this.npmPackages[pkgName] = { published: true, distTags: {} };
            }
            this.npmPackages[pkgName].distTags[distTag] = version;
        }
    }
}

describe('ReleaseCoordinator 状态机与故障恢复测试', () => {
    it('全流程干净稳定版本发布：完整阶段流转并正确推进 latest 指针', async () => {
        const adapter = new MockReleaseAdapter({ uiVersion: '0.2.0', cliVersion: '0.2.0' });
        try {
            const coordinator = new ReleaseCoordinator(adapter);
            const stagingDir = path.join(adapter.tmpDir, 'staging');

            const summary = await coordinator.execute({ stagingDir });

            // 验证流转状态
            assert.deepEqual(summary.stagesCompleted, [
                ReleaseStage.PREPARED,
                ReleaseStage.DRAFT_ASSETS_READY,
                ReleaseStage.RELEASE_PUBLISHED,
                ReleaseStage.NPM_PACKAGES_READY,
                ReleaseStage.CHANNELS_ADVANCED,
                ReleaseStage.COMPLETED,
            ]);

            assert.equal(summary.isStable, true);
            assert.equal(summary.recovered, false);
            assert.deepEqual(summary.publishedPackages, ['brutx-ui-vue', 'brutx-vue']);
            assert.deepEqual(summary.verifiedPackages, []);

            // 验证 Release 与资产
            assert.equal(adapter.githubRelease.exists, true);
            assert.equal(adapter.githubRelease.isDraft, false);
            assert.equal(adapter.githubRelease.latest, true);
            assert.ok(adapter.uploadedAssets.includes('brutx-ui-vue-0.2.0.tgz'));
            assert.ok(adapter.uploadedAssets.includes('brutx-vue-0.2.0.tgz'));
            assert.ok(adapter.uploadedAssets.includes('SHA256SUMS'));
            assert.ok(adapter.uploadedAssets.includes('release-manifest.json'));

            // 验证草稿公开时显式传递了 make_latest: "false"，后续才推进 latest
            const publishCall = adapter.calls.find(c => c.method === 'publishGithubRelease');
            assert.equal(publishCall.options.makeLatest, 'false');

            const latestCall = adapter.calls.find(c => c.method === 'setReleaseLatest');
            assert.equal(latestCall.makeLatest, 'true');

            // 验证 npm dist-tag
            assert.equal(adapter.npmPackages['brutx-ui-vue'].distTags.latest, '0.2.0');
            assert.equal(adapter.npmPackages['brutx-vue'].distTags.latest, '0.2.0');
        } finally {
            adapter.cleanup();
        }
    });

    it('预发布版本流转：使用独立渠道，绝不推进稳定 latest', async () => {
        const adapter = new MockReleaseAdapter({ uiVersion: '0.2.0-beta.1', cliVersion: '0.2.0-beta.1' });
        try {
            const coordinator = new ReleaseCoordinator(adapter);
            const stagingDir = path.join(adapter.tmpDir, 'staging');

            const summary = await coordinator.execute({ stagingDir });

            assert.equal(summary.isStable, false);
            assert.equal(summary.channel, 'beta');
            assert.deepEqual(summary.publishedPackages, ['brutx-ui-vue', 'brutx-vue']);

            // GitHub 保持不是 latest，且有 prerelease 标记
            assert.equal(adapter.githubRelease.latest, undefined);
            assert.equal(adapter.githubRelease.isPrerelease, true);

            // npm dist-tags 推进 beta，不触碰 latest
            assert.equal(adapter.npmPackages['brutx-ui-vue'].distTags.beta, '0.2.0-beta.1');
            assert.equal(adapter.npmPackages['brutx-ui-vue'].distTags.latest, undefined);
        } finally {
            adapter.cleanup();
        }
    });

    it('中断幂等恢复：草稿已存在且已有部分资产，仅补传缺失资产', async () => {
        const expectedUiSize = Buffer.byteLength('mock-ui-tarball-content');
        const adapter = new MockReleaseAdapter({
            uiVersion: '0.2.0',
            cliVersion: '0.2.0',
            initialGithubRelease: {
                exists: true,
                isDraft: true,
                isPrerelease: false,
                assets: [
                    { name: 'brutx-ui-vue-0.2.0.tgz', size: expectedUiSize, digest: 'mock' },
                ],
            },
        });
        try {
            const coordinator = new ReleaseCoordinator(adapter);
            const stagingDir = path.join(adapter.tmpDir, 'staging');

            const summary = await coordinator.execute({ stagingDir });

            assert.equal(summary.recovered, true);
            // 不会重复创建草稿
            const createCalls = adapter.calls.filter(c => c.method === 'createDraftRelease');
            assert.equal(createCalls.length, 0);

            // 仅补传缺失的资产（不重复上传已有资产 brutx-ui-vue-0.2.0.tgz）
            assert.ok(!adapter.uploadedAssets.includes('brutx-ui-vue-0.2.0.tgz'));
            assert.ok(adapter.uploadedAssets.includes('brutx-vue-0.2.0.tgz'));
            assert.ok(adapter.uploadedAssets.includes('SHA256SUMS'));
        } finally {
            adapter.cleanup();
        }
    });

    it('npm 幂等跳过：已有版本且 shasum 一致时安全跳过，发布其余未完成包', async () => {
        const tarballBuffer = Buffer.from('mock-ui-tarball-content');
        const expectedSha1 = computeSha1(tarballBuffer);
        const expectedSri = computeSri(tarballBuffer);

        const adapter = new MockReleaseAdapter({
            uiVersion: '0.2.0',
            cliVersion: '0.2.0',
            initialNpmPackages: {
                'brutx-ui-vue': {
                    published: true,
                    distTags: { latest: '0.2.0' },
                    shasum: expectedSha1,
                    integrity: expectedSri,
                },
                'brutx-vue': {
                    published: false,
                    distTags: {},
                },
            },
        });
        try {
            const coordinator = new ReleaseCoordinator(adapter);
            const stagingDir = path.join(adapter.tmpDir, 'staging');

            const summary = await coordinator.execute({ stagingDir });

            // brutx-ui-vue 校验一致跳过，brutx-vue 执行发布
            assert.deepEqual(summary.verifiedPackages, ['brutx-ui-vue']);
            assert.deepEqual(summary.publishedPackages, ['brutx-vue']);

            const publishCalls = adapter.calls.filter(c => c.method === 'publishNpmPackage');
            assert.equal(publishCalls.length, 1);
            assert.ok(publishCalls[0].tarballPath.includes('brutx-vue-0.2.0.tgz'));
        } finally {
            adapter.cleanup();
        }
    });

    it('不可变发布防御：已有版本但 shasum 不一致时立即熔断阻断', async () => {
        const adapter = new MockReleaseAdapter({
            uiVersion: '0.2.0',
            cliVersion: '0.2.0',
            initialNpmPackages: {
                'brutx-ui-vue': {
                    published: true,
                    distTags: { latest: '0.2.0' },
                    shasum: 'mismatched-remote-sha1-hash',
                },
                'brutx-vue': {
                    published: false,
                    distTags: {},
                },
            },
        });
        try {
            const coordinator = new ReleaseCoordinator(adapter);
            const stagingDir = path.join(adapter.tmpDir, 'staging');

            await assert.rejects(
                async () => {
                    await coordinator.execute({ stagingDir });
                },
                /Release blocked: Package "brutx-ui-vue@0.2.0" already published on npm with different shasum/
            );
        } finally {
            adapter.cleanup();
        }
    });

    it('指针核验熔断：npm dist-tag 推进未生效时抛出明确异常', async () => {
        const adapter = new MockReleaseAdapter({
            uiVersion: '0.2.0',
            cliVersion: '0.2.0',
            failAdvanceDistTag: true,
        });
        try {
            const coordinator = new ReleaseCoordinator(adapter);
            const stagingDir = path.join(adapter.tmpDir, 'staging');

            await assert.rejects(
                async () => {
                    await coordinator.execute({ stagingDir });
                },
                /Failed to verify npm dist-tag "latest" for "brutx-ui-vue"/
            );
        } finally {
            adapter.cleanup();
        }
    });
});
