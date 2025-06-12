// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ NO @tailwindcss/vite here
export default defineConfig({
  plugins: [react()],
});
