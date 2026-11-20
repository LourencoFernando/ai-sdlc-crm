import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const apiPort = Number(process.env.API_PORT ?? 3100);
const webPort = Number(process.env.WEB_PORT ?? 5173);

/** Prints one plain line with the address to open (G1). */
function printAddress(): Plugin {
  return {
    name: 'accountable-print-address',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          console.log(`\n  Accountable is running. Open http://localhost:${webPort} in your browser.\n`);
        }, 50);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), printAddress()],
  server: {
    port: webPort,
    strictPort: true,
    proxy: { '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } },
  },
});
