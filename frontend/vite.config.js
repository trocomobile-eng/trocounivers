import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
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
