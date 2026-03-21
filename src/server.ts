import 'zone.js/node';
import express from 'express';
import { join } from 'path';
import { render } from './main.server'; // Import named export, not "default"

const app = express();
const distFolder = join(process.cwd(), 'dist/review-my-driving/browser');
const siteUrl = 'https://www.reviewmydriving.co';

// Cloud Run / Firebase App Hosting sit behind a proxy/CDN.
// This makes req.protocol and req.hostname honor X-Forwarded-* headers.
app.enable('trust proxy');

// Normalize host + protocol to avoid duplicate URL variants in search engines.
app.use((req, res, next) => {
  const forwardedProto = req.header('x-forwarded-proto');
  const proto = (forwardedProto || req.protocol || 'https')
    .split(',')[0]
    ?.trim()
    .toLowerCase();

  const forwardedHost = req.header('x-forwarded-host');
  const hostHeader = (forwardedHost || req.header('host') || '').toLowerCase();
  const hostWithMaybePort = hostHeader.split(',')[0]?.trim();
  const host = (hostWithMaybePort || '').split(':')[0]?.trim();

  const shouldForceHttps = proto !== 'https';
  const shouldForceWww = host === 'reviewmydriving.co';

  if (shouldForceHttps || shouldForceWww) {
    const targetHost = shouldForceWww ? 'www.reviewmydriving.co' : host;
    return res.redirect(301, `https://${targetHost}${req.originalUrl}`);
  }

  // Strip trailing slash (except for root) to avoid duplicate paths.
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const withoutTrailingSlash = req.originalUrl.replace(/\/+$/, '');
    return res.redirect(301, withoutTrailingSlash);
  }

  next();
});

// Ensure non-public routes are not indexed even if HTML meta tags are missed.
// (Robots.txt should allow crawling so search engines can see this.)
app.use((req, res, next) => {
  const pathLower = (req.path || '').toLowerCase();

  const noindexPrefixes = [
    '/register',
    '/cart',
    '/checkout',
    '/orderconfirmation',
    '/login',
    '/resetpassword',
    '/account',
    '/settings',
    '/admin-functions',
    '/daily-report',
  ];

  const shouldNoindex = noindexPrefixes.some((prefix) => pathLower === prefix || pathLower.startsWith(`${prefix}/`));
  if (shouldNoindex) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }

  next();
});

const indexableRoutes = [
  '/',
  '/home',
  '/shop',
  '/services',
  '/about',
  '/contact'
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexableRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route === '/' ? '' : route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml`;

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  res.send(sitemapXml);
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(robotsTxt);
});

// Serve static files (JS, CSS, images)
app.use(express.static(distFolder, { maxAge: '1y' }));

// Handle all routes using Angular SSR
app.get('*', async (req, res) => {
  try {
    const html = await render(req.originalUrl); // Pass the request URL to the render function
    res.send(html);
  } catch (error) {
    console.error('❌ SSR Error:', error);
    res.status(500).send('<h1>Internal Server Error</h1>');
  }
});

// Start the server and listen on Cloud Run's required port (8080)
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Angular 19 SSR running at http://localhost:${PORT}`);
});
