import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { msw } from "msw/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), msw()],
	server: {
		host: true,
		allowedHosts: ["rygyfygy.tail4fc702.ts.net"],
		proxy: {
			"/api": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
		},
	},
});
