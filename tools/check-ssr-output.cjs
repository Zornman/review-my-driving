/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

// Angular server rendering requires Zone.js in Node.
require('zone.js/node');

function findServerMainBundle() {
  const serverDir = path.join(process.cwd(), 'dist', 'review-my-driving', 'server');
  const entries = fs.readdirSync(serverDir);
  const main = entries.find((name) => /^main\..*\.js$/i.test(name));
  if (!main) {
    throw new Error(`Could not find server main bundle in: ${serverDir}`);
  }
  return path.join(serverDir, main);
}

async function run() {
  const urlPath = process.argv[2] || '/';
  const bundlePath = findServerMainBundle();

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const mod = require(bundlePath);
  if (typeof mod.render !== 'function') {
    throw new Error(`No render() export found in ${bundlePath}. Exports: ${Object.keys(mod).join(', ')}`);
  }

  const html = await mod.render(urlPath);

  const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
  const ogUrlMatch = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i);

  console.log('bundle:', bundlePath);
  console.log('path:', urlPath);
  console.log('canonical:', canonicalMatch ? canonicalMatch[1] : null);
  console.log('og:url:', ogUrlMatch ? ogUrlMatch[1] : null);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
