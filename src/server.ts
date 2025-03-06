import express from 'express';
import { render } from '@netlify/angular-runtime/common-engine';
import net from 'net';

const app = express();

// ✅ Serve Angular SSR in Netlify Edge Functions
app.use('*', async (req, res) => {
    try {
        const html = await render({});
        res.status(200).send(html);
    } catch (error) {
        console.error('❌ SSR Error:', error);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
});

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
const port = process.env['PORT'] || 5500;
if (process.env['NETLIFY_DEV'] === 'true') {
    (async () => {
        const isPortInUse = await checkPortInUse(Number(port));

        if (!isPortInUse) {
            app.listen(port, () => {
                console.log(`🚀 Angular SSR server running at http://localhost:${port}`);
            });
        } else {
            console.log(`⚠️ Server is already running on port ${port}. Skipping restart.`);
        }
    })();
}

// ✅ Netlify Edge Function Handler
export async function netlifyCommonEngineHandler(request: Request, context: any): Promise<Response> {
    return await render({});
}
