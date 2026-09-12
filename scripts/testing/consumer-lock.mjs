import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const INTEGRITY_TOKEN = '__BRUTX_ARTIFACT_INTEGRITY__'

export function installLockedConsumer({ directory, id, artifact, lockDirectory, evidenceDirectory, env }) {
    const artifactDirectory = path.join(directory, 'artifacts')
    fs.mkdirSync(artifactDirectory, { recursive: true })
    const artifactName = `${artifact.name}.tgz`
    fs.copyFileSync(artifact.tarballPath, path.join(artifactDirectory, artifactName))
    const packagePath = path.join(directory, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    packageJson.dependencies[artifact.name] = `file:artifacts/${artifactName}`
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
    const integrity = `sha512-${createHash('sha512').update(fs.readFileSync(artifact.tarballPath)).digest('base64')}`
    const templatePath = path.join(lockDirectory, `${id.toLowerCase()}-lock.yaml`)
    const lockPath = path.join(directory, 'pnpm-lock.yaml')
    const run = (args) => execFileSync('pnpm', args, { cwd: directory, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

    if (env.BRUTX_UPDATE_CONSUMER_LOCKS === '1') {
        run(['install', '--lockfile-only', '--ignore-scripts'])
        const resolvedLock = fs.readFileSync(lockPath, 'utf8')
        if (!resolvedLock.includes(integrity)) throw new Error(`${id} 锁文件缺少候选产物摘要`)
        fs.mkdirSync(lockDirectory, { recursive: true })
        fs.writeFileSync(templatePath, resolvedLock.replace(integrity, INTEGRITY_TOKEN))
    }
    if (!fs.existsSync(templatePath)) {
        throw new Error(`${id} 缺少消费者锁文件；使用 BRUTX_UPDATE_CONSUMER_LOCKS=1 显式更新后审查锁文件`)
    }
    const template = fs.readFileSync(templatePath, 'utf8')
    if (template.indexOf(INTEGRITY_TOKEN) === -1 || template.indexOf(INTEGRITY_TOKEN) !== template.lastIndexOf(INTEGRITY_TOKEN)) {
        throw new Error(`${id} 锁文件必须包含唯一候选产物摘要`)
    }
    fs.writeFileSync(lockPath, template.replace(INTEGRITY_TOKEN, integrity))
    const installOutput = run(['install', '--frozen-lockfile', '--ignore-scripts'])
    const evidence = path.join(evidenceDirectory, id)
    fs.mkdirSync(evidence, { recursive: true })
    fs.copyFileSync(lockPath, path.join(evidence, 'pnpm-lock.yaml'))
    fs.copyFileSync(packagePath, path.join(evidence, 'package.json'))
    fs.writeFileSync(path.join(evidence, 'install.log'), installOutput)
    fs.writeFileSync(path.join(evidence, 'identity.json'), `${JSON.stringify({
        artifactSha256: artifact.sha256,
        lockTemplateSha256: createHash('sha256').update(template).digest('hex'),
        lockSha256: createHash('sha256').update(fs.readFileSync(lockPath)).digest('hex'),
    }, null, 2)}\n`)
}
