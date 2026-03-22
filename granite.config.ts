import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'minidetective',
  brand: {
    displayName: '1분 추리 뇌운동',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/17619/3c916e3e-69ce-4d9d-8869-6ecf13babd00.png',
  },
  web: {
    // localhost: 로컬 브라우저 접속용. 샌드박스에서 연결 시 본인 PC IP로 변경 (예: 192.168.0.10)
    host: '192.168.0.10',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});

