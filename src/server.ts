import express from 'express';
import net from 'net';
import { CommonEngine } from '@angular/ssr/node';

const app = express();
const commonEngine = new CommonEngine();

// ✅ Function to check if port is in use (for local dev)
function checkPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port);
    });
}

// ✅ Start Express server **ONLY in local development**
(async () => {
    const port = 5500;
    const isPortInUse = await checkPortInUse(Number(port));

    if (!isPortInUse) {
        app.listen(port, () => {
            console.log(`🚀 Angular SSR server running at http://localhost:${port}`);
        });
    } else {
        console.log(`⚠️ Server is already running on port ${port}. Skipping restart.`);
    }
})();
