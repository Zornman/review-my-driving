import {
    AngularNodeAppEngine,
    createNodeRequestHandler,
    isMainModule,
    writeResponseToNodeResponse,
  } from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContext } from '@netlify/angular-runtime/context';
import { AngularAppEngine } from '@angular/ssr';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const appEngine = new AngularAppEngine();

/**
 * ✅ Serve static files from /browser (Angular build output)
 */
app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
);

/**
 * ✅ Handle all requests by rendering the Angular SSR app
 */
app.use('/**', (req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
});
  
/**
 * ✅ Start the SSR server when running locally (not Netlify)
 */
if (isMainModule(import.meta.url)) {
    const port = process.env['PORT'] || 4000;
    app.listen(port, () => {
      console.log(`🚀 Angular SSR server listening on http://localhost:${port}`);
    });
}

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
    const context = getContext()
  
    const result = await appEngine.handle(request, context)
    return result || new Response('Not found', { status: 404 })
  }
  
/**
 * ✅ Request handler for Angular CLI dev-server and build
 */
export const reqHandler = createNodeRequestHandler(app);