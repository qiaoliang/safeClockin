import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // 在微信小程序环境中提供 process.env 的替代方案
    'process.env': process.env,
    // 为微信小程序提供全局配置
    'process.env.UNI_PLATFORM': JSON.stringify(process.env.UNI_PLATFORM || 'mp-weixin'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // 确保在构建时正确处理环境变量
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
  },
  // 抑制 Vue 编译器警告
  build: {
    rollupOptions: {
      output: {
        // 使用 es 格式而不是 iife 格式，避免代码分割警告
        format: 'es',
      }
    }
  },
  // 抑制编译器警告
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  }
})