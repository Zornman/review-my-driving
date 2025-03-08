import 'zone.js/node';
import express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { CommonEngine } from '@angular/ssr/node';

const app = express();
const commonEngine = new CommonEngine();

const distFolder = join(process.cwd(), 'dist/review-my-driving/browser');
const indexHtml = existsSync(join(distFolder, 'index.original.html'))
  ? 'index.original.html'
  : 'index.html';

// ✅ Serve static files (JS, CSS, images)
app.use(express.static(distFolder, { maxAge: '1y' }));

// ✅ Handle all routes using Angular SSR
app.get('*', async (req, res) => {
    try {
        const html = await commonEngine.render({
            documentFilePath: join(distFolder, indexHtml),
            url: req.url
        });
        res.send(html);
    } catch (error) {
        console.error('❌ SSR Error:', error);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
});

// ✅ Ensure the server listens on Cloud Run's required port (8080)
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Angular SSR running on http://localhost:${PORT}`);
});
