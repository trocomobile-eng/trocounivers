import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      pngquant: { quality: [0.6, 0.8] },
      mozjpeg: { quality: 80 },
      webp: { quality: 75 }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Map libraries (check first to avoid circular deps)
          if (id.includes('node_modules/leaflet') && !id.includes('react-leaflet')) {
            return 'maps';
          }
          
          // React libraries
          if (id.includes('react-leaflet')) {
            return 'maps-react';
          }
          
          // Vendor chunks
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
          
          // Firebase chunks
          if (id.includes('node_modules/firebase') || 
              id.includes('firebase/')) {
            return 'firebase';
          }
          
          // UI libraries
          if (id.includes('node_modules/framer-motion') || 
              id.includes('node_modules/lucide-react')) {
            return 'ui';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
});
