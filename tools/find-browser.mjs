import { existsSync, statSync } from 'node:fs';
import { join, delimiter } from 'node:path';

// No download or global installation. Explicit overrides must point to a file.
export function findBrowser() {
  for (const key of ['EDGE_PATH', 'CHROME_PATH']) {
    if (process.env[key]) {
      if (!existsSync(process.env[key])||!statSync(process.env[key]).isFile()) throw new Error(`${key} 指向的浏览器文件不存在：${process.env[key]}`);
      return process.env[key];
    }
  }
  const candidates = process.platform === 'win32' ? [
    ...['ProgramFiles(x86)', 'ProgramFiles', 'LOCALAPPDATA'].flatMap(key => process.env[key] ? [
      join(process.env[key], 'Microsoft/Edge/Application/msedge.exe'),
      join(process.env[key], 'Google/Chrome/Application/chrome.exe'),
    ] : []),
  ] : process.platform === 'darwin' ? [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ] : ['/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const names = process.platform === 'win32' ? ['msedge.exe', 'chrome.exe'] : ['microsoft-edge', 'google-chrome', 'chromium', 'chromium-browser'];
  for (const directory of (process.env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const name of names) candidates.push(join(directory, name));
  }
  return candidates.find(existsSync) || null;
}
