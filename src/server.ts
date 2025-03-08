import 'zone.js/node';
import express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { ngExpressEngine } from '@nguniversal/express-engine';

import bootstrap from './main.server'; // ✅ Ensure this imports your SSR bootstrap

const app = express();
const distFolder = join(process.cwd(), 'dist/review-my-driving/browser');
const indexHtml = existsSync(join(distFolder, 'index.original.html'))
  ? 'index.original.html'
  : 'index.html';

// ✅ Use Angular Universal (SSR)
app.engine('html', ngExpressEngine({ bootstrap }));

// ✅ Set the view engine to HTML
app.set('view engine', 'html');
app.set('views', distFolder);

// ✅ Serve static files (JS, CSS, images)
app.use(express.static(distFolder, { maxAge: '1y' }));

// ✅ Handle all routes using Angular SSR
app.get('*', (req, res) => {
  res.render(indexHtml, { req });
});

// ✅ Start the server and listen on Cloud Run's required port (8080)
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Angular SSR running on http://localhost:${PORT}`);
});