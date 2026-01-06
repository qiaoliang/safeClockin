import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  preview: {
    host: '0.0.0.0',
    port: 8081,
    https: {
      key: resolve(__dirname, 'certs/server.key'),
      cert: resolve(__dirname, 'certs/server.crt')
    }
  }
})
