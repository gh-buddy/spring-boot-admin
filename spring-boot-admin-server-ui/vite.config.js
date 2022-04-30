import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path';
import {viteStaticCopy} from "vite-plugin-static-copy";
import postcss from "./postcss.config";
import visualizer from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
const root = resolve(__dirname, './src/main/frontend');
const outDir = resolve(__dirname, './target/dist');

export default ({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return defineConfig({
    define: {
      '__PROJECT_VERSION__': JSON.stringify(`${process.env.PROJECT_VERSION || '0.0.0'}`)
    },
    plugins: [
      vue(),
      visualizer(() => {
        return {filename: resolve(__dirname, 'target/vite.bundle-size-analyzer.html')};
      }),
      viteStaticCopy({
        targets: [
          {
            src: [resolve(root, './sba-settings.js'), resolve(root, './variables.css'), resolve(root, 'assets')],
            dest: outDir
          }
        ]
      })
    ],
    server: {
      base: '/',
      proxy: {
        '^(/sba-settings.js|/variables.css)': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '^/': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          bypass: req => {
            const isEventStream = req.headers.accept === 'text/event-stream';
            const isAjaxCall = req.headers['x-requested-with'] === 'XMLHttpRequest';
            console.log(req.url, isAjaxCall, isEventStream);
            if (!(isAjaxCall || isEventStream)) {
              return "/index.html";
            }
          }
        }
      }
    },
    css: {
      postcss
    },
    build: {
      outDir,
      rollupOptions: {
        input: {
          sba: resolve(root, './index.html'),
          login: resolve(root, './login.html'),
        },
        external: ['sba-settings.js', 'variables.css']
      }
    },
    resolve: {
      alias: {
        '@': root,
      },
    },
  })
}
