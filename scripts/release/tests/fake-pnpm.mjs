import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function installFakePnpm(binDir, source, { platform = process.platform, nodePath = process.execPath } = {}) {
    mkdirSync(binDir, { recursive: true });
    const fixturePath = path.join(binDir, 'pnpm-fixture.cjs');
    writeFileSync(fixturePath, source);

    if (platform === 'win32') {
        const entryPath = path.join(binDir, 'pnpm.cmd');
        writeFileSync(entryPath, `@echo off\r\n"${nodePath}" "%~dp0pnpm-fixture.cjs" %*\r\nexit /b %ERRORLEVEL%\r\n`);
        return entryPath;
    }

    const entryPath = path.join(binDir, 'pnpm');
    writeFileSync(entryPath, `#!${nodePath}\nrequire(${JSON.stringify(fixturePath)});\n`);
    chmodSync(entryPath, 0o755);
    return entryPath;
}
