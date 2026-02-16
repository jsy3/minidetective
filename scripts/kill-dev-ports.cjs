#!/usr/bin/env node
/**
 * Windows에서 8081(Granite), 5173(Vite) 포트 사용 프로세스를 종료합니다.
 * npm run dev 오류(EADDRINUSE, Port already in use) 시 사용하세요.
 */
const { execSync } = require('child_process');

const PORTS = [8081, 5173];

function killPortsWindows() {
  const pids = new Set();
  try {
    const out = execSync(`netstat -ano | findstr "${PORTS.map(p => `:${p}`).join(' ')}"`, {
      encoding: 'utf8',
      windowsHide: true,
    });
    const lines = out.trim().split(/\r?\n/);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const last = parts[parts.length - 1];
      if (last && /^\d+$/.test(last) && last !== '0') {
        pids.add(last);
      }
    }
  } catch (e) {
    if (e.status !== 1) throw e;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit', windowsHide: true });
      console.log('종료: PID', pid);
    } catch (err) {
      // ignore
    }
  }
  if (pids.size === 0) {
    console.log('8081, 5173 포트를 사용 중인 프로세스가 없습니다.');
  }
}

if (process.platform === 'win32') {
  killPortsWindows();
} else {
  console.log('Windows 전용. Mac/Linux: npx kill-port 8081 5173');
}
