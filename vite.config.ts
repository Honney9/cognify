import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from "vite-plugin-pwa"

const __dir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copies WASM binaries from the @runanywhere and onnxruntime-web npm packages 
 * into dist/assets/ so they're served alongside the bundled JS at runtime.
 */
function copyWasmPlugin(): Plugin {
  const llamacppWasm = path.resolve(__dir, 'node_modules/@runanywhere/web-llamacpp/wasm');
  const onnxWasm = path.resolve(__dir, 'node_modules/@runanywhere/web-onnx/wasm');
  const ortWasm = path.resolve(__dir, 'node_modules/onnxruntime-web/dist'); // Added ORT path

  return {
    name: 'copy-wasm',
    writeBundle(options) {
      const outDir = options.dir ?? path.resolve(__dir, 'dist');
      const assetsDir = path.join(outDir, 'assets');
      fs.mkdirSync(assetsDir, { recursive: true });

      // LlamaCpp WASM binaries (LLM/VLM)
      const llamacppFiles = [
        { src: 'racommons-llamacpp.wasm', dest: 'racommons-llamacpp.wasm' },
        { src: 'racommons-llamacpp.js', dest: 'racommons-llamacpp.js' },
        { src: 'racommons-llamacpp-webgpu.wasm', dest: 'racommons-llamacpp-webgpu.wasm' },
        { src: 'racommons-llamacpp-webgpu.js', dest: 'racommons-llamacpp-webgpu.js' },
      ];

      for (const { src, dest } of llamacppFiles) {
        const srcPath = path.join(llamacppWasm, src);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, path.join(assetsDir, dest));
          const sizeMB = (fs.statSync(srcPath).size / 1_000_000).toFixed(1);
          console.log(`  ✓ Copied ${dest} (${sizeMB} MB)`);
        } else {
          console.warn(`  ⚠ Not found: ${srcPath}`);
        }
      }

      // Sherpa-ONNX: copy all files in sherpa/ subdirectory (STT/TTS/VAD)
      const sherpaDir = path.join(onnxWasm, 'sherpa');
      const sherpaOut = path.join(assetsDir, 'sherpa');
      if (fs.existsSync(sherpaDir)) {
        fs.mkdirSync(sherpaOut, { recursive: true });
        for (const file of fs.readdirSync(sherpaDir)) {
          const src = path.join(sherpaDir, file);
          fs.copyFileSync(src, path.join(sherpaOut, file));
          const sizeMB = (fs.statSync(src).size / 1_000_000).toFixed(1);
          console.log(`  ✓ Copied sherpa/${file} (${sizeMB} MB)`);
        }
      }

      // ONNX Runtime Web: Copy standard WASM binaries AND .mjs glue files
      if (fs.existsSync(ortWasm)) {
        // FIX: Include .mjs files alongside .wasm files
        const files = fs.readdirSync(ortWasm).filter(f => f.endsWith('.wasm') || f.endsWith('.mjs'));
        for (const file of files) {
          const src = path.join(ortWasm, file);
          fs.copyFileSync(src, path.join(assetsDir, file));
          const sizeMB = (fs.statSync(src).size / 1_000_000).toFixed(1);
          console.log(`  ✓ Copied onnxruntime/${file} (${sizeMB} MB)`);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyWasmPlugin(), tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "models/*",
        "assets/*.wasm",
        "assets/*.js",
        "assets/sherpa/*"
      ],
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,wasm,png,svg,ico,json}"
        ]
      },
      manifest: {
        name: "Cognify",
        short_name: "Cognify",
        description: "Offline Privacy AI Productivity Suite",
        display: "standalone",
        start_url: "/",
        background_color: "#0f172a",
        theme_color: "#0f172a"
      }
    })
  ],
  server: {
    headers: {
      // Cross-Origin Isolation — required for SharedArrayBuffer / multi-threaded WASM.
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      "@": path.resolve(__dir, "src"), // Corrected from __dirname to __dir for ESM consistency
    },
  },
  worker: { format: 'es' },
  optimizeDeps: {
    // Exclude WASM-bearing packages from pre-bundling
    exclude: [
      '@runanywhere/web-llamacpp', 
      '@runanywhere/web-onnx', 
      "@mlc-ai/web-llm", 
      "onnxruntime-web" // Added this to prevent the MIME type/HTML response error
    ],
  },
});