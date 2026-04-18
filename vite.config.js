import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using './' for base so it works on GitHub Pages regardless of repo name.
export default defineConfig({
  plugins: [react()],
  base: './',
});
