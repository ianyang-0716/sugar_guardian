import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量 (包括 .env 文件和 Netlify 设置的变量)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 【修复 1】解决白屏和 404 问题：强制使用相对路径加载资源
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    
    // 【修复 2】API Key 注入
    // 这里的逻辑是：优先找 VITE_GOOGLE_API_KEY，找不到再找 GEMINI_API_KEY
    // 并将它们同时赋值给多种变量名，确保你的代码一定能读到其中一个
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.VITE_GOOGLE_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.GEMINI_API_KEY || ''),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});