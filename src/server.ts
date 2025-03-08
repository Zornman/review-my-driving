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

// ✅ Serve static files (images, CSS, JS)
app.use(express.static(distFolder, { maxAge: '1y' }));

// ✅ SSR Rendering for all routes
app.get('*', async (req, res) => {
    try {
        const html = await commonEngine.render({
            url: req.url,
            document: join(distFolder, indexHtml),
        });
        res.send(html);
    } catch (error) {
        console.error('❌ SSR Error:', error);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
});

// ✅ Ensure the server always listens on PORT 8080
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Angular SSR running on http://localhost:${PORT}`);
});