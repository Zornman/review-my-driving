import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'product/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'orderConfirmation/:id',
    renderMode: RenderMode.Client // Disable prerendering for orderConfirmation
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender // Keep prerendering for all other routes
  }
];
