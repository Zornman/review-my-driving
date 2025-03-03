import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

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

// ✅ Start the server locally (for testing)
const port = process.env['PORT'] || 3000;
app.listen(port, () => {
    console.log(`🚀 Angular server running at http://localhost:${port}`);
});

// ✅ Netlify Function Handler (if needed)
export async function netlifyHandler(request: Request): Promise<Response> {
    return new Response('Not found', { status: 404 });
}
