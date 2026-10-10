import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export function selectSuccessfulMainRun(runs, sha) {
    return runs.find(run => run.head_sha === sha
        && run.head_branch === 'main'
        && run.event === 'push'
        && run.status === 'completed'
        && run.conclusion === 'success')
}

export function requireReleaseCi({ repository, sha }) {
    execFileSync('git', ['fetch', 'origin', 'main'], { stdio: 'inherit' })
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'origin/main'])
    const response = execFileSync('gh', ['api', `repos/${repository}/actions/workflows/ci.yml/runs?head_sha=${sha}&event=push&per_page=100`], { encoding: 'utf8' })
    const run = selectSuccessfulMainRun(JSON.parse(response).workflow_runs, sha)
    if (!run) throw new Error(`发布提交 ${sha} 需要 main 上同一提交的 CI 成功记录`)
    console.log(`已绑定发布 CI：${run.html_url}`)
    return run
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    requireReleaseCi({ repository: process.env.GITHUB_REPOSITORY, sha: process.env.GITHUB_SHA })
}
