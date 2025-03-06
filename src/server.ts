import express from 'express';
import { CommonEngine } from '@angular/ssr/node';
import { existsSync } from 'fs';
import { resolve } from 'path';

const isNetlify = process.env['NETLIFY_DEV'] === 'true';
if (isNetlify) {
    console.log('🚀 Running on Netlify. server.ts is disabled.');
    process.exit(0); // Prevents server.ts from running on Netlify
}

const app = express();
const commonEngine = new CommonEngine();

// ✅ Serve Angular SSR in Local Dev (ONLY when running locally)
app.get('*', async (req, res) => {
    try {
        const html = await commonEngine.render({
            documentFilePath: resolve(__dirname, '../browser/index.html'),
            url: req.url,
        });
        res.status(200).send(html);
    } catch (error) {
        console.error('❌ SSR Error:', error);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
});

// ✅ Start Express Server Locally
const port = process.env['PORT'] || 5500;
app.listen(port, () => {
    console.log(`🚀 Local Angular SSR server running at http://localhost:${port}`);
});
