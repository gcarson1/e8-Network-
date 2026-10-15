import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Everything (JS, CSS, the question bank CSV) is inlined into one HTML file.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2019', assetsInlineLimit: 100000000, cssCodeSplit: false, reportCompressedSize: false },
});
