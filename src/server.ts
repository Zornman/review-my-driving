import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CommonEngine } from '@angular/ssr/node';
import { render } from '@netlify/angular-runtime/common-engine';
import net from 'net';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const commonEngine = new CommonEngine();

const app = express();

// ✅ Serve static files from Angular's build output
app.use(express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
}));

// ✅ Redirect all requests to `index.html` (SPA fallback)
app.use('*', (req, res) => {
    res.sendFile(resolve(browserDistFolder, 'index.html'));
});

// ✅ Function to check if port is in use
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

// ✅ Start server only if port is free
const port = process.env['PORT'] || 5500;

(async () => {
    const isPortInUse = await checkPortInUse(Number(port));

    if (!isPortInUse) {
        app.listen(port, () => {
            console.log(`🚀 Angular server running at http://localhost:${port}`);
        });
    } else {
        console.log(`⚠️ Server is already running on port ${port}. Skipping restart.`);
    }
})();

// ✅ Netlify Function Handler (if needed)
export async function netlifyCommonEngineHandler(request: Request, context: any): Promise<Response> {
    return await render(commonEngine);
}