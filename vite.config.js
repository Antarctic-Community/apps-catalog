import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' — сайт работает и на github.io/<repo>/, и на кастомном домене, и внутри webview кошелька.
export default defineConfig({ base: './', plugins: [vue()] })
