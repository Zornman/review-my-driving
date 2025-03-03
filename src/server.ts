import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CommonEngine } from '@angular/ssr/node'
import { render } from '@netlify/angular-runtime/common-engine'

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

// ✅ Start the server locally (for testing)
const port = process.env['PORT'] || 5500;
app.listen(port, () => {
    console.log(`🚀 Angular server running at http://localhost:${port}`);
});

// ✅ Netlify Function Handler (if needed)
export async function netlifyCommonEngineHandler(request: Request, context: any): Promise<Response> {
  return await render(commonEngine);
}
