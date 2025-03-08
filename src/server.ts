import 'zone.js/node';
import express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { render } from './main.server'; // ✅ Import named export, not "default"

const app = express();
const distFolder = join(process.cwd(), 'dist/review-my-driving/browser');
const indexHtml = existsSync(join(distFolder, 'index.original.html'))
  ? 'index.original.html'
  : 'index.html';

// ✅ Serve static files (JS, CSS, images)
app.use(express.static(distFolder, { maxAge: '1y' }));

// ✅ Handle all routes using Angular SSR
app.get('*', async (req, res) => {
  try {
    const html = await render(req.originalUrl); // Pass the request URL to the render function
    res.send(html);
  } catch (error) {
    console.error('❌ SSR Error:', error);
    res.status(500).send('<h1>Internal Server Error</h1>');
  }
});

// ✅ Start the server and listen on Cloud Run's required port (8080)
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Angular 19 SSR running at http://localhost:${PORT}`);
});
