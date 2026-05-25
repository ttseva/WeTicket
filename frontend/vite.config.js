import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { loadEnv } from "vite";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var loadedEnv = loadEnv(mode, process.cwd(), "");
    var appPort = Number(loadedEnv.VITE_APP_PORT || 5174);
    return {
        plugins: [react()],
        server: {
            port: appPort
        },
        preview: {
            port: appPort
        },
        resolve: {
            alias: {
                "@app": path.resolve(__dirname, "src/app"),
                "@pages": path.resolve(__dirname, "src/pages"),
                "@shared": path.resolve(__dirname, "src/shared")
            }
        }
    };
});
