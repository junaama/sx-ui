import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import GlobalPolyFill from '@esbuild-plugins/node-globals-polyfill';
import Components from 'unplugin-vue-components/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import visualizer from 'rollup-plugin-visualizer';
import inject from '@rollup/plugin-inject';

const ELECTRON = process.env.ELECTRON || false;

const target = ['esnext'];

export default defineConfig({
  base: ELECTRON ? path.resolve(__dirname, './dist') : undefined,
  define: {
    'process.env': process.env
  },
  plugins: [
    vue({ reactivityTransform: true }),
    Components({
      directoryAsNamespace: true,
      resolvers: [
        IconsResolver({
          alias: {
            h: 'heroicons-outline'
          }
        })
      ]
    }),
    visualizer({
      filename: './dist/stats.html',
      template: 'sunburst',
      gzipSize: true
    }),
    Icons({
      compiler: 'vue3',
      iconCustomizer(collection, icon, props) {
        props.width = '20px';
        props.height = '20px';
      }
    })
  ],
  optimizeDeps: {
    include: ['@snapshot-labs/sx', '@snapshot-labs/snapshot-oc'],
    esbuildOptions: {
      target,
      plugins: [
        GlobalPolyFill({
          buffer: true
        })
      ]
    }
  },
  build: {
    target,
    commonjsOptions: {
      include: [/sx.js/, /soc.js/, /node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer']
        })
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // polyfills
      stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
      events: path.resolve(__dirname, 'node_modules/events'),
      util: path.resolve(__dirname, 'node_modules/util'),
      buffer: path.resolve(__dirname, 'node_modules/buffer')
    },
    dedupe: ['@popperjs/core']
  }
});
